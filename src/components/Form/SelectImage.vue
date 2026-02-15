<script setup>
import { ref } from 'vue'
import Icon from '@/components/Icon/Main.vue'

const props = defineProps({
    camera: {
        type: Boolean,
        default: false
    },
    storage: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['change', 'clear'])

const selectedImage = ref(null)
const fileInput = ref(null)
const cameraInput = ref(null)

function handleFileSelect(event) {
    const target = event.target
    const file = target.files?.[0]

    if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
            selectedImage.value = e.target?.result
            emit('change', file)
        }
        reader.readAsDataURL(file)
    }
}

function handleCameraCapture(event) {
    const target = event.target
    const file = target.files?.[0]

    if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
            selectedImage.value = e.target?.result
            emit('change', file)
        }
        reader.readAsDataURL(file)
    }
}

function clearImage() {
    selectedImage.value = null
    if (fileInput.value) fileInput.value.value = ''
    if (cameraInput.value) cameraInput.value.value = ''
    emit('clear')
}

function openStorageInput() {
    fileInput.value?.click()
}

function openCameraInput() {
    cameraInput.value?.click()
}
</script>

<template>
    <div class="selectImage flex column gap15">
        <!-- Image preview -->
        <div v-if="selectedImage" class="imagePreview">
            <img :src="selectedImage" alt="Selected image" />
        </div>

        <!-- Icon display -->
        <div v-else class="iconPlaceholder flex alignCenter justifyCenter">
            <Icon class="largeIcon">
                {{ camera && !storage ? 'photo_camera' : 'image' }}
            </Icon>
        </div>

        <!-- Buttons -->
        <div class="flex gap10 justifyCenter">
            <button
                v-if="storage"
                @click="openStorageInput"
                type="button"
                class="btn flex alignCenter justifyCenter gap5"
            >
                <Icon>folder_open</Icon>
                <span>Stockage</span>
            </button>

            <button
                v-if="camera"
                @click="openCameraInput"
                type="button"
                class="btn flex alignCenter justifyCenter gap5"
            >
                <Icon>photo_camera</Icon>
                <span>Appareil</span>
            </button>

            <button
                v-if="selectedImage"
                @click="clearImage"
                type="button"
                class="btn btnClear flex alignCenter justifyCenter gap5"
            >
                <Icon>
                    delete
                </Icon>

                <span>Effacer</span>
            </button>
        </div>

        <!-- Hidden file inputs -->
        <input
            ref="fileInput"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleFileSelect"
        />

        <input
            ref="cameraInput"
            type="file"
            accept="image/*"
            capture="environment"
            style="display: none"
            @change="handleCameraCapture"
        />
    </div>
</template>

<style scoped>
.selectImage {
    padding: 20px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
}

.imagePreview {
    width: 100%;
    max-height: 300px;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid var(--beige);
}

.imagePreview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.iconPlaceholder {
    width: 100%;
    aspect-ratio: 1;
    border: 1px dashed var(--beige);
    border-radius: 4px;
    background: rgba(169, 169, 132, 0.1);
}

.largeIcon {
    font-size: 48px;
    opacity: 0.6;
}

.btn {
    background: transparent;
    border: 1px solid var(--beige);
    color: var(--beige);
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 2px;
    transition: all 0.2s;
    font-size: 14px;
}

.btn:hover {
    background: rgba(169, 169, 132, 0.2);
}

.btnClear {
    border-color: rgba(169, 169, 132, 0.5);
}

.btnClear:hover {
    border-color: var(--beige);
    background: rgba(200, 100, 100, 0.2);
}
</style>