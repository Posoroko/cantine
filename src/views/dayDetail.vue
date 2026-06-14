<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Private from '@/components/Architecture/Layouts/Private.vue'
import Icon from '@/components/Icon/Main.vue'
import Loading from '@/components/Loading/Main.vue'
import EventBar from '@/components/Architecture/Bars/EventBar.vue'
import Meal from '@/components/Cards/Meal.vue'
import {
    TIME_SLOT_CONFIG,
    MEAL_TYPE_CONFIG
} from '@/composables/appAssets'
import { eventDaysStore, loadEventDays } from '@/composables/currentEvent'

const route = useRoute()
const router = useRouter()

const dayId = computed(() => parseInt(route.params.dayId as string))
const eventId = computed(() => parseInt(route.params.eventId as string))

onMounted(() => loadEventDays(eventId.value))

// c5t: day is a computed — reacts instantly to route param changes, no watcher needed
const day = computed(() => eventDaysStore.value?.find((d: any) => d.id === dayId.value) ?? null)

// c5t: prev/next day navigation within the same event
const currentDayIndex = computed(() => eventDaysStore.value?.findIndex((d: any) => d.id === dayId.value) ?? -1)
const prevDay = computed(() => currentDayIndex.value > 0 ? eventDaysStore.value![currentDayIndex.value - 1] : null)
const nextDay = computed(() => eventDaysStore.value && currentDayIndex.value < eventDaysStore.value.length - 1 ? eventDaysStore.value[currentDayIndex.value + 1] : null)

function goToDay(id: number) {
    router.push({ name: 'DayDetail', params: { eventId: eventId.value, dayId: id } })
}

const services = computed(() =>
    [...(day.value?.services ?? [])].sort((a: any, b: any) => {
        const orderA = TIME_SLOT_CONFIG[a.timeSlot ?? '']?.order ?? 99
        const orderB = TIME_SLOT_CONFIG[b.timeSlot ?? '']?.order ?? 99
        return orderA - orderB
    })
)

const selectedService = computed(() => {
    if (!services.value.length) return null
    const serviceId = route.params.serviceId ? parseInt(route.params.serviceId as string) : null
    if (serviceId) return services.value.find((s: any) => s.id === serviceId) ?? services.value[0]
    return services.value[0]
})

function selectService(id: number) {
    router.replace({
        name: 'DayDetail',
        params: { ...route.params, serviceId: id }
    })
}

// c5t: group and sort meals by type for the selected service
const mealsByType = computed(() => {
    const meals = selectedService.value?.meals ?? []
    const groups: Record<string, typeof meals> = {}
    for (const meal of meals) {
        const type = (meal as any).type ?? 'main'
        if (!groups[type]) groups[type] = []
        groups[type].push(meal)
    }
    return Object.entries(groups)
        .sort(([a], [b]) => {
            const orderA = MEAL_TYPE_CONFIG[a]?.order ?? 99
            const orderB = MEAL_TYPE_CONFIG[b]?.order ?? 99
            return orderA - orderB
        })
        .map(([type, meals]) => ({ type, label: MEAL_TYPE_CONFIG[type]?.label ?? type, meals }))
})

// c5t: sum of price per portion across all meals in the selected service
const servicePricePerPerson = computed(() => {
    const meals = selectedService.value?.meals ?? []
    let total = 0
    let hasPrice = false
    for (const meal of meals as any[]) {
        const recipe = meal.recipe
        if (!recipe?.ingredients?.length || !recipe.servings) continue
        for (const ri of recipe.ingredients) {
            if (ri.quantity && ri.ingredient?.defaultPrice) {
                total += (ri.quantity / recipe.servings) * ri.ingredient.defaultPrice
                hasPrice = true
            }
        }
    }
    return hasPrice ? total : null
})

function navigateToPrepList() {
    if (!selectedService.value) return
    router.push({
        path: `/evenements/${eventId.value}/jours/${dayId.value}/${selectedService.value.id}/prep-liste`,
    })
}

</script>

