<template>
    <private-view title="Liste de courses">
        <template #headline>
            <span class="headlineLink" @click="router.push(`/cantine-dashboard/events/${eventId}`)">Événement</span>
        </template>

        <template #title-outer:prepend>
            <v-button class="backBtn" secondary icon rounded @click="router.push(`/cantine-dashboard/events/${eventId}`)">
                <v-icon name="arrow_back" />
            </v-button>
        </template>

        <template #actions>
            <v-button secondary @click="window.print()">
                <v-icon name="print" left />
                Imprimer
            </v-button>
        </template>

        <div class="viewContent">
            <div v-if="loading" class="loadingState">
                <v-progress-circular indeterminate />
                <span class="loadingLabel">Calcul de la liste de courses…</span>
            </div>

            <v-notice v-else-if="error" type="warning">{{ error }}</v-notice>

            <template v-else>
                <div class="summaryRow">
                    <span class="summaryLabel">{{ totalIngredients }} ingrédients · {{ categoryGroups.length }} catégories</span>
                </div>

                <div v-for="group in categoryGroups" :key="group.category" class="categoryBlock">
                    <div class="categoryTitle">{{ group.category || 'Sans catégorie' }}</div>
                    <div class="ingredientTable">
                        <div
                            v-for="item in group.items"
                            :key="item.key"
                            class="ingredientRow"
                        >
                            <span class="ingName">{{ item.name }}</span>
                            <span class="ingQty">{{ formatQty(item.quantity) }} {{ item.unit }}</span>
                        </div>
                    </div>
                </div>

                <p v-if="!categoryGroups.length" class="empty">Aucun ingrédient trouvé pour cet événement.</p>
            </template>
        </div>
    </private-view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useApi } from '@directus/extensions-sdk'

const router = useRouter()
const route = useRoute()
const api = useApi()

const eventId = route.params.eventId as string

const loading = ref(true)
const error = ref('')
// c5t: aggregated map keyed by `${ingredientId}_${unitId}` → { name, unit, category, quantity }
const aggregated = ref<Record<string, { name: string; unit: string; category: string; quantity: number }>>({})

const SLOT_KEYS = ['breakfast', 'amSnack', 'lunch', 'pmSnack', 'supper', 'nightSnack']

onMounted(async () => {
    try {
        // Step 1: fetch event days with menu service ids
        const daysRes = await api.get('/items/days', {
            params: {
                filter: { event: { _eq: eventId } },
                fields: [
                    'id', 'date', 'guestCount',
                    ...SLOT_KEYS.map(s => `menu.${s}.id`),
                    ...SLOT_KEYS.map(s => `menu.${s}.guestCount`),
                ],
                limit: -1,
            },
        })

        const days: any[] = daysRes.data.data
        if (!days.length) {
            loading.value = false
            return
        }

        // Step 2: collect service ids from all slot keys
        const serviceIds: number[] = []
        for (const day of days) {
            if (!day.menu) continue
            for (const slot of SLOT_KEYS) {
                const service = day.menu[slot]
                if (service?.id) serviceIds.push(service.id)
            }
        }

        if (!serviceIds.length) {
            loading.value = false
            return
        }

        // Step 3: fetch all meals for those services with ingredient data
        const mealsRes = await api.get('/items/meals', {
            params: {
                filter: { service: { _in: serviceIds } },
                fields: [
                    'id', 'guestCount',
                    'recipe.baseServings',
                    'recipe.ingredients.quantity',
                    'recipe.ingredients.unit.id',
                    'recipe.ingredients.unit.abbreviation',
                    'recipe.ingredients.ingredient.id',
                    'recipe.ingredients.ingredient.name',
                    'recipe.ingredients.ingredient.category',
                    'ingredients.quantity',
                    'ingredients.unit.id',
                    'ingredients.unit.abbreviation',
                    'ingredients.ingredient.id',
                    'ingredients.ingredient.name',
                    'ingredients.ingredient.category',
                ],
                limit: -1,
            },
        })

        const meals: any[] = mealsRes.data.data

        // Step 4: aggregate quantities
        const map: Record<string, { name: string; unit: string; category: string; quantity: number }> = {}

        for (const meal of meals) {
            const guests = meal.guestCount || 1
            const baseServings = meal.recipe?.baseServings || 100

            const mealIngs = meal.ingredients || []
            const sourceIngs = mealIngs.length > 0
                ? mealIngs.map((i: any) => ({ ...i, scaleFactor: 1 }))
                : (meal.recipe?.ingredients || []).map((i: any) => ({
                    ...i,
                    scaleFactor: guests / baseServings,
                }))

            for (const ing of sourceIngs) {
                const ingredientId = ing.ingredient?.id
                const unitId = ing.unit?.id
                if (!ingredientId) continue

                const key = `${ingredientId}_${unitId ?? 'none'}`
                const qty = (ing.quantity ?? 0) * ing.scaleFactor

                if (map[key]) {
                    map[key].quantity += qty
                } else {
                    map[key] = {
                        name: ing.ingredient.name ?? '—',
                        unit: ing.unit?.abbreviation ?? '',
                        category: ing.ingredient.category ?? '',
                        quantity: qty,
                    }
                }
            }
        }

        aggregated.value = map
    } catch (err: any) {
        error.value = err?.message ?? 'Erreur lors du chargement de la liste de courses.'
    } finally {
        loading.value = false
    }
})

const categoryGroups = computed(() => {
    const grouped: Record<string, Array<{ key: string; name: string; unit: string; quantity: number }>> = {}

    for (const [key, item] of Object.entries(aggregated.value)) {
        const cat = item.category || ''
        if (!grouped[cat]) grouped[cat] = []
        grouped[cat].push({ key, name: item.name, unit: item.unit, quantity: item.quantity })
    }

    return Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b, 'fr'))
        .map(([category, items]) => ({
            category,
            items: items.sort((a, b) => a.name.localeCompare(b.name, 'fr')),
        }))
})

const totalIngredients = computed(() => Object.keys(aggregated.value).length)

function formatQty(qty: number) {
    if (!qty) return '—'
    const rounded = Math.round(qty * 100) / 100
    return rounded.toLocaleString('fr-FR')
}

// expose window for template
const window = globalThis.window
</script>

<style scoped>
@import '../styles/shared.css';

.backBtn {
    margin-right: 8px;
}

.headlineLink {
    cursor: pointer;
    color: var(--foreground-subdued);
}

.headlineLink:hover {
    color: var(--primary);
}

.loadingState {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 60px;
}

.loadingLabel {
    color: var(--foreground-subdued);
    font-size: 14px;
}

.summaryRow {
    margin-bottom: 24px;
}

.summaryLabel {
    font-size: 13px;
    color: var(--foreground-subdued);
}

@media print {
    .backBtn,
    .v-button {
        display: none !important;
    }
}
</style>
