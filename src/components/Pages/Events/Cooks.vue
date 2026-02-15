<script setup>
import { ref, onMounted, computed } from 'vue'
import TitleWithCreateButton from '@/components/Text/TitleWithCreateButton.vue'
import MenuButton from '@/components/Cards/MenuButton/Main.vue'
import SelectCook from '@/components/Architecture/Overlay/Modal/SelectCook.vue'
import { useModal } from '@/composables/modal'
import { useCooks } from '@/composables/cooks'
import { dbDelete } from '@/composables/fetch'
import appConfig from '@/composables/appConfig'

const props = defineProps({
    eventId: {
        type: Number,
        required: true
    }
})

const emit = defineEmits(['cooks-updated'])

const { 
    showModal, 
    showConfirmationModal 
} = useModal()
const { 
    getHiredCooks, 
    fire 
} = useCooks()

const hiredCooks = ref([])
const isLoading = ref(false)

const getImageUrl = (imageId) => {
    if (!imageId) return null
    return `${appConfig.dbUrl}/assets/${imageId}`
}

const loadHiredCooks = async () => {
    isLoading.value = true
    try {
        const cooks = await getHiredCooks(props.eventId)
        hiredCooks.value = cooks
    } catch (error) {
        console.error('Error loading hired cooks:', error)
    } finally {
        isLoading.value = false
    }
}

const openSelectCookModal = async () => {
    try {
        await showModal(
            SelectCook, 
            { 
                eventId: props.eventId 
            }
        )
        // Modal closed, reload the hired cooks list
        await loadHiredCooks()
        emit('cooks-updated')
    } catch (error) {
        console.log('Modal cancelled')
    }
}

const handleCookDelete = (data) => {
    showConfirmationModal({
        title: 'Retirer ce cuisinier?',
        message: 'Cette action ne peut pas être annulée.',
        confirmText: 'Retirer',
        cancelText: 'Annuler'
    }).then(async () => {
        try {
            await fire(data.id, props.eventId)
            console.log('Cook fired successfully')
            await loadHiredCooks()
            emit('cooks-updated')
        } catch (error) {
            console.error('Failed to fire cook:', error)
        }
    }).catch(() => {
        console.log('Delete cancelled')
    })
}

const handleCookUpdate = (data) => {
    console.log('Update cook:', data)
    // TODO: Implement update cook functionality
}

onMounted(() => {
    loadHiredCooks()
})
</script>

<template>
    <div class="scrollBox grow flex column">
        <TitleWithCreateButton 
            @createNew="openSelectCookModal"
        >
            Cuisiniers
        </TitleWithCreateButton>

        <div v-if="isLoading" class="loadingText">
            Chargement...
        </div>

        <div 
            v-else-if="hiredCooks.length > 0" 
            class="cooksList"
        >
            <div 
                v-for="cook in hiredCooks" 
                :key="cook.id" 
                class="cookItem"
            >
                <div class="cookHeader flex alignCenter gap15">
                    <div v-if="cook.avatar" class="cookAvatar">
                        <img :src="getImageUrl(cook.avatar)" :alt="cook.name" />
                    </div>
                    <div class="cookInfo flex column grow">
                        <span class="cookName">{{ cook.name }}</span>
                        <div v-if="cook.telephone" class="cookDetail">
                            <span>Tél:</span> {{ cook.telephone }}
                        </div>
                        <div v-if="cook.email" class="cookDetail">
                            <span>Email:</span> {{ cook.email }}
                        </div>
                    </div>
                    <MenuButton
                        :collection="'cooks'"
                        :id="cook.id"
                        canDelete
                        @delete="handleCookDelete"
                        @update="handleCookUpdate"
                    />
                </div>
            </div>
        </div>

        <p v-else class="noCooksText">
            Pas de cuistots pour cet événement
        </p>
    </div>
</template>

<style scoped>
.scrollBox {
    overflow: scroll;
}

.loadingText,
.noCooksText {
    text-align: center;
    color: var(--beige);
    font-size: 14px;
}

.cooksList {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.cookItem {
    padding: 12px;
    background: rgba(169, 169, 132, 0.1);
    border-radius: 4px;
    border-left: 2px solid var(--gold);
}

.cookHeader {
    width: 100%;
}

.cookAvatar {
    width: 48px;
    height: 48px;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid var(--beige);
    flex-shrink: 0;
}

.cookAvatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.cookInfo {
    min-width: 0;
}

.cookName {
    color: var(--beige);
    font-weight: bold;
    font-size: 14px;
}

.cookDetail {
    color: rgba(169, 169, 132, 0.9);
    font-size: 12px;
    margin-top: 2px;
}

.grow {
    flex: 1;
}
</style>
