<script setup>
import { ref, computed, onMounted } from 'vue'
import Title from '@/components/Architecture/Overlay/Modal/Title.vue'
import FormStep from '@/components/Architecture/Overlay/Modal/Step.vue'
import { dbGet, dbPost } from '@/composables/fetch'
import { appAssetStore } from '@/composables/appAssets'
import Icon from '@/components/Icon/Main.vue'

const emit = defineEmits(['confirm', 'cancel'])

const activeStep = ref(0)
const totalSteps = 3

// Step 1: Name & Guest Count
const name = ref('')
const servings = ref('')

// Step 2: Ingredients
const allIngredients = ref([])
const categories = ref([])
const units = ref([])
const ingredientSearch = ref('')
const selectedIngredients = ref([])

// New ingredient creation
const newIngredientCategory = ref(null)

// Step 3: Instructions
const instructions = ref('')

// Ingredient search logic
const ingredientMatches = computed(() => {
    if (!ingredientSearch.value) return []
    const query = ingredientSearch.value.toLowerCase()
    return allIngredients.value.filter(ing =>
        ing.name.toLowerCase().includes(query)
        && !selectedIngredients.value.some(s => s.id === ing.id)
    )
})

const firstMatch = computed(() => ingredientMatches.value[0] || null)
const extraMatchCount = computed(() => Math.max(0, ingredientMatches.value.length - 1))
const noResults = computed(() => ingredientSearch.value.length > 0 && ingredientMatches.value.length === 0)

// Validation
const isStep1Valid = computed(() => name.value.trim().length > 0 && servings.value > 0)
const isStep2Valid = computed(() => true) // Ingredients are optional
const isStep3Valid = computed(() => true) // Instructions are optional

onMounted(async () => {
    categories.value = appAssetStore.value.ingredientCategories || []
    units.value = appAssetStore.value.units || []

    const data = await dbGet({
        endpoint: '/items/ingredients',
        query: {
            fields: '*,category.*'
        }
    })
    allIngredients.value = data.sort((a, b) => a.name.localeCompare(b.name))
})

function selectIngredient(ingredient) {
    selectedIngredients.value.push({
        ...ingredient,
        quantity: '',
        unit: 'kg'
    })
    ingredientSearch.value = ''
    newIngredientCategory.value = null
}

async function createAndSelectIngredient() {
    if (!ingredientSearch.value.trim() || !newIngredientCategory.value) return

    const newIngredient = await dbPost({
        endpoint: '/items/ingredients',
        body: {
            name: ingredientSearch.value.trim(),
            category: newIngredientCategory.value
        }
    })

    // Refetch to get the full object with category relation
    const full = await dbGet({
        endpoint: `/items/ingredients/${newIngredient.id}`,
        query: {
            fields: '*,category.*'
        }
    })

    allIngredients.value.push(full)
    allIngredients.value.sort((a, b) => a.name.localeCompare(b.name))
    selectIngredient(full)
}

function removeIngredient(index) {
    selectedIngredients.value.splice(index, 1)
}

async function handleSave() {
    const recipePayload = {
        name: name.value,
        servings: parseInt(servings.value),
        instructions: instructions.value,
        ingredients: selectedIngredients.value.map(ing => ({
            ingredient: ing.id,
            quantity: ing.quantity || '0',
            unit: ing.unit
        }))
    }

    try {
        const result = await dbPost({
            endpoint: '/items/recipes',
            body: recipePayload
        })
        emit('confirm', result)
    } catch (error) {
        console.error('Failed to create recipe:', error)
    }
}

function goToNext() {
    if (activeStep.value < totalSteps - 1) {
        activeStep.value++
    }
}

function goToPrevious() {
    if (activeStep.value > 0) {
        activeStep.value--
    }
}
</script>

