<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { currentEventStore } from '@/composables/currentEvent'
import { useModal } from '@/composables/modal'
import NewPlanning from '@/components/Architecture/Overlay/Modal/NewPlanning.vue'
import ListItem from '@/components/Cards/ListItem.vue'
import Icon from '@/components/Icon/Main.vue'

const route = useRoute()
const router = useRouter()
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

function handlePlanningClick(planning) {
    router.push({
        query: {
            ...route.query,
            slide: 'planningDetails',
            planning: planning.id,
            previousPage: route.fullPath
        }
    })
}

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
                @click="handlePlanningClick(planning)"
                class="pointer"
            >
                <template #icon>
                    <Icon>
                        {{ planning.slot?.icon || 'event_note' }}
                    </Icon>
                </template>

                <template #text>
                    {{ planning.slot?.text || 'Planification' }}
                </template>
            </ListItem>

            <ListItem
                @click="openNewPlanning"
                class="pointer"
            >
                <template #icon>
                    <Icon>
                        add
                    </Icon>
                </template>

                <template #text>
                    planning
                </template>
            </ListItem>
        </div>
    </div>
</template>

<style scoped>

.prepContainer {
    padding: 20px 0;
    color: var(--beige);
    text-align: center;
}

</style>