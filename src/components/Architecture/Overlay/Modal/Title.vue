<script setup>
import Icon from '@/components/Icon/Main.vue'
import { useModal } from '@/composables/modal'

const { cancel } = useModal()
</script>

<template>
    <div
        class="flex justifyBetween alignCenter"
    >
        <p>
            <slot />
        </p>

        <Icon
            @click="cancel"
            class="pointer"
            size="lg"
        >
            close
        </Icon>
    </div>
</template>

<style scoped>
p {
    font-size: 24px;
    font-weight:700
}
</style>