<script setup>
import { ref, onMounted, computed } from 'vue'
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
const openMenuId = ref(null)

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

const toggleMenu = (dayId) => {
    openMenuId.value = openMenuId.value === dayId ? null : dayId
}

const closeMenu = () => {
    openMenuId.value = null
}

onMounted(() => {
    loadEvent()
    document.addEventListener('click', closeMenu)
})
</script>

<template>
    <div class="daysContainer">
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
                :isMenuOpen="openMenuId === day.id"
                @toggle-menu="toggleMenu"
                @close-menu="closeMenu"
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
