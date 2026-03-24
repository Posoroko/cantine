<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

import type { Item_Recipe } from '@/types/directusDataModel'

import Title from '@/components/Architecture/Overlay/Modal/Title.vue'
import Icon from '@/components/Icon/Main.vue'
import { dbGet } from '@/composables/fetch'
import { useModal } from '@/composables/modal'

const emit = defineEmits(['confirm', 'cancel'])

const { confirm } = useModal()

const recipes = ref<Item_Recipe[]>([])
const searchQuery = ref('')

const filteredRecipes = computed(() => {
    if (!searchQuery.value) return recipes.value

    const query = searchQuery.value.toLowerCase()
    return recipes.value.filter(recipe => recipe.name.toLowerCase().includes(query))
})

async function fetchRecipes() {
    const data = await dbGet({
        endpoint: '/items/recipes',
        query: {
            fields: '*',
            sort: 'name'
        }
    })
    recipes.value = data
}

function selectRecipe(recipe) {
    confirm(recipe)
}

onMounted(() => {
    fetchRecipes()
})
</script>

<template>
    <div
        class="
            full
            flex column gap20
        "
    >
        <Title>
            Sélectionner une recette
        </Title>

        <input
            v-model="searchQuery"
            class="searchInput"
            placeholder="Rechercher..."
        />

        <div
            class="
                recipeList
                flex column gap10
            "
        >
            <button
                v-for="recipe in filteredRecipes"
                :key="recipe.id"
                @click="selectRecipe(recipe)"
                class="
                    recipeButton
                    flex alignCenter gap20
                "
            >
                <Icon size="xl">
                    menu_book
                </Icon>

                <span class="recipeLabel">
                    {{ recipe.name }}
                </span>
            </button>

            <p
                v-if="filteredRecipes.length === 0"
                class="noResults"
            >
                Aucune recette trouvée
            </p>
        </div>
    </div>
</template>

<style scoped>
.searchInput {
    font-size: 18px;
    font-weight: 700;
    color: var(--beige);
    background-color: rgba(0, 0, 0, 0.042);
    outline: none;
    border: none;
    border-bottom: 1px solid var(--beige);
    padding: 8px 0;
}

.recipeList {
    overflow-y: auto;
    max-height: 60vh;
}

.recipeButton {
    padding: 16px 20px;
    border-radius: 8px;
    border: 1px solid rgba(169, 169, 132, 0.3);
    background: transparent;
    color: var(--beige);
    cursor: pointer;
    transition: all 200ms;
}

.recipeButton:hover {
    border-color: var(--green);
    background: rgba(13, 139, 95, 0.15);
}

.recipeLabel {
    font-size: 20px;
    font-weight: 700;
}

.noResults {
    text-align: center;
    color: var(--beige);
    opacity: 0.5;
    padding: 20px;
}
</style>
