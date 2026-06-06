<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { dbGet, dbPatch } from '@/composables/fetch'
import Icon from '@/components/Icon/Main.vue'

import appConfig from '@/composables/appConfig'

const route = useRoute()
const eventId = computed(() => parseInt(route.params.eventId as string))
const directusUrl = appConfig.dbUrl

const meals = ref<any[]>([])
const eventSuppliers = ref<any[]>([])

// c5t: prevents auto-save from firing while restoring saved overrides
const isRestoring = ref(false)

onMounted(async () => {
    meals.value = await dbGet<any[]>({
        endpoint: '/items/meals',
        query: {
            fields: [
                'servingCount',
                'service.guestCount',
                'recipe.servings',
                'recipe.ingredients.quantity',
                'recipe.ingredients.ingredient.id',
                'recipe.ingredients.ingredient.name',
                'recipe.ingredients.ingredient.unit',
                'recipe.ingredients.ingredient.foodCategory.value',
                'recipe.ingredients.ingredient.foodCategory.text',
                'recipe.ingredients.ingredient.supplyCategory.value',
                'recipe.ingredients.ingredient.supplyCategory.text',
                'recipe.ingredients.ingredient.defaultPrice',
            ].join(','),
            filter: {
                service: {
                    day: {
                        event: {
                            _eq: eventId.value,
                        },
                    },
                },
            },
        },
    })

    eventSuppliers.value = await dbGet<any[]>({
        endpoint: '/items/suppliers',
        query: {
            fields: [
                'id',
                '*',
                'name',
                'logo',
                'events.event',
                'supplyCategories.supplyCategory.value',
                'supplyCategories.supplyCategory.text',
                'foodCategories.foodCategory.value',
                'foodCategories.foodCategory.text',
            ].join(','),
            filter: {
                events: {
                    event: {
                        _eq: eventId.value,
                    },
                },
            },
        },
    })

    // c5t: restore saved supplier selections from the event's shoppingList
    // new computed data wins (qty, categories), only supplier assignment is preserved
    isRestoring.value = true
    const eventData = await dbGet<any>({ endpoint: `/items/events/${eventId.value}`, query: { fields: 'shoppingList' } })
    const saved = eventData?.shoppingList
    if (Array.isArray(saved)) {
        for (const savedIng of saved) {
            if (!savedIng.supplierId) continue
            const supplier = eventSuppliers.value.find((s: any) => s.id === savedIng.supplierId)
            if (supplier) supplierOverrides.set(savedIng.ingredientId, supplier)
        }
    }
    isRestoring.value = false

    // save immediately to sync new ingredients or category changes
    saveShoppingList()
})

// c5t: user overrides for supplier selection per ingredient id
const supplierOverrides = reactive(new Map<number, any>())

// c5t: tracks which ingredient rows have their supplier chips expanded
const expandedIds = reactive(new Set<number>())

// c5t: supplier groups are collapsed by default
const collapsedSuppliers = reactive(new Set<number>())


function toggleSupplier(supplierId: number) {
    if (collapsedSuppliers.has(supplierId)) collapsedSuppliers.delete(supplierId)
    else collapsedSuppliers.add(supplierId)
}

function supplierTotal(items: any[]): number {
    let total = 0
    for (const ing of items) {
        if (ing.defaultPrice != null) total += ing.totalQuantity * ing.defaultPrice
    }
    return total
}

function toggleExpand(ingId: number) {
    if (expandedIds.has(ingId)) expandedIds.delete(ingId)
    else expandedIds.add(ingId)
}

function selectSupplier(ingId: number, supplier: any) {
    supplierOverrides.set(ingId, supplier)
    expandedIds.delete(ingId)
}

