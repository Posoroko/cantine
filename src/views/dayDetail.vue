<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Private from '@/components/Architecture/Layouts/Private.vue'
import Icon from '@/components/Icon/Main.vue'
import Loading from '@/components/Loading/Main.vue'
import EventBar from '@/components/Architecture/Bars/EventBar.vue'
import Meal from '@/components/Cards/Meal.vue'
import TodoList from '@/components/Todos/TodoList.vue'
import type { TodoItem } from '@/components/Todos/TodoList.vue'

const dayTodoListRef = ref<InstanceType<typeof TodoList> | null>(null)
import {
    TIME_SLOT_CONFIG,
    MEAL_TYPE_CONFIG
} from '@/composables/appAssets'
import { eventDaysStore, loadEventDays } from '@/composables/currentEvent'
import { dbGet, dbPatch, dbPost, dbDelete } from '@/composables/fetch'
import { useUserState } from '@/composables/userState'

const route = useRoute()
const router = useRouter()

const dayId = computed(() => parseInt(route.params.dayId as string))
const eventId = computed(() => parseInt(route.params.eventId as string))

onMounted(() => {
    loadEventDays(eventId.value)
    fetchDayTodos()
})

// c5t: day is a computed — reacts instantly to route param changes, no watcher needed
const day = computed(() => eventDaysStore.value?.find((d: any) => d.id === dayId.value) ?? null)

// c5t: prev/next day navigation within the same event
const currentDayIndex = computed(() => eventDaysStore.value?.findIndex((d: any) => d.id === dayId.value) ?? -1)
const prevDay = computed(() => currentDayIndex.value > 0 ? eventDaysStore.value![currentDayIndex.value - 1] : null)
const nextDay = computed(() => eventDaysStore.value && currentDayIndex.value < eventDaysStore.value.length - 1 ? eventDaysStore.value[currentDayIndex.value + 1] : null)

function goToDay(id: number) {
    router.push({ name: 'DayDetail', params: { eventId: eventId.value, dayId: id } })
}

const services = computed(() =>
    [...(day.value?.services ?? [])].sort((a: any, b: any) => {
        const orderA = TIME_SLOT_CONFIG[a.timeSlot ?? '']?.order ?? 99
        const orderB = TIME_SLOT_CONFIG[b.timeSlot ?? '']?.order ?? 99
        return orderA - orderB
    })
)

const selectedService = computed(() => {
    if (!services.value.length) return null
    const serviceId = route.params.serviceId ? parseInt(route.params.serviceId as string) : null
    if (serviceId) return services.value.find((s: any) => s.id === serviceId) ?? services.value[0]
    return services.value[0]
})

type ServicePlanningNote = {
    id: number
    text: string
}

type ServicePlanningState = {
    startTime: string
    endTime: string
    notes: ServicePlanningNote[]
}

const servicePlanningStart = ref('')
const servicePlanningEnd = ref('')
const servicePlanningDraft = ref('')
const editingServicePlanningNoteId = ref<number | null>(null)
const servicePlanningNotes = ref<ServicePlanningNote[]>([])
const printTarget = ref<number | 'all' | null>(null)
const showPrintModal = ref(false)
const showServicePlanningInput = ref(false)

function normalizeServicePlanning(rawPlanning: any): ServicePlanningState {
    if (Array.isArray(rawPlanning)) {
        return {
            startTime: '',
            endTime: '',
            notes: rawPlanning
                .map((entry: any, index: number) => {
                    if (typeof entry === 'string') {
                        return { id: index, text: entry }
                    }

                    return {
                        id: entry.id ?? index,
                        text: entry.text ?? entry.label ?? '',
                    }
                })
                .filter((entry: ServicePlanningNote) => entry.text.trim().length > 0),
        }
    }

    if (!rawPlanning || typeof rawPlanning !== 'object') {
        return {
            startTime: '',
            endTime: '',
            notes: [],
        }
    }

    const notesSource = rawPlanning.notes ?? rawPlanning.items ?? rawPlanning.list ?? []

    return {
        startTime: rawPlanning.startTime ?? rawPlanning.start ?? '',
        endTime: rawPlanning.endTime ?? rawPlanning.end ?? '',
        notes: normalizeServicePlanning(notesSource).notes,
    }
}

