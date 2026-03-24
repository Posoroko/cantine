<script setup lang="ts">
import type { Item_PlanningSlot } from '@/types/directusDataModel'

import Title from '@/components/Architecture/Overlay/Modal/Title.vue'
import ListItem from '@/components/Cards/ListItem.vue'
import Icon from '@/components/Icon/Main.vue'
import { appAssetStore } from '@/composables/appAssets'
import { dbPost } from '@/composables/fetch'
import { loadCurrentEvent, currentEventStore } from '@/composables/currentEvent'
import { useModal } from '@/composables/modal'

const emit = defineEmits(['confirm', 'cancel'])

const { modalState } = useModal()

const planningSlots = appAssetStore.value.planningSlots || []
const existingSlotKeys: string[] = modalState.value.data?.existingSlotKeys || []
const availableSlots = planningSlots.filter(s => !existingSlotKeys.includes(s.key))

const movedMissions = modalState.value.data?.movedMissions || []

async function selectSlot(slot: Item_PlanningSlot) {
    const body: Record<string, any> = {
        day: modalState.value.data?.dayId,
        slot: slot.key
    }

    if (movedMissions.length) {
        body.missions = movedMissions
    }

    const newPlanning = await dbPost({
        endpoint: '/items/plannings',
        body
    })

    if (currentEventStore.value) {
        await loadCurrentEvent(currentEventStore.value.id)
    }

    emit('confirm', { planning: newPlanning, slot })
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
            Ajouter une planification
        </Title>

        <div
            class="
                flex column gap10
            "
        >
            <ListItem
                v-for="slot in availableSlots"
                :key="slot.key"
                @click="selectSlot(slot)"
                class="pointer"
            >
                <template #icon>
                    <!-- <Icon size="xl">
                        {{ slot.icon }}
                    </Icon> -->
                </template>

                <template #text>
                    {{ slot.text }}
                </template>
            </ListItem>

            <p
                v-if="availableSlots.length === 0"
                class="noSlots"
            >
                Tous les créneaux sont déjà utilisés.
            </p>
        </div>
    </div>
</template>

<style scoped>

.noSlots {
    color: var(--beige);
    opacity: 0.6;
    text-align: center;
    padding: 20px;
}
</style>
