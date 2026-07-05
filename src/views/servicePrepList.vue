<script setup lang="ts">
import Private from '@/components/Architecture/Layouts/Private.vue'
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { dbGet } from '@/composables/fetch'
import DayCard from '@/components/Cards/DayCard.vue'
import { TIME_SLOT_CONFIG } from '@/composables/appAssets'
import Icon from '@/components/Icon/Main.vue'

const route = useRoute()

const service = ref<any>(null)

type ServicePlanningNote = {
    id: number
    text: string
}

type ServicePlanningState = {
    startTime: string
    endTime: string
    notes: ServicePlanningNote[]
}

function normalizeServicePlanning(rawPlanning: any): ServicePlanningState {
    if (Array.isArray(rawPlanning)) {
        return {
            startTime: '',
            endTime: '',
            notes: rawPlanning
                .map((entry: any, index: number) => {
                    if (typeof entry === 'string') {
                        return { id: index, text: entry }
                    }

                    return {
                        id: entry.id ?? index,
                        text: entry.text ?? entry.label ?? '',
                    }
                })
                .filter((entry: ServicePlanningNote) => entry.text.trim().length > 0),
        }
    }

    if (!rawPlanning || typeof rawPlanning !== 'object') {
        return {
            startTime: '',
            endTime: '',
            notes: [],
        }
    }

    return {
        startTime: rawPlanning.startTime ?? rawPlanning.start ?? '',
        endTime: rawPlanning.endTime ?? rawPlanning.end ?? '',
        notes: normalizeServicePlanning(rawPlanning.notes ?? rawPlanning.items ?? rawPlanning.list ?? []).notes,
    }
}


onMounted(async () => {
    const result = await dbGet<any[]>({
        endpoint: `/items/services/${route.params.serviceId}`,
        query: {
            fields: [
                'id',
                'timeSlot',
                'guestCount',
                'servicePlanning',
                'day.id',
                'day.date',
                'day.event.name',
                'diets.count',
                'diets.diets.id',
                'diets.diets.diets.value',
                'diets.diets.diets.text',
                'meals.id',
                'meals.servingCount',
                'meals.recipe.name',
                'meals.recipe.servings',
                'meals.recipe.ingredients.id',
                'meals.recipe.ingredients.quantity',
                'meals.recipe.ingredients.ingredient.name',
                'meals.recipe.ingredients.ingredient.unit',
                'meals.recipe.ingredients.ingredient.defaultPrice',
                'meals.recipe.ingredients.ingredient.prepLess',
            ].join()
        }
    })
    console.log("result", result)
    service.value = result ?? null
})

const planning = computed(() => normalizeServicePlanning(service.value?.servicePlanning))
const planningStartTime = computed(() => planning.value.startTime)
const planningEndTime = computed(() => planning.value.endTime)



function getIngredientQuantity(baseQuantity: number, recipeBaseServingCount: number, mealServingCount: number | null) {
    const servings = mealServingCount ?? service.value.guestCount

    return parseFloat(((baseQuantity / recipeBaseServingCount) * servings).toFixed(2))
}

// c5t: modal state for meal selection before printing
const showPrintModal = ref(false)
const selectedMealIds = ref<Set<number>>(new Set())

const meals = computed(() => service.value?.meals ?? [])

function openPrintModal() {
    selectedMealIds.value = new Set(meals.value.map((m: any) => m.id))
    showPrintModal.value = true
}

function toggleMeal(id: number) {
    if (selectedMealIds.value.has(id)) {
        selectedMealIds.value.delete(id)
    } else {
        selectedMealIds.value.add(id)
    }
}

