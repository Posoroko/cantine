#!/usr/bin/env node

/**
 * Seed Terre Azure supplier and ingredients from their quote.
 * Usage: node mcp-servers/directus-mcp/seed-terre-azure.js
 *
 * - Creates the supplier "Terre Azure" if it doesn't already exist
 * - Creates each ingredient if it doesn't exist (matched by name, case-insensitive)
 * - Updates defaultPrice / unit / foodCategory / supplyCategory on existing ones
 * - Links all ingredients to the supplier
 *
 * Source data: docs/files/supplier-quotes/terre-azure.json
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const quote = JSON.parse(
    readFileSync(resolve(__dirname, '../../docs/files/supplier-quotes/terre-azure.json'), 'utf-8')
)

const DIRECTUS_URL = process.env.VITE_DIRECTUS_URL?.replace(/\/+$/, '')
const DIRECTUS_MCP_TOKEN = process.env.DIRECTUS_MCP_TOKEN

if (!DIRECTUS_URL || !DIRECTUS_MCP_TOKEN) {
    console.error('❌ Missing VITE_DIRECTUS_URL or DIRECTUS_MCP_TOKEN environment variables')
    process.exit(1)
}

const SUPPLIER_NAME = quote.supplier

const ingredientsData = quote.items.map(item => ({
    name: item.name,
    unit: item.unit,
    defaultPrice: item.pricePerUnit,
    foodCategory: item.foodCategory,
    supplyCategory: item.supplyCategory,
    prepLess: item.prepLess,
}))

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

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------

async function main() {
    console.log('🌿 Seeding Terre Azure supplier & ingredients...\n')

    // 1. Get or create the supplier
    console.log(`🏪 Finding supplier "${SUPPLIER_NAME}"...`)
    const existingSuppliers = await getAll('suppliers', ['id', 'name'])
    let supplier = existingSuppliers.find(
        s => s.name?.toLowerCase() === SUPPLIER_NAME.toLowerCase()
    )

    if (supplier) {
        console.log(`   Already exists (id ${supplier.id})\n`)
    } else {
        supplier = await createItem('suppliers', {
            status: 'published',
            name: SUPPLIER_NAME,
        })
        console.log(`   ✓ Created (id ${supplier.id})\n`)
    }

    const supplierId = supplier.id

    // 2. Get existing ingredients (to detect duplicates by name)
    const existingIngredients = await getAll('ingredients', ['id', 'name'])
    const existingByName = new Map(
        existingIngredients.map(i => [i.name?.toLowerCase(), i])
    )

    // 3. Upsert ingredients
    console.log(`🥦 Upserting ${ingredientsData.length} ingredients...`)
    const ingredientIds = []
    let created = 0
    let updated = 0
    let failed = 0

    for (const ing of ingredientsData) {
        try {
            const existing = existingByName.get(ing.name.toLowerCase())

            if (existing) {
                await updateItem('ingredients', existing.id, {
                    defaultPrice: ing.defaultPrice,
                    unit: ing.unit,
                    foodCategory: ing.foodCategory,
                    supplyCategory: ing.supplyCategory,
                    prepLess: ing.prepLess,
                })
                ingredientIds.push(existing.id)
                console.log(`   ~ ${ing.name} (updated id ${existing.id})`)
                updated++
            } else {
                const created_ = await createItem('ingredients', ing)
                ingredientIds.push(created_.id)
                console.log(`   ✓ ${ing.name} (created id ${created_.id})`)
                created++
            }
        } catch (err) {
            console.log(`   ✗ ${ing.name}: ${err.message}`)
            failed++
        }
    }

    console.log(`\n   Created: ${created} | Updated: ${updated} | Failed: ${failed}\n`)

    // 4. Link all ingredients to the supplier
    console.log(`🔗 Linking ${ingredientIds.length} ingredients to "${SUPPLIER_NAME}"...`)
    try {
        await updateItem('suppliers', supplierId, {
            ingredients: ingredientIds,
        })
        console.log(`   ✓ Done\n`)
    } catch (err) {
        console.log(`   ✗ Could not link: ${err.message}\n`)
    }

    console.log('✅ Seed complete.')
}

main().catch(err => {
    console.error('❌ Fatal:', err.message)
    process.exit(1)
})
