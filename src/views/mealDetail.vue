<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import Private from '@/Components/Architecture/Layouts/Private.vue'
import Icon from '@/components/Icon/Main.vue'
import Loading from '@/components/Loading/Main.vue'
import EventBar from '@/components/Architecture/Bars/EventBar.vue'
import { currentEventStore } from '@/composables/currentEvent'
import { appAssetStore } from '@/composables/appAssets'

const route = useRoute()
const router = useRouter()

const previousPage = computed(() => {
    return route.query.previousPage || route.path
})

const mealId = computed(() => parseInt(route.params.mealId as string))

const meal = computed(() => {
    if (!currentEventStore.value) return null

    for (const day of currentEventStore.value.days) {
        for (const service of day.services) {
            const found = service.meals.find(m => m.id === mealId.value)
            if (found) return { ...found, service, day }
        }
    }

    const eventMeal = currentEventStore.value.meals?.find(m => m.id === mealId.value)
    return eventMeal || null
})

const recipe = computed(() => (meal.value?.recipe || null) as any)

const serviceDietCounts = computed(() => {
    if (!meal.value?.service || typeof meal.value.service === 'number') return []
    const service = meal.value.service as any
    if (!service.dietCounts) return []
    return service.dietCounts
})

const mealGuestCount = computed(() => {
    const targetIds = meal.value?.targetDiets?.map(td => td.dietCount) || []
    if (!targetIds.length) {
        return serviceDietCounts.value.reduce((sum: number, dc: any) => sum + dc.count, 0)
    }
    return serviceDietCounts.value
        .filter((dc: any) => targetIds.includes(dc.id))
        .reduce((sum: number, dc: any) => sum + dc.count, 0)
})

const scaleFactor = computed(() => {
    const rec = recipe.value as any
    if (!rec?.servings || !mealGuestCount.value) return 1
    return mealGuestCount.value / rec.servings
})

function scaledQuantity(quantity: string | null): string {
    if (!quantity) return ''
    const num = parseFloat(quantity)
    if (isNaN(num)) return quantity
    const scaled = num * scaleFactor.value
    return scaled % 1 === 0 ? String(scaled) : scaled.toFixed(1)
}

function getUnitText(unitKey: string | null): string {
    if (!unitKey) return ''
    const unit = appAssetStore.value.units.find(u => u.key === unitKey)
    return unit?.singular || unitKey
}

function goBack() {
    router.push(previousPage.value as string)
}
</script>

<template>
    <Private>
        <template #topBar>
            <EventBar v-if="currentEventStore" />
        </template>

        <template #title>
            <Loading v-if="!currentEventStore" />

            <div
                v-else-if="meal"
                class="
                    flex alignCenter gap10
                    pad10
                "
            >
                <Icon
                    @click="goBack"
                    class="pointer"
                    size="lg"
                >
                    arrow_back
                </Icon>

                <h1 class="title">
                    {{ recipe?.name || 'Sans recette' }}
                </h1>

                <span
                    v-if="mealGuestCount"
                    class="
                        flex alignCenter gap4
                    "
                >
                    <Icon size="sm">
                        {{ mealGuestCount === 1 ? 'person' : 'group' }}
                    </Icon>
                    {{ mealGuestCount }}
                </span>
            </div>

            <div
                v-else
                class="pad20"
            >
                <p>Plat introuvable</p>
                <button @click="goBack">
                    Retour
                </button>
            </div>
        </template>

        <template #main>
            <div
                v-if="recipe"
                class="
                    content
                    flex column gap20
                    pad10
                "
            >
                <div
                    v-if="recipe.servings && mealGuestCount"
                    class="
                        scaleBanner
                        flex alignCenter gap10
                    "
                >
                    <Icon size="sm">
                        calculate
                    </Icon>
                    <span>
                        Recette pour {{ recipe.servings }}
                        — adapté à {{ mealGuestCount }} convives
                        (×{{ scaleFactor.toFixed(2) }})
                    </span>
                </div>

                <div class="flex column gap10">
                    <h3>Ingrédients</h3>

                    <div
                        v-for="ri in recipe.ingredients" :key="ri.id"
                        class="
                            ingredientRow
                            flex alignCenter justifyBetween
                        "
                    >
                        <div
                            class="
                                flex gap10 alignCenter
                            "
                        >
                            <div
                                class="
                                    quantityBox
                                    flex gap5
                                "
                            >
                                <span
                                    v-if="ri.quantity"
                                    class="quantity"
                                >
                                    {{ scaledQuantity(ri.quantity) }}
                                </span>

                                <span
                                    v-if="ri.unit"
                                    class="unit"
                                >
                                    {{ getUnitText(ri.unit) }}
                                </span>
                            </div>

                            <span class="ingredientName">
                                {{ ri.ingredient?.name || '—' }}
                            </span>
                        </div>

                        <button
                            class="
                                missionButton
                                flex alignCenter gap5
                            "
                            title="Créer une mission"
                        >
                            <Icon size="sm">
                                add_task
                            </Icon>
                        </button>
                    </div>
                </div>

                <div
                    v-if="recipe.instructions"
                    class="flex column gap10"
                >
                    <h3>Instructions</h3>
                    <pre class="instructionsText">{{ recipe.instructions }}</pre>
                </div>
            </div>

            <Loading v-else-if="meal?.recipe">
                Chargement de la recette...
            </Loading>

            <div
                v-else
                class="noRecipe pad20"
            >
                <p>Aucune recette associée</p>
            </div>
        </template>
    </Private>
</template>

<style scoped>
.title {
    font-size: 24px;
    font-weight: 700;
    text-transform: capitalize;
}

.content {
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
}

.scaleBanner {
    opacity: 0.6;
    font-size: 14px;
}

.ingredientRow {
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.quantityBox {
    min-width: 100px;
}

.quantity {
    font-weight: 600;
}

.unit {
    opacity: 0.7;
}

.ingredientName {
    text-transform: capitalize;
}

.missionButton {
    background: transparent;
    color: var(--beige);
    opacity: 0.4;
    border-radius: 8px;
    padding: 4px 8px;
    cursor: pointer;
    transition: opacity 0.2s;
}

.missionButton:hover {
    opacity: 1;
}

.instructionsText {
    white-space: pre-wrap;
    word-wrap: break-word;
    font: inherit;
    opacity: 0.8;
}

.noRecipe {
    text-align: center;
    opacity: 0.5;
}
</style>
