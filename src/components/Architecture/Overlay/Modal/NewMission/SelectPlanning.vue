<script setup>
import Title from '@/components/Architecture/Overlay/Modal/Title.vue'
import ListItem from '@/components/Cards/ListItem.vue'
import Icon from '@/components/Icon/Main.vue'
import { useModal } from '@/composables/modal'

const { modalState } = useModal()

const emit = defineEmits(['confirm', 'cancel'])

const plannings = modalState.value.data?.plannings || []
const canCreateNew = modalState.value.data?.canCreateNew || false
</script>

<template>
    <div
        class="
            full
            flex column gap20
        "
    >
        <Title showBack>
            Sélectionner une prep list
        </Title>

        <div class="flex column gap10">
            <ListItem
                v-for="planning in plannings"
                :key="planning.id"
                @click="emit('confirm', planning)"
                class="pointer"
            >
                <template #icon>
                    <Icon>
                        {{ planning.slot?.icon || 'event_note' }}
                    </Icon>
                </template>

                <template #text>
                    {{ planning.slot?.text || 'Planification' }}
                </template>
            </ListItem>

            <ListItem
                v-if="canCreateNew"
                @click="emit('confirm', { createNew: true })"
                class="pointer"
            >
                <template #icon>
                    <Icon>
                        add
                    </Icon>
                </template>

                <template #text>
                    Créer une prep list
                </template>
            </ListItem>

            <p
                v-if="plannings.length === 0 && !canCreateNew"
                class="noData"
            >
                Aucune planification disponible
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
