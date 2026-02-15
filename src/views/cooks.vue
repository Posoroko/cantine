<script setup>
import Private from '@/components/Architecture/Layouts/Private.vue'
import TitleWithCreateButton from '@/components/Text/TitleWithCreateButton.vue'
import Icon from '@/components/Icon/Main.vue'
import MenuButton from '@/components/Cards/MenuButton/Main.vue'
import NewCook from '@/components/Architecture/Overlay/Modal/NewCook.vue'
import { useModal } from '@/composables/modal'
import { useCooks } from '@/composables/cooks'
import { dbDelete } from '@/composables/fetch'
import appConfig from '@/composables/appConfig'
import { ref, onMounted } from 'vue'

const { showModal, showConfirmationModal } = useModal()
const { getCooks } = useCooks()

const cooks = ref([])
const isLoading = ref(false)

const openNewCookModal = () => {
    showModal(NewCook).then(() => {
        console.log('Cook created, reloading list')
        loadCooks()
    }).catch(() => {
        console.log('Modal cancelled')
    })
}

const loadCooks = async () => {
    isLoading.value = true
    try {
        const data = await getCooks()
        cooks.value = data
    } catch (error) {
        console.error('Error loading cooks:', error)
    } finally {
        isLoading.value = false
    }
}

const getImageUrl = (imageId) => {
    if (!imageId) return null
    return `${appConfig.dbUrl}/assets/${imageId}`
}

const handleCookDelete = (data) => {
    showConfirmationModal({
        title: 'Supprimer ce cuisinier?',
        message: 'Cette action ne peut pas être annulée.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
    }).then(async () => {
        try {
            await dbDelete(`/items/${data.collection}/${data.id}`)
            console.log('Cook deleted successfully')
            loadCooks()
        } catch (error) {
            console.error('Failed to delete cook:', error)
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
    loadCooks()
})
</script>

<template>
    <Private>
        <template #main>
            <div 
                class="
                    flex column gap20
                    pad20
                "
            >
                <TitleWithCreateButton 
                    @createNew="openNewCookModal"
                >
                    Cuisiniers
                </TitleWithCreateButton>

                <div v-if="isLoading" class="loadingText">
                    Chargement...
                </div>

                <div 
                    v-else-if="cooks.length > 0" 
                    class="
                        cooksList
                        flex column gap10
                    "
                >
                    <div 
                        v-for="cook in cooks" 
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
                    Aucun cuisinier n'a été créé. Cliquez sur le bouton "+" pour ajouter un cuisinier.
                </p>
            </div>
        </template>
    </Private>
</template>

<style scoped>
.loadingText,
.noCooksText {
    text-align: center;
    color: var(--beige);
    padding: 40px;
    font-size: 16px;
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
    width: 60px;
    height: 60px;
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
    /* margin-top: 2px; */
}

.grow {
    flex: 1;
}
</style>