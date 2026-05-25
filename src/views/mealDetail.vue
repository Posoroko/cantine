<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import Private from '@/components/Architecture/Layouts/Private.vue'
import Icon from '@/components/Icon/Main.vue'
import Loading from '@/components/Loading/Main.vue'
import EventBar from '@/components/Architecture/Bars/EventBar.vue'

import { currentEventStore } from '@/composables/currentEvent'
import { appAssetStore } from '@/composables/appAssets'

const route = useRoute()
const router = useRouter()

const previousPage = computed(() => route.query.previousPage || route.path)

const mealId = computed(() => parseInt(route.params.mealId as string))

const meal = computed(() => {
    if (!currentEventStore.value) return null
    for (const day of currentEventStore.value.days) {
        for (const service of day.services) {
            const found = service.meals.find((m: any) => m.id === mealId.value)
            if (found) return { ...found, service, day }
        }
    }
    return null
})

const recipe = computed(() => (meal.value?.recipe || null) as any)

function getUnitText(unitKey: string | null): string {
    if (!unitKey) return ''
    const unit = appAssetStore.value.units.find(u => u.key === unitKey)
    return unit?.singular || unitKey
}

function formatQty(value: number): string {
    if (value % 1 === 0) return String(value)
    return parseFloat(value.toFixed(2)).toString()
}

function formatPrice(price: number): string {
    return price.toFixed(2) + ' €'
}

// c5t: ingredient rows — qty shown as total for meal when servingCount is set, else per 1 portion
const ingredientRows = computed(() => {
    if (!recipe.value?.ingredients) return []
    const servings: number | null = recipe.value.servings || null
    const servingCount: number | null = meal.value?.servingCount ?? null
    return (recipe.value.ingredients as any[]).map(ri => {
        const qty: number | null = ri.quantity ?? null
        const defaultPrice: number | null = ri.ingredient?.defaultPrice ?? null
        const qtyPerPortion = (qty !== null && servings) ? qty / servings : null
        const pricePerPortion = (qtyPerPortion !== null && defaultPrice !== null) ? qtyPerPortion * defaultPrice : null
        const qtyDisplay = (qtyPerPortion !== null)
            ? (servingCount ? qtyPerPortion * servingCount : qtyPerPortion)
            : null
        return {
            id: ri.id as number,
            name: (ri.ingredient?.name as string | null) || '—',
            unit: getUnitText(ri.ingredient?.unit ?? null),
            qtyDisplay,
            pricePerPortion,
        }
    })
})

// c5t: sum of all per-portion ingredient prices
const totalPricePerPortion = computed(() => {
    const priced = ingredientRows.value.filter(r => r.pricePerPortion !== null)
    if (!priced.length) return null
    return priced.reduce((sum, r) => sum + r.pricePerPortion!, 0)
})

// c5t: only shown when meal.servingCount is set (not nullish)
const totalPriceForMeal = computed(() => {
    if (!totalPricePerPortion.value || !meal.value?.servingCount) return null
    return totalPricePerPortion.value * meal.value.servingCount
})

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
                class="flex alignCenter gap10 pad10"
            >
                <Icon
                    @click="goBack"
                    class="pointer"
                    size="lg"
                >
                    arrow_back
                </Icon>

                <h1 class="title grow">
                    {{ recipe?.name || 'Sans recette' }}
                </h1>

                <span
                    v-if="meal.servingCount"
                    class="flex alignCenter gap5 shrink0"
                >
                    <Icon size="sm">
                        {{ meal.servingCount === 1 ? 'person' : 'group' }}
                    </Icon>
                    {{ meal.servingCount }}
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
                class="content flex column gap20 pad10"
            >
                <!-- recipe type -->
                <span
                    v-if="recipe.type"
                    class="recipeType fS12 uppercase weight6"
                >
                    {{ recipe.type }}
                </span>

                <!-- ingredients -->
                <div class="flex column gap5">
                    <h3 class="sectionTitle">Ingrédients</h3>

                    <div
                        v-for="row in ingredientRows"
                        :key="row.id"
                        class="ingredientRow flex alignCenter gap10 pad10 rounded10"
                    >
                        <span class="grow">{{ row.name }}</span>

                        <span
                            v-if="row.qtyDisplay !== null"
                            class="fS14"
                        >
                            {{ formatQty(row.qtyDisplay) }} {{ row.unit }}
                        </span>

                        <span
                            v-if="row.pricePerPortion !== null"
                            class="fS14 weight6 priceCell"
                        >
                            {{ formatPrice(row.pricePerPortion) }}
                        </span>
                    </div>
                </div>

                <!-- instructions -->
                <div
                    v-if="recipe.instructions"
                    class="flex column gap10"
                >
                    <h3 class="sectionTitle">Instructions</h3>
                    <p class="whiteSpacePreWrap instructionsText">{{ recipe.instructions }}</p>
                </div>

                <!-- price summary -->
                <div
                    v-if="totalPricePerPortion !== null"
                    class="priceSummary flex column gap10 pad15 rounded10"
                >
                    <div class="flex justifyBetween alignCenter">
                        <span class="fS14">Prix par personne</span>
                        <span class="weight7">{{ formatPrice(totalPricePerPortion) }}</span>
                    </div>

                    <template v-if="totalPriceForMeal !== null">
                        <span class="fS14 dimmed">× {{ meal!.servingCount }} convives</span>

                        <div class="flex justifyBetween alignCenter">
                            <span class="fS14">Total</span>
                            <span class="weight7">{{ formatPrice(totalPriceForMeal) }}</span>
                        </div>
                    </template>
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

.recipeType {
    opacity: 0.5;
    letter-spacing: 0.08em;
}

.sectionTitle {
    margin-bottom: 4px;
    color: var(--beige);
}

.ingredientRow {
    background: color-mix(in srgb, var(--beige) 6%, transparent);
    color: var(--beige);
}

.dimmed {
    opacity: 0.5;
}

.priceCell {
    min-width: 64px;
    text-align: right;
    flex-shrink: 0;
}

.instructionsText {
    line-height: 1.6;
    color: var(--beige);
}

.priceSummary {
    background: color-mix(in srgb, var(--beige) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--beige) 20%, transparent);
}

.noRecipe {
    text-align: center;
    opacity: 0.5;
}
</style>
