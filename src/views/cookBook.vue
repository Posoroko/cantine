<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import Private from '@/components/Architecture/Layouts/Private.vue'
import Icon from '@/components/Icon/Main.vue'
import { dbGet } from '@/composables/fetch'
import { appAssetStore } from '@/composables/appAssets'

type RecipeTag = {
    key: string
    text: string
}

type RecipeDiet = {
    key: string
    text: string
}

type RecipeIngredientSource = {
    id: number
    name: string | null
    unit: string | null
    defaultPrice: number | null
}

type RecipeIngredient = {
    id: number
    ingredient: RecipeIngredientSource | null
    quantity: number | null
}

type Recipe = {
    id: number
    name: string | null
    instructions: string | null
    servings: number | null
    tags?: RecipeTag[]
    diets?: RecipeDiet[]
    ingredients?: RecipeIngredient[]
}

const recipes = ref<Recipe[]>([])
const tags = ref<RecipeTag[]>([])
const diets = ref<RecipeDiet[]>([])
const selectedTagKeys = ref<string[]>([])
const selectedDietKeys = ref<string[]>([])
const searchQuery = ref('')
const showTags = ref(false)
const showDiets = ref(false)
const expandedRecipeIds = ref<number[]>([])

const filteredRecipes = computed(() => {
    let results = recipes.value
    
    // Filter by selected tags (if any selected, recipe must have at least one)
    if (selectedTagKeys.value.length > 0) {
        results = results.filter((recipe) => {
            return recipe.tags?.some((tag) => selectedTagKeys.value.includes(tag.key))
        })
    }
    
    // Filter by selected diets (if any selected, recipe must have at least one)
    if (selectedDietKeys.value.length > 0) {
        results = results.filter((recipe) => {
            return recipe.diets?.some((diet) => selectedDietKeys.value.includes(diet.key))
        })
    }
    
    // Filter by search query
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        results = results.filter((recipe) => {
            const name = (recipe.name || '').toLowerCase()
            return name.includes(query)
        })
    }
    
    return results
})

function getUnitText(unitKey: string | null): string {
    if (!unitKey) return ''
    const unit = appAssetStore.value.units.find((u: any) => u.key === unitKey)
    return unit?.singular || unitKey
}

function formatQty(value: number): string {
    if (value % 1 === 0) return String(value)
    return parseFloat(value.toFixed(2)).toString()
}

function formatPrice(price: number): string {
    return price.toFixed(2) + ' €'
}

function isRecipeExpanded(recipeId: number): boolean {
    return expandedRecipeIds.value.includes(recipeId)
}

function toggleRecipeExpanded(recipeId: number) {
    const index = expandedRecipeIds.value.indexOf(recipeId)
    if (index > -1) {
        expandedRecipeIds.value.splice(index, 1)
    } else {
        expandedRecipeIds.value.push(recipeId)
    }
}

// c5t: cookbook ingredient rows are always expressed per person (no meal serving adaptation)
const recipeCards = computed(() => {
    return filteredRecipes.value.map((recipe) => {
        const servings = recipe.servings || null
        const ingredientRows = (recipe.ingredients || []).map((ri) => {
            const qty = ri.quantity ?? null
            const defaultPrice = ri.ingredient?.defaultPrice ?? null
            const qtyPerPerson = (qty !== null && servings) ? qty / servings : null
            const pricePerPerson = (qtyPerPerson !== null && defaultPrice !== null) ? qtyPerPerson * defaultPrice : null

            return {
                id: ri.id,
                name: ri.ingredient?.name || '—',
                unit: getUnitText(ri.ingredient?.unit ?? null),
                qtyPerPerson,
                pricePerPerson,
            }
        })

        const pricedRows = ingredientRows.filter((row) => row.pricePerPerson !== null)
        const totalPricePerPerson = pricedRows.length
            ? pricedRows.reduce((sum, row) => sum + row.pricePerPerson!, 0)
            : null

        return {
            ...recipe,
            ingredientRows,
            totalPricePerPerson,
        }
    })
})

