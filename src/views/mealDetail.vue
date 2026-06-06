<script setup lang="ts">
import { computed } from 'vue'
import Icon from '@/components/Icon/Main.vue'
import { eventDaysStore } from '@/composables/currentEvent'

const props = defineProps<{ mealId: number }>()
const emit = defineEmits(['cancel'])

const meal = computed(() => {
    if (!eventDaysStore.value) return null
    for (const day of eventDaysStore.value) {
        for (const service of day.services) {
            const found = service.meals.find((m: any) => m.id === props.mealId)
            if (found) return { ...found, service, day }
        }
    }
    return null
})

const recipe = computed(() => meal.value?.recipe ?? null)

const mealServingCount = computed(() => meal.value?.servingCount ?? meal.value?.service?.guestCount ?? null)

const recipeBaseServingCount = computed(() => meal.value?.recipe?.servings ?? null)

function getTotalIngredientQuantity(baseQuantity: number) {
    if (!mealServingCount.value || !recipeBaseServingCount.value) return null
    return parseFloat(((baseQuantity / recipeBaseServingCount.value) * mealServingCount.value).toFixed(2))
}

function getIngredientQuantityPerPlate(baseQuantity: number) {
    if (!recipeBaseServingCount.value) return null
    return (baseQuantity / recipeBaseServingCount.value)
}

function getIngredientPricePerPlate(baseQuantity: number, pricePerUnit: number | null | undefined) {
    if (!recipeBaseServingCount.value || pricePerUnit == null) return null
    return parseFloat(((baseQuantity / recipeBaseServingCount.value) * pricePerUnit).toFixed(2))
}

const totalPricePerPlate = computed(() => {
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
</script>

<template>
    <div class="full flex column gap20">
        <!-- header -->
        <div class="flex alignCenter gap10">
            <h2 class="mealTitle grow">{{ recipe?.name || 'Sans recette' }}</h2>

            <div
                v-if="meal"
                class="flex alignCenter gap10"
            >
                <Icon size="md">groups</Icon>
                <span class="fontWeightBold">{{ meal.service.guestCount }}</span>

                <span
                    v-if="meal.servingCount"
                    class="flex alignCenter gap5"
                >
                    <Icon size="sm">{{ meal.servingCount === 1 ? 'person' : 'group' }}</Icon>
                    {{ meal.servingCount }}
                </span>
            </div>

            <Icon
                @click="emit('cancel')"
                class="pointer"
                size="lg"
            >
                close
            </Icon>
        </div>

        <!-- ingredients -->
        <div
            v-if="recipe"
            class="flex column gap20"
        >
            <div class="flex column gap5">
                <h3 class="sectionTitle">Ingrédients</h3>

                <div
                    v-for="ingredient in recipe.ingredients"
                    :key="ingredient.id"
                    class="ingredientRow pad10 rounded10"
                >
                    <div class="flex justifyBetween">
                        <p class="textXl fontWeightBold beigeCardGreenText pad5 rounded5">
                            {{ ingredient.ingredient?.name }}
                        </p>

                        <div class="flex gap5 textXl fontWeightBold beigeCardGreenText pad5 rounded5">
                            <span>{{ getTotalIngredientQuantity(ingredient.quantity!) }}</span>
                            <span>{{ ingredient.ingredient?.unit }}</span>
                        </div>
                    </div>

                    <div class="flex justifyEnd alignCenter gap20 marTop10">
                        <Icon size="md">person</Icon>
                        <span>{{ getIngredientQuantityPerPlate(ingredient.quantity!) }} {{ ingredient.ingredient?.unit }}</span>
                        <span>{{ getIngredientPricePerPlate(ingredient.quantity!, ingredient.ingredient?.defaultPrice) }} €</span>
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

            <div class="priceSummary flex justifyBetween pad15 rounded10">
                <p>Total par assiette:</p>
                <p class="textLg fontWeightBold">{{ totalPricePerPlate }}€</p>
            </div>

            <div class="priceSummary flex justifyBetween pad15 rounded10">
                <p>Total:</p>
                <p class="textLg fontWeightBold">{{ totalPrice }}€</p>
            </div>
        </div>

        <div
            v-else
            class="noRecipe pad20"
        >
            <p>Aucune recette associée</p>
        </div>
    </div>
</template>

<style scoped>
.mealTitle {
    font-size: 20px;
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
