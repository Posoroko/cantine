<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import Icon from '@/components/Icon/Main.vue'
import { dbGet } from '@/composables/fetch'
import appConfig from '@/composables/appConfig'

const route = useRoute()
const router = useRouter()

const event = ref(null)

// c5t: resolve eventId from route — works on /evenements/:eventId and all nested routes
const eventId = computed(() => route.params.eventId ? parseInt(route.params.eventId) : null)

async function fetchEvent() {
    if (!eventId.value) return
    event.value = await dbGet({
        endpoint: `/items/events/${eventId.value}`,
        query: { fields: 'id,name,image' }
    })
}

onMounted(fetchEvent)
watch(eventId, fetchEvent)

const eventPath = computed(() => event.value ? `/evenements/${event.value.id}` : null)

const activeTab = computed(() => {
    if (!eventPath.value || !route.path.startsWith(eventPath.value)) return null
    return route.query.slide || null
})

function imageUrl(imageId) {
    if (!imageId) return null
    return `${appConfig.dbUrl}/assets/${imageId}?key=event-thumbnail`
}

function goToTab(tab) {
    router.push({ path: eventPath.value, query: { slide: tab } })
}
</script>

<template>
    <div
        v-if="event"
        class="
            eventBar
            flex justifyBetween
        "
    >
        <div
            class="
                flex alignCenter gap20
            "
        >
            
        </div>

        <div class="flex gap5">
            <button
                @click="goToTab('informations')"
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
                @click="goToTab('cooks')"
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
                @click="goToTab('days')"
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

            <button
                @click="goToTab('meals')"
                :class="{ active: activeTab === 'meals' }"
                class="
                    slideButton
                    flex alignCenter
                "
            >
                <Icon
                    :color="activeTab === 'meals' ? 'green' : 'beige'"
                >
                    restaurant
                </Icon>
            </button>

            <button
                @click="goToTab('shoppingList')"
                :class="{ active: activeTab === 'shoppingList' }"
                class="
                    slideButton
                    flex alignCenter
                "
            >
                <Icon
                    :color="activeTab === 'shoppingList' ? 'green' : 'beige'"
                >
                    shopping_cart
                </Icon>
            </button>

            <button
                @click="goToTab('gardeManger')"
                :class="{ active: activeTab === 'gardeManger' }"
                class="
                    slideButton
                    flex alignCenter
                "
            >
                <Icon
                    :color="activeTab === 'gardeManger' ? 'green' : 'beige'"
                >
                    kitchen
                </Icon>
            </button>

            <button
                @click="goToTab('notesAndTodos')"
                :class="{ active: activeTab === 'notesAndTodos' }"
                class="
                    slideButton
                    flex alignCenter
                "
            >
                <Icon
                    :color="activeTab === 'notesAndTodos' ? 'green' : 'beige'"
                >
                    checklist
                </Icon>
            </button>

            <div
                v-if="imageUrl(event.image)"
                class="eventImage"
            >
                <img
                    :src="imageUrl(event.image)"
                    :alt="event.name"
                />
            </div>
        </div>
    </div>
</template>

<style scoped>
.eventBar {
    border-bottom: 1px solid var(--beige);
    padding: 10px;
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

.slideButton {
    background-color: transparent;
    padding: 5px 8px;
    color: var(--beige);
    border-radius: 8px;
    transition: all 0.2s;
}

.slideButton.active {
    color: var(--green);
    background: var(--beige);
}
</style>
