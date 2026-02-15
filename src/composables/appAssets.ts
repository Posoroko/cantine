import { ref, computed } from 'vue'
import { dbGet } from '@/composables/fetch'

// Singleton instance
let assetsCache = null
let appAssetsInstance = null

function createAppAssets() {
    const assets = ref({
        recipe_tags: [],
        diets: []
    })

    const recipeTags = computed(() => assets.value.recipe_tags)
    const diets = computed(() => assets.value.diets)

    const loadAssets = async () => {
        // Return cached data if already loaded
        if (assetsCache) {
            assets.value = assetsCache
            return assetsCache
        }

        try {
            // Fetch all asset collections in parallel
            const [tagsResponse, dietsResponse] = await Promise.all([
                dbGet({ endpoint: '/items/recipe_tags?limit=-1' }),
                dbGet({ endpoint: '/items/diets?limit=-1' })
            ])

            assets.value = {
                recipe_tags: tagsResponse || [],
                diets: dietsResponse || []
            }

            // Cache the result
            assetsCache = assets.value

            return assets.value
        } catch (err) {
            console.error('Failed to load app assets:', err)
            throw err
        }
    }

    // Optional: Refresh specific collection
    const refresh = async (collectionName) => {
        assetsCache = null
        return await loadAssets()
    }

    return {
        recipeTags,
        diets,
        refresh,
        loadAssets
    }
}

export function useAppAssets() {
    if (!appAssetsInstance) {
        appAssetsInstance = createAppAssets()
        // Auto-load on first instantiation
        appAssetsInstance.loadAssets()
    }
    
    return appAssetsInstance
}
