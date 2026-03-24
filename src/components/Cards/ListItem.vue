<script setup lang="ts">
import Icon from '@/components/Icon/Main.vue'

withDefaults(defineProps<{
    showMenuButton?: boolean
    layout?: 'default' | 'slim'
    active?: boolean
}>(), {
    showMenuButton: false,
    layout: 'default',
    active: false
})

const emit = defineEmits(['toggleMenu'])
</script>

<template>
    <div
        :class="[
            active ? 'beigeCardGreenText' : '',
            layout === 'slim' ? 'slim' : ''
        ]"
        class="
            listItem
            flex alignCenter justifyBetween
        "
    >
        <div class="flex alignCenter gap10">
            <slot name="icon" />

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
        </div>
    </div>
</template>

<style scoped>
.listItem {
    padding: 3px 10px 3px 20px;
    border-radius: 10px;
    border: 1px solid var(--beige);
    transition: all 200ms;
    gap: 30px;
}

.listItem.slim {
    padding: 2px 8px 2px 14px;
}

.listItemText {
    font-size: 18px;
    font-weight: 700;
    text-transform: capitalize;
}

.slim .listItemText {
    font-size: 18px;
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

.dropdownMenu {
    background: var(--green);
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid #ddd;
    z-index: 10;
    min-width: 160px;
}
</style>
