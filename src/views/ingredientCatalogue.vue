<script setup>
import { ref, onMounted, computed } from 'vue'
import Private from '@/components/Architecture/Layouts/Private.vue'
import TitleWIthCreateButton from '@/components/Text/TitleWithCreateButton.vue'
import NewBasicIngredient from '@/components/Architecture/Overlay/Modal/NewBasicIngredient.vue'
import { useModal } from '@/composables/modal'
import { dbGet } from '@/composables/fetch'

const { showModal } = useModal()
const ingredients = ref([])
const ingredientTypes = ref([])
const selectedTypeId = ref(null)

const filteredIngredients = computed(() => {
    if (!selectedTypeId.value) {
        return ingredients.value
    }
    return ingredients.value.filter(ing => ing.type?.id === selectedTypeId.value)
})

async function fetchIngredients() {
    const data = await dbGet({
        endpoint: '/items/ingredients',
        query: {
            fields: '*,type.*'
        }
    })
    ingredients.value = data.sort((a, b) => a.name.localeCompare(b.name))
}

onMounted(async () => {
    await fetchIngredients()
    
    ingredientTypes.value = await dbGet({
        endpoint: '/items/ingredient_types'
    })
})

async function createNew() {
    const result = await showModal(NewBasicIngredient)
    
    if (result) {
        await fetchIngredients()
    }
}

function openIngredient(ingredient) {
    // TODO: Open ingredient detail modal
    console.log('Opened ingredient:', ingredient)
}

function filterByType(typeId) {
    selectedTypeId.value = typeId
}

</script>

<template>
    <Private>
        <template #title>
            <TitleWIthCreateButton
                @createNew="createNew"
            >
                Ingrédients
            </TitleWIthCreateButton>
        </template>

        <template #main>
            <div 
                class="
                    full
                    flex column gap20
                    pad20
                "
            >
                <div class="filters flex wrap gap5">
                    <button
                        @click="filterByType(null)"
                        class="filterTag"
                        :class="[!selectedTypeId ? 'active' : '']"
                    >
                        Voir tout
                    </button>
                    
                    <button
                        v-for="type in ingredientTypes"
                        :key="type.id"
                        @click="filterByType(type.id)"
                        class="filterTag"
                        :class="[selectedTypeId === type.id ? 'active' : '']"
                    >
                        {{ type.text }}
                    </button>
                </div>

                <div
                    v-for="ingredient in filteredIngredients"
                    :key="ingredient.id"
                    @click="openIngredient(ingredient)"
                    class="ingredient"
                >
                    {{ ingredient.name }}
                </div>
            </div>
        </template>

        <template #bottomBar>

        </template>
    </Private>
</template>

<style scoped>
.filterTag {
    padding: 8px 16px;
    border: 2px solid rgba(181, 159, 122, 0.3);
    border-radius: 20px;
    background-color: transparent;
    color: var(--beige);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
    font-weight: 500;
}

.filterTag:hover {
    border-color: rgba(181, 159, 122, 0.6);
    transform: translateY(-2px);
}

.filterTag.active {
    background-color: var(--beige);
    color: var(--green);
    border-color: var(--beige);
}

.ingredient {
    padding: 15px;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    cursor: pointer;
    color: var(--beige);
    font-weight: 500;
}

.ingredient:hover {
    background-color: rgba(0, 0, 0, 0.2);
}
</style>