function printList() {
    showPrintModal.value = false

    const selectedMeals = meals.value.filter((m: any) => selectedMealIds.value.has(m.id))
    const eventName = service.value?.day?.event?.name ?? 'Prep list'
    const rawDate = service.value?.day?.date ?? ''
    const date = rawDate
        ? new Date(rawDate).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit' })
        : ''
    const slot = TIME_SLOT_CONFIG[service.value?.timeSlot]?.label ?? service.value?.timeSlot ?? ''
    const timeHtml = (planningStartTime.value || planningEndTime.value)
        ? ` &nbsp;${planningStartTime.value || '??:??'} - ${planningEndTime.value || '??:??'}`
        : ''

    const pagesHtml = `<p class="serviceLabel">${date} &mdash; ${slot}${timeHtml} &nbsp;&bull;&nbsp; ${service.value?.guestCount ?? '?'} pers.</p>
    <div class="page">
        ${selectedMeals.map((meal: any) => {
        const ingredientsHtml = (meal.recipe?.ingredients ?? []).map((ing: any) => {
            const qty = getIngredientQuantity(ing.quantity, meal.recipe.servings, meal.servingCount)
            return `<div class="row">
                <span class="ingName">${ing.ingredient.name}</span>
                <span class="qty">${qty} ${ing.ingredient.unit}</span>
                <div class="checkbox"></div>
            </div>`
        }).join('')

        const servings = meal.servingCount ?? service.value?.guestCount ?? '?'
        return `<div class="recipe">
            <h2 class="recipeName">${meal.recipe.name} <span class="recipeServings">${servings} pers.</span></h2>
            <p class="recipeService">${date} &mdash; ${slot}${timeHtml}</p>
            ${ingredientsHtml}
        </div>`
    }).join('')}
    </div>`

    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return

    win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>${eventName} - ${date} - ${slot}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: white; color: black; font-family: Arial, sans-serif; }
        .page { padding: 1cm 1.5cm; width: 17cm; }
        .recipe { break-inside: avoid; margin-bottom: 0.8cm; page-break-inside: avoid; }
        .serviceLabel { border-bottom: 2px solid black; font-size: 16pt; font-weight: 700; margin-bottom: 0.5cm; padding-bottom: 0.25cm; }
        .recipeService { color: #666; font-size: 9pt; margin-bottom: 0.3cm; margin-top: 0.1cm; }
        .recipeName { border-bottom: 2px solid black; font-size: 20pt; font-weight: 700; margin-bottom: 0.15cm; padding-bottom: 0.2cm; display: flex; justify-content: space-between; align-items: baseline; }
        .recipeServings { font-size: 13pt; font-weight: 600; color: #444; }
        .row { align-items: center; border-bottom: 1px solid #ddd; display: flex; gap: 0.4cm; padding: 0.22cm 0; }
        .ingName { flex: 1; font-size: 14pt; font-weight: 600; }
        .qty { font-size: 14pt; font-weight: 700; min-width: 2.5cm; text-align: right; }
        .checkbox { border: 2px solid black; border-radius: 4px; flex-shrink: 0; height: 1cm; width: 1cm; }
    </style>
</head>
<body>${pagesHtml}</body>
</html>`)
    win.document.close()
    win.focus()
    win.onafterprint = () => win.close()
    win.print()
}
</script>

<template>
    <Private
        v-if="service"
        class="pad10 privateComponent"
    >
        <template #title>
            <div
                class="flex justifyBetween pad10"
            >
                <DayCard :day="service.day" />

                <div
                    class="flex column justifyCenter alignCenter"
                >
                    <Icon>{{ TIME_SLOT_CONFIG[service.timeSlot].icon }}</Icon>
                    <p>
                        {{ TIME_SLOT_CONFIG[service.timeSlot].label }}
                    </p>
                </div>
            </div>
            <div
                class="flex column alignCenter "
            >

                <h1>Prep list</h1>
                <button
                    @click="openPrintModal"
                    class="marTop20 beigeCardGreenText pad5 rounded5 flex alignCenter gap10"
                >
                    <Icon
                        color="green"
                    >
                        print
                    </Icon>
                    <span
                        class="textLg fontWeightBold"
                    >
                        imprimer
                    </span>
                </button>
            </div>
        </template>

        <template #main>
            <div class="">

            </div>
            <div>
                <div
                    v-for="meal in service?.meals"
                    class=""
                >
                    <h2
                        class="recipeName marTop50"
                    >
                        {{ meal.recipe.name }}
                    </h2>

                    <div
                        v-for="ingredient in meal.recipe?.ingredients"
                        :key="ingredient.id"
                        class="ingredient flex justifyBetween alignCenter marTop10 textXl fontWeightBold"
                    >
                        <div>
                            {{ ingredient.ingredient.name }}
                        </div>

                        <div
                            class="flex alignCenter gap30"
                        >
                            <div class="flex alignCenter gap5">
                                <span>
                                    {{ 
                                        getIngredientQuantity(
                                            ingredient.quantity,
                                            meal.recipe.servings,
                                            meal.servingCount
                                        )
                                    }}
                                </span>

                                <span>
                                    {{ ingredient.ingredient.unit }}
                                </span>
                            </div>

                            <div class="checkBox"></div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </Private>

    <!-- print modal -->
    <Teleport to="body">
        <div
            v-if="showPrintModal"
            class="modalOverlay flex alignCenter justifyCenter"
        >
            <div class="modal flex column gap15 pad20 rounded10">
                <h2 class="modalTitle">Choisir les recettes à imprimer</h2>

                <div class="flex column gap10">
                    <label
                        v-for="meal in meals"
                        :key="meal.id"
                        class="mealOption flex alignCenter gap10"
                    >
                        <input
                            type="checkbox"
                            :checked="selectedMealIds.has(meal.id)"
                            @change="toggleMeal(meal.id)"
                        />
                        {{ meal.recipe.name }}
                    </label>
                </div>

                <div class="flex gap10 justifyEnd">
                    <button
                        @click="showPrintModal = false"
                        class="pad10 rounded5"
                    >
                        Annuler
                    </button>
                    <button
                        @click="printList"
                        class="pad10 rounded5 beigeCardGreenText flex alignCenter gap5"
                    >
                        <Icon color="green">print</Icon>
                        Imprimer
                    </button>
                </div>
            </div>
        </div>
    </Teleport>


</template>

<style scoped>

.ingredient {
    padding-left: 20px;
}
.recipeName {
    border-bottom: 1px solid var(--beige)
}
.checkBox {
    width: 48px;
    height: 48px;
    border: 1px solid var(--beige);
    border-radius: 8px;
}

/* modal */
.modalOverlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 1000;
}
.modal {
    background: var(--green);
    color: var(--beige);
    min-width: 300px;
    max-width: 480px;
    width: 90%;
}
.modalTitle {
    font-size: 18px;
    font-weight: 700;
}
.mealOption {
    cursor: pointer;
    font-size: 16px;
}
.mealOption input {
    width: 20px;
    height: 20px;
    cursor: pointer;
}
</style>