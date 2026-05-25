<script setup>
import { ref, computed, onMounted } from 'vue'
import DayCard from '@/components/Cards/DayCard.vue'
import { useEvents } from '@/composables/events'

const props = defineProps({
    eventId: {
        type: Number,
        required: true
    }
})

const { getEventById } = useEvents()

const event = ref(null)
const isLoading = ref(false)
const days = computed(() => event.value?.days || [])

const loadEvent = async () => {
    isLoading.value = true
    try {
        const data = await getEventById(props.eventId)
        event.value = data
    } catch (error) {
        console.error('Error loading event:', error)
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    loadEvent()
})
</script>

<template>
    <div 
        class="
            daysContainer grow
            flex column justifyCenter pad10
        "
    >
        <div v-if="isLoading" class="loadingText">
            Chargement...
        </div>

        <div 
            v-else-if="days.length > 0" 
            class="daysList flex column gap10"
        >
            <DayCard
                v-for="day in days"
                :key="day.id"
                :day="day"
            />
        </div>

        <p v-else class="noData">
            Aucun jour pour cet événement
        </p>
    </div>
</template>

<style scoped>

.loadingText,
.noData {
    text-align: center;
    color: var(--beige);
    padding: 40px;
}

</style>
