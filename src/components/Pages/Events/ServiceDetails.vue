<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { currentEventStore } from '@/composables/currentEvent'
import Loading from '@/components/Loading/Main.vue'
import Icon from '@/components/Icon/Main.vue'
import DietDetails from '@/components/Pages/Events/ServiceDietDetails.vue'

const route = useRoute()
const router = useRouter()

const previousPage = computed(() => (route.query.previousPage as string) || route.path)

const TIME_SLOT_CONFIG: Record<string, { label: string; icon: string }> = {
    breakfast: { label: 'Petit-déj',  icon: 'breakfast_dining' },
    lunch:     { label: 'Déjeuner',   icon: 'lunch_dining' },
    snackPm:   { label: 'Goûter',     icon: 'bakery_dining' },
    aperoPm:   { label: 'Apéro',      icon: 'wine_bar' },
    supper:    { label: 'Souper',     icon: 'dinner_dining' },
}

const service = computed(() => {
    const dayId = parseInt(route.query.day as string)
    const serviceId = parseInt(route.query.service as string)
    if (!currentEventStore.value || !dayId || !serviceId) return null

    const day = currentEventStore.value.days.find(d => d.id === dayId)
    if (!day) return null

    return day.services.find(s => s.id === serviceId) || null
})

// c5t: price per portion for a meal = sum of (ri.quantity / recipe.servings * defaultPrice)
function mealPricePerPortion(meal: any): number | null {
    const recipe = meal.recipe
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
}

function formatPrice(price: number): string {
    return price.toFixed(2) + ' €'
}

// c5t: meal rows enriched with price per portion and head count for the meal
const mealRows = computed(() => {
    if (!service.value?.meals) return []
    const serviceGuestCount = (service.value as any).guestCount ?? null
    return (service.value.meals as any[]).map(meal => {
        const pricePerPortion = mealPricePerPortion(meal)
        const headCount: number | null = meal.servingCount ?? serviceGuestCount
        const totalCost = (pricePerPortion !== null && headCount) ? pricePerPortion * headCount : null
        return {
            id: meal.id as number,
            name: (meal.recipe?.name as string | null) || 'Sans recette',
            pricePerPortion,
            headCount,
            totalCost,
        }
    })
})

// c5t: service total = sum of all (mealPricePerPortion × headCount)
const serviceTotalCost = computed(() => {
    const priced = mealRows.value.filter(r => r.totalCost !== null)
    if (!priced.length) return null
    return priced.reduce((sum, r) => sum + r.totalCost!, 0)
})

// c5t: average per person = total / service guest count
const servicePricePerPerson = computed(() => {
    const guestCount = (service.value as any)?.guestCount
    if (!serviceTotalCost.value || !guestCount) return null
    return serviceTotalCost.value / guestCount
})

function openMeal(mealId: number) {
    router.push({ path: `/plats/${mealId}`, query: { previousPage: route.fullPath } })
}
</script>

<template>
    <div class="serviceDetailsContainer">
        <Loading v-if="!service">
            Chargement...
        </Loading>

        <div
            v-if="service"
            class="serviceDetailsContent flex column gap20"
        >
            <!-- header -->
            <div class="flex alignCenter gap10 pad10">
                <router-link
                    :to="previousPage"
                    class="flex alignCenter"
                >
                    <Icon size="lg">arrow_back</Icon>
                </router-link>

                <Icon size="md">
                    {{ TIME_SLOT_CONFIG[(service as any).timeSlot]?.icon || 'restaurant' }}
                </Icon>

                <h1 class="title grow">
                    {{ TIME_SLOT_CONFIG[(service as any).timeSlot]?.label || (service as any).timeSlot || '' }}
                </h1>

                <span
                    v-if="(service as any).guestCount"
                    class="flex alignCenter gap5 shrink0"
                >
                    <Icon size="sm">group</Icon>
                    {{ (service as any).guestCount }}
                </span>
            </div>

            <!-- diet details -->
            <div class="pad10">
                <DietDetails
                    :baseGuestCount="(service as any).guestCount"
                    :dietCounts="(service as any).dietCounts || []"
                />
            </div>

            <!-- meal rows -->
            <div class="flex column gap5 pad10">
                <h3 class="sectionTitle">Plats</h3>

                <div
                    v-for="row in mealRows"
                    :key="row.id"
                    @click="openMeal(row.id)"
                    class="mealRow flex alignCenter gap10 pad10 rounded10 pointer"
                >
                    <Icon size="sm">restaurant</Icon>

                    <span class="grow">{{ row.name }}</span>

                    <span
                        v-if="row.pricePerPortion !== null"
                        class="fS14 weight6 shrink0"
                    >
                        {{ formatPrice(row.pricePerPortion) }}/pers
                    </span>

                    <Icon size="sm">chevron_right</Icon>
                </div>
            </div>

            <!-- price summary -->
            <div
                v-if="serviceTotalCost !== null"
                class="priceSummary flex column gap10 pad15 rounded10"
            >
                <div
                    v-if="servicePricePerPerson !== null"
                    class="flex justifyBetween alignCenter"
                >
                    <span class="fS14">Prix par personne</span>
                    <span class="weight7">{{ formatPrice(servicePricePerPerson) }}</span>
                </div>

                <span
                    v-if="(service as any).guestCount"
                    class="fS14 dimmed"
                >
                    × {{ (service as any).guestCount }} convives
                </span>

                <div class="flex justifyBetween alignCenter">
                    <span class="fS14">Total service</span>
                    <span class="weight7">{{ formatPrice(serviceTotalCost) }}</span>
                </div>
            </div>
        </div>

        <p
            v-else
            class="noData pad20"
        >
            Erreur lors du chargement du service
        </p>
    </div>
</template>

<style scoped>
.title {
    font-size: 24px;
    font-weight: 700;
    color: var(--beige);
}

.noData {
    text-align: center;
    opacity: 0.5;
}

.sectionTitle {
    color: var(--beige);
    margin-bottom: 4px;
}

.mealRow {
    background: color-mix(in srgb, var(--beige) 6%, transparent);
    color: var(--beige);
}

.dimmed {
    opacity: 0.5;
}

.priceSummary {
    background: color-mix(in srgb, var(--beige) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--beige) 20%, transparent);
}
</style>
