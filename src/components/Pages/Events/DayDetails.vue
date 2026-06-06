<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { dbGet } from '@/composables/fetch'
import Icon from '@/components/Icon/Main.vue'
import Loading from '@/components/Loading/Main.vue'
import DayCard from '@/components/Cards/DayCard.vue'
import Meal from '@/components/Cards/Meal.vue'
import { 
    TIME_SLOT_CONFIG, 
    MEAL_TYPE_CONFIG 
} from '@/composables/appAssets'

const props = defineProps<{ dayId: number | null }>()

const router = useRouter()

const day = ref(null)

async function fetchDay() {
    if (!props.dayId) return
    const result = await dbGet({
        endpoint: `/items/days/${props.dayId}`,
        query: {
            fields: [
                'id',
                'date',
                'event',
                // services
                'services.id',
                'services.timeSlot',
                'services.guestCount',
                'services.note',
                // diets per service
                'services.diets.count',
                'services.diets.diet.value',
                'services.diets.diet.text',
                // meals
                'services.meals.id',
                'services.meals.type',
                'services.meals.servingCount',
                // recipe basics
                'services.meals.recipe.id',
                'services.meals.recipe.name',
                'services.meals.recipe.servings',
                // ingredients for price calculation
                'services.meals.recipe.ingredients.id',
                'services.meals.recipe.ingredients.quantity',
                'services.meals.recipe.ingredients.ingredient.id',
                'services.meals.recipe.ingredients.ingredient.name',
                'services.meals.recipe.ingredients.ingredient.unit',
                'services.meals.recipe.ingredients.ingredient.defaultPrice',
            ].join()
        }
    })

    day.value = result
}

onMounted(fetchDay)
watch(() => props.dayId, fetchDay)

const services = computed(() => {
    return day.value?.services
})

const selectedServiceId = ref<number | null>(null)

const selectedService = computed(() => {
    if (!services.value.length) return null
    if (selectedServiceId.value === null) return services.value[0]
    return services.value.find(s => s.id === selectedServiceId.value) ?? services.value[0]
})

function selectService(id: number) {
    selectedServiceId.value = id
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
    router.push({ name: 'ServicePrepList', query: { service: selectedService.value.id } })
}
</script>

<template>
    <div class="dayDetailsContainer">
        <Loading v-if="!day">
            Chargement...
        </Loading>

        <div
            v-if="day"
            class="
                dayDetailsContent
                flex column gap20
            "
        >
            <DayCard :day="day" />

            <div class="serviceTabBar flex">
                <button
                    v-for="service in services"
                    :key="service.id"
                    @click="selectService(service.id)"
                    :class="{ active: selectedService?.id === service.id }"
                    class="
                        serviceTabButton
                        flex column alignCenter justifyCenter gap4
                    "
                >
                    <Icon size="lg">
                        {{ TIME_SLOT_CONFIG[service.timeSlot ?? '']?.icon || 'restaurant' }}
                    </Icon>
                    <span class="serviceTabLabel">
                        {{ TIME_SLOT_CONFIG[service.timeSlot ?? '']?.label || service.timeSlot }}
                    </span>
                </button>
            </div>

            <div
                v-if="selectedService"
                class="flex jaugeBox"
            >
                <p
                    class="grow flex alignCenter gap10"
                >
                    <Icon
                        size="xl"
                    >
                        groups
                    </Icon>

                    <h3>
                        : {{ selectedService.guestCount }}
                    </h3>
                </p>

                <ul
                    class="grow"
                >
                    <p
                        class="marTop10 textXl fontWeightBold"
                    >
                        Régimes spéciaux
                    </p>
                    <div
                        class="liBox"
                    >
                        <li
                            v-for="diet in (selectedService.diets as any[])"
                        >
                            {{ diet.diet?.text }}: {{ diet.count }}
                        </li>
                    </div>
                </ul>
            </div>


            <div
                class="flex justifyEnd"
            >
                <button
                    @click="navigateToPrepList"
                    class="beigeCardGreenText flex alignCenter gap10 pad10 rounded5"
                >
                    <Icon color="green">receipt</Icon>
                    <span
                        class="textLg fontWeightBold"
                    >
                         Voir la prep liste
                    </span>                   
                </button>
            </div>

            <div
                v-if="selectedService"
                class="mealsList flex column gap10"
            >
                <template v-if="mealsByType.length">
                    <template
                        v-for="group in mealsByType"
                        :key="group.type"
                    >
                        <p class="mealTypeLabel">
                            {{ group.label }}
                        </p>

                        <Meal
                            v-for="meal in group.meals"
                            :key="meal.id"
                            :meal="meal"
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
    </div>
</template>

<style scoped>

.jaugeBox{
    padding: 10px 30px;
    border: 3px solid var(--beige);
}
.noData {
    text-align: center;
    color: var(--beige);
    padding: 40px;
}

.serviceTabBar {
    overflow-x: auto;
    gap: 8px;
}

.serviceTabButton {
    min-width: 64px;
    padding: 10px 8px;
    color: var(--beige);
    opacity: 0.5;
    border-radius: 10px;
    background: transparent;
    transition: all 200ms;
}

.serviceTabButton.active {
    opacity: 1;
    background: color-mix(in srgb, var(--beige) 15%, transparent);
}

.serviceTabLabel {
    font-size: 12px;
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
