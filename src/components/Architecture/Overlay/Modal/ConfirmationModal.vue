<script setup lang="ts">
const props = defineProps({
    title: {
        type: String,
        default: ''
    },
    message: {
        type: String,
        default: ''
    },
    confirmText: {
        type: String,
        default: 'Confirmer'
    },
    cancelText: {
        type: String,
        default: 'Annuler'
    }
})

const emit = defineEmits(['confirm', 'cancel'])

function handleConfirm() {
    emit('confirm', true)
}

function handleCancel() {
    emit('cancel')
}
</script>

<template>
    <div class="full flex column gap20">
        <div class="titleSection">
            <h2
                v-if="title"
                class="title"
            >
                {{ title }}
            </h2>
        </div>

        <p class="message">{{ message }}</p>

        <div class="buttonsSection flex gap10">
            <button
                @click="handleCancel"
                class="cancelBtn"
            >
                {{ cancelText }}
            </button>
            <button
                @click="handleConfirm"
                class="confirmBtn"
            >
                {{ confirmText }}
            </button>
        </div>
    </div>
</template>

<style scoped>
.titleSection {
    display: flex;
    align-items: center;
    gap: 10px;
}

.title {
    margin: 0;
    font-size: 20px;
    color: var(--beige);
}

.message {
    margin: 0;
    color: var(--beige);
    font-size: 14px;
    line-height: 1.6;
}

.buttonsSection {
    margin-top: 10px;
    justify-content: flex-end;
}

.cancelBtn,
.confirmBtn {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    transition: all 200ms ease;
    font-weight: 500;
}

.cancelBtn {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--beige);
}

.cancelBtn:hover {
    background-color: rgba(255, 255, 255, 0.2);
}

.confirmBtn {
    background-color: var(--beige);
    color: var(--green);
}

.confirmBtn:hover {
    background-color: rgba(255, 255, 255, 0.9);
}
</style>
