<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Icon from '@/components/Icon/Main.vue'

const props = defineProps({
    collection: {
        type: String,
        required: true
    },
    id: {
        type: [Number, String],
        required: true
    },
    canDelete: {
        type: Boolean,
        default: false
    },
    canUpdate: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['delete', 'update'])

const isOpen = ref(false)
const menuRef = ref(null)

function toggleMenu() {
    isOpen.value = !isOpen.value
}

function closeMenu() {
    isOpen.value = false
}

function handleDelete() {
    emit('delete', { collection: props.collection, id: props.id })
    closeMenu()
}

function handleUpdate() {
    emit('update', { collection: props.collection, id: props.id })
    closeMenu()
}

function handleClickOutside(event) {
    if (menuRef.value && !menuRef.value.contains(event.target)) {
        closeMenu()
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
    <div class="menuButtonContainer" ref="menuRef">
        <button
            @click="toggleMenu"
            class="menuButton"
            aria-label="Menu"
        >
            <Icon>more_vert</Icon>
        </button>

        <div v-if="isOpen" class="menu">
            <button
                v-if="canUpdate"
                @click="handleUpdate"
                class="menuItem updateItem"
            >
                <Icon>edit</Icon>
                <span>Modifier</span>
            </button>

            <button
                v-if="canDelete"
                @click="handleDelete"
                class="menuItem deleteItem"
            >
                <Icon>delete</Icon>
                <span>Supprimer</span>
            </button>
        </div>
    </div>
</template>

<style scoped>
.menuButtonContainer {
    position: relative;
    display: inline-block;
}

.menuButton {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 200ms ease;
}

.menuButton:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.menu {
    position: absolute;
    top: 100%;
    right: 0;
    background-color: var(--green);
    border: 1px solid var(--beige);
    border-radius: 8px;
    min-width: 150px;
    margin-top: 4px;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    overflow: hidden;
}

.menuItem {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 15px;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--beige);
    text-align: left;
    font-size: 14px;
    transition: background-color 150ms ease;
}

.menuItem:hover {
    background-color: rgba(169, 169, 132, 0.2);
}

.menuItem:first-child {
    border-radius: 8px 8px 0 0;
}

.menuItem:last-child {
    border-radius: 0 0 8px 8px;
}

.deleteItem:hover {
    background-color: rgba(220, 100, 100, 0.2);
}
</style>
