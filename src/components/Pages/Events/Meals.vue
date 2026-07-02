<script setup>
import { ref, onMounted } from 'vue'
import { dbGet, dbDelete } from '@/composables/fetch'
import Icon from '@/components/Icon/Main.vue'
import MealCard from '@/components/Cards/Meal.vue'
import { TIME_SLOT_CONFIG } from '@/composables/appAssets'

const props = defineProps({
    eventId: {
        type: Number,
        required: true
    }
})

const showNewMealForm = ref(false)
const openMealId = ref(null)
const openMenuMealId = ref(null)
const meals = ref([])

async function fetchMeals() {
    const result = await dbGet({
        endpoint: '/items/meals',
        query: {
            fields: [
                'id',
                'type',
                'servingCount',
                'recipe.id',
                'recipe.name',
                'service.id',
                'service.timeSlot',
                'service.guestCount',
                'service.day.id',
                'service.day.date',
            ].join(','),
            filter: { service: { day: { event: { _eq: props.eventId } } } }
        }
    })
    meals.value = Array.isArray(result) ? result : []
}

onMounted(fetchMeals)

const toggleMeal = (mealId) => {
    openMealId.value = openMealId.value === mealId ? null : mealId
    openMenuMealId.value = null
}

const toggleMealMenu = (mealId) => {
    openMenuMealId.value = openMenuMealId.value === mealId ? null : mealId
}

async function deleteMeal(mealId) {
    await dbDelete({ endpoint: `/items/meals/${mealId}` })
    await fetchMeals()
}

async function onMealCreated() {
    showNewMealForm.value = false
    await fetchMeals()
}

async function refreshMeal() {
    await fetchMeals()
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
            <div
                v-for="meal in meals" :key="meal.id"
                class="mealEntry flex column gap4"
            >
                <MealCard
                    :meal="meal"
                    :showMenu="openMenuMealId === meal.id"
                    variant="list"
                    @toggle-menu="toggleMealMenu(meal.id)"
                    @delete="deleteMeal(meal.id)"
                />
                <p class="mealMeta">
                    {{ meal.service?.day?.date ? new Date(meal.service.day.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' }) : '' }}
                    · {{ TIME_SLOT_CONFIG[meal.service?.timeSlot ?? '']?.label ?? meal.service?.timeSlot }}
                </p>
            </div>

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
.mealMeta {
    color: var(--beige);
    font-size: 0.72em;
    font-weight: 600;
    letter-spacing: 0.05em;
    opacity: 0.8;
    padding-left: 12px;
    text-transform: capitalize;
}
</style>

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
