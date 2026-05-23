<script setup>
import { ref, onMounted, computed } from 'vue'
import Private from '@/components/Architecture/Layouts/Private.vue'
import Icon from '@/components/Icon/Main.vue'
import { dbGet } from '@/composables/fetch'
import { appAssetStore } from '@/composables/appAssets'
import ListItem from '@/components/Cards/ListItem.vue'

const recipes = ref([])
const tags = ref([])
const diets = ref([])
const selectedTagKeys = ref([])
const selectedDietKeys = ref([])
const searchQuery = ref('')
const showTags = ref(false)
const showDiets = ref(false)

const filteredRecipes = computed(() => {
    let results = recipes.value
    
    // Filter by selected tags (if any selected, recipe must have at least one)
    if (selectedTagKeys.value.length > 0) {
        results = results.filter(recipe => {
            return recipe.tags?.some(tag => selectedTagKeys.value.includes(tag.key))
        })
    }
    
    // Filter by selected diets (if any selected, recipe must have at least one)
    if (selectedDietKeys.value.length > 0) {
        results = results.filter(recipe => {
            return recipe.diets?.some(diet => selectedDietKeys.value.includes(diet.key))
        })
    }
    
    // Filter by search query
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        results = results.filter(recipe => recipe.name.toLowerCase().includes(query))
    }
    
    return results
})

async function fetchRecipes() {
    const data = await dbGet({
        endpoint: '/items/recipes',
        query: {
            fields: '*,tags.*,diets.*'
        }
    })
    recipes.value = data.sort((a, b) => a.name.localeCompare(b.name))
}

onMounted(async () => {
    await fetchRecipes()
    tags.value = appAssetStore.value.recipeTags || []
    diets.value = appAssetStore.value.diets || []
})

function toggleTag(tagKey) {
    const index = selectedTagKeys.value.indexOf(tagKey)
    if (index > -1) {
        selectedTagKeys.value.splice(index, 1)
    } else {
        selectedTagKeys.value.push(tagKey)
    }
}

function toggleDiet(dietKey) {
    const index = selectedDietKeys.value.indexOf(dietKey)
    if (index > -1) {
        selectedDietKeys.value.splice(index, 1)
    } else {
        selectedDietKeys.value.push(dietKey)
    }
}

</script>

<template>
    <Private>
        <template #main>
            <div 
                class="
                    full
                    flex column gap20
                    pad20
                "
            >
                <h1>Recettes</h1>

                <input 
                    v-model="searchQuery"
                    type="text"
                    placeholder="Rechercher une recette..."
                    class="defaultInputStyles"
                />

                <div
                    class="scrollBox"
                >
                    <div>
                        <div
                            @click="showTags = !showTags"
                            class="
                                filterHeader
                                flex alignCenter justifyBetween
                                pointer pad10
                            "
                        >
                            <div class="filterLabel">Tags</div>
                            <Icon size="sm">
                                {{ showTags ? 'expand_less' : 'expand_more' }}
                            </Icon>
                        </div>

                        <div
                            v-if="showTags"
                            class="filters flex wrap gap10"
                        >
                            <button
                                v-for="tag in tags"
                                :key="tag.key"
                                @click.prevent.stop="toggleTag(tag.key)"
                                class="filterTag"
                                :class="[selectedTagKeys.includes(tag.key) ? 'active' : '']"
                            >
                                {{ tag.text }}
                            </button>
                        </div>
                    </div>
                    <div
                        @click="showDiets = !showDiets"
                        class="
                            filterHeader
                            flex alignCenter justifyBetween
                            pointer pad10
                        "
                    >
                        <div class="filterLabel">Régimes</div>
                        
                        <Icon size="sm">
                            {{ showDiets ? 'expand_less' : 'expand_more' }}
                        </Icon>
                    </div>
                    <div
                        v-if="showDiets"
                        class="filters flex wrap gap10"
                    >
                        <button
                            v-for="diet in diets"
                            :key="diet.key"
                            @click.prevent.stop="toggleDiet(diet.key)"
                            class="filterTag"
                            :class="[selectedDietKeys.includes(diet.key) ? 'active' : '']"
                        >
                            {{ diet.text }}
                        </button>
                    </div>


                    <div
                        class="
                            flex column gap5 marTop20
                        "
                    >
                        <ListItem
                            v-for="recipe in filteredRecipes"
                            :key="recipe.id"
                            class="
                                recipe
                                fontWeightSemibold
                            "
                        >
                            <template #text>
                                {{ recipe.name }}
                            </template>

                            <template #details>
                                <!-- will display the price per plate when feature is ready -->
                            </template>
                        </ListItem>
                    </div>
                </div>
            </div>
        </template>
    </Private>
</template>

<style scoped>
.scrollBox {
    overflow-y: scroll;
}
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

.filterHeader {
    margin-bottom: 8px;
    color: var(--beige);
}

.filterLabel {
    text-transform: uppercase;
}

.filterTag {
    padding: 2px 10px;
    border: 1px solid var(--beige);
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
}

.filterTag.active {
    background-color: var(--beige);
    color: var(--green);
}

.recipe {
    padding: 10px 15px;
    background-color: rgba(255, 255, 255, 0.033);
    border-radius: 8px;
    cursor: pointer;
    color: var(--beige);
}

.recipe:hover {
    background-color: rgba(0, 0, 0, 0.2);
}
</style>