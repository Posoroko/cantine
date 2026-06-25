<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { dbGet, dbPatch } from '@/composables/fetch'
import { useUserState } from '@/composables/userState'
import TodoList from '@/components/Todos/TodoList.vue'
import type { TodoItem } from '@/components/Todos/TodoList.vue'
import Icon from '@/components/Icon/Main.vue'

const route = useRoute()
const eventId = computed(() => parseInt(route.params.eventId as string))

const eventTodoListRef = ref<InstanceType<typeof TodoList> | null>(null)
const userState = useUserState()

const activeTab = ref<'notes' | 'todos'>('todos')

// ─── notes ───────────────────────────────────────────────────────────────────

const notesText = ref('')
const notesSaving = ref(false)

async function saveNotes() {
    if (notesSaving.value) return
    notesSaving.value = true
    try {
        await dbPatch({
            endpoint: `/items/events/${eventId.value}`,
            body: { notes: notesText.value },
        })
    } finally {
        notesSaving.value = false
    }
}

// ─── event-level todos (JSON on events.toDos) ────────────────────────────────

const eventTodos = ref<TodoItem[]>([])

async function saveEventTodos() {
    await dbPatch({
        endpoint: `/items/events/${eventId.value}`,
        body: { toDos: eventTodos.value },
    })
}

function onCreateEventTodo(text: string, dueTime: string | null) {
    eventTodos.value = [
        ...eventTodos.value,
        { id: crypto.randomUUID(), text, dueTime, isPending: true, closedBy: null },
    ]
    saveEventTodos()
}

function onToggleEventTodo(id: string | number) {
    eventTodos.value = eventTodos.value.map(t =>
        t.id === id
            ? { ...t, isPending: !t.isPending, closedBy: t.isPending ? (userState.value.id || null) : null }
            : t
    )
    saveEventTodos()
}

function onRemoveEventTodo(id: string | number) {
    eventTodos.value = eventTodos.value.filter(t => t.id !== id)
    saveEventTodos()
}

// ─── day todos (Directus toDos collection) ───────────────────────────────────

type DayGroup = { dayId: number; dayLabel: string; todos: TodoItem[] }
const dayTodoGroups = ref<DayGroup[]>([])

async function fetchDayTodos() {
    const raw = await dbGet<any[]>({
        endpoint: '/items/toDos',
        query: {
            fields: 'id,text,dueTime,isPending,user_markedAsClosed,day.id,day.dayOfTheWeek',
            sort: 'dueTime',
            limit: -1,
            filter: {
                day: {
                    event: { _eq: eventId.value },
                },
            },
        },
    })

    const map = new Map<number, DayGroup>()
    for (const t of raw ?? []) {
        const dayId = t.day?.id
        const dayLabel = t.day?.dayOfTheWeek ?? `Jour ${dayId}`
        if (!map.has(dayId)) map.set(dayId, { dayId, dayLabel, todos: [] })
        map.get(dayId)!.todos.push({
            id: t.id,
            text: t.text ?? '',
            dueTime: t.dueTime ?? null,
            isPending: t.isPending ?? true,
            closedBy: t.user_markedAsClosed ?? null,
        })
    }
    dayTodoGroups.value = [...map.values()]
}

// c5t: day todos can only be toggled from the event page — not created or deleted
async function onToggleDayTodo(id: string | number) {
    let newPending = true
    dayTodoGroups.value = dayTodoGroups.value.map(g => ({
        ...g,
        todos: g.todos.map(t => {
            if (t.id !== id) return t
            newPending = !t.isPending
            return { ...t, isPending: newPending, closedBy: newPending ? null : (userState.value.id || null) }
        }),
    }))
    await dbPatch({
        endpoint: `/items/toDos/${id}`,
        body: {
            isPending: newPending,
            user_markedAsClosed: newPending ? null : (userState.value.id || null),
        },
    })
}

// ─── init ─────────────────────────────────────────────────────────────────────

