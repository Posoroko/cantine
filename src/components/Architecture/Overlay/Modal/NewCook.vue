<template>
    <div class="newCookModal">
        <Title text="Ajouter un cuisinier" />
        
        <form @submit.prevent="handleSubmit">
            <div class="stepIndicator">
                <span class="colorBeige">({{ currentStep }}/2)</span>
            </div>
            
            <!-- Step 1: Basic Info -->
            <div v-if="currentStep === 1" class="step">
                <label for="cookName" class="colorBeige">
                    Nom *
                </label>
                <input
                    v-model="form.name"
                    id="cookName"
                    type="text"
                    class="translucide w100"
                    placeholder="Nom du cuisinier"
                    required
                />

                <label for="cookTelephone" class="colorBeige">
                    Téléphone
                </label>
                <input
                    v-model="form.telephone"
                    id="cookTelephone"
                    type="tel"
                    class="translucide w100"
                    placeholder="Téléphone"
                />

                <label for="cookEmail" class="colorBeige">
                    Email
                </label>
                <input
                    v-model="form.email"
                    id="cookEmail"
                    type="text"
                    class="translucide w100"
                    placeholder="Email"
                />
            </div>
            
            <!-- Step 2: Avatar -->
            <div v-if="currentStep === 2" class="step">
                <label class="colorBeige">
                    Avatar (optionnel)
                </label>
                <label class="avatarLabel">
                    <span v-if="!avatarPreview" class="uploadText">Cliquez pour sélectionner une image</span>
                    <img v-else :src="avatarPreview" :alt="form.name" class="avatarPreview" />
                    <input
                        type="file"
                        accept="image/*"
                        @change="handleAvatarSelect"
                        class="fileInput"
                    />
                </label>
                <p class="avatarHint">Format: JPG, PNG. Taille max: 5MB</p>
            </div>
            
            <!-- Navigation Buttons -->
            <div class="buttonContainer">
                <button
                    v-if="currentStep > 1"
                    type="button"
                    @click="previousStep"
                    class="buttonSecondary"
                >
                    Précédent
                </button>
                <button
                    v-if="currentStep < 2"
                    type="button"
                    @click="nextStep"
                    class="buttonPrimary"
                    :disabled="!form.name"
                >
                    Suivant
                </button>
                <button
                    v-if="currentStep === 2"
                    type="submit"
                    class="buttonPrimary"
                    :disabled="isSubmitting || !form.name"
                >
                    {{ isSubmitting ? 'Création...' : 'Créer' }}
                </button>
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Title from '@/components/Architecture/Overlay/Modal/Title.vue'
import { useModal } from '@/composables/modal'
import { useCooks } from '@/composables/cooks'

const emit = defineEmits(['confirm', 'cancel'])

const { modalState, confirm } = useModal()
const { createCook, hire } = useCooks()

const currentStep = ref(1)
const isSubmitting = ref(false)
const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string | null>(null)

const form = ref({
    name: '',
    telephone: '',
    email: '',
})

const eventId = computed(() => modalState.value.data?.eventId)

const handleAvatarSelect = (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (file) {
        avatarFile.value = file
        const reader = new FileReader()
        reader.onload = (e) => {
            avatarPreview.value = e.target?.result as string
        }
        reader.readAsDataURL(file)
    }
}

const nextStep = () => {
    if (currentStep.value < 2) {
        currentStep.value++
    }
}

const previousStep = () => {
    if (currentStep.value > 1) {
        currentStep.value--
    }
}

const handleSubmit = async () => {
    isSubmitting.value = true

    try {
        const cookData = {
            name: form.value.name,
            telephone: form.value.telephone,
            email: form.value.email,
            avatarFile: avatarFile.value || undefined,
        }

        const newCook = await createCook(cookData)

        // If eventId is present, hire the cook to the event
        if (eventId.value) {
            await hire(newCook.id, eventId.value)
        }

        // Reset form
        form.value = {
            name: '',
            telephone: '',
            email: '',
        }
        avatarFile.value = null
        avatarPreview.value = null
        currentStep.value = 1

        // Emit and close modal
        emit('confirm', newCook)
        confirm()
    } catch (error) {
        console.error('Erreur lors de la création du cuisinier:', error)
        // TODO: Show error notification
    } finally {
        isSubmitting.value = false
    }
}
</script>

<style scoped>
.newCookModal {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px;
    border-radius: 12px;
}

.step {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.avatarLabel {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 150px;
    height: 150px;
    border-radius: 8px;
    background-color: var(--lightGray, #f5f5f5);
    cursor: pointer;
    overflow: hidden;
    border: 2px dashed var(--green);
    transition: all 200ms;
}

.avatarLabel:hover {
    background-color: var(--gold, #d4af37);
    opacity: 0.8;
}

.uploadText {
    text-align: center;
    color: var(--green);
    font-size: 14px;
    padding: 10px;
}

.avatarPreview {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.fileInput {
    display: none;
}

.avatarHint {
    font-size: 12px;
    color: #666;
    margin-top: -10px;
}

.buttonContainer {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 10px;
}

.buttonPrimary,
.buttonSecondary {
    padding: 10px 20px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-weight: 600;
    transition: all 200ms;
    font-size: 14px;
}

.buttonPrimary {
    background-color: var(--green);
    color: white;
}

.buttonPrimary:hover:not(:disabled) {
    background-color: var(--green);
    opacity: 0.9;
    transform: translateY(-2px);
}

.buttonPrimary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.buttonSecondary {
    background-color: #ddd;
    color: #333;
}

.buttonSecondary:hover {
    background-color: #ccc;
    transform: translateY(-2px);
}
</style>
