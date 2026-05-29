<script setup>
import { computed } from 'vue'
import { currentEventStore } from '@/composables/currentEvent'
import { useModal } from '@/composables/modal'
import ListItem from '@/components/Cards/ListItem.vue'

const { showModal } = useModal()

const props = defineProps({
    day: {
        type: Object,
        required: true
    }
})

const plannings = computed(() => {
    if (!currentEventStore.value) return []
    const day = currentEventStore.value.days.find(d => d.id === props.day.id)
    return day?.plannings || []
})

const existingSlotKeys = computed(() =>
    plannings.value.map(p => typeof p.slot === 'object' && p.slot ? p.slot.key : p.slot).filter(Boolean)
)

function openNewPlanning() {
    showModal(NewPlanning, {
        dayId: props.day.id,
        existingSlotKeys: existingSlotKeys.value
    })
}
</script>

<template>
    <div class="prepContainer">
        <div class="flex column gap10">
            <ListItem
                v-for="planning in plannings"
                :key="planning.id"
            >
                <template #icon>
                    {{ planning.slot?.icon || 'event_note' }}
                </template>

                <template #text>
                    {{ planning.slot?.text || 'Planification' }}
                </template>
            </ListItem>

            <ListItem
                @click="openNewPlanning"
                layout="createButton"
            >
                <template #icon>
                    add
                </template>

                <template #text>
                    prep list
                </template>
            </ListItem>
        </div>
    </div>
</template>