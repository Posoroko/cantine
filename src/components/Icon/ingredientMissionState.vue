<script setup lang="ts">
type MissionState = 'none' | 'created' | 'prepLess'

const { state } = defineProps<{
    state: MissionState
}>()

const iconMap: Record<MissionState, string> = {
    none: 'check_box_outline_blank',
    created: 'select_check_box',
    prepLess: 'disabled_by_default',
}
</script>

<template>
    <span class="">
        {{ iconMap[state] }}
    </span>
</template>
