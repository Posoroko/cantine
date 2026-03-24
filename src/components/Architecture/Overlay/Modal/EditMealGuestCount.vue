<script setup>
import { ref, computed } from 'vue'
import Title from '@/components/Architecture/Overlay/Modal/Title.vue'
import { useModal } from '@/composables/modal'
import { dbPatch } from '@/composables/fetch'

const emit = defineEmits(['confirm', 'cancel'])

const { modalState } = useModal()

const mealId = computed(() => modalState.value.data?.mealId)
const currentCount = computed(() => modalState.value.data?.guestCount)

const guestCount = ref(currentCount.value || '')
const isSubmitting = ref(false)

const isValid = computed(() => {
    const n = Number(guestCount.value)
    return guestCount.value !== '' && Number.isFinite(n) && n > 0
})

async function handleSave() {
    if (!isValid.value || !mealId.value) return

    isSubmitting.value = true

    try {
        await dbPatch({
            endpoint: `/items/meals/${mealId.value}`,
            body: { guestCount: guestCount.value }
        })

        emit('confirm', { guestCount: guestCount.value })
    } catch (error) {
        console.error('Failed to update guest count:', error)
    } finally {
        isSubmitting.value = false
    }
}
</script>

<template>
    <div class="flex column gap20">
        <Title>
            Modifier le nombre de convives
        </Title>

        <form
            @submit.prevent="handleSave"
            class="flex column gap15"
        >
            <label
                for="guestCount"
                class="colorBeige"
            >
                Nombre de convives
            </label>

            <input
                v-model="guestCount"
                id="guestCount"
                type="number"
                min="1"
                class="translucide w100"
                autofocus
            />

            <div class="flex justifyEnd gap10">
                <button
                    type="button"
                    @click="emit('cancel')"
                    class="cancelBtn"
                >
                    Annuler
                </button>

                <button
                    type="submit"
                    :disabled="!isValid || isSubmitting"
                    class="confirmBtn"
                >
                    {{ isSubmitting ? 'Enregistrement...' : 'Enregistrer' }}
                </button>
            </div>
        </form>
    </div>
</template>

<style scoped>
label {
    font-size: 14px;
    display: block;
}

input {
    padding: 10px;
    border: 1px solid var(--beige);
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.5);
    color: var(--beige);
    font-family: inherit;
    font-size: 18px;
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

.confirmBtn {
    background-color: var(--beige);
    color: var(--green);
}

.confirmBtn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}
</style>