watch(
    () => selectedService.value?.id,
    () => {
        const planning = normalizeServicePlanning(selectedService.value?.servicePlanning)
        servicePlanningStart.value = planning.startTime
        servicePlanningEnd.value = planning.endTime
        servicePlanningNotes.value = planning.notes
        servicePlanningDraft.value = ''
        editingServicePlanningNoteId.value = null
        showServicePlanningInput.value = false
    },
    { immediate: true }
)

async function saveServicePlanning(notes: ServicePlanningNote[]) {
    if (!selectedService.value) return

    const cleanedNotes = notes
        .map(note => ({
            id: note.id,
            text: note.text.trim(),
        }))
        .filter(note => note.text.length > 0)

    await dbPatch({
        endpoint: `/items/services/${selectedService.value.id}`,
        body: {
            servicePlanning: {
                startTime: servicePlanningStart.value.trim() || null,
                endTime: servicePlanningEnd.value.trim() || null,
                notes: cleanedNotes,
            },
        },
    })

    selectedService.value.servicePlanning = {
        startTime: servicePlanningStart.value.trim() || null,
        endTime: servicePlanningEnd.value.trim() || null,
        notes: cleanedNotes,
    }
    servicePlanningNotes.value = cleanedNotes
}

async function submitServicePlanningNote() {
    const text = servicePlanningDraft.value.trim()
    if (!selectedService.value) return

    const nextNotes = editingServicePlanningNoteId.value !== null
        ? servicePlanningNotes.value.map(note => note.id === editingServicePlanningNoteId.value ? { ...note, text } : note)
        : text
            ? [...servicePlanningNotes.value, { id: Date.now(), text }]
            : servicePlanningNotes.value

    await saveServicePlanning(nextNotes)
    servicePlanningDraft.value = ''
    editingServicePlanningNoteId.value = null
}

function startEditingServicePlanningNote(note: ServicePlanningNote) {
    editingServicePlanningNoteId.value = note.id
    servicePlanningDraft.value = note.text
}

function cancelServicePlanningEdit() {
    editingServicePlanningNoteId.value = null
    servicePlanningDraft.value = ''
}

async function deleteServicePlanningNote(noteId: number) {
    await saveServicePlanning(servicePlanningNotes.value.filter(note => note.id !== noteId))
    if (editingServicePlanningNoteId.value === noteId) cancelServicePlanningEdit()
}

const servicesToPrint = computed(() => {
    if (printTarget.value === 'all') return services.value
    if (typeof printTarget.value === 'number') {
        return services.value.filter((service: any) => service.id === printTarget.value)
    }
    return []
})

function getPrintableMealGroups(service: any) {
    const meals = service?.meals ?? []
    const groups: Record<string, any[]> = {}

    for (const meal of meals) {
        const type = meal.type ?? 'main'
        if (!groups[type]) groups[type] = []
        groups[type].push(meal)
    }

    const order = ['starter', 'main', 'side', 'dessert', 'beverage']

    return Object.entries(groups)
        .sort(([typeA], [typeB]) => {
            const orderA = order.indexOf(typeA) === -1 ? 99 : order.indexOf(typeA)
            const orderB = order.indexOf(typeB) === -1 ? 99 : order.indexOf(typeB)
            return orderA - orderB
        })
        .map(([type, items]) => ({
            type,
            label: type === 'main' ? 'Plat principal' : (MEAL_TYPE_CONFIG[type]?.label ?? type),
            items,
        }))
}

function getServicePlanningNotes(service: any): ServicePlanningNote[] {
    return normalizeServicePlanning(service?.servicePlanning).notes
}

function getServicePlanningTimes(service: any) {
    return normalizeServicePlanning(service?.servicePlanning)
}

function getArtistCount(service: any): number {
    return (service?.diets ?? []).reduce((total: number, dietCount: any) => {
        const hasArtist = (dietCount.diets ?? []).some((diet: any) => diet.diets?.value === 'artist')
        return total + (hasArtist ? (dietCount.count ?? 0) : 0)
    }, 0)
}

function getPrintableDietCounts(service: any) {
    return (service?.diets ?? [])
        .map((dietCount: any) => ({
            ...dietCount,
            diets: (dietCount.diets ?? []).filter((diet: any) => diet.diets?.value !== 'artist'),
        }))
        .filter((dietCount: any) => dietCount.diets.length > 0)
}

function openPrintModal() {
    showPrintModal.value = true
}

function closePrintModal() {
    showPrintModal.value = false
}