const groupedIngredients = computed(() => {
    // step 1: aggregate ingredients across all meals
    const map = new Map<number, any>()

    for (const meal of meals.value) {
        const recipe = meal.recipe
        if (!recipe) continue

        const headcount = meal.servingCount ?? meal.service?.guestCount ?? recipe.servings ?? 1
        const ratio = recipe.servings ? headcount / recipe.servings : 1

        for (const ri of recipe.ingredients ?? []) {
            const ing = ri.ingredient
            if (!ing) continue

            const qty = (ri.quantity ?? 0) * ratio
            const existing = map.get(ing.id)

            if (existing) {
                existing.totalQuantity += qty
            } else {
                map.set(ing.id, {
                    id: ing.id,
                    name: ing.name,
                    unit: ing.unit,
                    foodCategory: ing.foodCategory,
                    supplyCategory: ing.supplyCategory,
                    defaultPrice: ing.defaultPrice ?? null,
                    totalQuantity: qty,
                    possibleSuppliers: [] as any[],
                    selectedSupplier: null as any,
                })
            }
        }
    }

    // step 2: match each ingredient's supplyCategory against event suppliers
    const ingredients = [...map.values()]
    const suppliers = eventSuppliers.value

    for (const ing of ingredients) {
        const matches = []

        for (const sup of suppliers) {
            const categories = sup.supplyCategories ?? []
            for (const cat of categories) {
                if (cat.supplyCategory?.value === ing.supplyCategory?.value) {
                    matches.push(sup)
                    break
                }
            }
        }

        ing.possibleSuppliers = matches
        ing.selectedSupplier = supplierOverrides.has(ing.id)
            ? supplierOverrides.get(ing.id)
            : matches.length === 1 ? matches[0] : null
    }

    return ingredients
})

// c5t: ingredients with no selected supplier — shown at top for manual review
const unmatched = computed(() => {
    return groupedIngredients.value.filter(ing => !ing.selectedSupplier)
})

// c5t: ingredients grouped by their selected supplier
const bySupplier = computed(() => {
    const map = new Map<number, { supplier: any; items: any[] }>()

    for (const ing of groupedIngredients.value) {
        if (!ing.selectedSupplier) continue
        const sup = ing.selectedSupplier
        if (!map.has(sup.id)) map.set(sup.id, { supplier: sup, items: [] })
        map.get(sup.id)!.items.push(ing)
    }

    return [...map.values()]
})

// c5t: seed collapsedSuppliers once after all data and overrides are restored
const stopWatchSuppliers = watch(isRestoring, (restoring) => {
    if (restoring) return
    for (const group of bySupplier.value) collapsedSuppliers.add(group.supplier.id)
    stopWatchSuppliers()
})

function formatQty(qty: number): string {
    return parseFloat(qty.toFixed(2)).toString()
}

function formatPrice(price: number): string {
    return price.toFixed(2) + ' €'
}

// c5t: total estimated cost across all ingredients with a price
const totalCost = computed(() => {
    let total = 0
    for (const ing of groupedIngredients.value) {
        if (ing.defaultPrice != null) total += ing.totalQuantity * ing.defaultPrice
    }
    return total
})

async function saveShoppingList() {
    if (isRestoring.value) return
    const eventIdVal = eventId.value
    if (!eventIdVal) return

    const payload = groupedIngredients.value.map(ing => ({
        ingredientId: ing.id,
        name: ing.name,
        totalQuantity: ing.totalQuantity,
        unit: ing.unit,
        foodCategory: ing.foodCategory?.value ?? null,
        supplyCategory: ing.supplyCategory?.value ?? null,
        supplierId: ing.selectedSupplier?.id ?? null,
        supplierName: ing.selectedSupplier?.name ?? null,
    }))

    console.log('[saveShoppingList] saving', payload.length, 'ingredients...')

    try {
        const res = await dbPatch({
            endpoint: `/items/events/${eventIdVal}`,
            body: { shoppingList: payload },
        })
        console.log('[saveShoppingList] ✓ saved', res)
    } catch (err) {
        console.error('[saveShoppingList] ✗ failed', err)
    }
}

// c5t: auto-save whenever supplier assignments change
watch(supplierOverrides, saveShoppingList)

</script>

