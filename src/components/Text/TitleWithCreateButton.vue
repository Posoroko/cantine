<script setup>
import Icon from '@/components/Icon/Main.vue'
const emit = defineEmits(['createNew'])
</script>

<template>
    <div
        class="flex justifyBetween alignCenter"
    >
        <h1
            class="caprasimo colorBeige"
        >
            <slot />
        </h1>

        <button
            @click="emit('createNew')"
            class="block centered"
        >
            <Icon
                color="beige"
                size="xl"
            >
                add
            </Icon>
        </button>
    </div>
</template>

<style scoped>

</style>