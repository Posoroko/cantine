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
const recipes = ref<Map<number, any>>(new Map())
const eventSuppliers = ref<any[]>([])

// c5t: prevents auto-save from firing while restoring saved overrides
const isRestoring = ref(false)

onMounted(async () => {
    // c5t: fetch meals with only headcount data — recipe is fetched separately to avoid
    // directus deduplication bug where nested recipe data is collapsed for repeated recipes
    const mealsRaw = await dbGet<any[]>({
        endpoint: '/items/meals',
        query: {
            fields: [
                'recipe',
                'servingCount',
                'service.guestCount',
            ].join(','),
            limit: -1,
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
    meals.value = mealsRaw ?? []

    console.log("raw meals: ", meals.value)

    // c5t: collect unique recipe ids then fetch them all with full ingredient data
    const recipeIds = [...new Set(mealsRaw?.map((m: any) => m.recipe).filter(Boolean) ?? [])]
    if (recipeIds.length) {
        const recipesRaw = await dbGet<any[]>({
            endpoint: '/items/recipes',
            query: {
                fields: [
                    'id',
                    'servings',
                    'ingredients.quantity',
                    'ingredients.ingredient.id',
                    'ingredients.ingredient.name',
                    'ingredients.ingredient.unit',
                    'ingredients.ingredient.foodCategory.value',
                    'ingredients.ingredient.foodCategory.text',
                    'ingredients.ingredient.supplyCategory.value',
                    'ingredients.ingredient.supplyCategory.text',
                    'ingredients.ingredient.defaultPrice',
                ].join(','),
                filter: { id: { _in: recipeIds } },
                limit: -1,
            },
        })
        recipes.value = new Map((recipesRaw ?? []).map((r: any) => [r.id, r]))
    }

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
            if (savedIng.supplierId) {
                const supplier = eventSuppliers.value.find((s: any) => s.id === savedIng.supplierId)
                if (supplier) supplierOverrides.set(savedIng.ingredientId, supplier)
            }
            if (savedIng.orderedQuantity != null) orderedQuantities.set(savedIng.ingredientId, savedIng.orderedQuantity)
            if (savedIng.ref) refs.set(savedIng.ingredientId, savedIng.ref)
        }
    }
    isRestoring.value = false

    // save immediately to sync new ingredients or category changes
    saveShoppingList()
})

// c5t: user overrides for supplier selection per ingredient id
const supplierOverrides = reactive(new Map<number, any>())

// c5t: ingredients explicitly unassigned by the user — prevents auto-assignment from kicking back in
const rejectedIds = reactive(new Set<number>())

// c5t: user-entered ordered quantities — override the computed totalQuantity for price purposes only
const orderedQuantities = reactive(new Map<number, number>())

// c5t: supplier reference numbers per ingredient — shown on print for the salesperson
const refs = reactive(new Map<number, string>())

function setRef(ingId: number, val: string) {
    if (val.trim()) refs.set(ingId, val.trim())
    else refs.delete(ingId)
}

// c5t: supplier groups are collapsed by default
const collapsedSuppliers = reactive(new Set<number>())


function toggleSupplier(supplierId: number) {
    if (collapsedSuppliers.has(supplierId)) collapsedSuppliers.delete(supplierId)
    else collapsedSuppliers.add(supplierId)
}

function supplierTotal(items: any[]): number {
    let total = 0
    for (const ing of items) {
        if (ing.defaultPrice != null) total += effectiveQty(ing) * ing.defaultPrice
    }
    return total
}

// c5t: returns the quantity to use for price calculation — ordered override if set, otherwise computed
function effectiveQty(ing: any): number {
    return orderedQuantities.get(ing.id) ?? ing.totalQuantity
}

function setOrderedQty(ingId: number, val: string) {
    const num = parseFloat(val)
    if (isNaN(num) || num <= 0) orderedQuantities.delete(ingId)
    else orderedQuantities.set(ingId, num)
}

function selectSupplier(ingId: number, supplier: any) {
    supplierOverrides.set(ingId, supplier)
    rejectedIds.delete(ingId)
}

function clearSupplier(ingId: number) {
    supplierOverrides.delete(ingId)
    rejectedIds.add(ingId)
}

const groupedIngredients = computed(() => {
    // step 1: aggregate ingredients across all meals
    const map = new Map<number, any>()

    for (const meal of meals.value) {
        const recipe = recipes.value.get(meal.recipe)
        if (!recipe) continue

        const headcount = meal.servingCount ?? meal.service?.guestCount ?? null

        for (const ri of recipe.ingredients ?? []) {
            const ing = ri.ingredient
            if (!ing) continue

            const existing = map.get(ing.id)

            if (headcount === null) {
                if (existing) {
                    existing.hasError = true
                } else {
                    map.set(ing.id, {
                        id: ing.id,
                        name: ing.name,
                        unit: ing.unit,
                        foodCategory: ing.foodCategory,
                        supplyCategory: ing.supplyCategory,
                        defaultPrice: ing.defaultPrice ?? null,
                        totalQuantity: 0,
                        hasError: true,
                        possibleSuppliers: [] as any[],
                        selectedSupplier: null as any,
                    })
                }
                continue
            }

            const ratio = recipe.servings ? headcount / recipe.servings : 1
            const qty = (ri.quantity ?? 0) * ratio

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
                    hasError: false,
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
            : rejectedIds.has(ing.id) ? null
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

// c5t: total based on raw computed quantities, never modified by user input
const totalBaseCost = computed(() => {
    let total = 0
    const rows = []
    for (const ing of groupedIngredients.value) {
        if (ing.defaultPrice != null) {
            const line = ing.totalQuantity * ing.defaultPrice
            total += line
            rows.push({ name: ing.name, qty: ing.totalQuantity, unit: ing.unit, price: ing.defaultPrice, line })
        }
    }
    console.table(rows)
    console.log('[totalBaseCost]', total.toFixed(2), '€')
    return total
})

// c5t: total using ordered quantities when set, otherwise falls back to computed
const totalCost = computed(() => {
    let total = 0
    for (const ing of groupedIngredients.value) {
        if (ing.defaultPrice != null) total += effectiveQty(ing) * ing.defaultPrice
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
        orderedQuantity: orderedQuantities.get(ing.id) ?? null,
        ref: refs.get(ing.id) ?? null,
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

// c5t: auto-save whenever supplier assignments, ordered quantities, or refs change
watch(supplierOverrides, saveShoppingList)
watch(rejectedIds, saveShoppingList)
watch(orderedQuantities, saveShoppingList)
watch(refs, saveShoppingList)

// c5t: opens a new window with a print-friendly version of the shopping list
function printList() {
    const groups = bySupplier.value

    const ingRow = (ing: any) => {
        const baseQty = ing.totalQuantity
        const ordered = orderedQuantities.get(ing.id)
        const ref = refs.get(ing.id) ?? null
        const basePrice = ing.defaultPrice != null ? formatPrice(baseQty * ing.defaultPrice) : ''
        const orderedQtyDisplay = ordered != null
            ? `${formatQty(ordered)} ${ing.unit}`
            : `<span class="blankLine"></span> ${ing.unit}`

        return `<div class="ing">
            <span class="cb"></span>
            <div class="ingBody">
                <div class="ingNameRow">
                        <div class="ingRefColumn">
                            <span class="ingRef"># ${ref ? `${ref}` : ''}</span>
                        </div>
                    <span class="ingName">${ing.name}</span>
                </div>
                <div class="ingDataRow ingBase">
                    <span class="ingQty">${formatQty(baseQty)} ${ing.unit}</span>
                    <span class="ingPrice">${basePrice}</span>
                </div>
                <div class="ingDataRow ingOrdered">
                    <span> commande: </span>
                    <span class="ingQty">${orderedQtyDisplay}</span>
                </div>
            </div>
        </div>`
    }

    let html = `
        <html><head><title>Liste de courses</title><style>
            body { font-family: sans-serif; padding: 32px; color: #111; }
            h1 { font-size: 1.3em; margin-bottom: 24px; }
            .supplier { margin-bottom: 28px; page-break-inside: avoid; }
            .supplierName { font-weight: bold; font-size: 1.1em; border-bottom: 2px solid #333; padding-bottom: 4px; margin-bottom: 8px; }
            .ing { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; border-bottom: 1px solid #eee; }
            .cb { width: 16px; height: 16px; border: 1.5px solid #555; border-radius: 3px; flex-shrink: 0; margin-top: 3px; display: inline-block; }
            .ingBody { flex: 1; display: flex; flex-direction: column; gap: 2px; }
            .ingNameRow { display: flex; align-items: center; gap: 16px; margin-bottom: 4px; }
            .ingRefColumn { width: 150px; }
            .ingRef { display: block; color: black; border: 1px solid black; font-weight: 700; font-size: 0.85em; letter-spacing: 0.1em; padding: 4px 8px; border-radius: 4px; white-space: nowrap; box-sizing: border-box; width: 100%; }
            .ingName { font-weight: 600; flex: 1; }
            .ingDataRow { display: flex; justify-content: flex-end; gap: 16px; margin-top: 10px; }
            .ingBase { color: #888; font-size: 0.85em; }
            .ingOrdered { font-weight: 700; font-size: 0.95em; }
            .ingQty { width: 120px; text-align: right; white-space: nowrap;  }
            .ingPrice { width: 80px; text-align: right; white-space: nowrap; }
            .blankLine { display: inline-block; width: 80px; border-bottom: 1.5px solid #aaa; margin-bottom: 2px; vertical-align: bottom; }
            .totalLine { margin-top: 28px; font-weight: bold; font-size: 1.1em; border-top: 2px solid #333; padding-top: 10px; }
        </style></head><body>
    `

    html += `<h1>Liste de courses</h1>`

    for (const group of groups) {
        html += `<div class="supplier">`
        html += `<div class="supplierName">${group.supplier.name}</div>`
        for (const ing of group.items) html += ingRow(ing)
        html += `</div>`
    }

    if (unmatched.value.length) {
        html += `<div class="supplier">`
        html += `<div class="supplierName">À vérifier (${unmatched.value.length})</div>`
        for (const ing of unmatched.value) html += ingRow(ing)
        html += `</div>`
    }

    html += `<div class="totalLine">Total estimé : ${formatPrice(totalCost.value)}</div>`
    html += `</body></html>`

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.print()
}

</script>

<template>
	<div class="shoppingListContainer flex column gap20">

		<div class="listActions flex gap10">
			<button
				class="printBtn"
				@click="printList"
			>Imprimer la liste</button>
			<button
				class="saveBtn"
				@click="saveShoppingList"
			>Enregistrer la liste</button>
		</div>

		<div class="totalCost flex column gap4">
			<div class="flex justifyBetween alignCenter">
				<span class="totalLabel">Total de base</span>
				<span class="totalAmountBase">{{ formatPrice(totalBaseCost) }}</span>
			</div>
			<div class="flex justifyBetween alignCenter">
				<span class="totalLabel">Total commandé</span>
				<span class="totalAmount">{{ formatPrice(totalCost) }}</span>
			</div>
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
                    <span v-if="ing.hasError" class="ingError">ERROR</span>					
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
                    
                    <!-- line 1: name -->
                    <div class="flex alignCenter justifyBetween w100">
                        
                        <span class="ingName textLg fontWeightBold">{{ ing.name }}</span>
                        <span v-if="ing.hasError" class="ingError">ERROR</span>

                        <button
                            class="clearSupplierBtn centered pad5"
                            @click.stop="clearSupplier(ing.id)"
                            title="Retirer le fournisseur"
                        >
                            <Icon>close</Icon>
                        </button>
                    </div>
                    <div
                        class="flex w50 gap20"
                    >
                        <p>Réf. : </p>

                        <input
                            type="text"
                            class="refInput"
                            :class="[
                                refs.get(ing.id) == null ? 'needsAction' : ''
                            ]"
                            :value="refs.get(ing.id) ?? ''"
                            @input="setRef(ing.id, ($event.target as HTMLInputElement).value)"
                            placeholder="Référence..."
                        />
                    </div>

                    <!-- line 2: base computed qty + price -->
                    <div class="ingTableRow">
                        <span class="ingUnit textMd">
                            {{ formatQty(ing.totalQuantity) }} {{ ing.unit }}
                        </span>
                        <span class="ingTableCell flex alignCenter justifyEnd">
                            <template v-if="ing.defaultPrice != null">
                                {{ formatPrice(ing.totalQuantity * ing.defaultPrice) }}
                            </template>
                        </span>
                    </div>
                    <!-- line 3: ordered qty input + effective price -->
                    <div 
                        v-if="ing.defaultPrice != null" 
                        class="ingTableRow marTop10"
                    >
                        <!-- <Icon class="ingOrderIcon">shopping_cart</Icon> -->
                        <div class="ingTableCell flex alignCenter justifyEnd gap5">
                            <input
                                class="ingOrderInput"
                                type="number"
                                min="0"
                                step="any"
                                :placeholder="formatQty(ing.totalQuantity)"
                                :value="orderedQuantities.get(ing.id) ?? ''"
                                @change="setOrderedQty(ing.id, ($event.target as HTMLInputElement).value)"
                            />
                            <span class="ingUnit textMd">{{ ing.unit }}</span>
                        </div>
                        <span class="ingTableCell flex alignCenter justifyEnd">
                            {{ formatPrice(effectiveQty(ing) * ing.defaultPrice) }}
                        </span>
                        <!-- <button
                            v-if="orderedQuantities.has(ing.id)"
                            class="clearOrderBtn"
                            @click="clearOrderedQty(ing.id)"
                            title="Réinitialiser"
                        >
                            <Icon>close</Icon>
                        </button> -->
                    </div>
                    <!-- <div class="flex gap5 wrap">
                        <button
                            v-for="sup in ing.possibleSuppliers"
                            :key="sup.id"
                            class="supplierChip"
                            :class="{ active: ing.selectedSupplier?.id === sup.id }"
                            @click="selectSupplier(ing.id, sup)"
                        >{{ sup.name }}</button>
                        
                        <span v-if="!ing.possibleSuppliers.length" class="noSupplier">Aucun fournisseur</span>
                    </div> -->
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
	/* border-top: 1px solid color-mix(in srgb, var(--beige) 10%, transparent); */
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

.listActions {
	justify-content: flex-end;
}

.saveBtn {
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

.printBtn {
	background: transparent;
	border: 1px solid color-mix(in srgb, var(--beige) 40%, transparent);
	border-radius: 10px;
	color: var(--beige);
	cursor: pointer;
	font-size: 1em;
	min-height: 44px;
	opacity: 0.7;
	padding: 10px 28px;
	transition: opacity 0.15s;
}

.printBtn:hover {
	opacity: 1;
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

.totalAmountBase {
	color: var(--beige);
	font-size: 1em;
	opacity: 0.5;
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

.ingError {
	color: #e74c3c;
	font-size: 0.75em;
	font-weight: 700;
	letter-spacing: 0.05em;
}

.clearSupplierBtn {
	background: none;
	border: none;
	color: var(--beige);
	cursor: pointer;
	min-height: 40px;
	min-width: 40px;
	opacity: 0.3;
	padding: 0;
	transition: opacity 0.15s;
}

.clearSupplierBtn:hover {
	opacity: 1;
	color: #e74c3c;
}

.ingOrderRow {
	align-items: center;
	display: grid;
	grid-template-columns: 1fr 120px 85px 28px;
}

.ingTableRow {
	display: flex;
    justify-content: flex-end;
}

.ingTableCell {
    width: 25%;
}


.ingOrderIcon {
	color: var(--beige);
	font-size: 1em;
	opacity: 0.35;
}

.refInput,
.ingOrderInput {
	background: color-mix(in srgb, var(--beige) 8%, transparent);
	border: 1px solid color-mix(in srgb, var(--beige) 25%, transparent);
	border-radius: 6px;
	color: var(--beige);
	font-size: 1.2em;
	min-height: 28px;
	padding: 0 6px;
}

.refInput.needsAction {
    border: 2px solid var(--color-error);
}

.ingOrderInput{
    width: 72px;
    text-align: right;
}

.ingOrderInput:focus {
	border-color: color-mix(in srgb, var(--beige) 60%, transparent);
	outline: none;
}

.ingOrderInput::-webkit-outer-spin-button,
.ingOrderInput::-webkit-inner-spin-button {
	-webkit-appearance: none;
	margin: 0;
}

.ingOrderInput[type='number'] {
	-moz-appearance: textfield;
}

.clearOrderBtn {
	background: none;
	border: none;
	color: var(--beige);
	cursor: pointer;
	opacity: 0.35;
	padding: 0;
	transition: opacity 0.15s;
}

.clearOrderBtn:hover {
	opacity: 1;
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