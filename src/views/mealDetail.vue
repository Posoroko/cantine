<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import Private from '@/components/Architecture/Layouts/Private.vue'
import Icon from '@/components/Icon/Main.vue'
import Loading from '@/components/Loading/Main.vue'
import EventBar from '@/components/Architecture/Bars/EventBar.vue'

import { currentEventStore } from '@/composables/currentEvent'

const route = useRoute()
const router = useRouter()

const previousPage = computed(() => route.query.previousPage || route.path)

const mealId = computed(() => parseInt(route.params.mealId as string))

const meal = computed(() => {
    if (!currentEventStore.value) return null
    for (const day of currentEventStore.value.days) {
        for (const service of day.services) {
            const found = service.meals.find((m: any) => m.id === mealId.value)
            if (found) return { ...found, service, day }
        }
    }
    return null
})

const recipe = computed(() => (meal.value?.recipe || null) as any)

const mealServingCount = computed(() => {

    if(meal.value?.servingCount) {
        return meal.value.servingCount
    }
    if(meal.value?.service.guestCount) {
        return meal.value.service.guestCount
    }

    return null
})

const recipeBaseServingCount = computed(() => {
    return meal.value?.recipe?.servings || null
})


function getTotalIngredientQuantity(baseQuantity: number) {
    if(!mealServingCount.value || !recipeBaseServingCount.value) return

    return parseFloat(((baseQuantity / recipeBaseServingCount.value) * mealServingCount.value).toFixed(2))
}

function getingredientQuantityPerPlate(baseQuantity: number) {
    if(!recipeBaseServingCount.value) return null

    return (baseQuantity / recipeBaseServingCount.value)
}

function getIngredientPricePerPlate(baseQuantity: number, pricePerUnit: number) {
    if(!recipeBaseServingCount.value) return null

    const quantity = (baseQuantity / recipeBaseServingCount.value)

    return parseFloat((quantity * pricePerUnit).toFixed(2))
}


const totalPricePerPLate = computed(() => {
    if (!recipe.value?.ingredients || !recipeBaseServingCount.value) return null
    let total = 0
    let hasPrice = false
    for (const ri of recipe.value.ingredients) {
        const qty: number | null = ri.quantity ?? null
        const price: number | null = ri.ingredient?.defaultPrice ?? null
        if (qty === null || price === null) continue
        total += (qty / recipeBaseServingCount.value) * price
        hasPrice = true
    }
    return hasPrice ? parseFloat(total.toFixed(2)) : null
})


const totalPrice = computed(() => {
    if (!recipe.value?.ingredients || !recipeBaseServingCount.value || !mealServingCount.value) return null
    let total = 0
    let hasPrice = false
    for (const ri of recipe.value.ingredients) {
        const qty: number | null = ri.quantity ?? null
        const price: number | null = ri.ingredient?.defaultPrice ?? null
        if (qty === null || price === null) continue
        total += (qty / recipeBaseServingCount.value) * mealServingCount.value * price
        hasPrice = true
    }
    return hasPrice ? parseFloat(total.toFixed(2)) : null
})

function goBack() {
    router.push(previousPage.value as string)
}
</script>

<template>
    <Private>
        <template #topBar>
            <EventBar v-if="currentEventStore" />
        </template>

        <template #title>
            <Loading v-if="!currentEventStore" />

            <div
                v-else-if="meal"
                class="flex alignCenter gap10 pad10"
            >
                <Icon
                    @click="goBack"
                    class="pointer"
                    size="lg"
                >
                    arrow_back
                </Icon>

                <h1 class="title grow">
                    {{ recipe?.name || 'Sans recette' }}
                </h1>

                <div
                    class="flex alignCenter gap10"
                >
                    <Icon
                        size="Lg"
                    >
                        groups
                    </Icon>
                    <p
                        class="textLg fontWeightBold"
                    >
                        {{ meal.service.guestCount }}
                    </p>
                </div>

                <span
                    v-if="meal.servingCount"
                    class="flex alignCenter gap5 shrink0"
                >
                    <Icon size="sm">
                        {{ meal.servingCount === 1 ? 'person' : 'group' }}
                    </Icon>
                    {{ meal.servingCount }}
                </span>
            </div>

            <div
                v-else
                class="pad20"
            >
                <p>Plat introuvable</p>
                <button @click="goBack">
                    Retour
                </button>
            </div>
        </template>

        <template #main>
            <div
                v-if="recipe"
                class="content flex column gap20 pad10"
            >
                <!-- ingredients -->
                <div class="flex column gap5">
                    <h3 class="sectionTitle">Ingrédients</h3>

                    <div
                        v-for="ingredient in meal?.recipe?.ingredients"
                        :key="ingredient.id"
                        class="ingredientRow pad10 rounded10"
                    >
                        <div
                            class=" flex justifyBetween"
                        >
                            <p
                                class="textXl fontWeightBold beigeCardGreenText pad5 rounded5"
                            >
                                {{ ingredient?.ingredient?.name }}
                            </p>

                            <div
                                class="flex gap5 textXl fontWeightBold  beigeCardGreenText pad5 rounded5"
                            >
                                <span>
                                    {{ getTotalIngredientQuantity(ingredient.quantity) }}
                                </span>

                                <span>
                                    {{ ingredient.ingredient.unit }}
                                </span>
                            </div>
                        </div>


                        <div
                            class="flex justifyEnd alignCenter gap20 marTop10"
                        >
                            <Icon
                                size="md"
                            >
                                person
                            </Icon>

                            <span
                                class=""
                            >
                                {{ getingredientQuantityPerPlate(ingredient.quantity) }}
                                {{ ingredient.ingredient.unit }}
                            </span>

                            <span
                                class=""
                            >
                                {{ getIngredientPricePerPlate(ingredient.quantity, ingredient.ingredient?.defaultPrice) }} €
                            </span>
                        </div>
                    </div>
                </div>

                <!-- instructions -->
                <div
                    v-if="recipe.instructions"
                    class="flex column gap10"
                >
                    <h3 class="sectionTitle">Instructions</h3>
                    <p class="whiteSpacePreWrap instructionsText">{{ recipe.instructions }}</p>
                </div>

                <!-- price summary -->


                <h2>Prix</h2>
                <div
                    class="priceSummary flex  justifyBetween pad15 rounded10"
                >
                    <p>
                        Total par assiette: 
                    </p>

                    <p
                        class="textLg fontWeightBold"
                    >
                        {{ totalPricePerPLate }}€
                    </p>
                </div>

                <div
                    class="priceSummary flex  justifyBetween pad15 rounded10"
                >
                    <p>
                        Total: 
                    </p>

                    <p
                        class="textLg fontWeightBold"
                    >
                        {{ totalPrice }}€
                    </p>
                </div>
            </div>

            <Loading v-else-if="meal?.recipe">
                Chargement de la recette...
            </Loading>

            <div
                v-else
                class="noRecipe pad20"
            >
                <p>Aucune recette associée</p>
            </div>
        </template>
    </Private>
</template>

<style scoped>
.title {
    font-size: 24px;
    font-weight: 700;
    text-transform: capitalize;
}

.priceSummary {
    background: color-mix(in srgb, var(--beige) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--beige) 20%, transparent);
}

.noRecipe {
    text-align: center;
    opacity: 0.5;
}
</style>