<template>
    <Private>
        <template #topBar>
            <EventBar />
        </template>

        <template #title>
            <Loading v-if="!day" />

            <div
                v-else
                class="titleArrowBox flex alignCenter justifyEvenly gap10"
            >
                <Icon
                    @click="prevDay && goToDay(prevDay.id)"
                    :class="prevDay ? 'pointer' : 'dimmed'"
                    size="xl"
                >
                    arrow_back
                </Icon>

                <h1 class="dayTitle beigeCardGreenText rounded10 caprasimo">
                    {{ day.date ? new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' }) : '' }}
                </h1>

                <Icon
                    @click="nextDay && goToDay(nextDay.id)"
                    :class="nextDay ? 'pointer' : 'dimmed'"
                    size="xl"
                >
                    arrow_forward
                </Icon>
            </div>
        </template>

        <template #main>
            <Loading v-if="!day">
                Chargement...
            </Loading>

            <div
                v-else
                class="flex column gap20 pad10"
            >
                <!-- service tab bar -->
                <div class="serviceTabBar flex justifyCenter gap20">
                    <div
                        v-for="service in services"
                        :key="service.id"
                        class="flex column gap10"
                    >
                        <button
                            
                            @click="selectService(service.id)"
                            :class="{ active: selectedService?.id === service.id }"
                            class="serviceTabButton flex column alignCenter justifyCenter pad5"
                        >
                            <Icon size="lg">
                                {{ TIME_SLOT_CONFIG[service.timeSlot ?? '']?.icon || 'restaurant' }}
                            </Icon>
                            <span class="serviceTabLabel">
                                {{ TIME_SLOT_CONFIG[service.timeSlot ?? '']?.label || service.timeSlot }}
                            </span>
                        </button>

                        <div 
                            v-if="selectedService.id === service.id"
                            class="flex justifyCenter alignCenter gap5"
                        >
                            <!-- <Icon size="md">groups</Icon> -->
                            <h3 class="beigeCardGreenText pad5 rounded5">{{ selectedService.guestCount }}</h3>
                        </div>
                    </div>
                </div>

                <div>
                    <!-- {{ selectedService.diets[0].diets[0].diets.text }} -->
                </div>
                
                <!-- guest count + diets -->
                <div
                    v-if="selectedService?.diets?.length"
                    class="jaugeBox gap20"
                >
                    <!-- <p class="textLg fontWeightBold">Régimes spéciaux</p> -->

                    <div class="dietBox marTop10">
                        <div class="liBox flex column gap10">
                            <div 
                                v-for="dietCount in (selectedService.diets as any[])"
                                class="
                                    textLg fontWeightSemibold
                                    flex gap5
                                "
                            >
                                <div
                                    class="dietCount textLg fontWeightBold"
                                >
                                    {{ dietCount.count }}
                                </div>

                                <div
                                    class="grow flex column"
                                >
                                    <span
                                        v-for="diet in (dietCount.diets as any[])"
                                        :key="diet.id ?? diet.diets?.value"
                                        class="grow"
                                    >
                                        {{ diet.diets?.text }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- prep list button -->
                <div class="flex justifyEnd">
                    <button
                        @click="navigateToPrepList"
                        class="beigeCardGreenText flex alignCenter gap10 pad10 rounded5"
                    >
                        <Icon color="green">receipt</Icon>
                        <span class="textLg fontWeightBold">Voir la prep liste</span>
                    </button>
                </div>

                <!-- meals -->
                <div
                    v-if="selectedService"
                    class="mealsList flex column gap10"
                >
                    <template v-if="mealsByType.length">
                        <template
                            v-for="group in mealsByType"
                            :key="group.type"
                        >
                            <p class="mealTypeLabel">{{ group.label }}</p>

                            <Meal
                                v-for="meal in group.meals"
                                :key="meal.id"
                                :meal="meal"
                                :serviceGuestCount="selectedService.guestCount"
                            />
                        </template>
                    </template>

                    <p
                        v-if="!selectedService.meals?.length"
                        class="noMeals"
                    >
                        Aucun plat pour ce service
                    </p>

                    <div
                        v-if="servicePricePerPerson !== null"
                        class="priceSummary flex justifyBetween alignCenter pad15 rounded10"
                    >
                        <span class="fS14">Prix par personne</span>
                        <span class="weight7">{{ servicePricePerPerson.toFixed(2) }} €</span>
                    </div>
                </div>
            </div>
        </template>
    </Private>
</template>

<style scoped>
.titleArrowBox {
    padding: 10px 0;
}
.dayTitle {
    font-size: clamp(20px, 5vw, 30px);
    padding: 3px 20px;
    text-transform: capitalize;
}

.dimmed {
    /* opacity: 0.25; */
    cursor: default;
}

.dietBox {
    padding: 10px 10px;
    border: 1px solid var(--beige);
    border-left: 5px solid var(--beige);
    border-radius:  5px;
}
.dietCount {
    width: 48px;
}
.serviceTabButton {
    min-width: 64px;
    padding: 10px 12px;
    color: var(--beige);
    /* opacity: 0.5; */
    border-radius: 10px;
    background: transparent;
    /* transition: all 200ms; */
}

.serviceTabButton.active {
    opacity: 1;
    background: color-mix(in srgb, var(--beige) 20%, transparent);
    border: 1px solid var(--beige);
}

.serviceTabLabel {
    font-size: 18px;
    font-weight: 600;
}

.mealTypeLabel {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--beige);
    opacity: 0.5;
    margin-top: 6px;
}

.noMeals {
    text-align: center;
    color: var(--beige);
    opacity: 0.5;
    padding: 20px;
}

.priceSummary {
    background: color-mix(in srgb, var(--beige) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--beige) 20%, transparent);
    color: var(--beige);
}

.liBox {
    padding-left: 20px;
}
</style>
