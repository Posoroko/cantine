<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { dbGet, dbPatch } from '@/composables/fetch'
import Icon from '@/components/Icon/Main.vue'
import { SUPPLY_CATEGORY_CONFIG } from '@/composables/appAssets'

const route = useRoute()
const eventId = computed(() => parseInt(route.params.eventId as string))

const meals = ref<any[]>([])
const recipes = ref<Map<number, any>>(new Map())

// c5t: prevents auto-save from firing while restoring saved state
const isRestoring = ref(false)

// c5t: true while user is typing in an input — shows the save button until @change fires and save completes
const isDirty = ref(false)

// c5t: ordered quantities pulled from shoppingList JSON — used as fallback for delivered
const shoppingOrderedQtys = reactive(new Map<number, number>())

// c5t: delivered quantities per ingredient id — manually entered on arrival
const deliveredQtys = reactive(new Map<number, number>())

// c5t: set of "ingredientId:mealId" composite keys — marks a meal as prepped/used
const usedMeals = reactive(new Set<string>())

// c5t: ingredient rows expanded by default so the list is immediately actionable
const collapsedIngredients = reactive(new Set<number>())

// c5t: null means all categories shown
const activeCategory = ref<string | null>(null)

// c5t: filters ingredient names within visible groups
const searchQuery = ref('')

// c5t: ingredient ids manually hidden from the list — persisted in pantryList
const hiddenIngredients = reactive(new Set<number>())

// c5t: extra qty per ingredient for unplanned use (ex. extra guests) — shown as "Autre" row in meal breakdown
const autreQtys = reactive(new Map<number, number>())

