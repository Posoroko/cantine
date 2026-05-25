import { ref } from 'vue'
import type {
    Item_Event,
    Item_Contact,
    Item_Day,
    Item_Service,
    Item_Meal,
    Item_Recipe,
    Item_RecipeIngredient,
    Item_Ingredient
} from '@/types/directusDataModel'
import { dbGet } from '@/composables/fetch'

export {
    currentEventStore,
    loadCurrentEvent
}

export type {
    CurrentEvent,
    ExpandedMeal,
    ExpandedRecipe,
    ExpandedIngredient,
    ExpandedService,
}

const currentEventStore = ref<CurrentEvent | null>(null)

async function loadCurrentEvent(eventId: number) {
    const event = await dbGet<CurrentEvent>({
        endpoint: `/items/events/${eventId}`,
        query: {
            fields: [
                '*',
                'contacts.*',
                'days.*',
                'days.services.*',
                'days.services.meals.*',
                'days.services.meals.type',
                'days.services.meals.recipe.id',
                'days.services.meals.recipe.name',
                'days.services.meals.recipe.servings',
                'days.services.meals.recipe.instructions',
                'days.services.meals.recipe.ingredients.*',
                'days.services.meals.recipe.ingredients.ingredient.id',
                'days.services.meals.recipe.ingredients.ingredient.name',
                'days.services.meals.recipe.ingredients.ingredient.unit',
                'days.services.meals.recipe.ingredients.ingredient.defaultPrice',
                'days.services.meals.recipe.ingredients.ingredient.prepLess',
            ].join(),
        }
    })

    currentEventStore.value = event
}

type ExpandedIngredient = Item_RecipeIngredient<Pick<Item_Ingredient, 'id' | 'name' | 'unit' | 'defaultPrice' | 'prepLess'> | null>

type ExpandedRecipe = Pick<Item_Recipe, 'id' | 'name' | 'servings' | 'instructions'> & {
    ingredients: ExpandedIngredient[]
}

type ExpandedMeal = Item_Meal<ExpandedRecipe | null>

type ExpandedService = Item_Service<ExpandedMeal>

type CurrentEvent = Item_Event<Item_Contact, Item_Day<ExpandedService>>