onMounted(async () => {
    const [eventData] = await Promise.all([
        dbGet<any>({
            endpoint: `/items/events/${eventId.value}`,
            query: { fields: 'notes,toDos' },
        }),
        fetchDayTodos(),
    ])
    notesText.value = eventData?.notes ?? ''
    eventTodos.value = Array.isArray(eventData?.toDos) ? eventData.toDos : []
})
</script>

<template>
    <div class="notesAndTodos flex column gap16 pad10">

        <!-- sub-tab bar -->
        <div class="subTabBar flex gap6">
            <button
                class="subTabBtn"
                :class="{ active: activeTab === 'todos' }"
                @click="activeTab = 'todos'"
            >
                Todos
            </button>
            <button
                class="subTabBtn"
                :class="{ active: activeTab === 'notes' }"
                @click="activeTab = 'notes'"
            >
                Notes
            </button>
        </div>

        <!-- notes tab -->
        <textarea
            v-if="activeTab === 'notes'"
            v-model="notesText"
            class="notesArea marTop20"
            placeholder="Notes opérationnelles…"
            @blur="saveNotes"
        />

        <!-- todos tab -->
        <div
            v-else
            class="flex column gap20"
        >
            <!-- event-level todos -->
            <div class="todoSection flex column marTop20">
                <div class="sectionHeader flex alignCenter justifyBetween">
                    <p class="fontWeightBold textLg">Événement</p>
                    <button
                        class="addTodoBtn"
                        @click="eventTodoListRef?.openCreate()"
                    >
                        <Icon>add</Icon>
                    </button>
                </div>
                <TodoList
                    ref="eventTodoListRef"
                    :todos="eventTodos"
                    emptyText="Aucune tâche générale"
                    @create="onCreateEventTodo"
                    @toggle="onToggleEventTodo"
                    @remove="onRemoveEventTodo"
                />
            </div>

            <!-- day todos grouped -->
            <div
                v-for="group in dayTodoGroups"
                :key="group.dayId"
                class="todoSection flex column gap8"
            >
                <p class="sectionLabel capitalize">{{ group.dayLabel }}</p>
                <TodoList
                    :todos="group.todos"
                    :canCreate="false"
                    emptyText="Aucune tâche"
                    @toggle="onToggleDayTodo"
                />
            </div>
        </div>

    </div>
</template>

<style scoped>
.notesAndTodos {
    max-width: 640px;
}

/* sub-tabs */

.subTabBar {
    border-bottom: 1px solid color-mix(in srgb, var(--beige) 15%, transparent);
    padding-bottom: 2px;
}

.subTabBtn {
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--beige);
    cursor: pointer;
    font-size: 0.95em;
    margin-bottom: -3px;
    opacity: 0.45;
    padding: 6px 14px;
    transition: opacity 0.15s, border-color 0.15s;
}

.subTabBtn.active {
    border-bottom-color: var(--beige);
    font-weight: 600;
    opacity: 1;
}

/* notes */

.notesArea {
    background: color-mix(in srgb, var(--beige) 5%, transparent);
    border: 1px solid color-mix(in srgb, var(--beige) 20%, transparent);
    border-radius: 12px;
    color: var(--beige);
    font-size: 0.95em;
    line-height: 1.6;
    min-height: 260px;
    padding: 14px;
    resize: vertical;
    width: 100%;
}

.notesArea::placeholder {
    color: var(--beige);
    opacity: 0.25;
}

.notesArea:focus {
    border-color: color-mix(in srgb, var(--beige) 45%, transparent);
    outline: none;
}

/* todo sections */

.todoSection {
    background: color-mix(in srgb, var(--beige) 5%, transparent);
    border-radius: 12px;
    padding: 12px 14px;
}

.sectionHeader {
    margin-bottom: 4px;
}



.capitalize {
    text-transform: capitalize;
}

.addTodoBtn {
    background: none;
    border: none;
    color: var(--beige);
    cursor: pointer;
    opacity: 0.45;
    padding: 2px;
    transition: opacity 0.15s;
}

.addTodoBtn:hover {
    opacity: 1;
}
</style>
