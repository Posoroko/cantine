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


onMounted(async () => {
    const result = await dbGet<any[]>({
        endpoint: `/items/services/${route.params.serviceId}`,
        query: {
            fields: [
                'id',
                'timeSlot',
                'guestCount',
                'day.id',
                'day.date',
                'day.event.name',
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
    const eventName = service.value?.day?.event?.name ?? 'Prep list'
    const rawDate = service.value?.day?.date ?? ''
    const date = rawDate
        ? new Date(rawDate).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit' })
        : ''
    const slot = TIME_SLOT_CONFIG[service.value?.timeSlot]?.label ?? service.value?.timeSlot ?? ''
    const originalTitle = document.title
    document.title = `${eventName} - ${date} - ${slot}`
    setTimeout(() => {
        window.print()
        document.title = originalTitle
    }, 50)
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

    <!-- print area (hidden on screen, visible on print) -->
    <div class="printArea">
        <template
            v-for="meal in meals.filter((m: any) => selectedMealIds.has(m.id))"
            :key="meal.id"
        >
            <div class="printPage">
                <div class="printHeader">
                    <span class="printDay">{{ service?.day?.date ? new Date(service.day.date).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit' }) : '' }}</span>
                    <span class="printSlot">{{ TIME_SLOT_CONFIG[service?.timeSlot]?.label }}</span>
                </div>

                <h2 class="printRecipeName">{{ meal.recipe.name }}</h2>

                <div
                    v-for="ingredient in meal.recipe?.ingredients"
                    :key="ingredient.id"
                    class="printIngredient"
                >
                    <span class="printIngredientName">{{ ingredient.ingredient.name }}</span>
                    <div class="printIngredientRight">
                        <span class="printQty">
                            {{ getIngredientQuantity(ingredient.quantity, meal.recipe.servings, meal.servingCount) }}
                            {{ ingredient.ingredient.unit }}
                        </span>
                        <div class="printCheckbox"></div>
                    </div>
                </div>
            </div>
        </template>
    </div>
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

/* print area — hidden on screen */
.printArea {
    display: none;
}

/* print styles */
@media print {
    /* hide everything and force white background */
    body {
        background: white !important;
    }

    body * {
        visibility: hidden;
    }

    /* show only the print area */
    .printArea,
    .printArea * {
        visibility: visible;
    }

    .printArea {
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        background: white;
    }

    .printPage {
        width: 17cm;
        padding: 1cm 1.5cm;
        page-break-after: always;
        break-after: page;
        background: white;
        color: black;
        box-sizing: border-box;
    }

    .printHeader {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14pt;
        font-weight: 600;
        margin-bottom: 0.5cm;
        padding-bottom: 0.3cm;
        border-bottom: 2px solid black;
    }

    .printRecipeName {
        font-size: 22pt;
        font-weight: 700;
        margin: 0.4cm 0;
        padding-bottom: 0.2cm;
        border-bottom: 1px solid #555;
    }

    .printIngredient {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.25cm 0;
        border-bottom: 1px solid #ddd;
    }

    .printIngredientName {
        font-size: 16pt;
        font-weight: 700;
    }

    .printIngredientRight {
        display: flex;
        align-items: center;
        gap: 0.5cm;
    }

    .printQty {
        font-size: 16pt;
        font-weight: 700;
    }

    .printCheckbox {
        width: 1.2cm;
        height: 1.2cm;
        border: 2px solid black;
        border-radius: 4px;
        flex-shrink: 0;
    }
}
</style>