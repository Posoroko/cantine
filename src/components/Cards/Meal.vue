<script setup lang="ts">
import Icon from '@/components/Icon/Main.vue'
import { computed } from 'vue'
import { useModal } from '@/composables/modal'
import MealDetail from '@/views/mealDetail.vue'

const { showModal } = useModal()

const props = defineProps({
    meal: { type: Object, required: true },
    serviceGuestCount: {
        type: Number,
        required: true
    }
})

// c5t: price per portion = sum of (ri.quantity / recipe.servings * defaultPrice)
const pricePerPortion = computed(() => {
    const recipe = props.meal.recipe
    if (!recipe?.ingredients?.length || !recipe.servings) return null
    let total = 0
    let hasPrice = false
    for (const ri of recipe.ingredients) {
        if (ri.quantity && ri.ingredient?.defaultPrice) {
            total += (ri.quantity / recipe.servings) * ri.ingredient.defaultPrice
            hasPrice = true
        }
    }
    return hasPrice ? total : null
})

function openMeal() {
    showModal(MealDetail, { mealId: props.meal.id }).catch(() => {})
}
</script>

<template>
    <div
        @click="openMeal"
        class="mealCard flex alignCenter gap10 pad10 rounded10 pointer"
    >
        <Icon size="sm">restaurant</Icon>

        <span class="mealLabel grow">
            {{ meal.recipe?.name || 'Sans recette' }}
        </span>

        <span
            class="beigeCardGreenText pad5 rounded10"
        >
            {{ meal.servingCount || serviceGuestCount }}
        </span>

        <span
            v-if="pricePerPortion !== null"
            class="shrink0"
        >
            {{ pricePerPortion.toFixed(2) }} €/pers
        </span>

        <Icon size="sm">chevron_right</Icon>
    </div>
</template>

<style scoped>
.mealCard {
    background: color-mix(in srgb, var(--beige) 6%, transparent);
    color: var(--beige);
    transition: background 200ms;
}

.mealCard:hover {
    background: color-mix(in srgb, var(--beige) 12%, transparent);
}

.mealLabel {
    font-size: 16px;
    font-weight: 600;
    text-transform: capitalize;
}
</style>
