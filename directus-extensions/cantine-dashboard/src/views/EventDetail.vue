<template>
    <private-view :title="event?.name || 'Événement'">
        <template #headline>
            <span class="headlineLink" @click="router.push('/cantine-dashboard/events')">Événements</span>
        </template>

        <template #title-outer:prepend>
            <v-button class="backBtn" secondary icon rounded @click="router.push('/cantine-dashboard/events')">
                <v-icon name="arrow_back" />
            </v-button>
        </template>

        <template #actions>
            <v-button @click="router.push(`/cantine-dashboard/events/${eventId}/shopping-list`)">
                <v-icon name="shopping_cart" left />
                Liste de courses
            </v-button>
        </template>

        <div class="viewContent">
            <div v-if="loading" class="loadingState">
                <v-progress-circular indeterminate />
            </div>

            <template v-else-if="event">
                <!-- Event meta -->
                <div class="metaRow">
                    <div v-if="event.client" class="metaItem">
                        <span class="label">Client</span>
                        <span class="value">{{ event.client }}</span>
                    </div>
                    <div v-if="event.location" class="metaItem">
                        <span class="label">Lieu</span>
                        <span class="value">{{ event.location }}</span>
                    </div>
                    <div class="metaItem">
                        <span class="label">Dates</span>
                        <span class="value">{{ formatDateRange(event.startDate, event.endDate) }}</span>
                    </div>
                    <div v-if="event.guestCount" class="metaItem">
                        <span class="label">Convives (estimé)</span>
                        <span class="value">{{ event.guestCount }}</span>
                    </div>
                </div>

                <p v-if="event.notes" class="eventNotes">{{ event.notes }}</p>

                <!-- Days -->
                <div class="daysList">
                    <div v-for="day in sortedDays" :key="day.id" class="dayBlock">
                        <div class="dayHeader">
                            <v-icon name="today" />
                            <span class="dayDate">{{ formatDate(day.date) }}</span>
                            <span v-if="day.guestCount" class="dayGuests">{{ day.guestCount }} convives</span>
                        </div>

                        <div v-if="day.menu" class="servicesList">
                            <template v-for="slot in SERVICE_SLOTS" :key="slot.key">
                                <div
                                    v-if="day.menu[slot.key]"
                                    class="serviceBlock"
                                >
                                    <div class="serviceHeader">
                                        <span class="serviceLabel">{{ slot.label }}</span>
                                        <span v-if="day.menu[slot.key].time" class="serviceTime">
                                            {{ day.menu[slot.key].time?.slice(0, 5) }}
                                        </span>
                                        <span v-if="day.menu[slot.key].guestCount" class="serviceGuests">
                                            {{ day.menu[slot.key].guestCount }} pers.
                                        </span>
                                        <span v-if="day.menu[slot.key].guestType" class="serviceType">
                                            {{ day.menu[slot.key].guestType }}
                                        </span>
                                    </div>

                                    <div class="mealsList">
                                        <div
                                            v-for="meal in day.menu[slot.key].meals"
                                            :key="meal.id"
                                            class="mealRow"
                                            @click="router.push(`/cantine-dashboard/events/${eventId}/meals/${meal.id}`)"
                                        >
                                            <v-icon name="restaurant_menu" small />
                                            <span class="mealName">{{ meal.recipe?.name || '—' }}</span>
                                            <span class="mealCategory">{{ meal.recipe?.category }}</span>
                                            <span class="mealGuests">
                                                <v-icon name="group" small />
                                                {{ meal.guestCount }}
                                            </span>
                                            <v-icon name="chevron_right" small class="mealArrow" />
                                        </div>

                                        <div v-if="!day.menu[slot.key].meals?.length" class="emptyService">
                                            Aucun plat configuré
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </div>

                        <div v-else class="noMenu">
                            Aucun menu configuré pour cette journée
                        </div>
                    </div>

                    <div v-if="!sortedDays.length" class="emptyDays">
                        <v-notice type="info">Aucun jour configuré pour cet événement.</v-notice>
                    </div>
                </div>
            </template>
        </div>
    </private-view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useApi } from '@directus/extensions-sdk'

const router = useRouter()
const route = useRoute()
const api = useApi()

const eventId = route.params.eventId as string
const loading = ref(true)
const event = ref<any>(null)

