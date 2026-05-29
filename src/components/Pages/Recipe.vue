<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Item_Recipe, Item_RecipeIngredient } from '@/types/directusDataModel'
import { dbGet } from '@/composables/fetch'

type RecipeWithIngredients = Item_Recipe & {
    ingredients: (Item_RecipeIngredient & {
        ingredient: { id: number; name: string; unit: string | null } | null
    })[]
}

const props = withDefaults(defineProps<{
    id: Item_Recipe['id']
    showTitle?: boolean
}>(), {
    showTitle: false
})

const recipe = ref<RecipeWithIngredients | null>(null)

function getUnitText(unitKey: string | null): string {
    return unitKey || ''
}

async function getRecipe() {
    recipe.value = await dbGet<RecipeWithIngredients>({
        endpoint: `/items/recipes/${props.id}`,
        query: {
            fields: [
                '*',
                'ingredients.*',
                'ingredients.ingredient.id',
                'ingredients.ingredient.name',
                'ingredients.ingredient.unit'
            ].join()
        }
    })
}

onMounted(async () => {
    await getRecipe()
})
</script>

<template>
    <div
        v-if="recipe"
        class="
            recipe
            flex column gap20
        "
    >
        <h2 v-if="showTitle">{{ recipe.name }}</h2>

        <p 
            v-if="recipe.servings"
        >
            <span>
                ({{ recipe.servings }})
            </span>


        </p>

        <div
            v-if="recipe.instructions"
            class="instructions"
        >
            <h3>Instructions</h3>
            <pre
                class="
                    instructionsText
                    textLg
                "
            >{{ recipe.instructions }}</pre>
        </div>

        <div class="flex column gap10">
            <h3>Ingrédients</h3>

            <div
                v-for="ri in recipe.ingredients" :key="ri.id"
                class="
                    ingredientRow
                    textLg
                    flex gap10 alignCenter
                "
            >
                <div
                    class="
                        ingredientQuantityBox
                        flex gap5
                    "
                >
                    <span
                        v-if="ri.quantity"
                            class="
                                quantityBase
                                tableColumn
                            "
                        >
                            {{ ri.quantity }}
                    </span>

                    <span 
                        v-if="ri.ingredient?.unit"
                        class="tableColumn"
                    >
                        {{ getUnitText(ri.ingredient.unit) }}
                    </span>
                </div>

                <span>
                    {{ ri.ingredient?.name || '—' }}
                </span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.instructionsText {
    white-space: pre-wrap;
    word-wrap: break-word;
    font: inherit;
}
.ingredientQuantityBox {
    width: 30%;
}
.tableColumn {
    width: 30%;
}
.muted {
    opacity: 0.45;
    font-size: 0.85em;
}
</style>