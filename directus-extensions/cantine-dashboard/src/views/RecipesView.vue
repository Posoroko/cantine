<template>
    <private-view title="Livre de recettes">
        <template #title-outer:prepend>
            <v-button class="backBtn" secondary icon rounded @click="router.push('/cantine-dashboard')">
                <v-icon name="arrow_back" />
            </v-button>
        </template>

        <div class="viewContent">
            <div v-if="loading" class="loadingState">
                <v-progress-circular indeterminate />
            </div>

            <v-notice v-else-if="!recipes.length" type="info">
                Aucune recette trouvée.
            </v-notice>

            <template v-else>
                <div v-for="group in categoryGroups" :key="group.category" class="categoryBlock">
                    <div class="categoryTitle">{{ group.category || 'Sans catégorie' }}</div>
                    <div class="recipeGrid">
                        <div
                            v-for="recipe in group.recipes"
                            :key="recipe.id"
                            class="recipeCard"
                            @click="router.push(`/cantine-dashboard/recipes/${recipe.id}`)"
                        >
                            <span class="recipeName">{{ recipe.name }}</span>
                            <div class="recipeMeta">
                                <span v-if="recipe.baseServings" class="recipeMetaItem">
                                    <v-icon name="group" x-small />
                                    {{ recipe.baseServings }}
                                </span>
                                <span v-if="recipe.prepTime" class="recipeMetaItem">
                                    <v-icon name="schedule" x-small />
                                    {{ recipe.prepTime }}'
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </private-view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@directus/extensions-sdk'

const router = useRouter()
const api = useApi()

const loading = ref(true)
const recipes = ref<any[]>([])

onMounted(async () => {
    const res = await api.get('/items/recipes', {
        params: {
            fields: ['id', 'name', 'category', 'baseServings', 'prepTime', 'cookTime'],
            sort: ['category', 'name'],
            limit: -1,
        },
    })
    recipes.value = res.data.data
    loading.value = false
})

const categoryGroups = computed(() => {
    const grouped: Record<string, any[]> = {}
    for (const recipe of recipes.value) {
        const cat = recipe.category || ''
        if (!grouped[cat]) grouped[cat] = []
        grouped[cat].push(recipe)
    }
    return Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b, 'fr'))
        .map(([category, recs]) => ({ category, recipes: recs }))
})
</script>

<style scoped>
@import '../styles/shared.css';

.backBtn {
    margin-right: 8px;
}

.loadingState {
    display: flex;
    justify-content: center;
    padding: 60px;
}

.recipeGrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
    margin-bottom: 24px;
}

.recipeCard {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px 20px;
    border: 1px solid var(--border-normal);
    border-radius: 8px;
    cursor: pointer;
    background: var(--background-normal);
    transition: border-color 0.2s, box-shadow 0.15s;
}

.recipeCard:hover {
    border-color: var(--primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
}

.recipeName {
    font-weight: 600;
    font-size: 14px;
    color: var(--foreground-normal);
    line-height: 1.3;
}

.recipeMeta {
    display: flex;
    gap: 12px;
}

.recipeMetaItem {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 12px;
    color: var(--foreground-subdued);
}
</style>
