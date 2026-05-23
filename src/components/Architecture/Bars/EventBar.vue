<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import Icon from '@/components/Icon/Main.vue'
import { currentEventStore } from '@/composables/currentEvent'
import appConfig from '@/composables/appConfig'

const route = useRoute()
const router = useRouter()

const event = computed(() => currentEventStore.value)

const eventPath = computed(() => {
    if (!event.value) return null
    return `/evenements/${event.value.id}`
})

const activeTab = computed(() => {
    if (route.path !== eventPath.value) return null
    return route.query.slide || 'informations'
})

function imageUrl(imageId) {
    if (!imageId) return null
    return `${appConfig.dbUrl}/assets/${imageId}`
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
            <div
                v-if="imageUrl(event.image)"
                class="eventImage"
            >
                <img
                    :src="imageUrl(event.image)"
                    :alt="event.name"
                />
            </div>
            <h2 class="eventTitle">
                {{ event.name }}
            </h2>
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
