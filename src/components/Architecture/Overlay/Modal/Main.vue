<script setup lang="ts">
import { useModal } from '@/composables/modal'
import { provide } from 'vue'

const { 
    modalState, 
    confirm, 
    cancel 
} = useModal()

// Provide modal functions to child components
provide('modal', { confirm, cancel })

</script>

<template>
    <div
        id="modal-container"
        :class="[
            'full',
            'centered',
            modalState.visible ? 'visible allEvents' : 'notVisible noEvents'
        ]"
    >
        <div 
            class="modalBox"
        >
            <!-- Custom modal component -->
            <component
                v-if="modalState.modal && modalState.modalType === 'custom'"
                :is="modalState.modal"
                v-bind="modalState.data"
                @confirm="confirm"
                @cancel="cancel"
                class="modalComponent"
            />
        </div>
    </div>
</template>

<style scoped>
#modal-container {
    background-color: rgba(0, 0, 0, 0);
    padding: 10px;
    pointer-events: none;
    transition: 500ms ease-in-out;
}

#modal-container.visible {
    background-color: rgba(0, 0, 0, 0.579);
    pointer-events: all;
}

#modal-container.notVisible {
    opacity: 0;
    pointer-events: none;
}

.modalBox {
    width: min(500px, 100%);
    height: 100%;
    background-color: var(--green);
    padding: 30px;
    border-radius: 30px;
    margin: auto;
    overflow: hidden;
}
.modalComponent {
    height: 100%;
    overflow: scroll;
}
</style>