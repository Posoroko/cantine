<script setup lang="ts">
import { ref } from 'vue'
import type { Item_DietCount } from '@/types/directusDataModel'
import type { DietCountEntry } from '@/components/Form/DietCountEditor.vue'

import Title from '@/components/Architecture/Overlay/Modal/Title.vue'
import DietCountEditor from '@/components/Form/DietCountEditor.vue'
import { dbPatch } from '@/composables/fetch'
import { loadCurrentEvent, currentEventStore } from '@/composables/currentEvent'
import { useModal } from '@/composables/modal'

const emit = defineEmits(['confirm', 'cancel'])

const { modalState } = useModal()

const serviceId = modalState.value.data?.serviceId as number
const existingGuestCount = Number(modalState.value.data?.guestCount) || 0
const existingDietCounts = (modalState.value.data?.dietCounts || []) as Item_DietCount[]

const guestCount = ref<number | null>(existingGuestCount || null)
const dietCounts = ref<DietCountEntry[]>([])
const dietCountEditor = ref<InstanceType<typeof DietCountEditor> | null>(null)
const isDietValid = ref(false)

async function submit() {
    if (!guestCount.value || !isDietValid.value) return

    const allDietCounts: { count: number; diets: { diet: string }[] }[] = []

    const defaultCount = dietCountEditor.value?.defaultCount ?? 0
    if (defaultCount > 0) {
        allDietCounts.push({
            count: defaultCount,
            diets: [{ diet: 'default' }]
        })
    }

    for (const dc of dietCounts.value) {
        if (dc.count > 0 && dc.diets.length > 0) {
            allDietCounts.push({
                count: dc.count,
                diets: dc.diets.map(key => ({ diet: key }))
            })
        }
    }

    await dbPatch({
        endpoint: `/items/services/${serviceId}`,
        body: {
            guestCount: String(guestCount.value),
            dietCounts: allDietCounts
        }
    })

    if (currentEventStore.value) {
        await loadCurrentEvent(currentEventStore.value.id)
    }

    emit('confirm')
}
</script>

<template>
    <div
        class="
            full
            flex column gap20
        "
    >
        <Title>
            Modifier les couverts
        </Title>

        <!-- Guest count -->
        <label
            class="
                flex alignCenter gap10
            "
        >
            <span>Nombre de couverts :</span>
            <input
                v-model.number="guestCount"
                type="number"
                min="1"
                placeholder="Ex: 50"
                class="
                    inputCount
                    fontWeightBold
                "
            />
        </label>

        <!-- Diet counts -->
        <DietCountEditor
            ref="dietCountEditor"
            mode="update"
            :guestCount="guestCount"
            :existingDietCounts="existingDietCounts"
            @update:dietCounts="dietCounts = $event"
            @update:valid="isDietValid = $event"
        />

        <!-- Submit -->
        <button
            @click="submit"
            :disabled="!guestCount || !isDietValid"
            class="
                submitButton
                fontWeightBold
            "
        >
            Enregistrer
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

.submitButton {
    padding: 14px 20px;
    border-radius: 8px;
    border: none;
    background: var(--green);
    color: var(--beige);
    font-size: 18px;
    cursor: pointer;
    transition: all 200ms;
}

.submitButton:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.submitButton:not(:disabled):hover {
    filter: brightness(1.1);
}
</style>
