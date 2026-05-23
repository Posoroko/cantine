<template>
    <private-view title="Événements">
        <template #title-outer:prepend>
            <v-button class="backBtn" secondary icon rounded @click="router.push('/cantine-dashboard')">
                <v-icon name="arrow_back" />
            </v-button>
        </template>

        <div class="viewContent">
            <div v-if="loading" class="loadingState">
                <v-progress-circular indeterminate />
            </div>

            <v-notice v-else-if="!events.length" type="info">
                Aucun événement trouvé.
            </v-notice>

            <div v-else class="eventList">
                <div
                    v-for="event in events"
                    :key="event.id"
                    class="eventCard"
                    @click="router.push(`/cantine-dashboard/events/${event.id}`)"
                >
                    <div class="eventCardTop">
                        <span class="eventName">{{ event.name }}</span>
                        <span class="statusBadge" :class="`status-${event.status}`">{{ event.status }}</span>
                    </div>
                    <div class="eventMeta">
                        <span v-if="event.client" class="metaPill">
                            <v-icon name="person" small /> {{ event.client }}
                        </span>
                        <span v-if="event.location" class="metaPill">
                            <v-icon name="place" small /> {{ event.location }}
                        </span>
                        <span class="metaPill">
                            <v-icon name="calendar_today" small /> {{ formatDateRange(event.startDate, event.endDate) }}
                        </span>
                        <span v-if="event.guestCount" class="metaPill">
                            <v-icon name="group" small /> {{ event.guestCount }} convives
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </private-view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@directus/extensions-sdk'

const router = useRouter()
const api = useApi()

const loading = ref(true)
const events = ref<any[]>([])

onMounted(async () => {
    const res = await api.get('/items/events', {
        params: {
            fields: ['id', 'name', 'client', 'location', 'startDate', 'endDate', 'guestCount', 'status'],
            sort: ['-startDate'],
        },
    })
    events.value = res.data.data
    loading.value = false
})

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

.loadingState {
    display: flex;
    justify-content: center;
    padding: 60px;
}

.eventList {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.eventCard {
    padding: 20px 24px;
    border: 1px solid var(--border-normal);
    border-radius: 10px;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.15s;
    background: var(--background-normal);
}

.eventCard:hover {
    border-color: var(--primary);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.eventCardTop {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
}

.eventName {
    font-size: 17px;
    font-weight: 600;
    color: var(--foreground-normal);
}

.statusBadge {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 2px 10px;
    border-radius: 20px;
    background: var(--background-subdued);
    color: var(--foreground-subdued);
}

.statusBadge.status-confirmed {
    background: var(--success-25, #d4edda);
    color: var(--success, #28a745);
}

.statusBadge.status-cancelled {
    background: var(--danger-25, #f8d7da);
    color: var(--danger, #dc3545);
}

.statusBadge.status-draft {
    background: var(--warning-25, #fff3cd);
    color: var(--warning, #ffc107);
}

.eventMeta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.metaPill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: var(--foreground-subdued);
}
</style>
