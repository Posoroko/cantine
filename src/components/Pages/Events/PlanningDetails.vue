<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { currentEventStore } from '@/composables/currentEvent'
import { appAssetStore } from '@/composables/appAssets'
import Loading from '@/components/Loading/Main.vue'
import Icon from '@/components/Icon/Main.vue'
import ListItem from '@/components/Cards/ListItem.vue'
import DateText from '@/components/Text/Date.vue'

const route = useRoute()
const router = useRouter()

const previousPage = computed(() => {
    return route.query.previousPage || route.path
})

const day = computed(() => {
    const dayId = parseInt(route.query.day)
    if (!currentEventStore.value || !dayId) return null
    return currentEventStore.value.days.find(d => d.id === dayId) || null
})

const planning = computed(() => {
    if (!day.value) return null
    const planningId = parseInt(route.query.planning)
    if (!planningId) return null

    return day.value.plannings.find(p => p.id === planningId) || null
})

const missions = computed(() => {
    if (!planning.value?.missions?.length) return []
    return planning.value.missions
})

const missionTargets = computed(() => {
    const map = {}
    for (const mission of missions.value) {
        map[mission.id] = findMissionService(mission)
    }
    return map
})

function findMissionService(mission) {
    if (!currentEventStore.value) return null
    const ingredientId = mission.ingredient?.id
    if (!ingredientId) return null

    for (const day of currentEventStore.value.days) {
        for (const service of day.services) {
            for (const meal of (service.meals || [])) {
                const hasIngredient = meal.recipe?.ingredients?.some(ri => ri.id === ingredientId)
                if (hasIngredient) {
                    const slotKey = typeof service.slot === 'object' ? service.slot?.key : service.slot
                    const serviceSlot = (appAssetStore.value.serviceSlots || []).find(s => s.key === slotKey)
                    return { day, service, slotSort: serviceSlot?.sort ?? 0, slotIcon: serviceSlot?.icon || 'event_note' }
                }
            }
        }
    }
    return null
}

</script>

<template>
    <div class="planningDetailsContainer">
        <Loading v-if="!planning">
            Chargement...
        </Loading>

        <div
            v-if="planning"
            class="
                planningDetailsContent
                flex column
            "
        >
            <router-link
                :to="previousPage"
                class="pad10"
            >
                <Icon size="lg">
                    arrow_back
                </Icon>
            </router-link>
            <div class="flex column gap20">
                <h2
                    class="
                        planningTitle
                        flex alignCenter justifyBetween
                    "
                >
                    <span>
                        <DateText
                            :timestamp="day?.date"
                            format="textNoMonth"
                            class="
                                beigeCardGreenText
                                rounded5
                            "
                        />
                    </span>

                    <span
                        class="flex alignCenter gap10"
                    >
                        <Icon size="md">
                            {{ planning.slot?.icon || 'event_note' }}
                        </Icon>

                        {{ planning.slot?.text || 'Planification' }}
                    </span>
                </h2>

                <div
                    class="
                        missionsGrid
                        flex column gap10
                    "
                >
                    <ListItem
                        v-for="mission in missions"
                        :key="mission.id"
                    >
                        <template #icon>
                            <Icon>
                                {{ mission.completed ? 'task_alt' : 'radio_button_unchecked' }}
                            </Icon>
                        </template>

                        <template #text>
                            {{ mission.ingredient?.ingredient?.name || 'Mission' }}
                        </template>

                        <template
                            v-if="missionTargets[mission.id]"
                            #details
                        >
                            <span class="flex alignCenter gap5">
                                <DateText
                                    :timestamp="missionTargets[mission.id].day.date"
                                    format="textNoMonth"
                                />
                                <Icon size="sm">
                                    {{ missionTargets[mission.id].slotIcon }}
                                </Icon>
                            </span>
                        </template>
                    </ListItem>
                </div>
            </div>
        </div>

        <p
            v-else
            class="noData"
        >
            Erreur lors du chargement de la planification
        </p>
    </div>
</template>

<style scoped>

.noData {
    text-align: center;
    padding: 40px;
}

.menuItem {
    padding: 10px 14px;
    background: transparent;
    color: var(--beige);
    border: none;
    cursor: pointer;
    white-space: nowrap;
    font-size: 14px;
}
</style>
