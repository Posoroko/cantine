<script setup>
import { ref, onMounted } from 'vue'
import { useCooks } from '@/composables/cooks'
import appConfig from '@/composables/appConfig'

const props = defineProps({
    eventId: {
        type: Number,
        required: true
    }
})

const { getHiredCooks } = useCooks()

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

onMounted(() => {
    loadHiredCooks()
})
</script>

<template>
    <div class="scrollBox grow flex column">
        <h2>Cuisiniers</h2>

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
