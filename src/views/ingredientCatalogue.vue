<script setup>
import { ref, onMounted, computed } from 'vue'
import Private from '@/components/Architecture/Layouts/Private.vue'
import TitleWIthCreateButton from '@/components/Text/TitleWithCreateButton.vue'
import NewBasicIngredient from '@/components/Architecture/Overlay/Modal/NewBasicIngredient.vue'
import { useModal } from '@/composables/modal'
import { dbGet } from '@/composables/fetch'
import { appAssetStore } from '@/composables/appAssets'

const { showModal } = useModal()
const ingredients = ref([])
const categories = ref([])
const selectedTypeId = ref(null)
const searchQuery = ref('')

const filteredIngredients = computed(() => {
    let results = ingredients.value
    
    // Filter by category
    if (selectedTypeId.value) {
        results = results.filter(ing => ing.category?.key === selectedTypeId.value)
    }
    
    // Filter by search query
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        results = results.filter(ing => ing.name.toLowerCase().includes(query))
    }
    
    return results
})

async function fetchIngredients() {
    const data = await dbGet({
        endpoint: '/items/ingredients',
        query: {
            fields: '*,category.*'
        }
    })
    ingredients.value = data.sort((a, b) => a.name.localeCompare(b.name))
}

onMounted(async () => {
    await fetchIngredients()
    categories.value = appAssetStore.value.ingredientCategories || []
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
                <input 
                    v-model="searchQuery"
                    type="text"
                    placeholder="Rechercher un ingrédient..."
                    class="searchInput"
                />

                <div class="filters flex wrap gap5">
                    <button
                        @click.prevent.stop="filterByType(null)"
                        class="filterTag"
                        :class="[!selectedTypeId ? 'active' : '']"
                    >
                        Voir tout
                    </button>
                    
                    <button
                        v-for="type in categories"
                        :key="type.key"
                        @click.prevent.stop="filterByType(type.key)"
                        class="filterTag"
                        :class="[selectedTypeId === type.key ? 'active' : '']"
                    >
                        {{ type.text }}
                    </button>
                </div>

                <div
                    class="
                        ingredientList
                        flex column gap10
                    "
                >
                    <div
                        v-for="ingredient in filteredIngredients"
                        :key="ingredient.id"
                        @click="openIngredient(ingredient)"
                        class="ingredient"
                    >
                        {{ ingredient.name }}
                    </div>
                </div>
            </div>
        </template>

        <template #bottomBar>

        </template>
    </Private>
</template>

<style scoped>
.searchInput {
    padding: 10px 15px;
    border: none;
    border-bottom: 2px solid var(--beige);
    border-radius: 0;
    background-color: transparent;
    color: var(--beige);
    font-size: 14px;
    transition: all 0.2s ease;
}

.searchInput::placeholder {
    color: rgba(181, 159, 122, 0.5);
}

.searchInput:focus {
    outline: none;
    border-bottom-color: rgba(181, 159, 122, 0.8);
}

.filterTag {
    padding: 8px 16px;
    border: 2px solid var(--beige);
    border-radius: 20px;
    background-color: transparent;
    color: var(--beige);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
    font-weight: 500;
}

.filterTag.active {
    background-color: var(--beige);
    color: var(--green);
}
.ingredientList {
    overflow-y: scroll;
}
.ingredient {
    padding: 15px;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    cursor: pointer;
    color: var(--beige);
    font-weight: 500;
}
</style>