const SERVICE_SLOTS = [
    { key: 'breakfast', label: 'Petit-déjeuner' },
    { key: 'amSnack', label: 'Collation 10h' },
    { key: 'lunch', label: 'Déjeuner' },
    { key: 'pmSnack', label: 'Goûter' },
    { key: 'supper', label: 'Souper' },
    { key: 'nightSnack', label: 'Collation de nuit' },
]

const SLOT_KEYS = SERVICE_SLOTS.map(s => s.key)

const mealFields = [
    'id', 'guestCount', 'notes',
    'recipe.id', 'recipe.name', 'recipe.category',
]

function serviceFields(slot: string) {
    return [
        `days.menu.${slot}.id`,
        `days.menu.${slot}.name`,
        `days.menu.${slot}.time`,
        `days.menu.${slot}.guestCount`,
        `days.menu.${slot}.guestType`,
        `days.menu.${slot}.notes`,
        ...mealFields.map(f => `days.menu.${slot}.meals.${f}`),
    ]
}

const sortedDays = computed(() => {
    if (!event.value?.days) return []
    return [...event.value.days].sort((a: any, b: any) => a.date.localeCompare(b.date))
})

onMounted(async () => {
    const res = await api.get(`/items/events/${eventId}`, {
        params: {
            fields: [
                'id', 'name', 'client', 'location', 'startDate', 'endDate', 'guestCount', 'status', 'notes',
                'days.id', 'days.date', 'days.guestCount', 'days.notes',
                ...SLOT_KEYS.flatMap(serviceFields),
            ],
        },
    })
    event.value = res.data.data
    loading.value = false
})

function formatDate(date: string) {
    return new Date(date).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long',
    })
}

function formatDateRange(start: string, end: string) {
    if (!start) return '—'
    const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    if (!end || end === start) return fmt(start)
    return `${fmt(start)} → ${fmt(end)}`
}
</script>

<style scoped>
@import '../styles/shared.css';

.backBtn {
    margin-right: 8px;
}

.headlineLink {
    cursor: pointer;
    color: var(--foreground-subdued);
}

.headlineLink:hover {
    color: var(--primary);
}

.loadingState {
    display: flex;
    justify-content: center;
    padding: 60px;
}

.eventNotes {
    margin: 8px 0 0;
    color: var(--foreground-subdued);
    font-style: italic;
}

/* Days */
.daysList {
    margin-top: 32px;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.dayBlock {
    border: 1px solid var(--border-normal);
    border-radius: 10px;
    overflow: hidden;
}

.dayHeader {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 20px;
    background: var(--background-subdued);
    border-bottom: 1px solid var(--border-normal);
}

.dayDate {
    font-weight: 700;
    font-size: 15px;
    color: var(--foreground-normal);
    text-transform: capitalize;
    flex: 1;
}

.dayGuests {
    font-size: 13px;
    color: var(--foreground-subdued);
}

/* Services */
.servicesList {
    display: flex;
    flex-direction: column;
}

.serviceBlock {
    border-bottom: 1px solid var(--border-subdued);
}

.serviceBlock:last-child {
    border-bottom: none;
}

.serviceHeader {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 20px 8px;
    background: var(--background-normal);
}

.serviceLabel {
    font-size: 13px;
    font-weight: 700;
    color: var(--primary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    flex: 1;
}

.serviceTime {
    font-size: 13px;
    font-weight: 600;
    color: var(--foreground-normal);
    background: var(--background-subdued);
    padding: 2px 8px;
    border-radius: 4px;
}

.serviceGuests,
.serviceType {
    font-size: 12px;
    color: var(--foreground-subdued);
}

/* Meals */
.mealsList {
    display: flex;
    flex-direction: column;
}

.mealRow {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 20px 10px 32px;
    cursor: pointer;
    transition: background 0.15s;
    border-top: 1px solid var(--border-subdued);
}

.mealRow:hover {
    background: var(--background-subdued);
}

.mealName {
    flex: 1;
    font-weight: 500;
    color: var(--foreground-normal);
}

.mealCategory {
    font-size: 12px;
    color: var(--foreground-subdued);
}

.mealGuests {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    font-weight: 600;
    color: var(--foreground-normal);
    white-space: nowrap;
}

.mealArrow {
    color: var(--foreground-subdued);
}

.emptyService,
.noMenu {
    padding: 12px 20px 12px 32px;
    font-size: 13px;
    color: var(--foreground-subdued);
    font-style: italic;
}

.emptyDays {
    margin-top: 16px;
}
</style>
