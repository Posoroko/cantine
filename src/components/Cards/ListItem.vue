<script setup lang="ts">
import { ref } from 'vue'
import Icon from '@/components/Icon/Main.vue'

type MenuOption = {
    label: string
    icon?: string
    onClick: () => void
}

withDefaults(defineProps<{
    showMenuButton?: boolean
    layout?: 'default' | 'slim' | 'createButton'
    active?: boolean
    pointer?: boolean
    disableMenu?: boolean
    extraMenuOptions?: MenuOption[]
}>(), {
    showMenuButton: false,
    layout: 'default',
    active: false,
    pointer: true,
    disableMenu: false,
    extraMenuOptions: () => []
})

const emit = defineEmits(['toggleMenu', 'edit', 'delete'])

const menuOpen = ref(false)

function handleEdit() {
    menuOpen.value = false
    emit('edit')
}

function handleDelete() {
    menuOpen.value = false
    emit('delete')
}

function handleOption(option: MenuOption) {
    menuOpen.value = false
    option.onClick()
}
</script>

<template>
    <div
        :class="[
            active ? 'beigeCardGreenText' : '',
            layout,
            pointer ? 'pointer' : ''
        ]"
        class="
            listItem
            flex alignCenter justifyBetween
        "
    >
        <div class="flex alignCenter gap30">

            <Icon 
                size="lg" 
                class="serviceIcon"
            >
                <slot name="icon" />
            </Icon>
            

            <div
                class="flex column"
            >
                <span class="listItemText">
                    <slot name="text" />
                </span>

                <span class="listItemDetails">
                    <slot name="details" />
                </span>
            </div>
        </div>

        <div
            class="
                flex alignCenter
                relative
            "
        >
            <slot name="extraContent" />

            <button
                v-if="showMenuButton"
                @click.stop.prevent="emit('toggleMenu')"
                class="
                    menuButton
                    pointer
                    flex alignCenter
                "
            >
                <Icon size="lg">
                    more_vert
                </Icon>
            </button>

            <div
                v-if="$slots.menu"
                @click.stop.prevent
                class="
                    dropdownMenu
                    absolute top0 right0 pad10
                    flex column
                "
            >
                <slot name="menu" />
            </div>

            <!-- Self-contained menu -->
            <template v-if="!disableMenu && !showMenuButton">
                <div
                    v-if="menuOpen"
                    @click.stop="menuOpen = false"
                    class="menuOverlay"
                />

                <button
                    @click.stop.prevent="menuOpen = !menuOpen"
                    class="
                        menuButton
                        pointer
                        flex alignCenter
                    "
                >
                    <Icon size="lg">
                        more_vert
                    </Icon>
                </button>

                <div
                    v-if="menuOpen"
                    @click.stop.prevent
                    class="
                        dropdownMenu
                        absolute top0 right0 pad10
                        flex column
                    "
                >
                    <button
                        @click="handleEdit"
                        class="
                            menuItem
                            flex alignCenter gap10
                        "
                    >
                        <Icon size="sm">edit</Icon>
                        Modifier
                    </button>

                    <button
                        @click="handleDelete"
                        class="
                            menuItem
                            flex alignCenter gap10
                        "
                    >
                        <Icon size="sm">delete</Icon>
                        Supprimer
                    </button>

                    <button
                        v-for="option in extraMenuOptions"
                        :key="option.label"
                        @click="handleOption(option)"
                        class="
                            menuItem
                            flex alignCenter gap10
                        "
                    >
                        <Icon
                            v-if="option.icon"
                            size="sm"
                        >
                            {{ option.icon }}
                        </Icon>
                        {{ option.label }}
                    </button>
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
.listItem {
    padding: 10px 20px;
    border-radius: 5px;
    border: 1px solid var(--beige);
    transition: all 200ms;
    gap: 30px;
}

.listItem.slim {
    padding: 2px 8px 2px 14px;
}

.listItem.createButton {
    border-style: dashed;
    opacity: 0.7;
}

.listItemText {
    font-size: 18px;
    font-weight: 700;
    text-transform: capitalize;
}

.slim .listItemText {
    /* font-size: 18px; */
    font-weight: 600;
}

.menuButton {
    width: 32px;
    aspect-ratio: 1;
    color: var(--beige);
}

.slim .menuButton {
    width: 28px;
}

.menuOverlay {
    position: fixed;
    inset: 0;
    z-index: 9;
}

.dropdownMenu {
    background: var(--green);
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid var(--beige);
    z-index: 10;
    min-width: 160px;
    box-shadow: 0 2px 5px 3px rgba(0, 0, 0, 0.422);
}

.menuItem {
    padding: 10px 14px;
    background: transparent;
    color: var(--beige);
    border: none;
    cursor: pointer;
    white-space: nowrap;
    font-size: 14px;
    text-align: left;
}

.menuItem:hover {
    background: rgba(255, 255, 255, 0.1);
}
</style>