<template>
    <div class="full flex column gap20">
        <Title>
            Nouvelle recette
            <span class="colorBeige">({{ activeStep + 1 }}/{{ totalSteps }})</span>
        </Title>

        <form>
            <!-- Step 1: Name & Guest Count -->
            <FormStep
                v-if="activeStep === 0"
                @previous="goToPrevious"
                @next="goToNext"
                :valid="isStep1Valid"
                :firstStep="true"
                class="flex column"
            >
                <div class="flex column gap20">
                    <div class="flex column gap5">
                        <label
                            for="recipeName"
                            class="colorBeige"
                        >
                            Nom de la recette
                        </label>

                        <input
                            v-model="name"
                            id="recipeName"
                            type="text"
                            class="defaultInputStyles"
                        />
                    </div>

                    <div 
                        class="
                            flex gap20 justifyBetween alignCenter
                        "
                    >
                        <label
                            for="recipeGuestCount"
                            class="colorBeige"
                        >
                            Nombre de convives
                        </label>

                        <input
                            v-model="servings"
                            id="recipeGuestCount"
                            type="number"
                            min="1"
                            class="defaultInputStyles"
                        />
                    </div>
                </div>
            </FormStep>

            <!-- Step 2: Ingredients -->
            <FormStep
                v-if="activeStep === 1"
                @previous="goToPrevious"
                @next="goToNext"
                :valid="isStep2Valid"
                class="flex column"
            >
                <div class="flex column gap20">
                    <label class="colorBeige">
                        Ingrédients
                    </label>

                    <!-- Selected ingredients list -->
                    <div
                        v-if="selectedIngredients.length"
                        class="flex column gap5"
                    >
                        <div
                            v-for="(ing, index) in selectedIngredients"
                            :key="ing.id"
                            class="
                                selectedIngredient 
                                flex column gap10
                            "
                        >
                            <div 
                                class="
                                    ingredientName
                                    flex justifyBetween alignCenter
                                "
                            >
                                <h2>
                                    {{ ing.name }}
                                </h2>

                                <Icon
                                    @click.prevent.stop="removeIngredient(index)"
                                    class="removeBtn"
                                    size="md"
                                >
                                    close
                                </Icon>
                            </div>

                            <div>
                                <input
                                    v-model="ing.quantity"
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    placeholder="Qté"
                                    class="qtyInput"
                                />

                                <select
                                    v-model="ing.unit"
                                    class="unitSelect"
                                >
                                    <option
                                        v-for="u in units"
                                        :key="u.key"
                                        :value="u.key"
                                    >
                                        {{ u.singular }}
                                    </option>
                                </select>
                            </div>

                            <div
                                class="flex column gap5"
                            >
                                <p>
                                    préparation :
                                </p>

                                <input
                                    type="text"
                                    class="defaultInputStyles w100"
                                />
                            </div>
                            
                        </div>
                    </div>

                    <!-- Search input -->
                    <div class="flex column gap5">
                        <input
                            v-model="ingredientSearch"
                            type="text"
                            placeholder="Chercher un ingrédient..."
                            class="defaultInputStyles"
                        />

                        <!-- First match -->
                        <div
                            v-if="firstMatch"
                            class="flex column gap5"
                        >
                            <div
                                @click="selectIngredient(firstMatch)"
                                class="matchResult"
                            >
                                <span class="matchName">{{ firstMatch.name }}</span>
                                <span class="matchCategory">{{ firstMatch.category?.text }}</span>
                            </div>
                            <div
                                v-if="extraMatchCount > 0"
                                class="matchExtra"
                            >
                                + {{ extraMatchCount }} autre{{ extraMatchCount > 1 ? 's' : '' }}
                            </div>
                        </div>

                        <!-- No results: create new -->
                        <div
                            v-if="noResults"
                            class="flex column gap10"
                        >
                            <div class="matchExtra">
                                Aucun résultat. Créer « {{ ingredientSearch }} » ?
                            </div>

                            <div class="flex wrap gap5">
                                <div
                                    v-for="cat in categories"
                                    :key="cat.key"
                                    @click="newIngredientCategory = cat.key"
                                    class="categoryTag"
                                    :class="[
                                        newIngredientCategory === cat.key ? 'selected' : ''
                                    ]"
                                >
                                    {{ cat.text }}
                                </div>
                            </div>

                            <button
                                v-if="newIngredientCategory"
                                @click.prevent.stop="createAndSelectIngredient"
                                class="createBtn"
                            >
                                Créer et ajouter
                            </button>
                        </div>
                    </div>
                </div>
            </FormStep>

            <!-- Step 3: Instructions -->
            <FormStep
                v-if="activeStep === 2"
                @previous="goToPrevious"
                @save="handleSave"
                :valid="isStep3Valid"
                :lastStep="true"
                class="flex column"
            >
                <div class="flex column gap5">
                    <label
                        for="recipeInstructions"
                        class="colorBeige"
                    >
                        Instructions
                    </label>

                    <textarea
                        v-model="instructions"
                        id="recipeInstructions"
                        rows="8"
                        placeholder="Étapes de préparation..."
                        class="translucide w100"
                    ></textarea>
                </div>
            </FormStep>
        </form>
    </div>
</template>

<style scoped>
#recipeGuestCount {
    width: 100px;
}
.selectedIngredient {
    padding: 8px 12px;
    /* background-color: rgba(181, 159, 122, 0.15); */
    border-radius: 8px;
    color: var(--beige);
    border: 1px solid var(--beige);
    font-size: 14px;
}

.ingredientName {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.qtyInput {
    width: 60px;
    padding: 4px 6px;
    border: 1px solid rgba(181, 159, 122, 0.3);
    border-radius: 6px;
    background-color: rgba(0, 0, 0, 0.2);
    color: var(--beige);
    font-size: 13px;
    text-align: center;
}

.qtyInput:focus {
    outline: none;
    border-color: rgba(181, 159, 122, 0.6);
}

.unitSelect {
    padding: 4px 6px;
    border: 1px solid rgba(181, 159, 122, 0.3);
    border-radius: 6px;
    background-color: rgba(0, 0, 0, 0.2);
    color: var(--beige);
    font-size: 13px;
    cursor: pointer;
}

.unitSelect:focus {
    outline: none;
    border-color: rgba(181, 159, 122, 0.6);
}

.removeBtn {
    cursor: pointer;
    opacity: 0.6;
}

.removeBtn:hover {
    opacity: 1;
}

.matchResult {
    padding: 10px 14px;
    background-color: rgba(181, 159, 122, 0.1);
    border: 1px solid rgba(181, 159, 122, 0.3);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.matchResult:hover {
    background-color: rgba(181, 159, 122, 0.2);
    border-color: rgba(181, 159, 122, 0.5);
}

.matchName {
    color: var(--beige);
    font-weight: 600;
    margin-right: 10px;
}

.matchCategory {
    color: rgba(181, 159, 122, 0.6);
    font-size: 13px;
}

.matchExtra {
    color: rgba(181, 159, 122, 0.5);
    font-size: 13px;
    padding-left: 4px;
}

.categoryTag {
    padding: 6px 14px;
    border-radius: 20px;
    border: 1px solid var(--beige);
    color: var(--beige);
    cursor: pointer;
    font-size: 14px;
}

.categoryTag.selected {
    background-color: var(--beige);
    color: var(--green);
}

.createBtn {
    padding: 8px 16px;
    background-color: var(--beige);
    color: var(--green);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    align-self: flex-start;
}

.createBtn:hover {
    opacity: 0.9;
}

textarea {
    resize: vertical;
    min-height: 120px;
}

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

input[type="number"] {
    -moz-appearance: textfield;
}
</style>
