<script setup>
import ModalButtons from '@/components/Architecture/Overlay/Modal/Buttons.vue'

const props = defineProps({
    firstStep: {
        type: Boolean,
        default: false
    },
    lastStep: {
        type: Boolean,
        default: false
    },
    valid: {
        type: Boolean,
        default: true
    }
})

const emit = defineEmits(['previous', 'next', 'save'])

</script>

<template>
    <div 
        class="
            box
        "
    >
        <div>
            <slot />
        </div>

        <div class="flex justifyBetween">
            <div>
                <button
                    v-if="!firstStep"
                    @click.prevent.stop="emit('previous')"
                    class="colorBeige"
                >
                    ← Retour
                </button>
            </div>

            <button
                v-if="lastStep"
                :disabled="!valid"
                @click.prevent.stop="emit('save')"
            >
                Valider
            </button>

            <button
                v-else
                :disabled="!valid"
                @click.prevent.stop="emit('next')"
            >
                Continuer
            </button>

        </div>
    </div>
</template>