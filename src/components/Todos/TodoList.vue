<script setup lang="ts">
import { nextTick, ref } from 'vue'
import Icon from '@/components/Icon/Main.vue'

export interface TodoItem {
    id: string | number
    text: string
    dueTime: string | null
    isPending: boolean
    closedBy?: string | null
}

withDefaults(defineProps<{
    todos: TodoItem[]
    canCreate?: boolean
    emptyText?: string
}>(), {
    canCreate: true,
    emptyText: 'Aucune tâche',
})

const emit = defineEmits<{
    create: [text: string, dueTime: string | null]
    toggle: [id: string | number]
    remove: [id: string | number]
}>()

const newText = ref('')
const newDueTime = ref('')
const showCreate = ref(false)
const newTextInput = ref<HTMLInputElement | null>(null)

function openCreate() {
    newText.value = ''
    newDueTime.value = ''
    showCreate.value = true
    nextTick(() => newTextInput.value?.focus())
}

function closeCreate() {
    showCreate.value = false
}

defineExpose({ openCreate })

function submitCreate() {
    const text = newText.value.trim()
    if (!text) return
    emit('create', text, newDueTime.value || null)
    closeCreate()
}

function formatTime(t: string | null): string {
    if (!t) return ''
    return t.slice(0, 5)
}
</script>

<template>
    <div class="todoList flex column gap6">

        <!-- create modal -->
        <Teleport to="body">
            <div
                v-if="showCreate && canCreate"
                class="createOverlay"
                @click.self="closeCreate"
            >
                <form
                    class="createModal flex column gap10"
                    @submit.prevent="submitCreate"
                >
                    <p class="textLg fontWeightBold">Nouvelle tâche</p>

                    <input
                        ref="newTextInput"
                        v-model="newText"
                        class="createInput marTop10"
                        type="text"
                        placeholder="Description de la tâche…"
                    />

                    <div class="flex column gap5 marTop10">
                        <label class="createLabel">Heure</label>
                        <input
                            v-model="newDueTime"
                            class="timeInput"
                            type="time"
                        />
                    </div>

                    <div class="flex gap10 justifyEnd">
                        <button
                            type="button"
                            class="cancelBtn"
                            @click="closeCreate"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            class="submitBtn"
                        >
                            Ajouter
                        </button>
                    </div>
                </form>
            </div>
        </Teleport>

        <!-- todo rows -->
        <div
            v-for="todo in todos"
            :key="todo.id"
            class="todoRow flex alignCenter gap10"
            :class="{ done: !todo.isPending }"
        >
            <span class="grow todoText flex1">
                {{ todo.text }}
            </span>

            <div
                class="flex gap10"
            >
                <span
                    v-if="todo.dueTime"
                    class="textLg fontWeightBold"
                >
                    {{ formatTime(todo.dueTime) }}
                </span>

                <button
                    class="checkbox"
                    :class="{ checked: !todo.isPending }"
                    @click="emit('toggle', todo.id)"
                >
                    <Icon v-if="!todo.isPending">check</Icon>
                </button>
            </div>

            <button
                v-if="canCreate"
                class="deleteBtn centered"
                @click="emit('remove', todo.id)"
            >
                <Icon>close</Icon>
            </button>
        </div>

    </div>
</template>

<style scoped>
.todoList {
    padding: 4px 0;
}

/* create modal */

.createOverlay {
    align-items: center;
    background: rgba(0, 0, 0, 0.6);
    bottom: 0;
    display: flex;
    justify-content: center;
    left: 0;
    padding: 20px;
    position: fixed;
    right: 0;
    top: 0;
    z-index: 200;
}

.createModal {
    background: var(--green);
    border: 1px solid color-mix(in srgb, var(--beige) 15%, transparent);
    border-radius: 16px;
    padding: 24px 20px;
    width: 100%;
    max-width: 420px;
}

.createInput {
    background: color-mix(in srgb, var(--beige) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--beige) 25%, transparent);
    border-radius: 8px;
    color: var(--beige);
    font-size: 1em;
    min-height: 42px;
    padding: 0 12px;
    width: 100%;
}

.createInput::placeholder {
    color: var(--beige);
    opacity: 0.3;
}

.createInput:focus {
    border-color: color-mix(in srgb, var(--beige) 55%, transparent);
    outline: none;
}

.timeInput {
    background: color-mix(in srgb, var(--beige) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--beige) 25%, transparent);
    border-radius: 8px;
    color: var(--beige);
    font-size: 1em;
    min-height: 42px;
    padding: 0 12px;
    width: 140px;
}

.timeInput:focus {
    border-color: color-mix(in srgb, var(--beige) 55%, transparent);
    outline: none;
}

.timeInput::-webkit-calendar-picker-indicator {
    cursor: pointer;
    filter: invert(1) opacity(0.5);
}

.timeInput::-webkit-calendar-picker-indicator:hover {
    filter: invert(1) opacity(1);
}

.cancelBtn {
    background: none;
    border: 1px solid color-mix(in srgb, var(--beige) 25%, transparent);
    border-radius: 8px;
    color: var(--beige);
    cursor: pointer;
    font-size: 0.95em;
    min-height: 40px;
    opacity: 0.6;
    padding: 0 18px;
}

.cancelBtn:hover {
    opacity: 1;
}

.submitBtn {
    background: color-mix(in srgb, var(--beige) 20%, transparent);
    border: 1px solid var(--beige);
    border-radius: 8px;
    color: var(--beige);
    cursor: pointer;
    font-size: 0.95em;
    font-weight: 600;
    min-height: 40px;
    padding: 0 22px;
    transition: background 0.15s;
}

.submitBtn:hover {
    background: color-mix(in srgb, var(--beige) 30%, transparent);
}

/* todo row */

.emptyText {
    color: var(--beige);
    font-size: 0.85em;
    opacity: 0.35;
    padding: 6px 2px;
}

.todoRow {
    border-radius: 8px;
    padding: 6px 4px;
    transition: background 0.12s;
}

.todoRow:hover {
    background: color-mix(in srgb, var(--beige) 5%, transparent);
}

.done {
    opacity: 0.45;
}

.checkbox {
    align-items: center;
    background: none;
    border: 2px solid color-mix(in srgb, var(--beige) 40%, transparent);
    border-radius: 5px;
    color: var(--beige);
    cursor: pointer;
    display: flex;
    flex-shrink: 0;
    font-size: 0.85em;
    height: 22px;
    justify-content: center;
    padding: 0;
    transition: background 0.15s, border-color 0.15s;
    width: 22px;
}

.checkbox.checked {
    background: var(--green);
    border-color: var(--green);
    color: #fff;
}

.todoText {
    color: var(--beige);
    font-size: 0.95em;
}

.done .todoText {
    text-decoration: line-through;
}

.deleteBtn {
    padding: 2px;
}
</style>
