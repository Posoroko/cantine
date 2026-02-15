<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Private from '@/Components/Architecture/Layouts/Private.vue'
import Icon from '@/components/Icon/Main.vue'
import Informations from '@/components/Pages/Events/Informations.vue'
import Cooks from '@/components/Pages/Events/Cooks.vue'
import Days from '@/components/Pages/Events/Days.vue'
import DayDetails from '@/components/Pages/Events/DayDetails.vue'
import { useEvents } from '@/composables/events'
import appConfig from '@/composables/appConfig'

const router = useRouter()
const route = useRoute()
const { getEventById } = useEvents()

const event = ref(null)
const isLoading = ref(false)

const activeTab = computed(() => route.query.slide || 'informations')

async function loadEvent() {
    isLoading.value = true
    try {
        console.log('Loading event:', route.params.eventId)
        const eventId = parseInt(route.params.eventId)
        const data = await getEventById(eventId)
        console.log('Event loaded, contacts count:', data?.contacts?.length || 0)
        event.value = data
    } catch (error) {
        console.error('Failed to load event:', error)
        router.push('/evenements')
    } finally {
        isLoading.value = false
    }
}

function getImageUrl(imageId) {
    if (!imageId) return null
    return `${appConfig.dbUrl}/assets/${imageId}`
}

function switchTab(tab) {
    router.push({ query: { slide: tab } })
}

function onContactCreated() {
    console.log('Contact created event received, reloading event')
    loadEvent()
}

onMounted(() => {
    loadEvent()
})
</script>

<template>
    <Private>
        <template #topBarLinks>
            
        </template>

        <template #main>
            <div 
                class="
                    scrollBox
                    h100 
                    flex column
                "
            >
                <div v-if="isLoading" class="loadingText">
                    Chargement...
                </div>

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
                    <div
                        class="flex justifyBetween"
                    >
                        <div 
                            class="
                                header
                                flex alignCenter gap20
                            "
                        >
                            <div 
                                v-if="getImageUrl(event.image)" 
                                class="eventImage"
                            >
                                <img :src="getImageUrl(event.image)" :alt="event.name" />
                            </div>
                            <h1 
                                class="eventTitle"
                            >
                                {{ event.name }}
                            </h1>
                        </div>

                        <div
                            class="
                                flex
                            "
                        >
                            <button
                                @click="switchTab('informations')"
                                :class="{ active: activeTab === 'informations' }"
                                class="
                                    slideButton
                                    flex alignCenter
                                "
                            >
                                <Icon
                                    :color="activeTab === 'informations' ? 'green' : 'beige'"
                                >
                                    info
                                </Icon>
                            </button>

                            <button
                                @click="switchTab('cooks')"
                                :class="{ active: activeTab === 'cooks' }"
                                class="
                                    slideButton
                                    flex alignCenter
                                "
                            >
                                <Icon
                                    :color="activeTab === 'cooks' ? 'green' : 'beige'"
                                >
                                    group
                                </Icon>
                            </button>

                            <button
                                @click="switchTab('days')"
                                :class="{ active: activeTab === 'days' }"
                                class="
                                    slideButton
                                    flex alignCenter
                                "
                            >
                                <Icon
                                    :color="activeTab === 'days' ? 'green' : 'beige'"
                                >
                                    calendar_month
                                </Icon>
                            </button>
                        </div>
                    </div>

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

                    <DayDetails
                        v-if="activeTab === 'dayDetails'"
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
    padding: 5px;
}
.loadingText,
.errorText {
    text-align: center;
    color: var(--beige);
    padding: 40px;
    font-size: 16px;
}

.eventContent {
    max-width: 800px;
    margin: 0 auto;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.eventTitle {
    font-size: 22px;
}

.eventImage {
    width: 32px;
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid var(--beige);
}

.eventImage img {
    object-fit: cover;
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

.slideButton {
    background-color: transparent;
    color: var(--beige);
    border-radius: 8px;
    transition: all 0.2s;
}

.slideButton.active {
    color: var(--green);
    background: var(--beige);
}
</style>
