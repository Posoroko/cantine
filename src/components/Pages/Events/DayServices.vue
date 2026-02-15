<script setup>
import { computed } from 'vue'
import { useModal } from '@/composables/modal'
import Icon from '@/components/Icon/Main.vue'

const props = defineProps({
    day: {
        type: Object,
        required: true
    }
})

const { showModal } = useModal()

const serviceTypes = [
    { key: 'breakfast', label: 'Petit-déj', icon: 'wb_sunny' },
    { key: 'lunch', label: 'Déjeuner', icon: 'lunch_dining' },
    { key: 'supper', label: 'Souper', icon: 'dark_mode' }
]

const servicesBySlot = computed(() => {
    const map = {}
    if (props.day.services && Array.isArray(props.day.services)) {
        props.day.services.forEach(service => {
            const slotKey = service.slot?.key || service.slot
            map[slotKey] = service
        })
    }
    return map
})

const handleServiceClick = async (serviceType) => {
    const hasService = servicesBySlot.value[serviceType.key]
    
    if (!hasService) {
        // TODO: Open createService modal with dayId and slotKey
        console.log('Open createService modal for slot:', serviceType.key)
        // await showModal(CreateService, { dayId: props.day.id, slotKey: serviceType.key })
    } else {
        // TODO: Open service details/edit modal
        console.log('Edit service:', hasService)
        // await showModal(EditService, hasService)
    }
}
</script>

<template>
    <div class="servicesContainer">
        <div class="servicesGrid">
            <button
                v-for="service in serviceTypes"
                :key="service.key"
                @click="handleServiceClick(service)"
                :class="[
                    'serviceTile',
                    'flex column alignCenter justifyCenter gap10',
                    servicesBySlot[service.key] ? 'active' : 'empty'
                ]"
            >
                <Icon size="xl" class="serviceIcon">
                    {{ service.icon }}
                </Icon>
                <span class="serviceLabel">
                    {{ service.label }}
                </span>
            </button>
        </div>
    </div>
</template>

<style scoped>

.servicesContainer {
    padding: 20px 0;
}

.servicesGrid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
}

.serviceTile {
    padding: 20px;
    border-radius: 8px;
    border: 2px dashed;
    background: transparent;
    cursor: pointer;
    transition: all 200ms;
    min-height: 120px;
}

.serviceTile.empty {
    border-color: rgba(160, 160, 100, 0.3);
    color: rgba(160, 160, 100, 0.4);
}

.serviceTile.empty:hover {
    border-color: rgba(160, 160, 100, 0.6);
    color: rgba(160, 160, 100, 0.7);
    background: rgba(0, 0, 0, 0.1);
}

.serviceTile.active {
    border-color: var(--green);
    background: rgba(13, 139, 95, 0.1);
    color: var(--beige);
    border-style: solid;
}

.serviceTile.active:hover {
    background: rgba(13, 139, 95, 0.2);
}

.serviceIcon {
    font-size: 32px;
}

.serviceLabel {
    font-size: 14px;
    font-weight: 600;
    text-transform: capitalize;
}

</style>