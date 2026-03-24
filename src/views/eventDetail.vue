<script setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import Private from '@/components/Architecture/Layouts/Private.vue'
import Loading from '@/components/Loading/Main.vue'
import EventBar from '@/components/Architecture/Bars/EventBar.vue'
import Informations from '@/components/Pages/Events/Informations.vue'
import Cooks from '@/components/Pages/Events/Cooks.vue'
import Days from '@/components/Pages/Events/Days.vue'
import Meals from '@/components/Pages/Events/Meals.vue'
import DayDetails from '@/components/Pages/Events/DayDetails.vue'
import ServiceDetails from '@/components/Pages/Events/ServiceDetails.vue'
import PlanningDetails from '@/components/Pages/Events/PlanningDetails.vue'
import { currentEventStore, loadCurrentEvent } from '@/composables/currentEvent'

const route = useRoute()

const activeTab = computed(() => route.query.slide || 'informations')
const event = computed(() => currentEventStore.value)

onMounted(() => {
    if (!event.value) {
        const eventId = parseInt(route.params.eventId)
        loadCurrentEvent(eventId)
    }
})

function onContactCreated() {
    const eventId = parseInt(route.params.eventId)
    loadCurrentEvent(eventId)
}
</script>

<template>
    <Private>
        <template #topBar>
            <EventBar />
        </template>

        <template #main>
            <div 
                class="
                    scrollBox
                    h100 
                    flex column
                "
            >
                <Loading v-if="!event">
                    Chargement...
                </Loading>

                <div 
                    v-else-if="!event" 
                    class="
                        errorText
                    "
                >
                    Événement non trouvé
                </div>

                <div 
                    v-else 
                    class="
                        eventContent
                        flex column w100
                    "
                >
                    <!-- Content Area -->
                    <Informations 
                        v-if="activeTab === 'informations'" 
                        :event="event"
                        @contact-created="onContactCreated"
                    />

                    <Cooks
                        v-if="activeTab === 'cooks'"
                        :eventId="event.id"
                    />

                    <Days
                        v-if="activeTab === 'days'"
                        :eventId="event.id"
                    />

                    <Meals
                        v-if="activeTab === 'meals'"
                        :eventId="event.id"
                    />

                    <DayDetails
                        v-if="activeTab === 'dayDetails'"
                    />

                    <ServiceDetails
                        v-if="activeTab === 'serviceDetails'"
                    />

                    <PlanningDetails
                        v-if="activeTab === 'planningDetails'"
                    />
                </div>
            </div>
        </template>
    </Private>
</template>

<style scoped>
.scrollBox {
    overflow-x: hidden;
    overflow-y: scroll;
}

.loadingText,
.errorText {
    text-align: center;
    color: var(--beige);
    padding: 40px;
    font-size: 16px;
}

.eventContent {
    display: flex;
    flex-direction: column;
}

.contentArea {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.bottomBar {
    padding: 20px;
    border-top: 1px solid var(--beige);
    margin-top: auto;
}
</style>
