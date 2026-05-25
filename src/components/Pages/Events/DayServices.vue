<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import ListItem from '@/components/Cards/ListItem.vue'

const props = defineProps<{
    day: any
}>()

const router = useRouter()
const route = useRoute()

const services = computed(() => {
    if (!props.day.services?.length) return []

    return props.day.services.map((service: any) => ({
        ...service,
        text: (service.slot as any)?.text || '',
        icon: (service.slot as any)?.icon || ''
    }))
})

const handleServiceClick = (service: any) => {
    router.push({
        query: {
            ...route.query,
            slide: 'serviceDetails',
            service: service.id,
            previousPage: route.fullPath
        }
    })
}

</script>

<template>
    <div class="servicesContainer">
        <div 
            class="
                servicesGrid
                flex column gap10
            "
        >
            <ListItem
                v-for="service in services"
                :key="service.id"
                @click="handleServiceClick(service)"
            >
                <template #icon>
                    {{ service.icon }}
                </template>
                

                <template #text>
                    <span class="serviceLabel">
                        {{ service.text }}
                    </span>
                </template>
            </ListItem>
        </div>
    </div>
</template>

<style scoped>

</style>