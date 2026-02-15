<script setup>
import ModalMain from '@/components/Architecture/Overlay/Modal/Main.vue'
import { useModal } from '@/composables/modal'

const {
    modalState,
    showModal,
    confirm,
    cancel
} = useModal()

</script>

<template>
    <div 
        id="overlay-container"
        class="
            absolute top0 left0 full
            noEvents
        "
    >
        <ModalMain />
    </div>
</template>

<style scoped>

</style>