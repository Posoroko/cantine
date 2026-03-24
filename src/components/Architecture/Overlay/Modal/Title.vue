<script setup lang="ts">
import Icon from '@/components/Icon/Main.vue'
import { useModal } from '@/composables/modal'

withDefaults(
    defineProps<{
        showBack?: boolean
    }>(), 
    {
        showBack: false
    }
)

const { cancel } = useModal()
</script>

<template>
    <div
        class="flex justifyBetween alignCenter"
    >
        <div class="flex alignCenter gap10">
            <Icon
                v-if="showBack"
                @click="cancel('back')"
                class="pointer"
                size="lg"
            >
                arrow_back
            </Icon>

            <p>
                <slot />
            </p>
        </div>

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