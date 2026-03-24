<script setup>
import Title from '@/components/Architecture/Overlay/Modal/Title.vue'
import ListItem from '@/components/Cards/ListItem.vue'
import Icon from '@/components/Icon/Main.vue'
import { useModal } from '@/composables/modal'

const { modalState } = useModal()

const emit = defineEmits(['confirm', 'cancel'])

const services = modalState.value.data?.services || []
</script>

<template>
    <div
        class="
            full
            flex column gap20
        "
    >
        <Title showBack>
            Sélectionner un service
        </Title>

        <div class="flex column gap10">
            <ListItem
                v-for="service in services"
                :key="service.id"
                @click="emit('confirm', service)"
                class="pointer"
            >
                <template #icon>
                    <Icon>
                        {{ service.slot?.icon || 'restaurant' }}
                    </Icon>
                </template>

                <template #text>
                    {{ service.slot?.text || 'Service' }}
                </template>
            </ListItem>

            <p
                v-if="services.length === 0"
                class="noData"
            >
                Aucun service disponible
            </p>
        </div>
    </div>
</template>

<style scoped>
.noData {
    color: var(--beige);
    opacity: 0.6;
    text-align: center;
    padding: 20px;
}
</style>
