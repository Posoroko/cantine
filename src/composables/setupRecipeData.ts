/**
 * ONE-TIME SETUP: Create Recipe Tags and Diets
 * 
 * Run this once to initialize the static recipe data in the database.
 * 
 * Usage in browser console:
 * 1. Open DevTools (F12)
 * 2. Go to Console tab
 * 3. Paste this code and press Enter
 * 
 * Or import and call from any Vue component:
 * import { useRecipes } from '@/composables/recipes'
 * const { createAllStaticData } = useRecipes()
 * await createAllStaticData()
 */

import { useRecipes } from '@/composables/recipes'

export async function setupRecipeData() {
    console.log('🍳 Starting recipe data setup...')
    
    try {
        const { createAllStaticData } = useRecipes()
        const results = await createAllStaticData()
        
        console.log('✅ Recipe data setup completed!')
        console.log('Results:', results)
        
        return results
    } catch (error) {
        console.error('❌ Setup failed:', error)
        throw error
    }
}

// For one-time execution in console:
// await (async () => { const { useRecipes } = await import('@/composables/recipes'); const { createAllStaticData } = useRecipes(); return await createAllStaticData() })()
