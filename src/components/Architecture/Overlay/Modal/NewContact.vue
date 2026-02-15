<script setup>
import { ref, computed } from 'vue'
import Title from '@/components/Architecture/Overlay/Modal/Title.vue'
import FormStep from '@/components/Architecture/Overlay/Modal/Step.vue'
import { useModal } from '@/composables/modal'
import { useEvents } from '@/composables/events'

const emit = defineEmits(['confirm', 'cancel'])

const { modalState, confirm, cancel } = useModal()
const { createContact } = useEvents()

const eventId = computed(() => modalState.value.data?.eventId)

const activeStep = ref(0)
const totalSteps = 2

const name = ref('')
const telephone = ref('')
const email = ref('')
const notes = ref('')

const isLastStep = computed(() => activeStep.value === totalSteps - 1)

// Validation
const isNameValid = computed(() => name.value.trim().length > 0)
const isTelephoneValid = computed(() => telephone.value.trim().length > 0 || telephone.value === '')
const isEmailValid = computed(() => email.value.trim().length > 0 || email.value === '')
const isCurrentStepValid = computed(() => {
    if (activeStep.value === 0) return isNameValid.value && isTelephoneValid.value && isEmailValid.value
    if (activeStep.value === 1) return true
    return true
})

function goToNext() {
    if (activeStep.value < totalSteps - 1) {
        activeStep.value++
    }
}

function goToPrevious() {
    if (activeStep.value > 0) {
        activeStep.value--
    }
}

async function handleSave() {
    try {
        console.log('Creating contact with eventId:', eventId.value)
        const result = await createContact({
            eventId: eventId.value,
            name: name.value,
            telephone: telephone.value,
            email: email.value,
            notes: notes.value
        })
        console.log('Contact created successfully:', result)
        emit('confirm', result)
    } catch (error) {
        console.error('Failed to create contact:', error)
    }
}
</script>

<template>
    <div class="full flex column gap20">
        <Title>
            Ajouter un contact
            <span class="colorBeige">({{ activeStep + 1 }}/{{ totalSteps }})</span>
        </Title>

        <form>
            <!-- Step 1: Name, Telephone, Email -->
            <FormStep
                v-if="activeStep === 0"
                @previous="goToPrevious"
                @next="goToNext"
                :valid="isCurrentStepValid"
                :firstStep="true"
                class="flex column"
            >
                <label for="contactName" class="colorBeige">
                    Nom
                </label>
                <input
                    v-model="name"
                    id="contactName"
                    type="text"
                    class="translucide w100"
                />

                <label for="contactTelephone" class="colorBeige">
                    Téléphone
                </label>
                <input
                    v-model="telephone"
                    id="contactTelephone"
                    type="tel"
                    class="translucide w100"
                />

                <label for="contactEmail" class="colorBeige">
                    Email
                </label>
                <input
                    v-model="email"
                    id="contactEmail"
                    type="email"
                    class="translucide w100"
                />
            </FormStep>

            <!-- Step 2: Notes -->
            <FormStep
                v-if="activeStep === 1"
                @previous="goToPrevious"
                @save="handleSave"
                :valid="isCurrentStepValid"
                class="flex column"
                lastStep
            >
                <label for="contactNotes" class="colorBeige">
                    Notes
                </label>
                <textarea
                    v-model="notes"
                    id="contactNotes"
                    class="translucide w100"
                    rows="6"
                />
            </FormStep>
        </form>
    </div>
</template>

<style scoped>
label {
    font-size: 14px;
    margin-bottom: 8px;
    display: block;
}

input,
textarea {
    padding: 10px;
    border: 1px solid var(--beige);
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.5);
    color: var(--beige);
    font-family: inherit;
}

input:focus,
textarea:focus {
    outline: none;
    border-color: var(--gold);
    background: rgba(0, 0, 0, 0.7);
}

textarea {
    resize: vertical;
}
</style>
