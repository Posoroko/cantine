<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Item_ServiceSlot } from '@/types/directusDataModel'
import type { DietCountEntry } from '@/components/Form/DietCountEditor.vue'

import Title from '@/components/Architecture/Overlay/Modal/Title.vue'
import Icon from '@/components/Icon/Main.vue'
import DietCountEditor from '@/components/Form/DietCountEditor.vue'
import { appAssetStore } from '@/composables/appAssets'
import { dbPost } from '@/composables/fetch'
import { loadCurrentEvent, currentEventStore } from '@/composables/currentEvent'
import { useModal } from '@/composables/modal'

const emit = defineEmits(['confirm', 'cancel'])

const { modalState } = useModal()

const serviceSlots = appAssetStore.value.serviceSlots || []
const existingSlotKeys: string[] = modalState.value.data?.existingSlotKeys || []
const availableSlots = serviceSlots.filter(s => !existingSlotKeys.includes(s.key))

// -- Multi-step state
const step = ref<1 | 2>(1)
const selectedSlot = ref<Item_ServiceSlot | null>(null)
const guestCount = ref<number | null>(null)
const dietCounts = ref<DietCountEntry[]>([])
const dietCountEditor = ref<InstanceType<typeof DietCountEditor> | null>(null)
const isDietValid = ref(false)

const isValid = computed(() => {
    if (!guestCount.value || guestCount.value <= 0) return false
    return isDietValid.value
})

// -- Step 1
function selectSlot(slot: Item_ServiceSlot) {
    selectedSlot.value = slot
    step.value = 2
}

function goBack() {
    step.value = 1
}

// -- Submit
async function submit() {
    if (!selectedSlot.value || !guestCount.value || !isValid.value) return

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

    const newService = await dbPost({
        endpoint: '/items/services',
        body: {
            day: modalState.value.data?.dayId,
            slot: selectedSlot.value.key,
            guestCount: String(guestCount.value),
            dietCounts: allDietCounts
        }
    })

    if (currentEventStore.value) {
        loadCurrentEvent(currentEventStore.value.id)
    }

    emit('confirm', newService)
}
</script>

<template>
    <div
        class="
            full
            flex column gap20
        "
    >
        <!-- ======================== Step 1: Select slot -->
        <template v-if="step === 1">
            <Title>
                Ajouter un service
            </Title>

            <div
                class="
                    flex column gap10
                "
            >
                <button
                    v-for="slot in availableSlots"
                    :key="slot.key"
                    @click="selectSlot(slot)"
                    class="
                        slotButton
                        flex alignCenter gap20
                    "
                >
                    <Icon size="xl">
                        {{ slot.icon }}
                    </Icon>

                    <span class="slotLabel">
                        {{ slot.text }}
                    </span>
                </button>
            </div>
        </template>

        <!-- ======================== Step 2: Guest count + diets -->
        <template v-if="step === 2">
            <div class="flex alignCenter gap10">
                <Icon
                    @click="goBack"
                    class="pointer"
                    size="lg"
                >
                    arrow_back
                </Icon>

                <Title>
                    {{ selectedSlot?.text }}
                </Title>
            </div>

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
                mode="create"
                :guestCount="guestCount"
                @update:dietCounts="dietCounts = $event"
                @update:valid="isDietValid = $event"
            />

            <!-- Submit -->
            <button
                @click="submit"
                :disabled="!isValid"
                class="
                    submitButton
                    fontWeightBold
                "
            >
                Créer le service
            </button>
        </template>
    </div>
</template>

<style scoped>
.slotButton {
    padding: 16px 20px;
    border-radius: 8px;
    border: 1px solid rgba(169, 169, 132, 0.3);
    background: transparent;
    color: var(--beige);
    cursor: pointer;
    transition: all 200ms;
}

.slotButton:hover {
    border-color: var(--green);
    background: rgba(13, 139, 95, 0.15);
}

.slotLabel {
    font-size: 20px;
    font-weight: 700;
}

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
