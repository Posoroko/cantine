<script setup>
import Title from '@/components/Architecture/Overlay/Modal/Title.vue'
import ListItem from '@/components/Cards/ListItem.vue'
import Icon from '@/components/Icon/Main.vue'
import { useModal } from '@/composables/modal'

const { modalState } = useModal()

const emit = defineEmits(['confirm', 'cancel'])

const meals = modalState.value.data?.meals || []
</script>

<template>
    <div
        class="
            full
            flex column gap20
        "
    >
        <Title showBack>
            Sélectionner un plat
        </Title>

        <div class="flex column gap10">
            <ListItem
                v-for="meal in meals"
                :key="meal.id"
                @click="emit('confirm', meal)"
                class="pointer"
            >
                <template #icon>
                    <Icon>
                        restaurant
                    </Icon>
                </template>

                <template #text>
                    {{ meal.recipe?.name || 'Plat' }}
                </template>
            </ListItem>

            <p
                v-if="meals.length === 0"
                class="noData"
            >
                Aucun plat disponible
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
