<script setup lang="ts">
import { computed, watch } from 'vue'
import { toasts, removeToast } from '@/composables/toaster'
import AppConfig from '@/composables/appConfig'
import Icon from '@/components/Icon/Main.vue'

const topToasts = computed(() => toasts.value.filter(t => t.position === 'top'))
const bottomToasts = computed(() => toasts.value.filter(t => t.position === 'bottom'))

const typeIcons: Record<string, string> = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
}

watch(toasts, (newToasts) => {
    for (const toast of newToasts) {
        setTimeout(() => {
            removeToast(toast.id)
        }, AppConfig.toasterDuration)
    }
}, { deep: true })
</script>

<template>
    <div
        id="toaster-container"
        class="
            absolute top0 left0 full
            flex column justifyBetween
            pad10
            noEvents
        "
    >
        <div
            class="
                topStack
                flex column gap5 w100 marginAuto
            "
        >
            <div
                v-for="toast in topToasts"
                :key="toast.id"
                @click="removeToast(toast.id)"
                class="
                    toast
                    flex alignCenter gap10
                    rounded10
                    allEvents pointer
                "
                :class="[
                    `toast--${toast.type}`
                ]"
            >
                <Icon v-if="toast.icon || typeIcons[toast.type]">
                    {{ toast.icon || typeIcons[toast.type] }}
                </Icon>

                <span>{{ toast.text }}</span>
            </div>
        </div>

        <div
            class="
                bottomStack
                flex column gap5 w100 marginAuto
            "
        >
            <div
                v-for="toast in bottomToasts"
                :key="toast.id"
                @click="removeToast(toast.id)"
                class="
                    toast
                    flex alignCenter gap10
                    rounded10
                    allEvents pointer
                "
                :class="[
                    `toast--${toast.type}`
                ]"
            >
                <Icon v-if="toast.icon || typeIcons[toast.type]">
                    {{ toast.icon || typeIcons[toast.type] }}
                </Icon>

                <span>{{ toast.text }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
#toaster-container {
    z-index: 1;
}

.topStack {
    padding-top: 10px;
}

.bottomStack {
    padding-bottom: 60px;
}

.toast {
    padding: 12px 16px;
    color: var(--color-white);
    font-size: 0.9rem;
    animation: toastIn 300ms ease-out;
}

.toast--success {
    background-color: var(--color-success);
}

.toast--error {
    background-color: var(--color-error);
}

.toast--warning {
    background-color: var(--color-warning);
    color: var(--color-gray-900);
}

.toast--info {
    background-color: var(--color-info);
}

@keyframes toastIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