async function fetchRecipes() {
    const data = await dbGet<Recipe[]>({
        endpoint: '/items/recipes',
        query: {
            fields: [
                '*',
                'tags.*',
                'diets.*',
                'ingredients.*',
                'ingredients.ingredient.id',
                'ingredients.ingredient.name',
                'ingredients.ingredient.unit',
                'ingredients.ingredient.defaultPrice',
            ].join(),
        }
    })

    recipes.value = data.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
}

onMounted(async () => {
    await fetchRecipes()
    tags.value = appAssetStore.value.recipeTags || []
    diets.value = appAssetStore.value.diets || []
})

function toggleTag(tagKey: string) {
    const index = selectedTagKeys.value.indexOf(tagKey)
    if (index > -1) {
        selectedTagKeys.value.splice(index, 1)
    } else {
        selectedTagKeys.value.push(tagKey)
    }
}

function toggleDiet(dietKey: string) {
    const index = selectedDietKeys.value.indexOf(dietKey)
    if (index > -1) {
        selectedDietKeys.value.splice(index, 1)
    } else {
        selectedDietKeys.value.push(dietKey)
    }
}
</script>

<template>
    <Private>
        <template #main>
            <div 
                class="
                    full
                    flex column gap20
                    pad20
                "
            >
                <h1>Recettes</h1>

                <input 
                    v-model="searchQuery"
                    type="text"
                    placeholder="Rechercher une recette..."
                    class="defaultInputStyles"
                />

                <div
                    class="scrollBox"
                >
                    <div>
                        <div
                            @click="showTags = !showTags"
                            class="
                                filterHeader
                                flex alignCenter justifyBetween
                                pointer pad10
                            "
                        >
                            <div class="filterLabel">Tags</div>
                            <Icon size="sm">
                                {{ showTags ? 'expand_less' : 'expand_more' }}
                            </Icon>
                        </div>

                        <div
                            v-if="showTags"
                            class="filters flex wrap gap10"
                        >
                            <button
                                v-for="tag in tags"
                                :key="tag.key"
                                @click.prevent.stop="toggleTag(tag.key)"
                                class="filterTag"
                                :class="[selectedTagKeys.includes(tag.key) ? 'active' : '']"
                            >
                                {{ tag.text }}
                            </button>
                        </div>
                    </div>
                    <div
                        @click="showDiets = !showDiets"
                        class="
                            filterHeader
                            flex alignCenter justifyBetween
                            pointer pad10
                        "
                    >
                        <div class="filterLabel">Régimes</div>
                        
                        <Icon size="sm">
                            {{ showDiets ? 'expand_less' : 'expand_more' }}
                        </Icon>
                    </div>
                    <div
                        v-if="showDiets"
                        class="filters flex wrap gap10"
                    >
                        <button
                            v-for="diet in diets"
                            :key="diet.key"
                            @click.prevent.stop="toggleDiet(diet.key)"
                            class="filterTag"
                            :class="[selectedDietKeys.includes(diet.key) ? 'active' : '']"
                        >
                            {{ diet.text }}
                        </button>
                    </div>


                    <div
                        class="
                            flex column gap5 marTop20
                        "
                    >
                        <article
                            v-for="recipe in recipeCards"
                            :key="recipe.id"
                            class="recipeCard flex column gap15 pad15 rounded10"
                            :class="[isRecipeExpanded(recipe.id) ? 'recipeCardOpen' : '']"
                        >
                            <div class="flex alignCenter justifyBetween gap10">
                                <h2 class="recipeTitle grow">{{ recipe.name || 'Sans nom' }}</h2>

                                <div class="flex alignCenter gap10 shrink0">
                                    <span
                                        v-if="recipe.servings"
                                        class="servingsBadge flex alignCenter gap5"
                                    >
                                        <Icon size="sm">group</Icon>
                                        {{ recipe.servings }}
                                    </span>

                                    <button
                                        @click="toggleRecipeExpanded(recipe.id)"
                                        class="expandButton flex alignCenter justifyCenter"
                                        type="button"
                                        :aria-label="isRecipeExpanded(recipe.id) ? 'Réduire la recette' : 'Déplier la recette'"
                                    >
                                        <Icon size="sm">
                                            {{ isRecipeExpanded(recipe.id) ? 'expand_less' : 'expand_more' }}
                                        </Icon>
                                    </button>
                                </div>
                            </div>

                            <div
                                v-if="isRecipeExpanded(recipe.id)"
                                class="flex column gap15"
                            >
                                <div
                                    v-if="recipe.instructions"
                                    class="flex column gap5"
                                >
                                    <h3 class="sectionTitle">Instructions</h3>
                                    <p class="instructionsText whiteSpacePreWrap">{{ recipe.instructions }}</p>
                                </div>

                                <div class="flex column gap5">
                                    <h3 class="sectionTitle">Ingrédients</h3>

                                    <div
                                        v-if="recipe.ingredientRows.length"
                                        class="flex column gap5"
                                    >
                                        <div
                                            v-for="row in recipe.ingredientRows"
                                            :key="row.id"
                                            class="ingredientRow flex alignCenter gap10 pad10 rounded10"
                                        >
                                            <span class="grow">{{ row.name }}</span>

                                            <span
                                                v-if="row.qtyPerPerson !== null"
                                                class="fS14"
                                            >
                                                {{ formatQty(row.qtyPerPerson) }} {{ row.unit }} / pers
                                            </span>

                                            <span
                                                v-if="row.pricePerPerson !== null"
                                                class="fS14 weight6 priceCell"
                                            >
                                                {{ formatPrice(row.pricePerPerson) }}
                                            </span>
                                        </div>

                                        <div
                                            v-if="recipe.totalPricePerPerson !== null"
                                            class="priceSummary flex alignCenter justifyBetween pad10 rounded10"
                                        >
                                            <span>Prix total par personne</span>
                                            <span class="weight7">{{ formatPrice(recipe.totalPricePerPerson) }}</span>
                                        </div>
                                    </div>

                                    <p
                                        v-else
                                        class="emptyText"
                                    >
                                        Aucun ingrédient
                                    </p>
                                </div>
                            </div>
                        </article>

                        <p
                            v-if="!recipeCards.length"
                            class="emptyText"
                        >
                            Aucune recette trouvée
                        </p>
                    </div>
                </div>
            </div>
        </template>
    </Private>
