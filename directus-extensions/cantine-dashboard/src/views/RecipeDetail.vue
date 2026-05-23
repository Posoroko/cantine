<template>
    <private-view :title="recipe?.name || 'Recette'">
        <template #headline>
            <span class="headlineLink" @click="router.push('/cantine-dashboard/recipes')">Livre de recettes</span>
        </template>

        <template #title-outer:prepend>
            <v-button class="backBtn" secondary icon rounded @click="router.push('/cantine-dashboard/recipes')">
                <v-icon name="arrow_back" />
            </v-button>
        </template>

        <div class="viewContent">
            <div v-if="loading" class="loadingState">
                <v-progress-circular indeterminate />
            </div>

            <template v-else-if="recipe">
                <!-- Recipe meta -->
                <div class="metaRow">
                    <div v-if="recipe.category" class="metaItem">
                        <span class="label">Catégorie</span>
                        <span class="value">{{ recipe.category }}</span>
                    </div>
                    <div v-if="recipe.baseServings" class="metaItem">
                        <span class="label">Portions de base</span>
                        <span class="value">{{ recipe.baseServings }}</span>
                    </div>
                    <div v-if="recipe.prepTime" class="metaItem">
                        <span class="label">Préparation</span>
                        <span class="value">{{ recipe.prepTime }}'</span>
                    </div>
                    <div v-if="recipe.cookTime" class="metaItem">
                        <span class="label">Cuisson</span>
                        <span class="value">{{ recipe.cookTime }}'</span>
                    </div>
                </div>

                <!-- Ingredients -->
                <div class="section">
                    <div class="sectionTitle">Ingrédients (pour {{ recipe.baseServings }} pers.)</div>

                    <div v-if="recipe.ingredients?.length" class="ingredientTable">
                        <div
                            v-for="ing in recipe.ingredients"
                            :key="ing.id"
                            class="ingredientRow"
                        >
                            <span class="ingName">{{ ing.ingredient?.name ?? '—' }}</span>
                            <span class="ingQty">{{ formatQty(ing.quantity) }} {{ ing.unit?.abbreviation ?? '' }}</span>
                            <span v-if="ing.notes" class="ingNotes">{{ ing.notes }}</span>
                        </div>
                    </div>

                    <p v-else class="empty">Aucun ingrédient renseigné.</p>
                </div>

                <!-- Instructions -->
                <div v-if="recipe.instructions" class="section">
                    <div class="sectionTitle">Instructions</div>
                    <p class="instructions">{{ recipe.instructions }}</p>
                </div>

                <!-- Notes -->
                <div v-if="recipe.notes" class="section">
                    <div class="sectionTitle">Notes</div>
                    <p class="recipeNotes">{{ recipe.notes }}</p>
                </div>
            </template>
        </div>
    </private-view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useApi } from '@directus/extensions-sdk'

const router = useRouter()
const route = useRoute()
const api = useApi()

const recipeId = route.params.recipeId as string
const loading = ref(true)
const recipe = ref<any>(null)

onMounted(async () => {
    const res = await api.get(`/items/recipes/${recipeId}`, {
        params: {
            fields: [
                'id', 'name', 'category', 'baseServings', 'prepTime', 'cookTime', 'instructions', 'notes',
                'ingredients.id', 'ingredients.quantity', 'ingredients.notes',
                'ingredients.unit.abbreviation',
                'ingredients.ingredient.id', 'ingredients.ingredient.name',
            ],
        },
    })
    recipe.value = res.data.data
    loading.value = false
})

function formatQty(qty: number) {
    if (!qty) return '—'
    const rounded = Math.round(qty * 100) / 100
    return rounded.toLocaleString('fr-FR')
}
</script>

<style scoped>
@import '../styles/shared.css';

.backBtn {
    margin-right: 8px;
}

.headlineLink {
    cursor: pointer;
    color: var(--foreground-subdued);
}

.headlineLink:hover {
    color: var(--primary);
}

.loadingState {
    display: flex;
    justify-content: center;
    padding: 60px;
}

.recipeNotes {
    color: var(--foreground-subdued);
    white-space: pre-wrap;
    line-height: 1.6;
}
</style>
