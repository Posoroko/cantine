<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Title from '@/components/Architecture/Overlay/Modal/Title.vue'
import Icon from '@/components/Icon/Main.vue'
import { useModal } from '@/composables/modal'
import { useCooks, type CookRecord } from '@/composables/cooks'
import appConfig from '@/composables/appConfig'

const emit = defineEmits(['confirm', 'cancel'])

const { modalState, confirm, cancel } = useModal()
const { 
    getCooks, 
    getHiredCooks, 
    hire, 
    fire
} = useCooks()

const isLoading = ref(false)
const isSaving = ref(false)
const allCooks = ref<CookRecord[]>([])
const selectedCookIds = ref(new Set<number>())
const initiallyHiredIds = ref(new Set<number>())

const eventId = computed(() => modalState.value.data?.eventId)

const getImageUrl = (imageId?: string): string | null => {
    if (!imageId) return null
    return `${appConfig.dbUrl}/assets/${imageId}`
}

const isSelected = (cookId: number) => selectedCookIds.value.has(cookId)

const toggleCook = (cookId: number) => {
    if (selectedCookIds.value.has(cookId)) {
        selectedCookIds.value.delete(cookId)
    } else {
        selectedCookIds.value.add(cookId)
    }
}

const handleCancel = () => {
    emit('cancel')
    cancel()
}

const handleSubmit = async () => {
    isSaving.value = true

    try {
        // Find cooks to hire (selected but not initially hired)
        const cooksToHire = Array.from(selectedCookIds.value).filter(
            id => !initiallyHiredIds.value.has(id)
        )

        // Find cooks to fire (initially hired but not selected)
        const cooksToFire = Array.from(initiallyHiredIds.value).filter(
            id => !selectedCookIds.value.has(id)
        )

        // Execute hire operations
        for (const cookId of cooksToHire) {
            try {
                await hire(cookId, eventId.value)
            } catch (error) {
                console.error(`Failed to hire cook ${cookId}:`, error)
            }
        }

        // Execute fire operations
        for (const cookId of cooksToFire) {
            try {
                await fire(cookId, eventId.value)
            } catch (error) {
                console.error(`Failed to fire cook ${cookId}:`, error)
            }
        }

        // Emit success and close
        emit('confirm', {
            selected: Array.from(selectedCookIds.value),
            hired: cooksToHire,
            fired: cooksToFire
        })
        confirm()
    } catch (error) {
        console.error('Error updating cooks:', error)
    } finally {
        isSaving.value = false
    }
}

const loadData = async () => {
    if (!eventId.value) {
        console.error('No eventId provided to SelectCook modal')
        return
    }

    isLoading.value = true

    try {
        // Fetch all cooks
        console.log('Loading all cooks...')
        const cooks = await getCooks()
        console.log('Cooks loaded:', cooks)
        allCooks.value = cooks || []
        console.log('All cooks set:', allCooks.value)

        // Fetch already hired cooks
        console.log('Loading hired cooks for event:', eventId.value)
        const hiredCooks = await getHiredCooks(eventId.value)
        console.log('Hired cooks:', hiredCooks)
        const hiredIds = new Set(hiredCooks.map(cook => cook.id))

        // Set initial state
        initiallyHiredIds.value = hiredIds
        selectedCookIds.value = new Set(hiredIds)
        console.log('Initial hired IDs:', initiallyHiredIds.value)
    } catch (error) {
        console.error('Error loading cooks:', error)
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    loadData()
})
</script>

<template>
    <div 
        class="
            selectCookModal
            flex column gap10
        "
    >
        <Title>Equipe</Title>
        
        <div v-if="isLoading" class="loadingText">
            Chargement...
        </div>

        <div v-else-if="allCooks.length > 0" class="cooksList">
            <div 
                v-for="cook in allCooks" 
                :key="cook.id"
                class="cookItem"
                :class="[isSelected(cook.id) ? 'hired' : '']"
                @click="toggleCook(cook.id)"
                
            >
                <div class="cookInfo">
                    <div v-if="cook.avatar" class="cookAvatar">
                        <img :src="getImageUrl(cook.avatar) || ''" :alt="cook.name" />
                    </div>
                    <div v-else class="cookAvatarPlaceholder">
                        <Icon>person</Icon>
                    </div>
                    <span class="cookName">{{ cook.name }}</span>
                </div>
                <Icon 
                    class="checkboxIcon"
                    size="xl"
                >
                    {{ isSelected(cook.id) ? 'check_box' : 'check_box_outline_blank' }}
                </Icon>
            </div>
        </div>

        <p v-else class="noData">Aucun cuisinier disponible</p>

        <!-- Action Buttons -->
        <div class="buttonContainer">
            <button 
                type="button" 
                @click="handleCancel"
                class="buttonSecondary"
            >
                Annuler
            </button>
            <button 
                type="button" 
                @click="handleSubmit"
                class="buttonPrimary"
                :disabled="isSaving"
            >
                {{ isSaving ? 'Enregistrement...' : 'OK' }}
            </button>
        </div>
    </div>
</template>

<style scoped>

.loadingText,
.noData {
    text-align: center;
    color: #666;
    padding: 20px;
    font-size: 14px;
}

.cooksList {
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
    flex: 1;
    min-height: 200px;
}

.cookItem {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 6px;
    cursor: pointer;
    transition: all 200ms;
    border: 1px solid transparent;
}

.cookItem:hover {
    background: rgba(0, 0, 0, 0.1);
    border-color: var(--green);
}
.cookItem.hired {
    border-color: var(--beige);
}
.cookInfo {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
}

.cookAvatar {
    width: 60px;
    height: 60px;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid #999;
    flex-shrink: 0;
}

.cookAvatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.cookAvatarPlaceholder {
    width: 60px;
    height: 60px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    flex-shrink: 0;
}

.cookName {
    color: var(--beige);
    font-weight: 500;
    font-size: 32px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.checkboxIcon {
    flex-shrink: 0;
    cursor: pointer;
}

.buttonContainer {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    padding-top: 10px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
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
