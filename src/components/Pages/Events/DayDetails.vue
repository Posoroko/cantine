<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { currentEventStore } from '@/composables/currentEvent'
import Icon from '@/components/Icon/Main.vue'
import Loading from '@/components/Loading/Main.vue'
import DayCard from '@/components/Cards/DayCard.vue'
import DayServices from '@/components/Pages/Events/DayServices.vue'
import DayPlannings from '@/components/Pages/Events/DayPlannings.vue'
import Date from '@/components/Text/Date.vue'

const route = useRoute()

const day = computed(() => {
    const dayId = parseInt(route.query.day)
    if (!currentEventStore.value || !dayId) return null
    return currentEventStore.value.days.find(d => d.id === dayId) || null
})

const openMenuId = ref(null)
const activeSchedule = ref('services')

const toggleSchedule = (schedule) => {
    activeSchedule.value = schedule
}

const toggleMenu = (dayId) => {
    openMenuId.value = openMenuId.value === dayId ? null : dayId
}

const closeMenu = () => {
    openMenuId.value = null
}
const previousPage = computed(() => {
    return route.query.previousPage || route.path
})
</script>
<template>
    <div class="dayDetailsContainer">
        <Loading v-if="!day">
            Chargement...
        </Loading>

        <div 
            v-if="day" 
            class="
                dayDetailsContent
                flex column
            "
        >
            <router-link
                :to="previousPage"
                class="pad10"
            >
                <Icon
                    size="xl"
                >
                    arrow_back
                </Icon>
            </router-link>

            <DayCard
                :day="day"
                :isMenuOpen="openMenuId === day.id"
                @toggle-menu="toggleMenu"
                @close-menu="closeMenu"
                class="grow"
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
                        dinner_dining
                    </Icon>

                    <span>Services</span>
                </button>

                <button 
                    @click="toggleSchedule('prep')"
                    :class="{ active: activeSchedule === 'prep' }"
                    class="
                        actionButton
                        flex alignCenter justifyCenter gap10
                        marTop20
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
                class="marTop20"
            />

            <DayPlannings
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
    border-radius: 0px;
    flex: 1 1 0;
    border-bottom: 6px solid transparent;
    transition: all 200ms;
}

.actionButton.active {
    border-bottom: 6px solid var(--beige);
}

</style>
