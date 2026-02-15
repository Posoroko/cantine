<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { dbGet } from '@/composables/fetch'
import Icon from '@/components/Icon/Main.vue'
import DayCard from '@/components/Cards/DayCard.vue'
import DayServices from '@/components/Pages/Events/DayServices.vue'
import DayPrep from '@/components/Pages/Events/DayPrep.vue'

const route = useRoute()

const day = ref(null)
const isLoading = ref(true)
const openMenuId = ref(null)
const activeSchedule = ref('services')

const loadDay = async () => {
    try {
        isLoading.value = true
        const dayId = route.query.day
        
        if (!dayId) {
            console.error('No day ID in query params')
            return
        }

        const response = await dbGet({
            endpoint: `/items/days/${dayId}`
        })

        console.log('getting the day:', response)
        
        day.value = response
    } catch (error) {
        console.error('Error loading day:', error)
    } finally {
        isLoading.value = false
    }
}

const toggleSchedule = (schedule) => {
    activeSchedule.value = schedule
}

const formatDate = (dateString) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }).format(date)
}

const toggleMenu = (dayId) => {
    openMenuId.value = openMenuId.value === dayId ? null : dayId
}

const closeMenu = () => {
    openMenuId.value = null
}

onMounted(() => {
    loadDay()
})
</script>

<template>
    <div
        class="dayDetailsContainer"
    >
        <div 
            v-if="isLoading" 
            class="loadingText"
        >
            Chargement...
        </div>

        <div 
            v-else-if="day" 
            class="
                dayDetailsContent
                flex column gap20
            "
        >
            <DayCard
                :day="day"
                :isMenuOpen="openMenuId === day.id"
                @toggle-menu="toggleMenu"
                @close-menu="closeMenu"
            />

            <div class="actionsContainer flex gap10">
                <button 
                    @click="toggleSchedule('services')"
                    :class="{ active: activeSchedule === 'services' }"
                    class="
                        actionButton 
                        flex alignCenter justifyCenter gap10
                    "
                >
                    <Icon>
                        restaurant
                    </Icon>

                    <span>Services</span>
                </button>

                <button 
                    @click="toggleSchedule('prep')"
                    :class="{ active: activeSchedule === 'prep' }"
                    class="
                        actionButton
                        flex alignCenter justifyCenter gap10
                    "
                >
                    <Icon>
                        schedule
                    </Icon>
                    <span>Prep</span>
                </button>
            </div>

            <DayServices
                v-if="activeSchedule === 'services'"
                :day="day"
            />

            <DayPrep
                v-if="activeSchedule === 'prep'"
                :day="day"
            />
        </div>

        <p v-else class="noData">
            Erreur lors du chargement du jour
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

.actionsContainer {
    flex-wrap: wrap;
}

.actionButton {
    color: var(--beige);
    font-size: 24px;
    font-weight: 700;
    padding: 8px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    flex: 1 1 0;
    border: 1px solid transparent;
    transition: all 200ms;
}

.actionButton:hover {
    background: rgba(13, 139, 95, 0.2);
}

.actionButton.active {
    background: rgba(13, 139, 95, 0.4);
    border-color: var(--green);
}

</style>
