<script setup>
import { computed } from 'vue'
import { useModal } from '@/composables/modal'
import { currentEventStore, loadCurrentEvent } from '@/composables/currentEvent'
import { appAssetStore } from '@/composables/appAssets'
import { dbPost } from '@/composables/fetch'
import ListItem from '@/components/Cards/ListItem.vue'
import Icon from '@/components/Icon/Main.vue'

import SelectDay from './SelectDay.vue'
import SelectService from './SelectService.vue'
import SelectMeal from './SelectMeal.vue'
import SelectIngredients from './SelectIngredients.vue'

const props = defineProps({
    planning: { type: Object, required: true },
    day: { type: Object, required: true }
})

const { showModal } = useModal()

const planningSlotSort = computed(() => {
    const slot = props.planning.slot
    if (slot && typeof slot === 'object' && slot.sort != null) return slot.sort
    const found = appAssetStore.value.planningSlots.find(s => s.key === (slot?.key || slot))
    return found?.sort ?? 0
})

function getEligibleDays() {
    if (!currentEventStore.value) return []
    const planningDate = props.day.date
    return currentEventStore.value.days.filter(d => {
        if (!d.date || !planningDate) return false
        return d.date >= planningDate
    })
}

function getEligibleServices(selectedDay) {
    const services = selectedDay.services || []
    const isSameDay = selectedDay.id === props.day.id

    if (!isSameDay) return services

    const serviceSlots = appAssetStore.value.serviceSlots || []
    return services.filter(service => {
        const slotKey = typeof service.slot === 'object' ? service.slot?.key : service.slot
        const serviceSlot = serviceSlots.find(s => s.key === slotKey)
        const serviceSort = serviceSlot?.sort ?? 0
        return serviceSort > planningSlotSort.value
    })
}

function getEligibleIngredients(meal) {
    if (!meal.recipe?.ingredients) return []

    const existingIngredientIds = new Set(
        (props.planning.missions || [])
            .map(m => m.ingredient?.id)
            .filter(Boolean)
    )

    return meal.recipe.ingredients.filter(ri => {
        if (ri.ingredient?.prepLess) return false
        if (existingIngredientIds.has(ri.id)) return false
        return true
    })
}

async function startMissionFlow() {
    let step = 1
    let selectedDay = null
    let selectedService = null
    let selectedMeal = null

    while (step >= 1 && step <= 4) {
        try {
            if (step === 1) {
                const eligibleDays = getEligibleDays()
                selectedDay = await showModal(SelectDay, { days: eligibleDays })
                if (!selectedDay) return
                step = 2
            }
            else if (step === 2) {
                const eligibleServices = getEligibleServices(selectedDay)
                selectedService = await showModal(SelectService, { services: eligibleServices })
                if (!selectedService) return
                step = 3
            }
            else if (step === 3) {
                const meals = selectedService.meals || []
                selectedMeal = await showModal(SelectMeal, { meals })
                if (!selectedMeal) return
                step = 4
            }
            else if (step === 4) {
                const eligibleIngredients = getEligibleIngredients(selectedMeal)
                const selectedIngredients = await showModal(SelectIngredients, { ingredients: eligibleIngredients })
                if (!selectedIngredients?.length) return

                //* Create missions
                const promises = selectedIngredients.map(ingredient =>
                    dbPost({
                        endpoint: '/items/missions',
                        body: {
                            planning: props.planning.id,
                            ingredient: ingredient.id
                        }
                    })
                )
                await Promise.all(promises)

                if (currentEventStore.value) {
                    await loadCurrentEvent(currentEventStore.value.id)
                }
                return
            }
        } catch (reason) {
            if (reason === 'back') {
                step--
            } else {
                return
            }
        }
    }
}
</script>

<template>
    <ListItem
        @click="startMissionFlow"
        class="pointer"
    >
        <template #icon>
            <Icon>
                add
            </Icon>
        </template>

        <template #text>
            mission
        </template>
    </ListItem>
</template>
