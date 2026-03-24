<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { currentEventStore, loadCurrentEvent } from '@/composables/currentEvent'
import { dbPatch, dbDelete } from '@/composables/fetch'
import { useModal } from '@/composables/modal'
import { showToast } from '@/composables/toaster'
import { appAssetStore } from '@/composables/appAssets'
import Loading from '@/components/Loading/Main.vue'
import Icon from '@/components/Icon/Main.vue'
import ListItem from '@/components/Cards/ListItem.vue'
import DateText from '@/components/Text/Date.vue'
import AddMission from '@/components/Architecture/Overlay/Modal/NewMission/Main.vue'
import SelectDay from '@/components/Architecture/Overlay/Modal/NewMission/SelectDay.vue'
import SelectPlanning from '@/components/Architecture/Overlay/Modal/NewMission/SelectPlanning.vue'
import NewPlanning from '@/components/Architecture/Overlay/Modal/NewPlanning.vue'

const route = useRoute()
const router = useRouter()
const { showModal, showConfirmationModal } = useModal()

const previousPage = computed(() => {
    return route.query.previousPage || route.path
})

const openMenuMissionId = ref(null)

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

function toggleMenu(missionId) {
    openMenuMissionId.value = openMenuMissionId.value === missionId ? null : missionId
}

async function toggleCompleted(mission) {
    await dbPatch({
        endpoint: `/items/missions/${mission.id}`,
        body: { completed: !mission.completed }
    })
    if (currentEventStore.value) {
        await loadCurrentEvent(currentEventStore.value.id)
    }
}

async function deleteMission(missionId) {
    openMenuMissionId.value = null
    try {
        await showConfirmationModal({
            title: 'Supprimer la mission',
            message: 'Êtes-vous sûr de vouloir supprimer cette mission ?',
            confirmText: 'Supprimer',
            cancelText: 'Annuler'
        })
    } catch {
        return
    }

    await dbDelete(`/items/missions/${missionId}`)
    if (currentEventStore.value) {
        await loadCurrentEvent(currentEventStore.value.id)
    }
}

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

function getEligibleDaysForMove(mission) {
    const target = findMissionService(mission)
    if (!target || !currentEventStore.value) return currentEventStore.value?.days || []

    return currentEventStore.value.days.filter(d => {
        if (!d.date || !target.day.date) return false
        return d.date <= target.day.date
    })
}

function getEligiblePlanningsForMove(mission, selectedDay) {
    const target = findMissionService(mission)
    const allPlannings = (selectedDay.plannings || []).filter(p => p.id !== planning.value?.id)

    if (!target) return allPlannings

    const isSameDay = selectedDay.id === target.day.id
    if (!isSameDay) return allPlannings

    return allPlannings.filter(p => {
        const slotKey = typeof p.slot === 'object' ? p.slot?.key : p.slot
        const planningSlot = (appAssetStore.value.planningSlots || []).find(s => s.key === slotKey)
        const planningSort = planningSlot?.sort ?? 0
        return planningSort < target.slotSort
    })
}

function formatDayText(date) {
    if (!date) return ''
    const [year, month, dayNum] = date.split('-').map(Number)
    const d = new Date(year, month - 1, dayNum)
    const dayName = d.toLocaleDateString('fr-FR', { weekday: 'long' })
    return dayName.charAt(0).toUpperCase() + dayName.slice(1) + ' ' + dayNum
}

async function moveMission(mission) {
    openMenuMissionId.value = null

    try {
        //* Step 1: Select day
        const eligibleDays = getEligibleDaysForMove(mission)
        const selectedDay = await showModal(SelectDay, { days: eligibleDays })
        if (!selectedDay) return

        //* Step 2: Select planning
        const eligiblePlannings = getEligiblePlanningsForMove(mission, selectedDay)
        const existingSlotKeys = (selectedDay.plannings || []).map(p => {
            return typeof p.slot === 'object' ? p.slot?.key : p.slot
        }).filter(Boolean)
        const allSlots = appAssetStore.value.planningSlots || []
        const canCreateNew = allSlots.length > existingSlotKeys.length

        const selectedPlanning = await showModal(
            SelectPlanning, 
            { 
                plannings: eligiblePlannings,
                canCreateNew
            }
        )
        if (!selectedPlanning) return

        const dayText = formatDayText(selectedDay.date)

        //* Step 3a: Create new planning with the mission
        if (selectedPlanning.createNew) {
            const result = await showModal(NewPlanning, {
                dayId: selectedDay.id,
                existingSlotKeys,
                movedMissions: [mission.id]
            })

            if (result?.slot) {
                showToast({ text: `Déplacé vers ${result.slot.text}, ${dayText}` })
            }
            return
        }

        //* Step 3b: Move to existing planning
        await showConfirmationModal({
            title: 'Déplacer la mission ?',
            message: `Vers ${selectedPlanning.slot?.text || 'cette planification'}`,
            confirmText: 'Déplacer',
            cancelText: 'Annuler'
        })

        await dbPatch({
            endpoint: `/items/missions/${mission.id}`,
            body: { planning: selectedPlanning.id }
        })

        if (currentEventStore.value) {
            await loadCurrentEvent(currentEventStore.value.id)
        }

        showToast({ text: `Déplacé vers ${selectedPlanning.slot?.text || 'planification'}, ${dayText}` })
    } catch (e) {
        if (e) console.error('moveMission error:', e)
    }
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
                        @toggleMenu="toggleMenu(mission.id)"
                        showMenuButton
                    >
                        <template #icon>
                            <Icon
                                @click="toggleCompleted(mission)"
                                class="pointer"
                            >
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

                        <template
                            v-if="openMenuMissionId === mission.id"
                            #menu
                        >
                            <button
                                @click="toggleCompleted(mission)"
                                class="
                                    menuItem
                                    flex alignCenter gap10
                                "
                            >
                                <Icon size="sm">
                                    {{ mission.completed ? 'undo' : 'check' }}
                                </Icon>
                                {{ mission.completed ? 'Marquer à faire' : 'Marquer fait' }}
                            </button>

                            <button
                                @click="moveMission(mission)"
                                class="
                                    menuItem
                                    flex alignCenter gap10
                                "
                            >
                                <Icon size="sm">
                                    drive_file_move
                                </Icon>
                                Déplacer
                            </button>

                            <button
                                @click="deleteMission(mission.id)"
                                class="
                                    menuItem
                                    flex alignCenter gap10
                                "
                            >
                                <Icon size="sm">
                                    delete
                                </Icon>
                                Supprimer
                            </button>
                        </template>
                    </ListItem>

                    <AddMission
                        :planning="planning"
                        :day="day"
                    />
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