</template>

<style scoped>
.scrollBox {
    overflow-y: scroll;
}
.searchInput {
    padding: 10px 15px;
    border: none;
    border-bottom: 2px solid var(--beige);
    border-radius: 0;
    background-color: transparent;
    color: var(--beige);
    font-size: 14px;
    transition: all 0.2s ease;
}

.searchInput::placeholder {
    color: rgba(181, 159, 122, 0.5);
}

.searchInput:focus {
    outline: none;
    border-bottom-color: rgba(181, 159, 122, 0.8);
}

.filterHeader {
    margin-bottom: 8px;
    color: var(--beige);
}

.filterLabel {
    text-transform: uppercase;
}

.filterTag {
    padding: 2px 10px;
    border: 1px solid var(--beige);
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
}

.filterTag.active {
    background-color: var(--beige);
    color: var(--green);
}

.recipeCard {
    background: color-mix(in srgb, var(--beige) 6%, transparent);
    color: var(--beige);
}

.recipeCardOpen {
    border: 1px solid var(--beige);
}

.recipeTitle {
    font-size: 18px;
    font-weight: 700;
    text-transform: capitalize;
}

.servingsBadge {
    opacity: 0.85;
}

.expandButton {
    width: 28px;
    height: 28px;
    border: 1px solid color-mix(in srgb, var(--beige) 35%, transparent);
    border-radius: 999px;
    background: transparent;
    color: var(--beige);
    cursor: pointer;
}

.sectionTitle {
    margin-bottom: 2px;
    color: var(--beige);
}

.instructionsText {
    line-height: 1.5;
}

.ingredientRow {
    background: color-mix(in srgb, var(--beige) 4%, transparent);
}

.priceCell {
    min-width: 64px;
    text-align: right;
    flex-shrink: 0;
}

.priceSummary {
    margin-top: 4px;
    border: 1px solid color-mix(in srgb, var(--beige) 20%, transparent);
    background: color-mix(in srgb, var(--beige) 8%, transparent);
}

.emptyText {
    opacity: 0.6;
}
</style>