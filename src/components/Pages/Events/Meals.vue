<script setup>
import { ref, computed } from 'vue'
import { currentEventStore, loadCurrentEvent } from '@/composables/currentEvent'
import { dbDelete } from '@/composables/fetch'
import Icon from '@/components/Icon/Main.vue'
import MealCard from '@/components/Cards/Meal.vue'

const props = defineProps({
    eventId: {
        type: Number,
        required: true
    }
})

const showNewMealForm = ref(false)
const openMealId = ref(null)
const openMenuMealId = ref(null)

const meals = computed(() => {
    if (!currentEventStore.value?.meals?.length) return []
    return currentEventStore.value.meals
})

const toggleMeal = (mealId) => {
    openMealId.value = openMealId.value === mealId ? null : mealId
    openMenuMealId.value = null
}

const toggleMealMenu = (mealId) => {
    openMenuMealId.value = openMenuMealId.value === mealId ? null : mealId
}

async function deleteMeal(mealId) {
    await dbDelete({ endpoint: `/items/meals/${mealId}` })
    await loadCurrentEvent(props.eventId)
}

async function onMealCreated() {
    showNewMealForm.value = false
    await loadCurrentEvent(props.eventId)
}

async function refreshMeal() {
    await loadCurrentEvent(props.eventId)
}

</script>

<template>
    <div
        class="
            mealsContainer grow
            flex column pad10
        "
    >
        <div
            v-if="meals.length > 0"
            class="
                mealsList
                flex column gap10
            "
        >
            <MealCard
                v-for="meal in meals" :key="meal.id"
                :meal="meal"
                :showMenu="openMenuMealId === meal.id"
                variant="list"
                @toggle-menu="toggleMealMenu(meal.id)"
                @delete="deleteMeal(meal.id)"
            />
        </div>

        <p
            v-else-if="!showNewMealForm"
            class="noData"
        >
            Aucun plat pour cet événement
        </p>
    </div>
</template>

<style scoped>
.mealsContainer {
    overflow-y: auto;
}

.noData {
    text-align: center;
    color: var(--beige);
    padding: 40px;
}

.addMealButton {
    margin-top: 10px;
    padding: 12px 16px;
    border-radius: 12px;
    background: rgba(13, 139, 95, 0.08);
    border: 1px dashed var(--green);
    color: var(--green);
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
}

.addMealButton:hover {
    background: rgba(13, 139, 95, 0.15);
}
</style>
