<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TitleWIthCreateButton from '@/components/Text/TitleWithCreateButton.vue'
import Private from '@/components/Architecture/Layouts/Private.vue'
import NewEvent from '@/components/Architecture/Overlay/Modal/NewEvent.vue'
import Icon from '@/components/Icon/Main.vue'
import { useModal } from '@/composables/modal'
import { useEvents } from '@/composables/events'
import { loadCurrentEvent } from '@/composables/currentEvent'
import appConfig from '@/composables/appConfig'
import DateParser from '@/components/Text/Date.vue'

const router = useRouter()
const { showModal } = useModal()
const { getEvents } = useEvents()

const events = ref([])
const isLoading = ref(false)

async function loadEvents() {
    isLoading.value = true
    try {
        const data = await getEvents()
        events.value = data || []
    } catch (error) {
        console.error('Failed to load events:', error)
        events.value = []
    } finally {
        isLoading.value = false
    }
}

async function openNewEventModal() {
    try {
        const result = await showModal(NewEvent)
        console.log('Event created:', result)
        // Reload events list
        await loadEvents()
    } catch (error) {
        console.log('Modal cancelled')
    }
}

function getImageUrl(imageId) {
    if (!imageId) return null
    return `${appConfig.dbUrl}/assets/${imageId}`
}

function getDateRange(days) {
    if (!days || days.length === 0) return ''
    const sortedDays = [...days].sort((a, b) => new Date(a.date) - new Date(b.date))
    const firstDate = new Date(sortedDays[0].date)
    const lastDate = new Date(sortedDays[sortedDays.length - 1].date)
    
    const formatDate = (date) => {
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        return `${day}/${month}`
    }
    
    return `${formatDate(firstDate)} - ${formatDate(lastDate)}`
}

function goToEvent(eventId) {
    loadCurrentEvent(eventId)
    router.push(`/evenements/${eventId}?slide=days`)
}

onMounted(() => {
    loadEvents()
})
</script>

<template>
    <Private>
        <template #title>
            <TitleWIthCreateButton
                @createNew="openNewEventModal"
            >
                Événements
            </TitleWIthCreateButton>
        </template>

        <template #main>
            <div class="eventsList flex column gap20">
                <div v-if="isLoading" class="loadingText">
                    Chargement...
                </div>

                <div v-else-if="events.length === 0" class="emptyText">
                    Aucun événement créé
                </div>

                <div v-else class="cardsGrid">
                    <div
                        v-for="event in events"
                        :key="event.id"
                        @click="goToEvent(event.id)"
                        class="eventCard"
                    >
                        <!-- Image -->
                        <div class="cardImage">
                            <img 
                                v-if="getImageUrl(event.image)"
                                :src="getImageUrl(event.image)"
                                :alt="event.name"
                            />
                            <div v-else class="noImage">
                                <Icon class="noImageIcon">photo_camera</Icon>
                            </div>
                        </div>

                        <!-- Content -->
                        <div class="cardContent flex column gap10">
                            <h3 
                                class="
                                    cardTitle
                                    flex justifyBetween
                                "
                            >
                                <span>
                                    {{ event.name }}
                                </span>
                                
                                <span
                                    v-if="event?.days?.[0]?.date"
                                >
                                    <DateParser :timestamp="event.days[0].date" format="year"/>
                                </span>
                            </h3>

                            <div class="flex alignCenter gap5">
                                <Icon class="smallIcon">location_on</Icon>
                                <p class="cardLocation">
                                    {{ event.description }}
                                </p>
                            </div>

                            <div class="cardMeta flex gap20">
                                <div class="metaItem flex alignCenter gap5">
                                    <Icon class="smallIcon">calendar_today</Icon>
                                    <span>{{ getDateRange(event.days) }}</span>
                                </div>
                                <span class="metaItem">
                                    {{ event.days?.length || 0 }} jour(s)
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </Private>
</template>

<style scoped>
.eventsList {
    width: 100%;
    padding: 20px;
}

.loadingText,
.emptyText {
    text-align: center;
    color: var(--beige);
    padding: 40px;
    font-size: 16px;
}

.cardsGrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
}

.eventCard {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--beige);
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s ease;
}

.eventCard:hover {
    background: rgba(0, 0, 0, 0.5);
    border-color: var(--gold);
}

.cardImage {
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.5);
}

.cardImage img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.noImage {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
}

.cardContent {
    padding: 16px;
}

.cardTitle {
    margin: 0;
    color: var(--gold);
    font-size: 18px;
    font-weight: bold;
}

.cardLocation {
    margin: 0;
    color: var(--beige);
    font-size: 14px;
}

.cardMeta {
    font-size: 12px;
    color: rgba(169, 169, 132, 0.8);
}

.metaItem {
    white-space: nowrap;
}

.noImageIcon {
    font-size: 48px;
    opacity: 0.6;
}

.smallIcon {
    font-size: 16px;
    flex-shrink: 0;
}

.cardLocation {
    margin: 0;
}
</style>