async function printCurrentService() {
    if (!selectedService.value) return
    closePrintModal()
    await printServices(selectedService.value.id)
}

async function printAllServices() {
    closePrintModal()
    await printServices('all')
}

async function printServices(target: number | 'all') {
    if (!services.value.length) return

    printTarget.value = target
    await nextTick()
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

    const eventName = day.value?.event?.name ?? 'Service'
    const rawDate = day.value?.date ?? ''
    const date = rawDate
        ? new Date(rawDate).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit' })
        : ''
    const serviceLabel = target === 'all'
        ? 'Tous les services'
        : TIME_SLOT_CONFIG[services.value.find((service: any) => service.id === target)?.timeSlot ?? '']?.label ?? ''
    const originalTitle = document.title

    document.title = `${eventName} - ${date}${serviceLabel ? ` - ${serviceLabel}` : ''}`

    const onAfterPrint = () => {
        document.title = originalTitle
        printTarget.value = null
        window.removeEventListener('afterprint', onAfterPrint)
    }

    window.addEventListener('afterprint', onAfterPrint)

    setTimeout(() => {
        window.print()
    }, 50)
}

function selectService(id: number) {
    router.replace({
        name: 'DayDetail',
        params: { ...route.params, serviceId: id }
    })
}

// c5t: group and sort meals by type for the selected service
const mealsByType = computed(() => {
    const meals = selectedService.value?.meals ?? []
    const groups: Record<string, typeof meals> = {}
    for (const meal of meals) {
        const type = (meal as any).type ?? 'main'
        if (!groups[type]) groups[type] = []
        groups[type].push(meal)
    }
    return Object.entries(groups)
        .sort(([a], [b]) => {
            const orderA = MEAL_TYPE_CONFIG[a]?.order ?? 99
            const orderB = MEAL_TYPE_CONFIG[b]?.order ?? 99
            return orderA - orderB
        })
        .map(([type, meals]) => ({ type, label: MEAL_TYPE_CONFIG[type]?.label ?? type, meals }))
})

// c5t: weighted cost per guest — each meal's total cost is divided by service headcount
// so meals with a partial servingCount (e.g. cheese for 50 artists out of 200) are
// correctly diluted across the full service rather than counted as a full per-portion cost
const servicePricePerPerson = computed(() => {
    const service = selectedService.value
    if (!service?.guestCount) return null
    const serviceHeadcount = service.guestCount
    const meals = service.meals ?? []
    let totalCost = 0
    let hasPrice = false
    for (const meal of meals as any[]) {
        const recipe = meal.recipe
        if (!recipe?.ingredients?.length || !recipe.servings) continue
        const mealHeadcount = meal.servingCount ?? serviceHeadcount
        for (const ri of recipe.ingredients) {
            if (ri.quantity && ri.ingredient?.defaultPrice) {
                totalCost += (ri.quantity / recipe.servings) * mealHeadcount * ri.ingredient.defaultPrice
                hasPrice = true
            }
        }
    }
    return hasPrice ? totalCost / serviceHeadcount : null
})

function navigateToPrepList() {
    if (!selectedService.value) return
    router.push({
        path: `/evenements/${eventId.value}/jours/${dayId.value}/${selectedService.value.id}/prep-liste`,
    })
}

// ─── day todos ────────────────────────────────────────────────────────────────

const userState = useUserState()
const dayTodos = ref<TodoItem[]>([])

async function fetchDayTodos() {
    const raw = await dbGet<any[]>({
        endpoint: '/items/toDos',
        query: {
            fields: 'id,text,dueTime,isPending,user_markedAsClosed',
            sort: 'dueTime',
            limit: -1,
            filter: { day: { _eq: dayId.value } },
        },
    })
    dayTodos.value = (raw ?? []).map(t => ({
        id: t.id,
        text: t.text ?? '',
        dueTime: t.dueTime ?? null,
        isPending: t.isPending ?? true,
        closedBy: t.user_markedAsClosed ?? null,
    }))
}

async function onCreateDayTodo(text: string, dueTime: string | null) {
    const created = await dbPost<any>({
        endpoint: '/items/toDos',
        body: {
            text,
            dueTime: dueTime || null,
            isPending: true,
            day: dayId.value,
        },
    })
    if (created) {
        dayTodos.value = [
            ...dayTodos.value,
            { id: created.id, text, dueTime, isPending: true, closedBy: null },
        ]
    }
}

