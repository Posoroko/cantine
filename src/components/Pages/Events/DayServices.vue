<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import type { Item_Day, Item_Service } from '@/types/directusDataModel'

import { useModal } from '@/composables/modal'
import Icon from '@/components/Icon/Main.vue'
import NewService from '@/components/Architecture/Overlay/Modal/NewService.vue'

import ListItem from '@/components/Cards/ListItem.vue'

const props = defineProps<{
    day: Item_Day<Item_Service>
}>()

const router = useRouter()
const route = useRoute()
const { showModal } = useModal()

const services = computed(() => {
    if (!props.day.services?.length) return []

    return props.day.services.map(service => ({
        ...service,
        text: (service.slot as any)?.text || '',
        icon: (service.slot as any)?.icon || ''
    }))
})

const handleServiceClick = (service: Item_Service) => {
    router.push({
        query: {
            ...route.query,
            slide: 'serviceDetails',
            service: service.id,
            previousPage: route.fullPath
        }
    })
}

const handleAddService = async () => {
    const existingSlotKeys = props.day.services
        ?.map(s => typeof s.slot === 'string' ? s.slot : (s.slot as any)?.key)
        .filter(Boolean) || []

    await showModal(
        NewService, 
        { 
            dayId: props.day.id,
            existingSlotKeys
        }
    )
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

            <ListItem
                @click="handleAddService"
                layout="createButton"
            >
                <template #icon>
                    <Icon 
                        size="xl" 
                    >
                        add
                    </Icon>
                </template>

                <template #text>
                    Ajouter un service
                </template>
            </ListItem>
        </div>
    </div>
</template>

<style scoped>

</style>