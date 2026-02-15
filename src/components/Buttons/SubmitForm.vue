<script setup lang="ts">
defineProps<{
    text: string
    iconName?: string
    color?: 'green' | 'beige' | 'transparent'
}>()
</script>

<template>
    <button
        class="roboto fontWeightSemibold"
        :class="[
            color
        ]"
    >
        <slot>
            {{ text }}
        </slot>
    </button>
</template>

<style scoped>
button{
    padding: 8px 14px;
}
button.green {
    color: var(--beige);
    background-color: var(--green);
}
button.beige {
    color: var(--green);
    background-color: var(--beige);
}
button.transparent {
    color: var(--beige);
    background-color: transparent;
}
</style>