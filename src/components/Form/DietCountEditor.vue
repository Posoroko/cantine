<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Item_Diet, Item_DietCount } from '@/types/directusDataModel'

import Icon from '@/components/Icon/Main.vue'
import { appAssetStore } from '@/composables/appAssets'

const props = defineProps<{
    mode: 'create' | 'update'
    guestCount: number | null
    existingDietCounts?: Item_DietCount[]
}>()

const emit = defineEmits<{
    (e: 'update:dietCounts', value: DietCountEntry[]): void
    (e: 'update:valid', value: boolean): void
}>()

export type DietCountEntry = {
    diets: Item_Diet['key'][]
    count: number
}

const specialDiets = computed((): Item_Diet[] =>
    appAssetStore.value.diets.filter(d => d.key !== 'default') as Item_Diet[]
)

const dietCounts = ref<DietCountEntry[]>([])

// -- Initialize from existing data in update mode
if (props.mode === 'update' && props.existingDietCounts?.length) {
    dietCounts.value = props.existingDietCounts
        .filter(dc => !dc.diets.some(d => d.diet === 'default'))
        .map(dc => ({
            diets: dc.diets.map(d => d.diet),
            count: dc.count
        }))
}

const defaultCount = computed(() => {
    const specialTotal = dietCounts.value.reduce((sum, dc) => sum + dc.count, 0)
    return (props.guestCount || 0) - specialTotal
})

const isValid = computed(() => {
    if (!props.guestCount || props.guestCount <= 0) return false
    if (defaultCount.value < 0) return false
    return dietCounts.value.every(dc => dc.diets.length > 0 && dc.count > 0)
})

// -- Emit changes
watch([dietCounts, defaultCount], () => {
    emit('update:dietCounts', dietCounts.value)
    emit('update:valid', isValid.value)
}, { deep: true, immediate: true })

watch(() => props.guestCount, () => {
    emit('update:valid', isValid.value)
})

// -- Diet count management
const editingDiet = ref<DietCountEntry | null>(null)

function startAddDietCount() {
    editingDiet.value = { diets: [], count: 1 }
}

function confirmDietCount() {
    if (!editingDiet.value || editingDiet.value.diets.length === 0) return
    dietCounts.value.push(editingDiet.value)
    editingDiet.value = null
}

function cancelDietCount() {
    editingDiet.value = null
}

function removeDietCount(index: number) {
    dietCounts.value.splice(index, 1)
}

function toggleDiet(entry: DietCountEntry, dietKey: Item_Diet['key']) {
    const idx = entry.diets.indexOf(dietKey)
    if (idx >= 0) {
        entry.diets.splice(idx, 1)
    } else {
        entry.diets.push(dietKey)
    }
}

defineExpose({ defaultCount })
</script>

<template>
    <div
        v-if="guestCount && guestCount > 0"
        class="
            flex column gap10
        "
    >
        <!-- Default (classique) -->
        <div
            class="
                dietCountRow
                flex alignCenter gap10
            "
        >
            <span
                class="
                    defaultCount
                    fontWeightBold
                "
                :class="[
                    defaultCount < 0 ? 'countError' : ''
                ]"
            >
                {{ defaultCount }}
            </span>

            <span class="dietLabel">
                Classique
            </span>
        </div>

        <!-- Confirmed diet counts -->
        <div
            v-for="(entry, index) in dietCounts"
            :key="index"
            class="
                dietCountRow
                flex alignCenter justifyBetween gap10
            "
        >
            <div>
                <span
                    class="
                        defaultCount
                        fontWeightBold
                    "
                >
                    {{ entry.count }}
                </span>

                <span class="dietLabel">
                    {{ entry.diets.map(k => specialDiets.find(d => d.key === k)?.text || k).join(', ') }}
                </span>
            </div>

            <Icon
                @click="removeDietCount(index)"
                class="pointer mlAuto"
                size="sm"
            >
                close
            </Icon>
        </div>

        <!-- Editing a new diet count -->
        <div
            v-if="editingDiet"
            class="
                dietCountRow editing
                flex column gap10
            "
        >
            <div class="flex alignCenter gap10">
                <input
                    v-model.number="editingDiet.count"
                    type="number"
                    min="1"
                    class="
                        inputCount
                        fontWeightBold
                    "
                />

                <div class="flex flexWrap gap6 flex1">
                    <button
                        v-for="diet in specialDiets"
                        :key="diet.key"
                        @click="toggleDiet(editingDiet, diet.key)"
                        class="dietPill"
                        :class="[
                            editingDiet.diets.includes(diet.key) ? 'active' : ''
                        ]"
                    >
                        {{ diet.text }}
                    </button>
                </div>
            </div>

            <div class="flex justifyEnd gap10">
                <Icon
                    @click="cancelDietCount"
                    class="pointer"
                    size="sm"
                >
                    close
                </Icon>

                <Icon
                    @click="confirmDietCount"
                    class="pointer"
                    :class="[
                        editingDiet.diets.length === 0 ? 'disabled' : ''
                    ]"
                    size="sm"
                >
                    check
                </Icon>
            </div>
        </div>

        <!-- Add diet button -->
        <button
            v-if="!editingDiet"
            @click="startAddDietCount"
            class="
                addDietButton
                flex alignCenter gap6
            "
        >
            <Icon size="sm">
                add
            </Icon>
            Ajouter un régime
        </button>
    </div>
</template>

<style scoped>
input.inputCount {
    width: 70px;
    color: var(--green);
    background-color: var(--beige);
    outline: none;
    border: none;
    -moz-appearance: textfield;
    appearance: textfield;
}

input.inputCount::-webkit-outer-spin-button,
input.inputCount::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.dietCountRow {
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid rgba(169, 169, 132, 0.2);
}

.dietCountRow.editing {
    border-color: var(--green);
    border-style: dashed;
}

.defaultCount {
    display: inline-block;
    width: 70px;
    text-align: center;
    font-size: 18px;
    color: var(--beige);
}

.countError {
    color: var(--color-error);
}

.dietLabel {
    font-size: 16px;
    color: var(--beige);
    opacity: 0.7;
}

.dietPill {
    padding: 4px 10px;
    border-radius: 20px;
    border: 1px solid rgba(169, 169, 132, 0.4);
    background: transparent;
    color: var(--beige);
    font-size: 13px;
    cursor: pointer;
    transition: all 200ms;
}

.dietPill.active {
    border-color: var(--green);
    background: var(--green);
    color: var(--beige);
}

.addDietButton {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px dashed rgba(169, 169, 132, 0.4);
    background: transparent;
    color: var(--beige);
    cursor: pointer;
    opacity: 0.7;
    transition: all 200ms;
}

.addDietButton:hover {
    opacity: 1;
    border-color: var(--green);
}

.disabled {
    opacity: 0.3;
    pointer-events: none;
}
</style>
