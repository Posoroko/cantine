<template>
    <private-view :title="meal?.recipe?.name || 'Plat'">
        <template #headline>
            <span class="headlineLink" @click="router.push(`/cantine-dashboard/events/${eventId}`)">Événement</span>
        </template>

        <template #title-outer:prepend>
            <v-button class="backBtn" secondary icon rounded @click="router.push(`/cantine-dashboard/events/${eventId}`)">
                <v-icon name="arrow_back" />
            </v-button>
        </template>

        <div class="viewContent">
            <div v-if="loading" class="loadingState">
                <v-progress-circular indeterminate />
            </div>

            <template v-else-if="meal">
                <!-- Meal meta -->
                <div class="metaRow">
                    <div v-if="meal.guestCount" class="metaItem">
                        <span class="label">Convives</span>
                        <span class="value">{{ meal.guestCount }}</span>
                    </div>
                    <div v-if="meal.recipe?.baseServings" class="metaItem">
                        <span class="label">Recette de base</span>
                        <span class="value">{{ meal.recipe.baseServings }} pers.</span>
                    </div>
                    <div v-if="scaleFactor !== 1" class="metaItem">
                        <span class="label">Facteur</span>
                        <span class="value">×{{ scaleFactor.toFixed(2) }}</span>
                    </div>
                    <div v-if="meal.recipe?.category" class="metaItem">
                        <span class="label">Catégorie</span>
                        <span class="value">{{ meal.recipe.category }}</span>
                    </div>
                </div>

                <p v-if="meal.notes" class="mealNotes">{{ meal.notes }}</p>

                <!-- Ingredients -->
                <div class="section">
                    <div class="sectionTitle">Ingrédients (pour {{ meal.guestCount }} pers.)</div>

                    <div v-if="scaledIngredients.length" class="ingredientTable">
                        <div
                            v-for="ing in scaledIngredients"
                            :key="ing.id"
                            class="ingredientRow"
                        >
                            <span class="ingName">{{ ing.name }}</span>
                            <span class="ingQty">{{ formatQty(ing.quantity) }} {{ ing.unit }}</span>
                            <span v-if="ing.notes" class="ingNotes">{{ ing.notes }}</span>
                        </div>
                    </div>

                    <p v-else class="empty">Aucun ingrédient renseigné.</p>
                </div>

                <!-- Instructions -->
                <div v-if="meal.recipe?.instructions" class="section">
                    <div class="sectionTitle">Instructions</div>
                    <p class="instructions">{{ meal.recipe.instructions }}</p>
                </div>

                <!-- Recipe notes -->
                <div v-if="meal.recipe?.notes" class="section">
                    <div class="sectionTitle">Notes recette</div>
                    <p class="recipeNotes">{{ meal.recipe.notes }}</p>
                </div>
            </template>
        </div>
    </private-view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useApi } from '@directus/extensions-sdk'

const router = useRouter()
const route = useRoute()
const api = useApi()

const eventId = route.params.eventId as string
const mealId = route.params.mealId as string

const loading = ref(true)
const meal = ref<any>(null)

onMounted(async () => {
    const res = await api.get(`/items/meals/${mealId}`, {
        params: {
            fields: [
                'id', 'guestCount', 'notes',
                'recipe.id', 'recipe.name', 'recipe.category', 'recipe.baseServings',
                'recipe.prepTime', 'recipe.cookTime', 'recipe.instructions', 'recipe.notes',
                'recipe.ingredients.id', 'recipe.ingredients.quantity', 'recipe.ingredients.notes',
                'recipe.ingredients.unit.abbreviation',
                'recipe.ingredients.ingredient.id', 'recipe.ingredients.ingredient.name',
                'ingredients.id', 'ingredients.quantity', 'ingredients.notes',
                'ingredients.unit.abbreviation',
                'ingredients.ingredient.id', 'ingredients.ingredient.name',
            ],
        },
    })
    meal.value = res.data.data
    loading.value = false
})

const scaleFactor = computed(() => {
    if (!meal.value) return 1
    const guests = meal.value.guestCount || 1
    const base = meal.value.recipe?.baseServings || 100
    return guests / base
})

const scaledIngredients = computed(() => {
    if (!meal.value) return []

    // c5t: prefer meal_ingredients if they exist, otherwise scale from recipe ingredients
    const mealIngs = meal.value.ingredients || []
    if (mealIngs.length > 0) {
        return mealIngs.map((i: any) => ({
            id: i.id,
            name: i.ingredient?.name ?? '—',
            quantity: i.quantity,
            unit: i.unit?.abbreviation ?? '',
            notes: i.notes ?? '',
        }))
    }

    const recipeIngs = meal.value.recipe?.ingredients || []
    return recipeIngs.map((i: any) => ({
        id: i.id,
        name: i.ingredient?.name ?? '—',
        quantity: (i.quantity ?? 0) * scaleFactor.value,
        unit: i.unit?.abbreviation ?? '',
        notes: i.notes ?? '',
    }))
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

.mealNotes {
    margin: 8px 0 0;
    color: var(--foreground-subdued);
    font-style: italic;
}

.recipeNotes {
    color: var(--foreground-subdued);
    white-space: pre-wrap;
    line-height: 1.6;
}
</style>
