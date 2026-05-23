#!/usr/bin/env node

/**
 * Seed ingredients from all three supplier quote files.
 * Usage: node mcp-servers/directus-mcp/seed-ingredients.js
 *
 * - Reads docs/files/supplier-quotes/{terre-azure,episaveur,passion-froid}.json
 * - Maps quote category strings → Directus category value slugs
 * - Normalizes ingredient names (strips brand/origin suffixes, deduplicates)
 * - Creates or updates each ingredient in Directus
 * - Skips items with supplyCategory "Matériel" (not food ingredients)
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const DIRECTUS_URL = process.env.VITE_DIRECTUS_URL?.replace(/\/+$/, '')
const DIRECTUS_MCP_TOKEN = process.env.DIRECTUS_MCP_TOKEN

if (!DIRECTUS_URL || !DIRECTUS_MCP_TOKEN) {
    console.error('❌ Missing VITE_DIRECTUS_URL or DIRECTUS_MCP_TOKEN environment variables')
    process.exit(1)
}

// ------------------------------------------------------------
// Category mappings: quote text value → Directus category value
// ------------------------------------------------------------

// c5t: maps the raw foodCategory strings used in quote files to Directus food_categories.value
const FOOD_CATEGORY_MAP = {
    'Boissons':              'drinks',
    'Boulangerie':           'bakery',
    'Charcuterie':           'charcuterie',
    'Condiments':            'condiments',
    'Conserves':             'canned',
    'Épices':                'spices',
    'Farines':               'flour',
    'Féculents':             'starches',
    'Fromages':              'cheese',
    'Fruits':                'fruits',
    'Graines':               'seeds',
    'Herbes':                'herbs',
    'Légumes':               'vegetable',
    'Légumes (surgelé)':     'vegetable',
    'Légumineuses':          'legumes',
    'Légumineuses (surgelé)':'legumes',
    'Liquides':              'liquids',
    'Matières grasses':      'fats',
    'Œufs':                  'eggs',
    'Pâtisserie':            'pastry',
    'Poisson':               'fish',
    'Produits laitiers':     'dairy',
    'Protéines végétales':   'plant_proteins',
    'Sucrants':              'sweeteners',
    'Viande':                'meat',
}

// c5t: maps the raw supplyCategory strings used in quote files to Directus supply_categories.value
const SUPPLY_CATEGORY_MAP = {
    'Conserve':  'conserve',
    'Frais':     'Frais',
    'Liquide':   'liquid',
    'Matériel':  'materiel',
    'Réfrigéré': 'fridge',
    'Sec':       'sec',
    'Surgelé':   'frozen',
}

// ------------------------------------------------------------
// Ingredient name overrides
// Specific product names from quotes → canonical ingredient name in DB
// Handles: brand variants, origin suffixes, size suffixes, duplicates
// ------------------------------------------------------------

// c5t: when multiple quote items map to the same generic ingredient,
// the first one encountered sets the unit/price/category; subsequent ones are skipped
const INGREDIENT_NAME_OVERRIDES = {
    'Agar-agar (pot 270g)':           'Agar-agar',
    'Agar-agar poudre (pot 650g)':    'Agar-agar',
    'Arôme vanille artificiel':       'Arôme vanille',
    'Arôme vanille naturel':          'Arôme vanille',
    'Haricots blancs cuits Bonduelle':'Haricots blancs cuits',
    'Jus de citron naturel Sicile':   'Jus de citron',
    'Jus de citron vert Pulco':       'Jus de citron vert',
    'Lait de coco Thai Kitchen':      'Lait de coco',
    'Miel de fleurs Bio squeeze':     'Miel de fleurs',
    'Miel de France Bio':             'Miel',
    'Moutarde forte Dijon 5kg':       'Moutarde Dijon forte',
}

// ------------------------------------------------------------
// Load and merge all quote files
// ------------------------------------------------------------

const QUOTE_FILES = [
    'terre-azure.json',
    'episaveur.json',
    'passion-froid.json',
]

const allItems = []
for (const file of QUOTE_FILES) {
    const quote = JSON.parse(
        readFileSync(resolve(__dirname, `../../docs/files/supplier-quotes/${file}`), 'utf-8')
    )
    for (const item of quote.items) {
        allItems.push({ ...item, sourceFile: file })
    }
}

// c5t: skip non-food items (equipment, packaging) — supplyCategory Matériel
// then normalize names, map categories, and deduplicate by canonical name
const seenNames = new Set()
const ingredientsToSeed = []
const skipped = []

for (const item of allItems) {
    if (item.supplyCategory === 'Matériel') {
        skipped.push(item.name)
        continue
    }

    const canonicalName = INGREDIENT_NAME_OVERRIDES[item.name] ?? item.name
    const key = canonicalName.toLowerCase()

    if (seenNames.has(key)) continue
    seenNames.add(key)

    const foodCategory = item.foodCategory ? FOOD_CATEGORY_MAP[item.foodCategory] : null
    const supplyCategory = item.supplyCategory ? SUPPLY_CATEGORY_MAP[item.supplyCategory] : null

    ingredientsToSeed.push({
        name: canonicalName,
        unit: item.unit,
        defaultPrice: item.pricePerUnit,
        foodCategory: foodCategory ?? null,
        supplyCategory: supplyCategory ?? null,
        prepLess: item.prepLess,
    })
}

// ------------------------------------------------------------
// Directus helpers
// ------------------------------------------------------------

const headers = {
    'Authorization': `Bearer ${DIRECTUS_MCP_TOKEN}`,
    'Content-Type': 'application/json',
}

async function directusRequest(method, endpoint, body) {
    const response = await fetch(`${DIRECTUS_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Directus ${method} ${endpoint} → ${response.status}: ${error}`)
    }

    return await response.json()
}

async function getAll(collection, fields = ['id', 'name']) {
    const res = await directusRequest('GET', `/items/${collection}?fields=${fields.join(',')}&limit=-1`)
    return res.data ?? []
}

async function createItem(collection, data) {
    const res = await directusRequest('POST', `/items/${collection}`, data)
    return res.data
}

async function updateItem(collection, id, data) {
    const res = await directusRequest('PATCH', `/items/${collection}/${id}`, data)
    return res.data
}

async function fetchExistingCategoryValues(collection) {
    const items = await getAll(collection, ['value'])
    return new Set(items.map(c => c.value))
}

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------

async function main() {
    console.log('🥦 Seeding ingredients from all supplier quotes...\n')

    // 0. Fetch existing category values — token is read-only on categories
    const existingFoodCats = await fetchExistingCategoryValues('food_categories')
    const existingSupplyCats = await fetchExistingCategoryValues('supply_categories')

    // c5t: clamp category FK to null if the value doesn't exist in Directus yet
    // — avoids INVALID_FOREIGN_KEY errors; missing categories are reported at the end
    const missingFoodCats = new Set()
    const missingSupplyCats = new Set()
    for (const ing of ingredientsToSeed) {
        if (ing.foodCategory && !existingFoodCats.has(ing.foodCategory)) {
            missingFoodCats.add(ing.foodCategory)
            ing.foodCategory = null
        }
        if (ing.supplyCategory && !existingSupplyCats.has(ing.supplyCategory)) {
            missingSupplyCats.add(ing.supplyCategory)
            ing.supplyCategory = null
        }
    }

    if (skipped.length > 0) {
        console.log(`⏭️  Skipped ${skipped.length} non-food items (Matériel)\n`)
    }

    console.log(`📦 ${ingredientsToSeed.length} unique ingredients to seed\n`)

    // Fetch existing ingredients to detect duplicates
    const existing = await getAll('ingredients', ['id', 'name'])
    const existingByName = new Map(
        existing.map(i => [i.name?.toLowerCase(), i])
    )

    let created = 0
    let updated = 0
    let failed = 0

    for (const ing of ingredientsToSeed) {
        try {
            const existingIng = existingByName.get(ing.name.toLowerCase())

            if (existingIng) {
                await updateItem('ingredients', existingIng.id, {
                    defaultPrice: ing.defaultPrice,
                    unit: ing.unit,
                    foodCategory: ing.foodCategory,
                    supplyCategory: ing.supplyCategory,
                    prepLess: ing.prepLess,
                })
                console.log(`   ~ ${ing.name} (updated id ${existingIng.id})`)
                updated++
            } else {
                const created_ = await createItem('ingredients', ing)
                console.log(`   ✓ ${ing.name} (created id ${created_.id})`)
                created++
            }
        } catch (err) {
            console.error(`   ✗ ${ing.name}: ${err.message}`)
            failed++
        }
    }

    console.log(`\nCreated: ${created} | Updated: ${updated} | Failed: ${failed}`)

    if (missingFoodCats.size > 0) {
        console.log('\n⚠️  These food categories don\'t exist in Directus — add them manually then re-run:')
        for (const v of missingFoodCats) console.log(`   food_categories: value="${v}"`)
    }
    if (missingSupplyCats.size > 0) {
        console.log('\n⚠️  These supply categories don\'t exist in Directus — add them manually then re-run:')
        for (const v of missingSupplyCats) console.log(`   supply_categories: value="${v}"`)
    }

    console.log('\n✅ Done.')
}

main().catch(err => {
    console.error('❌ Fatal:', err.message)
    process.exit(1)
})
