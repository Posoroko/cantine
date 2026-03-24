<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import type { Item_Day, Item_Service } from '@/types/directusDataModel'

import { useModal } from '@/composables/modal'
import Icon from '@/components/Icon/Main.vue'
import NewService from '@/components/Architecture/Overlay/Modal/NewService.vue'

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
            <button
                v-for="service in services"
                :key="service.id"
                @click="handleServiceClick(service)"
                class="
                    serviceTile active
                    flex alignCenter gap30
                "
            >
                <Icon 
                    size="xl" 
                    class="serviceIcon"
                >
                    {{ service.icon }}
                </Icon>

                <span class="serviceLabel">
                    {{ service.text }}
                </span>
            </button>

            <button
                @click="handleAddService"
                class="
                    serviceTile empty
                    flex alignCenter gap30
                "
            >
                <Icon 
                    size="xl" 
                    class="serviceIcon"
                >
                    add
                </Icon>

                <span 
                    class="serviceLabel"
                >
                    Ajouter un service
                </span>
            </button>
        </div>
    </div>
</template>

<style scoped>
.serviceTile {
    padding: 20px;
    border-radius: 20px;
    border: 1px solid var(--beige);

    background: transparent;
    cursor: pointer;
    transition: all 200ms;
}

.serviceIcon {
    font-size: 32px;
}

.serviceLabel {
    font-size: 24px;
    font-weight: 700;
    text-transform: capitalize;
}

</style>