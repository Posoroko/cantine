<script setup>
import { ref, onMounted } from 'vue'
import { dbGet } from '@/composables/fetch'
import appConfig from '@/composables/appConfig'
import Loading from '@/components/Loading/Main.vue'
import Icon from '@/components/Icon/Main.vue'

const props = defineProps({
    eventId: {
        type: Number,
        required: true
    }
})

const cooks = ref([])
const isLoading = ref(true)

onMounted(async () => {
    const result = await dbGet({
        endpoint: '/items/cooks_events',
        query: {
            'filter[event][_eq]': props.eventId,
            fields: [
                'id',
                'event',
                'cook.id',
                'cook.first_name',
                'cook.last_name',
                'cook.email',
                'cook.telephone',
                'cook.avatar',
            ].join(',')
        }
    })
    cooks.value = Array.isArray(result) ? result.map(r => r.cook).filter(Boolean) : []
    isLoading.value = false
})

function getImageUrl(imageId) {
    if (!imageId) return null
    return `${appConfig.dbUrl}/assets/${imageId}`
}
</script>

<template>
    <div class="scrollBox grow flex column gap10">
        <Loading v-if="isLoading" />

        <div
            v-else-if="cooks.length > 0"
            class="cooksList flex column gap10"
        >
            <div
                v-for="cook in cooks"
                :key="cook.id"
                class="cookItem pad15 rounded10 flex alignCenter gap15"
            >
                <img
                    v-if="cook.avatar"
                    :src="getImageUrl(cook.avatar)"
                    :alt="cook.name"
                    class="cookAvatar rounded10"
                />

                <div class="flex column gap5 grow textLg">
                    <span class="cookName fontWeightBold textXl">{{ cook.first_name }} {{ cook.last_name }}</span>
                    <div
                        class="flex column  gap10"
                    >
                        <a
                            :href="`tel:${cook.telephone}`"
                            v-if="cook.telephone"
                            class="cookDetail beigeCardGreenText contactActionButton"
                        >
                            <Icon
                                color="var(--beige)"
                            >
                                call
                            </Icon>
                            <span
                                class="fontWeightBold textLg"
                            >
                                {{ cook.telephone }}
                            </span>
                        </a>
                        
                        <a
                            :href="`mailto:${cook.email}`" 
                            v-if="cook.email" 
                            class="cookDetail beigeCardGreenText contactActionButton"
                        
                        >
                            <Icon
                                color="var(--beige)"
                            >
                                email
                            </Icon>
                            <span
                                class="cookName fontWeightBold textLg"
                            >
                                {{ cook.email }}
                            </span>
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <p
            v-else
            class="noCooks"
        >
            Pas de cuistots pour cet événement
        </p>
    </div>
</template>

<style scoped>
.scrollBox {
    overflow-y: scroll;
}

.cookItem {
    background: color-mix(in srgb, var(--beige) 8%, transparent);
}

.cookAvatar {
    width: 150px;
    height: 150px;
    object-fit: cover;
    flex-shrink: 0;
}

.noCooks {
    text-align: center;
    opacity: 0.5;
}

.contactActionButton {
    padding: 5px 10px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 20px;
    text-decoration: none;
}
</style>