onMounted(async () => {
    // c5t: fetch meals with headcount + service context for labelling
    const mealsRaw = await dbGet<any[]>({
        endpoint: '/items/meals',
        query: {
            fields: [
                'id',
                'recipe',
                'servingCount',
                'service.guestCount',
                'service.timeSlot',
                'service.day.dayOfTheWeek',
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

    // c5t: fetch recipes with ingredient breakdown — same deduplication-safe approach as shopping list
    const recipeIds = [...new Set(mealsRaw?.map((m: any) => m.recipe).filter(Boolean) ?? [])]
    if (recipeIds.length) {
        const recipesRaw = await dbGet<any[]>({
            endpoint: '/items/recipes',
            query: {
                fields: [
                    'id',
                    'name',
                    'servings',
                    'ingredients.quantity',
                    'ingredients.ingredient.id',
                    'ingredients.ingredient.name',
                    'ingredients.ingredient.unit',
                    'ingredients.ingredient.supplyCategory.value',
                    'ingredients.ingredient.supplyCategory.text',
                ].join(','),
                filter: { id: { _in: recipeIds } },
                limit: -1,
            },
        })
        recipes.value = new Map((recipesRaw ?? []).map((r: any) => [r.id, r]))
    }

    // c5t: restore saved state from both shoppingList (ordered qty) and pantryList (delivered + used)
    isRestoring.value = true
    const eventData = await dbGet<any>({
        endpoint: `/items/events/${eventId.value}`,
        query: { fields: 'shoppingList,pantryList' },
    })

    const savedShopping = eventData?.shoppingList
    if (Array.isArray(savedShopping)) {
        for (const item of savedShopping) {
            if (item.orderedQuantity != null) shoppingOrderedQtys.set(item.ingredientId, item.orderedQuantity)
        }
    }

    const savedPantry = eventData?.pantryList
    if (Array.isArray(savedPantry)) {
        for (const item of savedPantry) {
            if (item.deliveredQty != null) deliveredQtys.set(item.ingredientId, item.deliveredQty)
            if (item.autreQty != null) autreQtys.set(item.ingredientId, item.autreQty)
            if (item.showInList === false) hiddenIngredients.add(item.ingredientId)
            if (Array.isArray(item.meals)) {
                for (const m of item.meals) {
                    if (m.used) usedMeals.add(`${item.ingredientId}:${m.mealId}`)
                }
            }
        }
    }

    isRestoring.value = false
    savePantryList()
})

// c5t: build per-ingredient list with full per-meal breakdown for pantry tracking
const pantryIngredients = computed(() => {
    const map = new Map<number, any>()

    for (const meal of meals.value) {
        const recipe = recipes.value.get(meal.recipe)
        if (!recipe) continue

        const headcount = meal.servingCount ?? meal.service?.guestCount ?? null
        const mealId = meal.id

        for (const ri of recipe.ingredients ?? []) {
            const ing = ri.ingredient
            if (!ing) continue

            if (!map.has(ing.id)) {
                map.set(ing.id, {
                    id: ing.id,
                    name: ing.name,
                    unit: ing.unit,
                    supplyCategory: ing.supplyCategory ?? null,
                    baseQty: 0,
                    hasError: false,
                    mealBreakdown: [] as any[],
                })
            }

            const entry = map.get(ing.id)!

            if (headcount === null) {
                entry.hasError = true
                continue
            }

            const ratio = recipe.servings ? headcount / recipe.servings : 1
            const qty = (ri.quantity ?? 0) * ratio

            entry.baseQty += qty
            entry.mealBreakdown.push({
                mealId,
                recipeName: recipe.name ?? '',
                dayOfTheWeek: meal.service?.day?.dayOfTheWeek ?? '',
                timeSlot: meal.service?.timeSlot ?? '',
                qty,
            })
        }
    }

    return [...map.values()]
})

// c5t: ingredients grouped by supplyCategory, sorted alphabetically within each group
const groupedIngredients = computed(() => {
    const categoryMap = new Map<string, { key: string; label: string; icon: string; items: any[] }>()

    const sorted = [...pantryIngredients.value].sort((a, b) =>
        a.name.localeCompare(b.name, 'fr')
    )

    for (const ing of sorted) {
        const key = ing.supplyCategory?.value ?? '__none__'
        const label = ing.supplyCategory?.text ?? 'Sans catégorie'
        const icon = SUPPLY_CATEGORY_CONFIG[key]?.icon ?? 'category'
        if (!categoryMap.has(key)) categoryMap.set(key, { key, label, icon, items: [] })
        categoryMap.get(key)!.items.push(ing)
    }

    // c5t: sort by SUPPLY_CATEGORY_CONFIG order, keeping '__none__' last
    return [...categoryMap.entries()]
        .sort(([keyA], [keyB]) => {
            if (keyA === '__none__') return 1
            if (keyB === '__none__') return -1
            const orderA = SUPPLY_CATEGORY_CONFIG[keyA]?.order ?? 99
            const orderB = SUPPLY_CATEGORY_CONFIG[keyB]?.order ?? 99
            return orderA - orderB
        })
        .map(([, group]) => group)
})

// c5t: categories available as filter buttons — derived from grouped data
const availableCategories = computed(() => groupedIngredients.value)

// c5t: only the selected category group, or all if none selected — then filtered by search
const visibleGroups = computed(() => {
    const isHiddenView = activeCategory.value === '__hidden__'

    const groups = isHiddenView
        ? groupedIngredients.value
        : activeCategory.value
            ? groupedIngredients.value.filter(g => g.key === activeCategory.value)
            : groupedIngredients.value

    const q = searchQuery.value.trim().toLowerCase()

    return groups
        .map(g => ({
            ...g,
            items: g.items.filter((ing: any) => {
                const matchesHidden = isHiddenView
                    ? hiddenIngredients.has(ing.id)
                    : !hiddenIngredients.has(ing.id)
                const matchesSearch = !q || ing.name.toLowerCase().includes(q)
                return matchesHidden && matchesSearch
            }),
        }))
        .filter(g => g.items.length > 0)
})

const hiddenCount = computed(() => hiddenIngredients.size)

function toggleCategory(key: string) {
    activeCategory.value = activeCategory.value === key ? null : key
}

function hideIngredientFromList(ing: any) {
    hiddenIngredients.add(ing.id)
}

function showIngredient(ing: any) {
    hiddenIngredients.delete(ing.id)
}

// c5t: collapse all ingredients once computed — each row starts collapsed
const stopInitWatch = watch(pantryIngredients, (ings) => {
    if (!ings.length) return
    for (const ing of ings) collapsedIngredients.add(ing.id)
    stopInitWatch()
})

function toggleIngredient(ingId: number) {
    if (collapsedIngredients.has(ingId)) collapsedIngredients.delete(ingId)
    else collapsedIngredients.add(ingId)
}

function setDeliveredQty(ingId: number, val: string) {
    const num = parseFloat(val)
    if (isNaN(num) || num < 0) deliveredQtys.delete(ingId)
    else deliveredQtys.set(ingId, num)
}

function toggleUsedMeal(ingId: number, mealId: number) {
    const key = `${ingId}:${mealId}`
    if (usedMeals.has(key)) usedMeals.delete(key)
    else usedMeals.add(key)
}

function isUsed(ingId: number, mealId: number): boolean {
    return usedMeals.has(`${ingId}:${mealId}`)
}

function setAutreQty(ingId: number, val: string) {
    const num = parseFloat(val)
    if (isNaN(num) || num < 0) autreQtys.delete(ingId)
    else autreQtys.set(ingId, num)
}

function usedQty(ing: any): number {
    const mealSum = ing.mealBreakdown
        .filter((m: any) => isUsed(ing.id, m.mealId))
        .reduce((sum: number, m: any) => sum + m.qty, 0)
    return mealSum + (autreQtys.get(ing.id) ?? 0)
}

// c5t: returns null when no deliveredQty has been entered — signals missing info
function remainingQty(ing: any): number | null {
    const delivered = deliveredQtys.get(ing.id)
    if (delivered == null) return null
    return delivered - usedQty(ing)
}

function formatQty(qty: number): string {
    return parseFloat(qty.toFixed(2)).toString()
}

const SLOT_LABELS: Record<string, string> = {
    breakfast: 'matin',
    snackAm: 'collation matin',
    lunch: 'midi',
    snackPm: 'collation soir',
    supper: 'soir',
}

function formatSlot(slot: string): string {
    return SLOT_LABELS[slot] ?? slot
}

async function savePantryList() {
    if (isRestoring.value) return
    const eventIdVal = eventId.value
    if (!eventIdVal) return

    const payload = pantryIngredients.value.map(ing => ({
        ingredientId: ing.id,
        name: ing.name,
        unit: ing.unit,
        baseQty: ing.baseQty,
        showInList: !hiddenIngredients.has(ing.id),
        deliveredQty: deliveredQtys.get(ing.id) ?? null,
        autreQty: autreQtys.get(ing.id) ?? null,
        meals: ing.mealBreakdown.map((m: any) => ({
            mealId: m.mealId,
            recipeName: m.recipeName,
            dayOfTheWeek: m.dayOfTheWeek,
            timeSlot: m.timeSlot,
            qty: m.qty,
            used: isUsed(ing.id, m.mealId),
        })),
    }))

    try {
        await dbPatch({
            endpoint: `/items/events/${eventIdVal}`,
            body: { pantryList: payload },
        })
        isDirty.value = false
    } catch (err) {
        console.error('[savePantryList] ✗ failed', err)
    }
}

// c5t: auto-save whenever delivered quantities, used-meal state, or visibility changes
watch(deliveredQtys, savePantryList)
watch(usedMeals, savePantryList)
watch(hiddenIngredients, savePantryList)
watch(autreQtys, savePantryList)

</script>

<template>
    <div class="gardeManger flex column gap20">

        <!-- category filter bar -->
        <div class="categoryFilterBar flex gap10 wrap">
            <button
                class="categoryFilterBtn flex alignCenter gap6"
                :class="{ active: activeCategory === null }"
                @click="activeCategory = null"
            >
                <span>Tout</span>
            </button>
            <button
                v-for="cat in availableCategories"
                :key="cat.key"
                class="categoryFilterBtn flex alignCenter gap6"
                :class="{ active: activeCategory === cat.key }"
                @click="toggleCategory(cat.key)"
            >
                <Icon>{{ cat.icon }}</Icon>
                <!-- <span>{{ cat.label }}</span> -->
            </button>

            <button
                class="categoryFilterBtn flex alignCenter gap6"
                :class="{ active: activeCategory === '__hidden__' }"
                @click="toggleCategory('__hidden__')"
            >
                <Icon>visibility_off</Icon>
                <span>{{ hiddenCount > 0 ? ` (${hiddenCount})` : '' }}</span>
            </button>
        </div>

        <!-- search input -->
        <div class="searchRow">
            <input
                v-model="searchQuery"
                class="searchInput"
                type="text"
                placeholder="Rechercher un ingrédient…"
            />
        </div>

        <div
            v-for="group in visibleGroups"
            :key="group.label"
            class="categorySection flex column gap10"
        >
            <p 
                class="
                    categorySectionLabel
                    textXl 
                    fontWeightBold 
                    beigeCardGreenText 
                    rounded10
                    flex alignCenter gap10
                "
            >
                <Icon
                    color="green"
                >
                    {{ group.icon }}
                </Icon>

                {{ group.label }}
            </p>

        <div
            v-for="ing in group.items"
            :key="ing.id"
            class="ingCard flex column"
        >
            <!-- ingredient name — always visible -->
            <div class="ingNameRow flex alignCenter justifyBetween">
                <span class="ingName">{{ ing.name }}</span>
                <span
                    v-if="ing.hasError"
                    class="ingError"
                >
                    convives manquants 
                </span>

                <button
                    v-if="activeCategory !== '__hidden__'"
                    class="hideBtn"
                    title="Cacher cet ingrédient"
                    @click="hideIngredientFromList(ing)"
                >
                    <Icon>visibility_off</Icon>
                </button>
                <button
                    v-else
                    class="showBtn"
                    title="Réafficher cet ingrédient"
                    @click="showIngredient(ing)"
                >
                    <Icon>visibility</Icon>
                </button>
            </div>

            <!-- quantities — always visible -->
            <div class="qtyRow flex gap0">
                <div class="qtyBlock flex column gap2">
                    <span class="qtyLabel">base</span>
                    <span class="qtyValue">
                        {{ formatQty(ing.baseQty) }} {{ ing.unit }}
                    </span>
                </div>

                <div class="qtyBlock flex column gap2">
                    <span class="qtyLabel">
                        commandé
                    </span>
                    <span
                        class="qtyValue"
                        :class="{ qtyMissing: shoppingOrderedQtys.get(ing.id) == null }"
                    >
                        {{ shoppingOrderedQtys.get(ing.id) != null
                            ? `${formatQty(shoppingOrderedQtys.get(ing.id)!)} ${ing.unit}`
                            : '—' }}
                    </span>
                </div>

                <div class="qtyBlock flex column gap2">
                    <span class="qtyLabel">reçu</span>
                    <div class="flex alignCenter gap5">
                        <input
                            class="deliveredInput"
                            :class="{ needsAction: deliveredQtys.get(ing.id) == null }"
                            type="number"
                            min="0"
                            step="any"
                            placeholder="--"
                            :value="deliveredQtys.get(ing.id) ?? ''"
                            @input="isDirty = true"
                            @change="setDeliveredQty(ing.id, ($event.target as HTMLInputElement).value)"
                        />
                        <!-- <span class="qtyUnit">{{ ing.unit }}</span> -->
                    </div>
                </div>

                <div
                    class="qtyBlock qtyBlockRemaining flex column gap2"
                    :class="{
                        remainingOk: remainingQty(ing) !== null && remainingQty(ing)! >= 0,
                        remainingLow: remainingQty(ing) !== null && remainingQty(ing)! < 0,
                        remainingUnknown: remainingQty(ing) === null,
                    }"
                >
                    <span class="qtyLabel">restant</span>
                    <span class="qtyValue remainingValue">
                        {{ remainingQty(ing) !== null ? `${formatQty(remainingQty(ing)!)}` : '—' }}
                    </span>
                </div>
            </div>

            <!-- meal breakdown — expandable -->
            <button
                class="mealsToggle flex alignCenter justifyBetween gap8"
                @click="toggleIngredient(ing.id)"
            >
                <span class="mealsToggleLabel">
                    {{ ing.mealBreakdown.length }} repas
                </span>
                <Icon :class="{ collapsed: collapsedIngredients.has(ing.id) }">expand_less</Icon>
            </button>

            <div
                v-if="!collapsedIngredients.has(ing.id)"
                class="mealList flex column gap6"
            >
                <div
                    v-for="meal in ing.mealBreakdown"
                    :key="meal.mealId"
                    class="mealRow flex alignCenter justifyBetween"
                    :class="{ mealUsed: isUsed(ing.id, meal.mealId) }"
                    @click="toggleUsedMeal(ing.id, meal.mealId)"
                >
                    <div class="flex column flex1">
                        <span class="mealRecipeName">{{ meal.recipeName }}</span>
                        <span class="mealSubtitle">
                            {{ meal.dayOfTheWeek }} {{ formatSlot(meal.timeSlot) }}
                        </span>
                    </div>

                    <div
                        class="flex alignCenter gap20"
                    >
                        <span class="textMd">
                            {{ formatQty(meal.qty) }} {{ ing.unit }}
                        </span>

                        <div
                            class="checkbox"
                            :class="{ checked: isUsed(ing.id, meal.mealId) }"
                        >
                            <Icon v-if="isUsed(ing.id, meal.mealId)">check</Icon>
                        </div>
                    </div>
                </div>

                <!-- autre row: extra unplanned usage input -->
                <div class="autreRow flex alignCenter justifyBetween">
                    <span class="mealRecipeName autreLabel">Autre</span>
                    <div class="flex alignCenter gap8">
                        <input
                            class="autreInput"
                            type="number"
                            min="0"
                            step="any"
                            :value="autreQtys.get(ing.id) ?? ''"
                            @input="isDirty = true"
                            @change="setAutreQty(ing.id, ($event.target as HTMLInputElement).value)"
                        />
                        <!-- <span class="mealSubtitle">{{ ing.unit }}</span> -->
                    </div>
                </div>
            </div>
        </div>

        </div>

        <!-- floating save button — clicking it blurs any active input, triggering @change saves -->
        <button 
            v-if="isDirty"
            class="
                beigeCardGreenText
                saveFloatingBtn 
                flex alignCenter gap5
            "
        >
            <Icon
                color="green"
            >
                save
            </Icon>
            <span>Enregistrer</span>
        </button>
    </div>
</template>

<style scoped>
.gardeManger {
    padding: 10px;
    padding-bottom: 80px;
}

.saveFloatingBtn {
    border: none;
    border-radius: 50px;
    bottom: 20px;
    box-shadow: 0 4px 16px color-mix(in srgb, var(--green) 40%, transparent);
    cursor: pointer;
    font-size: 0.95em;
    font-weight: 700;
    padding: 12px 22px;
    position: fixed;
    right: 20px;
    z-index: 10;
}

/* category filter bar */

.categoryFilterBar {
    padding: 0 4px;
}

.categoryFilterBtn {
    background: color-mix(in srgb, var(--beige) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--beige) 20%, transparent);
    border-radius: 20px;
    color: var(--beige);
    cursor: pointer;
    font-size: 0.85em;
    opacity: 0.6;
    padding: 6px 14px;
    transition: opacity 0.15s, background 0.15s, border-color 0.15s;
}

.categoryFilterBtn:hover {
    opacity: 1;
}

.categoryFilterBtn.active {
    background: color-mix(in srgb, var(--beige) 20%, transparent);
    border-color: var(--beige);
    opacity: 1;
    font-weight: 600;
}

/* search */

.searchRow {
    padding: 0 4px;
}

.searchInput {
    background: color-mix(in srgb, var(--beige) 6%, transparent);
    border: 1px solid color-mix(in srgb, var(--beige) 25%, transparent);
    border-radius: 10px;
    color: var(--beige);
    font-size: 1em;
    min-height: 40px;
    padding: 0 14px;
    width: 100%;
}

.searchInput::placeholder {
    color: var(--beige);
    opacity: 0.3;
}

.searchInput:focus {
    border-color: color-mix(in srgb, var(--beige) 55%, transparent);
    outline: none;
}

.categorySectionLabel {
    padding: 5px 10px;
}

.ingCard {
    background: color-mix(in srgb, var(--beige) 5%, transparent);
    border-radius: 14px;
    overflow: hidden;
}

/* name row */

.ingNameRow {
    padding: 14px 16px 8px;
}

.pad14 {
    padding: 14px 16px 8px;
}

.ingName {
    color: var(--beige);
    font-size: 1.15em;
    font-weight: 700;
}

.ingError {
    color: #e74c3c;
    font-size: 0.75em;
    font-weight: 700;
    letter-spacing: 0.05em;
}

.hideBtn,
.showBtn {
    background: none;
    border: none;
    color: var(--beige);
    cursor: pointer;
    flex-shrink: 0;
    opacity: 0.25;
    padding: 4px;
    transition: opacity 0.15s;
}

.hideBtn:hover {
    opacity: 0.7;
}

.showBtn {
    opacity: 0.6;
    color: var(--green);
}

.showBtn:hover {
    opacity: 1;
}

/* quantities row */

.qtyRow {
    border-bottom: 1px solid color-mix(in srgb, var(--beige) 10%, transparent);
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    padding: 0 16px 14px;
}

.qtyBlock {
    padding: 0 4px;
}

.qtyBlock + .qtyBlock {
    border-left: 1px solid color-mix(in srgb, var(--beige) 10%, transparent);
    padding-left: 12px;
}

.qtyBlockRemaining {
    background: color-mix(in srgb, var(--beige) 4%, transparent);
    border-radius: 8px;
    padding: 6px 10px;
}

.qtyLabel {
    color: var(--beige);
    font-size: 0.7em;
    letter-spacing: 0.06em;
    opacity: 0.8;
    text-transform: uppercase;
}

.qtyValue {
    color: var(--beige);
    font-size: 0.95em;
    font-weight: 600;
}

.qtyMissing {
    opacity: 0.3;
}

.qtyUnit {
    color: var(--beige);
    font-size: 0.9em;
    opacity: 0.6;
}

/* remaining block color states */

.remainingLow { 
    border-color: #e74c3c; 
}

.remainingLow .remainingValue { 
    color: #e74c3c; 
}

.remainingUnknown .remainingValue { 
    color: #f4b942; 
}

.remainingValue {
    font-size: 1em;
    font-weight: 700;
}

/* delivered input */

.deliveredInput {
    background: color-mix(in srgb, var(--beige) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--beige) 30%, transparent);
    border-radius: 6px;
    color: var(--beige);
    font-size: 1em;
    font-weight: 600;
    min-height: 30px;
    padding: 0 6px;
    text-align: right;
    width: 64px;
}

.deliveredInput.needsAction {
    border-color: #f4b942;
    border-width: 2px;
}

.deliveredInput:focus {
    border-color: color-mix(in srgb, var(--beige) 60%, transparent);
    outline: none;
}

.deliveredInput::-webkit-outer-spin-button,
.deliveredInput::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.deliveredInput[type='number'] {
    -moz-appearance: textfield;
}

/* meals toggle */

.mealsToggle {
    background: none;
    border: none;
    border-top: 1px solid color-mix(in srgb, var(--beige) 8%, transparent);
    color: var(--beige);
    cursor: pointer;
    font-size: 0.8em;
    opacity: 0.5;
    padding: 8px 16px;
    text-align: left;
    transition: opacity 0.15s;
    width: 100%;
}

.mealsToggle:hover {
    opacity: 1;
}

.mealsToggle .collapsed {
    transform: rotate(180deg);
}

.mealsToggleLabel {
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

/* meal breakdown */

.mealList {
    padding: 4px 10px 10px;
}

.mealRow {
    border-radius: 8px;
    cursor: pointer;
    padding: 8px 6px;
    transition: background 0.12s;
}

.mealRow:hover {
    background: color-mix(in srgb, var(--beige) 6%, transparent);
}

.mealUsed {
    opacity: 0.45;
}

.checkbox {
    align-items: center;
    border: 2px solid color-mix(in srgb, var(--beige) 40%, transparent);
    border-radius: 5px;
    color: var(--beige);
    display: flex;
    flex-shrink: 0;
    font-size: 0.9em;
    height: 22px;
    justify-content: center;
    transition: background 0.15s, border-color 0.15s;
    width: 22px;
}

.checkbox.checked {
    background: var(--green);
    border-color: var(--green);
    color: #fff;
}

.mealRecipeName {
    color: var(--beige);
    font-size: 1em;
    font-weight: 600;
}

.mealSubtitle {
    color: var(--beige);
    font-size: 0.8em;
    opacity: 0.5;
    text-transform: capitalize;
}

/* autre row */

.autreRow {
    border-top: 1px dashed color-mix(in srgb, var(--beige) 15%, transparent);
    margin-top: 4px;
    padding: 8px 6px 4px;
}

.autreLabel {
    opacity: 0.45;
}

.autreInput {
    background: color-mix(in srgb, var(--beige) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--beige) 25%, transparent);
    border-radius: 6px;
    color: var(--beige);
    font-size: 1em;
    font-weight: 600;
    min-height: 30px;
    padding: 0 6px;
    text-align: right;
    width: 64px;
}

.autreInput:focus {
    border-color: color-mix(in srgb, var(--beige) 60%, transparent);
    outline: none;
}

.autreInput::-webkit-outer-spin-button,
.autreInput::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.autreInput[type='number'] {
    -moz-appearance: textfield;
}
</style>