async function onToggleDayTodo(id: string | number) {
    let newPending = true
    dayTodos.value = dayTodos.value.map(t => {
        if (t.id !== id) return t
        newPending = !t.isPending
        return { ...t, isPending: newPending, closedBy: newPending ? null : (userState.value.id || null) }
    })
    await dbPatch({
        endpoint: `/items/toDos/${id}`,
        body: {
            isPending: newPending,
            user_markedAsClosed: newPending ? null : (userState.value.id || null),
        },
    })
}

async function onRemoveDayTodo(id: string | number) {
    dayTodos.value = dayTodos.value.filter(t => t.id !== id)
    await dbDelete(`/items/toDos/${id}`)
}

// c5t: reload todos when navigating between days
watch(dayId, fetchDayTodos)

</script>

<template>
    <Private>
        <template #topBar>
            <EventBar />
        </template>

        <template #title>
            <Loading v-if="!day" />

            <div
                v-else
                class="titleArrowBox flex alignCenter justifyEvenly gap10"
            >
                <Icon
                    @click="prevDay && goToDay(prevDay.id)"
                    :class="prevDay ? 'pointer' : 'dimmed'"
                    size="xl"
                >
                    arrow_back
                </Icon>

                <h1 class="dayTitle beigeCardGreenText rounded10 caprasimo">
                    {{ day.date ? new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' }) : '' }}
                </h1>

                <Icon
                    @click="nextDay && goToDay(nextDay.id)"
                    :class="nextDay ? 'pointer' : 'dimmed'"
                    size="xl"
                >
                    arrow_forward
                </Icon>
            </div>
        </template>

        <template #main>
            <Loading v-if="!day">
                Chargement...
            </Loading>

            <div
                v-else
                class="flex column gap20 pad10"
            >
                <!-- todos -->
                <div class="todosSection flex column gap8">
                    <div class="todosSectionHeader flex alignCenter justifyBetween">
                        <p class="todosSectionLabel">Tâches du jour</p>
                        <button
                            class="addTodoBtn"
                            @click="dayTodoListRef?.openCreate()"
                        >
                            <Icon>add</Icon>
                        </button>
                    </div>
                    <TodoList
                        ref="dayTodoListRef"
                        :todos="dayTodos"
                        emptyText="Aucune tâche pour ce jour"
                        @create="onCreateDayTodo"
                        @toggle="onToggleDayTodo"
                        @remove="onRemoveDayTodo"
                    />
                </div>
                <!-- service tab bar -->
                <div class="serviceActions flex justifyBetween alignCenter gap10">
                    <p class="serviceActionsLabel">Services</p>
                </div>

                <div class="serviceTabBar flex justifyCenter gap20 wrap">
                    <div
                        v-for="service in services"
                        :key="service.id"
                        class="flex column alignCenter gap10"
                    >
                        <button
                            @click="selectService(service.id)"
                            :class="{ active: selectedService?.id === service.id }"
                            class="serviceTabButton flex column alignCenter justifyCenter pad5"
                        >
                            <Icon size="lg">
                                {{ TIME_SLOT_CONFIG[service.timeSlot ?? '']?.icon || 'restaurant' }}
                            </Icon>
                            <span class="serviceTabLabel">
                                {{ TIME_SLOT_CONFIG[service.timeSlot ?? '']?.label || service.timeSlot }}
                            </span>
                        </button>

                        <button
                            class="servicePrintBtn flex alignCenter gap5"
                            @click.stop="printServices(service.id)"
                            title="Imprimer ce service"
                        >
                            <Icon size="sm">print</Icon>
                            <span>Imprimer</span>
                        </button>

                        <div 
                            v-if="selectedService.id === service.id"
                            class="flex justifyCenter alignCenter gap5"
                        >
                            <!-- <Icon size="md">groups</Icon> -->
                            <h3 class="beigeCardGreenText pad5 rounded5">{{ selectedService.guestCount }}</h3>
                        </div>
                    </div>
                </div>

                <!-- guest count + diets -->
                <div
                    v-if="selectedService?.diets?.length"
                    class="jaugeBox gap20"
                >
                    <div class="dietBox marTop10">
                        <div class="liBox flex column gap10">
                            <div 
                                v-for="dietCount in (selectedService.diets as any[])"
                                class="textLg fontWeightSemibold flex gap5"
                            >
                                <div class="dietCount textLg fontWeightBold">
                                    {{ dietCount.count }}
                                </div>

                                <div class="grow flex column">
                                    <span
                                        v-for="diet in (dietCount.diets as any[])"
                                        :key="diet.id ?? diet.diets?.value"
                                        class="grow"
                                    >
                                        {{ diet.diets?.text }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- prep list button -->
                <div class="flex justifyEnd">
                    <button
                        @click="navigateToPrepList"
                        class="beigeCardGreenText flex alignCenter gap10 pad10 rounded5"
                    >
                        <Icon color="green">receipt</Icon>
                        <span class="textLg fontWeightBold">Voir la prep liste</span>
                    </button>
                </div>

                <!-- meals -->
                <div
                    v-if="selectedService"
                    class="mealsList flex column gap10"
                >
                    <template v-if="mealsByType.length">
                        <template
                            v-for="group in mealsByType"
                            :key="group.type"
                        >
                            <p class="mealTypeLabel">{{ group.label }}</p>

                            <Meal
                                v-for="meal in group.meals"
                                :key="meal.id"
                                :meal="meal"
                                :serviceGuestCount="selectedService.guestCount"
                            />
                        </template>
                    </template>

                    <p
                        v-if="!selectedService.meals?.length"
                        class="noMeals"
                    >
                        Aucun plat pour ce service
                    </p>

                    <div
                        v-if="servicePricePerPerson !== null"
                        class="priceSummary flex justifyBetween alignCenter pad15 rounded10"
                    >
                        <span class="fS14">Prix par personne</span>
                        <span class="weight7">{{ servicePricePerPerson.toFixed(2) }} €</span>
                    </div>
                </div>
                

                <h1
                    class="marTop20"
                >
                    Organisation du Service
                </h1>

                <div class="servicePlanningEditor flex column gap10">
                    <div class="flex justifyEnd">
                        <button
                            class="servicePlanningPrintBtn flex alignCenter gap5"
                            @click="openPrintModal"
                        >
                            <Icon size="sm">print</Icon>
                            <span>Imprimer</span>
                        </button>
                    </div>

                    <div class="servicePlanningTimes flex gap10 wrap">
                        <label class="servicePlanningTimeField flex column gap5">
                            <span class="servicePlanningFieldLabel">Début</span>
                            <input
                                v-model="servicePlanningStart"
                                class="servicePlanningTimeInput"
                                inputmode="numeric"
                                maxlength="5"
                                pattern="[0-2][0-9]:[0-5][0-9]"
                                placeholder="--:--"
                                type="text"
                                @blur="saveServicePlanning(servicePlanningNotes)"
                            />
                        </label>

                        <label class="servicePlanningTimeField flex column gap5">
                            <span class="servicePlanningFieldLabel">Fin</span>
                            <input
                                v-model="servicePlanningEnd"
                                class="servicePlanningTimeInput"
                                inputmode="numeric"
                                maxlength="5"
                                pattern="[0-2][0-9]:[0-5][0-9]"
                                placeholder="--:--"
                                type="text"
                                @blur="saveServicePlanning(servicePlanningNotes)"
                            />
                        </label>
                    </div>

                    <div class="flex column gap8">
                        <p
                            class="flex justifyBetween alignCenter"
                        >
                            <span>
                                Notes
                            </span>

                            <Icon
                                class="pad10 pointer"
                                @click="showServicePlanningInput = !showServicePlanningInput"
                            >
                                {{ showServicePlanningInput ? 'close' : 'add' }}
                            </Icon>
                        </p>

                        <div v-if="showServicePlanningInput">
                            <input
                                v-model="servicePlanningDraft"
                                class="servicePlanningInput"
                                type="text"
                                placeholder="Ajouter une note de service"
                                @keyup.enter.prevent="submitServicePlanningNote"
                            />

                            <div 
                                class="
                                    flex gap10 justifyEnd 
                                    marTop10
                                "
                            >
                                <button
                                    v-if="editingServicePlanningNoteId !== null"
                                    class="servicePlanningCancelBtn"
                                    @click="cancelServicePlanningEdit"
                                >
                                    Annuler
                                </button>

                                <button
                                    class="servicePlanningSaveBtn flex alignCenter gap5"
                                    @click="submitServicePlanningNote"
                                >
                                    <Icon size="sm">save</Icon>
                                    <span>{{ editingServicePlanningNoteId !== null ? 'Mettre à jour' : 'Ajouter' }}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="servicePlanningList flex column gap8">
                        <div
                            v-if="!servicePlanningNotes.length"
                            class="servicePlanningEmpty"
                        >
                            Aucune note pour ce service
                        </div>

                        <div
                            v-for="note in servicePlanningNotes"
                            :key="note.id"
                            class="servicePlanningNote flex alignCenter justifyBetween gap10"
                        >
                            <span class="servicePlanningNoteText">{{ note.text }}</span>

                            <div class="flex alignCenter gap5">
                                <button
                                    class="servicePlanningIconBtn"
                                    @click="startEditingServicePlanningNote(note)"
                                    title="Modifier la note"
                                >
                                    <Icon size="sm">edit</Icon>
                                </button>

                                <button
                                    class="servicePlanningIconBtn"
                                    @click="deleteServicePlanningNote(note.id)"
                                    title="Supprimer la note"
                                >
                                    <Icon size="sm">delete</Icon>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <Teleport to="body">
                <div class="printArea">
                    <template
                        v-for="service in servicesToPrint"
                        :key="service.id"
                    >
                        <div class="printPage">
                            <div class="printHeader">
                                <div class="printHeaderCenter flex column alignCenter">
                                    <span class="printDay caprasimo">{{ day?.date ? new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' }) : '' }}</span>
                                    <span class="printSlot">{{ TIME_SLOT_CONFIG[service.timeSlot ?? '']?.label ?? service.timeSlot }}</span>
                                    <span class="printServiceTime">
                                        {{ getServicePlanningTimes(service).startTime || '--:--' }} - {{ getServicePlanningTimes(service).endTime || '--:--' }}
                                    </span>
                                </div>

                                <div class="printHeaderStats flex gap20">
                                    <span class="printGuestCount">Convives: {{ service.guestCount ?? 0 }}</span>
                                    <span class="printArtistCount">Artistes: {{ getArtistCount(service) }}</span>
                                </div>
                            </div>

                            <div
                                v-if="getServicePlanningNotes(service).length"
                                class="printSection"
                            >
                                <h2 class="printSectionTitle">Notes</h2>
                                <div
                                    v-for="note in getServicePlanningNotes(service)"
                                    :key="note.id"
                                    class="printNoteLine"
                                >
                                    {{ note.text }}
                                </div>
                            </div>

                            <div class="printSection">
                                <h2 class="printSectionTitle">Régimes spéciaux</h2>
                                <template v-if="getPrintableDietCounts(service).length">
                                    <div
                                        v-for="dietCount in getPrintableDietCounts(service)"
                                        :key="dietCount.id ?? dietCount.count"
                                        class="printDietRow"
                                    >
                                        <span class="printDietCount">{{ dietCount.count }}</span>
                                        <div class="printDietList">
                                            <span
                                                v-for="diet in (dietCount.diets ?? [])"
                                                :key="diet.id ?? diet.diets?.value"
                                                class="printDietText"
                                            >
                                                {{ diet.diets?.text }}
                                            </span>
                                        </div>
                                    </div>
                                </template>
                                <p v-else class="printEmptyState">Aucun régime spécial</p>
                            </div>

                            <div class="printSection">
                                <h2 class="printSectionTitle">Menu</h2>

                                <div
                                    v-for="group in getPrintableMealGroups(service)"
                                    :key="group.type"
                                    class="printMealGroup"
                                >
                                    <h3 class="printMealType">{{ group.label }}</h3>

                                    <div
                                        v-for="meal in group.items"
                                        :key="meal.id"
                                        class="printMealRow"
                                    >
                                        <span class="printRecipeName">{{ meal.recipe?.name }}</span>
                                        <span class="printMealPortion">
                                            {{ meal.servingCount ?? service.guestCount ?? 0 }} pers.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
                </Teleport>

                <Teleport to="body">
                    <div
                        v-if="showPrintModal"
                        class="printModalOverlay flex alignCenter justifyCenter"
                    >
                        <div class="printModal flex column gap15 pad20 rounded10">
                            <h2 class="printModalTitle">Que veux-tu imprimer ?</h2>

                            <div class="flex column gap10">
                                <button
                                    class="printModalBtn flex alignCenter gap10"
                                    @click="printCurrentService"
                                >
                                    <Icon size="sm">print</Icon>
                                    <span>Ce service</span>
                                </button>

                                <button
                                    class="printModalBtn flex alignCenter gap10"
                                    @click="printAllServices"
                                >
                                    <Icon size="sm">print</Icon>
                                    <span>Tous les services</span>
                                </button>
                            </div>

                            <div class="flex justifyEnd">
                                <button
                                    class="printModalCancelBtn"
                                    @click="closePrintModal"
                                >
                                    Annuler
                                </button>
                            </div>
                        </div>
                    </div>
                </Teleport>

            </div>
        </template>
    </Private>
</template>

<style scoped>
.titleArrowBox {
    padding: 10px 0;
}

.todosSection {
    background: color-mix(in srgb, var(--beige) 5%, transparent);
    border-radius: 12px;
    padding: 12px 14px;
}

.todosSectionHeader {
    margin-bottom: 4px;
}

.todosSectionLabel {
    color: var(--beige);
    font-size: 0.75em;
    font-weight: 700;
    letter-spacing: 0.08em;
    opacity: 0.5;
    text-transform: uppercase;
}

.addTodoBtn {
    padding: 2px;
}

.dayTitle {
    font-size: clamp(20px, 5vw, 30px);
    padding: 3px 20px;
    text-transform: capitalize;
}

.dimmed {
    /* opacity: 0.25; */
    cursor: default;
}

.dietBox {
    padding: 10px 10px;
    border: 1px solid var(--beige);
    border-left: 5px solid var(--beige);
    border-radius:  5px;
}
.dietCount {
    width: 48px;
}
.serviceTabButton {
    min-width: 64px;
    padding: 10px 12px;
    color: var(--beige);
    /* opacity: 0.5; */
    border-radius: 10px;
    background: transparent;
    /* transition: all 200ms; */
}

.serviceTabButton.active {
    opacity: 1;
    background: color-mix(in srgb, var(--beige) 20%, transparent);
    border: 1px solid var(--beige);
}

.serviceActions {
    margin-bottom: 10px;
}

.serviceActionsLabel {
    color: var(--beige);
    font-size: 0.8em;
    font-weight: 700;
    letter-spacing: 0.08em;
    opacity: 0.5;
    text-transform: uppercase;
}

.servicePrintAllBtn,
.servicePrintBtn,
.servicePlanningSaveBtn,
.servicePlanningCancelBtn,
.servicePlanningIconBtn {
    background: color-mix(in srgb, var(--beige) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--beige) 20%, transparent);
    border-radius: 8px;
    color: var(--beige);
    cursor: pointer;
}

.servicePrintAllBtn,
.servicePlanningSaveBtn {
    padding: 8px 12px;
}

.servicePrintBtn {
    font-size: 0.75em;
    opacity: 0.7;
    padding: 4px 8px;
}

.servicePlanningEditor {
    background: color-mix(in srgb, var(--beige) 5%, transparent);
    border-radius: 12px;
    padding: 14px;
}

.servicePlanningPrintBtn {
    background: color-mix(in srgb, var(--beige) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--beige) 20%, transparent);
    border-radius: 8px;
    color: var(--beige);
    cursor: pointer;
    padding: 8px 12px;
}

.servicePlanningTimes {
    margin-bottom: 4px;
}

.servicePlanningTimeField {
    flex: 1;
    min-width: 140px;
}

.servicePlanningFieldLabel {
    color: var(--beige);
    font-size: 0.75em;
    font-weight: 700;
    letter-spacing: 0.06em;
    opacity: 0.55;
    text-transform: uppercase;
}

.servicePlanningTimeInput {
    background: color-mix(in srgb, var(--beige) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--beige) 25%, transparent);
    border-radius: 10px;
    color: var(--beige);
    min-height: 42px;
    padding: 0 12px;
}

.servicePlanningTimeInput:focus {
    border-color: color-mix(in srgb, var(--beige) 55%, transparent);
    outline: none;
}

.servicePlanningInput {
    background: color-mix(in srgb, var(--beige) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--beige) 25%, transparent);
    border-radius: 10px;
    color: var(--beige);
    min-height: 42px;
    padding: 0 12px;
    width: 100%;
}

.servicePlanningInput::placeholder {
    color: var(--beige);
    opacity: 0.4;
}

.servicePlanningInput:focus {
    border-color: color-mix(in srgb, var(--beige) 55%, transparent);
    outline: none;
}

.servicePlanningList {
    margin-top: 6px;
}

.servicePlanningEmpty,
.servicePlanningNoteText {
    color: var(--beige);
}

.servicePlanningEmpty {
    opacity: 0.5;
}

.servicePlanningNote {
    background: color-mix(in srgb, var(--beige) 4%, transparent);
    border-radius: 10px;
    padding: 10px 12px;
}

.servicePlanningNoteText {
    flex: 1;
    line-height: 1.35;
}

.servicePlanningIconBtn {
    opacity: 0.75;
    padding: 6px;
}

.printPage {
    background: white;
    color: black;
    box-sizing: border-box;
    page-break-after: always;
    break-after: page;
    padding: 1cm 1.25cm;
}

.printHeader {
    border-bottom: 2px solid black;
    margin-bottom: 0.4cm;
    padding-bottom: 0.25cm;
}

.printHeaderCenter {
    text-align: center;
    margin-bottom: 0.3cm;
}

.printDay,
.printSlot,
.printServiceTime,
.printGuestCount,
.printArtistCount,
.printSectionTitle,
.printRecipeName,
.printDietText,
.printNoteLine,
.printEmptyState,
.printIngredientName,
.printQty {
    color: black;
}

.printEmptyState {
    font-size: 11pt;
    font-style: italic;
    opacity: 0.55;
}
.printRecipeName {
    padding-left: 10px;
}
.printDay {
    font-size: 22pt;
    font-weight: 700;
}

.printSlot {
    font-size: 15pt;
    font-weight: 700;
}

.printServiceTime {
    font-size: 12pt;
    font-weight: 600;
}

.printGuestCount,
.printArtistCount {
    font-size: 12pt;
    font-weight: 700;
}

.printSection {
    break-inside: avoid;
    margin-top: 0.45cm;
}

.printSectionTitle {
    font-size: 18pt;
    font-weight: 700;
    margin: 0 0 0.15cm;
}

.printMealGroup {
    break-inside: avoid;
    font-size: 16pt;
    margin-top: 0.2cm;
}

.printMealType {
    font-size: 13pt;
    font-weight: 700;
    margin: 0 0 0.1cm;
}

.printMealRow {
    align-items: baseline;
    display: flex;
    justify-content: space-between;
    padding: 0.08cm 0;
}

.printDietRow {
    display: flex;
    gap: 0.35cm;
    margin-bottom: 0.12cm;
}

.printDietCount {
    font-size: 13pt;
    font-weight: 700;
    min-width: 0.7cm;
}

.printDietList {
    display: flex;
    flex-direction: column;
    gap: 0.05cm;
}

.printDietText,
.printNoteLine,
.printRecipeName,
.printMealPortion {
    font-size: 12.5pt;
}

.printRecipeName {
    font-weight: 600;
    margin: 0;
}

.printMealPortion {
    font-weight: 600;
}

.printNotesSection {
    margin-top: 0.5cm;
}

.printModalOverlay {
    background: rgba(0, 0, 0, 0.65);
    inset: 0;
    position: fixed;
    z-index: 1000;
}

.printModal {
    background: var(--green);
    color: var(--beige);
    min-width: 300px;
    width: min(92vw, 420px);
}

.printModalTitle {
    font-size: 18px;
    font-weight: 700;
}

.printModalBtn,
.printModalCancelBtn {
    background: color-mix(in srgb, var(--beige) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--beige) 20%, transparent);
    border-radius: 8px;
    color: var(--beige);
    cursor: pointer;
    padding: 10px 12px;
}

.printModalBtn {
    justify-content: flex-start;
}

.serviceTabLabel {
    font-size: 18px;
    font-weight: 600;
}

.mealTypeLabel {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--beige);
    opacity: 0.5;
    margin-top: 6px;
}

.noMeals {
    text-align: center;
    color: var(--beige);
    opacity: 0.5;
    padding: 20px;
}

.priceSummary {
    background: color-mix(in srgb, var(--beige) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--beige) 20%, transparent);
    color: var(--beige);
}

.liBox {
    padding-left: 20px;
}
</style>

<style>
.printArea {
    display: none;
}

@media print {
    body {
        background: white !important;
        margin: 0;
        padding: 0;
    }

    body > *:not(.printArea) {
        display: none !important;
    }

    .printArea {
        display: block;
    }
}
</style>
