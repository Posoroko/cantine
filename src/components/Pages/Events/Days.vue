<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DayCard from '@/components/Cards/DayCard.vue'
import { loadEventDays } from '@/composables/currentEvent'

const route = useRoute()
const router = useRouter()

defineProps({
    days: {
        type: Array,
        required: true
    }
})

onMounted(() => loadEventDays(parseInt(route.params.eventId)))

function goToDay(dayId) {
    router.push(`/evenements/${route.params.eventId}/jours/${dayId}`)
}
</script>

<template>
    <div 
        class="
            daysContainer grow
            flex column justifyCenter pad10
        "
    >
        <div 
            v-if="days.length > 0" 
            class="daysList flex column gap10"
        >
            <DayCard
                v-for="day in days"
                :key="day.id"
                :day="day"
                class="pointer"
                @click="goToDay(day.id)"
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
