#!/usr/bin/env node

/**
 * Seed Recipe Tags and Diets to Directus via MCP Server
 * Usage: node mcp-servers/directus-mcp/seed-recipes.js
 */

const DIRECTUS_URL = process.env.VITE_DIRECTUS_URL?.replace(/\/+$/, '');
const DIRECTUS_MCP_TOKEN = process.env.DIRECTUS_MCP_TOKEN;

if (!DIRECTUS_URL || !DIRECTUS_MCP_TOKEN) {
    console.error('❌ Missing DIRECTUS_URL or DIRECTUS_MCP_TOKEN environment variables');
    process.exit(1);
}

const recipeTagsData = [
    { key: 'tartinades', text: 'Tartinades' },
    { key: 'entree', text: 'Entrée' },
    { key: 'plat', text: 'Plat' },
    { key: 'dessert', text: 'Dessert' },
    { key: 'viande', text: 'Viande' },
    { key: 'fromage', text: 'Fromage' },
    { key: 'salade', text: 'Salade' },
    { key: 'sauce', text: 'Sauce' },
    { key: 'comfortFood', text: 'Plat réconfortant' },
    { key: 'leger', text: 'Léger' },
    { key: 'chaud', text: 'Chaud' },
    { key: 'froid', text: 'Froid' },
    { key: 'sandwich', text: 'Sandwich' },
    { key: 'soupe', text: 'Soupe' },
    { key: 'pickles', text: 'Pickles' },
    { key: 'feculent', text: 'Féculent' },
    { key: 'legumineuse', text: 'Légumineuse' },
    { key: 'poisson', text: 'Poisson' },
    { key: 'fruits', text: 'Fruits' },
    { key: 'legumes', text: 'Légumes' },
    { key: 'pates', text: 'Pâtes' },
    { key: 'riz', text: 'Riz' }
];

const dietsData = [
    { key: 'vegetarian', text: 'Végétarien' },
    { key: 'vegan', text: 'Végan' },
    { key: 'glutenFree', text: 'Sans gluten' },
    { key: 'dairyFree', text: 'Sans lactose' }
];

async function directusPost(endpoint, data) {
    const url = `${DIRECTUS_URL}${endpoint}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${DIRECTUS_MCP_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Directus API error ${response.status}: ${error}`);
    }

    return await response.json();
}

async function createItems(collection, items) {
    const results = [];
    let successCount = 0;
    
    for (const item of items) {
        try {
            const response = await directusPost(`/items/${collection}`, item);
            results.push({ success: true, item, response });
            console.log(`  ✓ ${item.key}`);
            successCount++;
        } catch (error) {
            results.push({ success: false, item, error: error.message });
            console.log(`  ✗ ${item.key}: ${error.message}`);
        }
    }
    
    return { successCount, total: items.length, results };
}

async function main() {
    console.log('🍳 Seeding Recipe Tags and Diets...\n');

    try {
        console.log('📝 Creating Recipe Tags...');
        const tagsResult = await createItems('recipe_tags', recipeTagsData);
        console.log(`   Completed: ${tagsResult.successCount}/${tagsResult.total}\n`);

        console.log('🥗 Creating Diets...');
        const dietsResult = await createItems('diets', dietsData);
        console.log(`   Completed: ${dietsResult.successCount}/${dietsResult.total}\n`);

        const totalSuccess = tagsResult.successCount + dietsResult.successCount;
        const totalItems = tagsResult.total + dietsResult.total;

        if (totalSuccess === totalItems) {
            console.log(`✅ All done! ${totalSuccess}/${totalItems} items created successfully.\n`);
        } else {
            console.log(`⚠️  Partial success: ${totalSuccess}/${totalItems} items created.\n`);
        }

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    }
}

main();
