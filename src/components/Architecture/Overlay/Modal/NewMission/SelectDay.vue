<script setup>
import Title from '@/components/Architecture/Overlay/Modal/Title.vue'
import ListItem from '@/components/Cards/ListItem.vue'
import Icon from '@/components/Icon/Main.vue'
import DateText from '@/components/Text/Date.vue'
import { useModal } from '@/composables/modal'

const { modalState } = useModal()

const emit = defineEmits(['confirm', 'cancel'])

const days = modalState.value.data?.days || []
</script>

<template>
    <div
        class="
            full
            flex column gap20
        "
    >
        <Title>
            Sélectionner un jour
        </Title>

        <div class="flex column gap10">
            <ListItem
                v-for="day in days"
                :key="day.id"
                @click="emit('confirm', day)"
                class="pointer"
            >
                <template #icon>
                    <Icon>
                        calendar_today
                    </Icon>
                </template>

                <template #text>
                    <DateText
                        :timestamp="day.date"
                        format="textNoMonth"
                    />
                </template>
            </ListItem>

            <p
                v-if="days.length === 0"
                class="noData"
            >
                Aucun jour disponible
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