<template>
	<div class="shoppingListContainer flex column gap20">

		<button
			class="saveBtn"
			@click="saveShoppingList"
		>Enregistrer la liste</button>

		<div class="totalCost flex justifyBetween alignCenter">
			<span class="totalLabel">Total estimé</span>
			<span class="totalAmount">{{ formatPrice(totalCost) }}</span>
		</div>

		<div
			v-if="unmatched.length"
			class="supplierGroup flex column gap6"
		>
			<p class="sectionTitle attention">À vérifier ({{ unmatched.length }})</p>

			<div
				v-for="ing in unmatched"
				:key="ing.id"
				class="ingRow flex column gap4"
			>
				<div class="flex gap10">
					<span class="ingName">{{ ing.name }}</span>
					<span class="ingQty">{{ formatQty(ing.totalQuantity) }} {{ ing.unit }}</span>
					<span
						v-if="ing.defaultPrice != null"
						class="ingPrice"
					>{{ formatPrice(ing.totalQuantity * ing.defaultPrice) }}</span>
				</div>
				<div class="flex gap6 wrap">
					<button
						v-for="sup in ing.possibleSuppliers"
						:key="sup.id"
						class="supplierChip"
						:class="{ active: ing.selectedSupplier?.id === sup.id }"
						@click="selectSupplier(ing.id, sup)"
					>{{ sup.name }}</button>
					<span
						v-if="!ing.possibleSuppliers.length"
						class="noSupplier"
					>Aucun fournisseur</span>
				</div>
			</div>
		</div>

		<!-- ingredients grouped by selected supplier -->
		<div
			v-for="group in bySupplier"
			:key="group.supplier.id"
			class="supplierGroup flex column"
		>
			<!-- supplier header -->
			<div
				class="supplierHeader flex alignCenter  justifyBetween gap10"
				@click="toggleSupplier(group.supplier.id)"
			>
				<div
                    class="flex gap10 alignCenter"
                >
                    <img
                        v-if="group.supplier.logo"
                        class="supplierLogo"
                        :src="`${directusUrl}/assets/${group.supplier.logo}`"
                        :alt="group.supplier.name"
                    />
                    <div
                        v-else
                        class="supplierLogoPlaceholder flex alignCenter justifyCenter"
                    >
                        {{ group.supplier.name?.[0]?.toUpperCase() }}
                    </div>

                    <div class="flex column flex1">
                        <span class="supplierName">{{ group.supplier.name }}</span>
                        <span class="supplierMeta">{{ group.items.length }} article{{ group.items.length > 1 ? 's' : '' }}</span>
                        
                    </div>
                </div>

				<div>
                    <span class="supplierGroupTotal">{{ formatPrice(supplierTotal(group.items)) }}</span>
				
                    <button
                        class="collapseBtn"
                        :class="{ collapsed: collapsedSuppliers.has(group.supplier.id) }"
                        @click.stop="toggleSupplier(group.supplier.id)"
                    >
                        <Icon>expand_less</Icon>
                    </button>
                </div>
			</div>

			<!-- ingredient rows -->
			<div
				v-if="!collapsedSuppliers.has(group.supplier.id)"
				class="supplierIngList flex column"
			>
				<div
					v-for="ing in group.items"
					:key="ing.id"
					class="ingRow flex column gap4"
				>
				<div class="flex gap10 alignCenter">
					<span class="ingName">{{ ing.name }}</span>
					<span class="ingQty">{{ formatQty(ing.totalQuantity) }} {{ ing.unit }}</span>
					<span
						v-if="ing.defaultPrice != null"
						class="ingPrice"
					>{{ formatPrice(ing.totalQuantity * ing.defaultPrice) }}</span>
					<button
						class="expandBtn centered pad5"
						:class="{ open: expandedIds.has(ing.id) }"
						@click="toggleExpand(ing.id)"
					>
						<Icon>arrow_drop_down</Icon>
					</button>
				</div>
				<div
					v-if="expandedIds.has(ing.id)"
					class="flex gap5 wrap"
				>
					<button
						v-for="sup in ing.possibleSuppliers"
						:key="sup.id"
						class="supplierChip"
						:class="{ active: ing.selectedSupplier?.id === sup.id }"
						@click="selectSupplier(ing.id, sup)"
					>{{ sup.name }}</button>
					<span v-if="!ing.possibleSuppliers.length" class="noSupplier">Aucun fournisseur</span>
				</div>
				</div>
			</div>
		</div>

	</div>
</template>

<style scoped>
.suppliersSection {
	border: 1px solid color-mix(in srgb, var(--beige) 20%, transparent);
	border-radius: 10px;
	padding: 10px;
}

.sectionTitle {
	color: var(--beige);
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.06em;
}

.supplierCard {
	background: color-mix(in srgb, var(--beige) 7%, transparent);
	border: 1px solid color-mix(in srgb, var(--beige) 20%, transparent);
	border-radius: 10px;
	padding: 10px;
}

.supplierName {
	margin: 0;
	color: var(--beige);
	font-weight: 700;
}

.supplierMeta {
	margin: 0;
	color: var(--beige);
	opacity: 0.8;
}

