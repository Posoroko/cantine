<script setup>
import Private from '@/components/Architecture/Layouts/Private.vue'
import Icon from '@/components/Icon/Main.vue'
import { useCooks } from '@/composables/cooks'
import appConfig from '@/composables/appConfig'
import { ref, onMounted } from 'vue'

const { getCooks } = useCooks()

const cooks = ref([])
const isLoading = ref(false)

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
                <h1>Cuisiniers</h1>

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
                        </div>
                    </div>
                </div>

                <p v-else class="noCooksText">
                    Aucun cuisinier.
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