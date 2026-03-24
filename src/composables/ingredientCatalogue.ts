import { ref } from 'vue'

import { dbGet } from './fetch'
import type { BasicIngredient } from '@/types/basicIngredient'

export function useIngredientsList() {
    const allIngredients = ref<BasicIngredient[]>([])
    const isLoading = ref(false)

    // Fetch and store all ingredients in memory
    async function fetchAll() {
        isLoading.value = true
        try {
            const response = await dbGet<{ data: BasicIngredient[] }>({ endpoint: '/items/ingredients' })
            allIngredients.value = (response as any).data.sort((a: BasicIngredient, b: BasicIngredient) =>
                a.name.localeCompare(b.name)
            )
        } catch (error) {
            console.error('Failed to fetch ingredients:', error)
        } finally {
            isLoading.value = false
        }
    }

    // Search/filter ingredients by name - returns new filtered array
    function search(query: string): BasicIngredient[] {
        if (!query.trim()) {
            return allIngredients.value
        }

        const lowerQuery = query.toLowerCase()
        return allIngredients.value.filter(ingredient =>
            ingredient.name.toLowerCase().includes(lowerQuery)
        )
    }

    // Filter by type ID
    function filterByType(typeId: number | null): BasicIngredient[] {
        if (typeId === null) {
            return allIngredients.value
        }

        return allIngredients.value.filter(ingredient =>
            ingredient.type?.id === typeId
        )
    }

    // Combine search and type filter
    function searchAndFilter(query: string, typeId: number | null = null): BasicIngredient[] {
        let results = typeId === null
            ? allIngredients.value
            : allIngredients.value.filter(ingredient => ingredient.type?.id === typeId)

        if (!query.trim()) {
            return results
        }

        const lowerQuery = query.toLowerCase()
        return results.filter(ingredient =>
            ingredient.name.toLowerCase().includes(lowerQuery)
        )
    }

    // Refresh - refetch all ingredients
    async function refresh() {
        await fetchAll()
    }

    return {
        allIngredients,
        isLoading,
        fetchAll,
        search,
        filterByType,
        searchAndFilter,
        refresh,
    }
}