.emptyText {
	color: var(--beige);
	opacity: 0.7;
}

.shoppingList {
	padding-top: 10px;
}

.supplierGroup {
	background: color-mix(in srgb, var(--beige) 5%, transparent);
	border-radius: 16px;
	overflow: hidden;
}

.supplierHeader {
	cursor: pointer;
	padding: 14px 16px;
	transition: background 0.15s;
}

.supplierHeader:hover {
	background: color-mix(in srgb, var(--beige) 8%, transparent);
}

.supplierLogo {
	border-radius: 10px;
	height: 44px;
	object-fit: contain;
	width: 44px;
}

.supplierLogoPlaceholder {
	background: color-mix(in srgb, var(--beige) 15%, transparent);
	border-radius: 10px;
	color: var(--beige);
	font-size: 1.2em;
	font-weight: 700;
	height: 44px;
	width: 44px;
}

.supplierName {
	color: var(--beige);
	font-size: 1.5em;
	font-weight: 700;
}

.supplierMeta {
	color: var(--beige);
	font-size: 0.8em;
	opacity: 0.5;
}

.supplierIngList {
	border-top: 1px solid color-mix(in srgb, var(--beige) 10%, transparent);
	padding: 0 16px;
}

.attention {
	color: #f4b942;
}

.ingredientRow {
	align-items: baseline;
}

.ingRow {
	border-bottom: 1px solid color-mix(in srgb, var(--beige) 8%, transparent);
	padding: 10px 0;
}

.ingName {
	flex: 1;
	color: var(--beige);
	font-size: 1.05em;
}

.ingQty {
	color: var(--beige);
	font-size: 1.1em;
	font-weight: 700;
}

.ingCat {
	color: var(--beige);
	opacity: 0.4;
	font-size: 0.8em;
	margin-left: auto;
}

.supplierChip {
	background: transparent;
	border: 1px solid color-mix(in srgb, var(--beige) 50%, transparent);
	border-radius: 20px;
	color: var(--beige);
	cursor: pointer;
	font-size: 0.9em;
	min-height: 36px;
	opacity: 0.7;
	padding: 0px 16px;
	transition: opacity 0.15s, background 0.15s, border-color 0.15s;
}

.supplierChip:hover {
	opacity: 1;
}

.supplierChip.active {
	background: color-mix(in srgb, var(--beige) 25%, transparent);
	border-color: var(--beige);
	opacity: 1;
	font-weight: 600;
}

.noSupplier {
	color: var(--beige);
	font-size: 0.75em;
	opacity: 0.4;
}

.saveBtn {
	align-self: flex-end;
	background: color-mix(in srgb, var(--beige) 15%, transparent);
	border: 1px solid var(--beige);
	border-radius: 10px;
	color: var(--beige);
	cursor: pointer;
	font-size: 1em;
	font-weight: 600;
	min-height: 44px;
	padding: 10px 28px;
}

.totalCost {
	background: color-mix(in srgb, var(--beige) 10%, transparent);
	border: 1px solid color-mix(in srgb, var(--beige) 30%, transparent);
	border-radius: 10px;
	padding: 12px 16px;
}

.totalLabel {
	color: var(--beige);
	font-size: 0.85em;
	opacity: 0.7;
	text-transform: uppercase;
	letter-spacing: 0.06em;
}

.totalAmount {
	color: var(--beige);
	font-size: 1.4em;
	font-weight: 700;
}

.ingPrice {
	color: var(--beige);
	font-size: 0.9em;
	margin-left: auto;
	opacity: 0.7;
}

.expandBtn {
	background: none;
	border: none;
	color: var(--beige);
	cursor: pointer;
	min-height: 40px;
	min-width: 40px;
	opacity: 0.4;
	padding: 0;
	transition: opacity 0.15s;
}

.expandBtn.open {
	opacity: 0.9;
}

.supplierGroupTotal {
	color: var(--beige);
	font-size: 1em;
	font-weight: 700;
	opacity: 0.85;
}

.collapseBtn {
	background: none;
	border: none;
	color: var(--beige);
	cursor: pointer;
	min-height: 36px;
	min-width: 36px;
	opacity: 0.5;
	padding: 0;
	transition: opacity 0.15s, rotate 0.2s;
}

.collapseBtn:hover {
	opacity: 1;
}

.collapseBtn.collapsed {
	rotate: 180deg;
}
</style>