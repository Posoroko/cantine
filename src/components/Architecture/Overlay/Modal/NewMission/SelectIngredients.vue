<script setup>
import { ref, computed } from 'vue'
import Title from '@/components/Architecture/Overlay/Modal/Title.vue'
import ListItem from '@/components/Cards/ListItem.vue'
import Icon from '@/components/Icon/Main.vue'
import { useModal } from '@/composables/modal'

const { modalState } = useModal()

const emit = defineEmits(['confirm', 'cancel'])

const ingredients = modalState.value.data?.ingredients || []
const selected = ref(new Set())

const allSelected = computed(() =>
    selected.value.size === ingredients.length && ingredients.length > 0
)

function toggle(ingredientId) {
    if (selected.value.has(ingredientId)) {
        selected.value.delete(ingredientId)
    } else {
        selected.value.add(ingredientId)
    }
}

function toggleAll() {
    if (allSelected.value) {
        selected.value.clear()
    } else {
        selected.value = new Set(ingredients.map(i => i.id))
    }
}

function submit() {
    const selectedIngredients = ingredients.filter(i => selected.value.has(i.id))
    if (selectedIngredients.length > 0) {
        emit('confirm', selectedIngredients)
    }
}
</script>

<template>
    <div
        class="
            full
            flex column gap20
        "
    >
        <Title showBack>
            Sélectionner les ingrédients
        </Title>

        <div class="flex column gap10">
            <ListItem
                @click="toggleAll"
                :active="allSelected"
                class="pointer"
            >
                <template #icon>
                    <Icon>
                        {{ allSelected ? 'deselect' : 'select_all' }}
                    </Icon>
                </template>

                <template #text>
                    {{ allSelected ? 'Tout désélectionner' : 'Tout sélectionner' }}
                </template>
            </ListItem>

            <ListItem
                v-for="ingredient in ingredients"
                :key="ingredient.id"
                @click="toggle(ingredient.id)"
                :active="selected.has(ingredient.id)"
                class="pointer"
            >
                <template #icon>
                    <Icon>
                        {{ selected.has(ingredient.id) ? 'check_box' : 'check_box_outline_blank' }}
                    </Icon>
                </template>

                <template #text>
                    {{ ingredient.ingredient?.name || 'Ingrédient' }}
                </template>
            </ListItem>

            <p
                v-if="ingredients.length === 0"
                class="noData"
            >
                Aucun ingrédient disponible
            </p>
        </div>

        <button
            v-if="ingredients.length > 0"
            @click="submit"
            :disabled="selected.size === 0"
            class="submitButton fontWeightBold"
        >
            Créer {{ selected.size }} mission{{ selected.size > 1 ? 's' : '' }}
        </button>
    </div>
</template>

<style scoped>
.noData {
    color: var(--beige);
    opacity: 0.6;
    text-align: center;
    padding: 20px;
}

.submitButton {
    padding: 14px 20px;
    border-radius: 8px;
    border: none;
    background: var(--green);
    color: var(--beige);
    font-size: 18px;
    cursor: pointer;
    transition: all 200ms;
}

.submitButton:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.submitButton:not(:disabled):hover {
    filter: brightness(1.1);
}
</style>
