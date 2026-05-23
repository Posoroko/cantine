import { ref } from 'vue'
import type {
    Item_Event,
    Item_Contact,
    Item_Day,
    Item_Service,
    Item_Meal,
    Item_Mission,
    Item_Planning,
    Item_PlanningSlot,
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
    ExpandedPlanning,
    ExpandedMission
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
                'days.services.day.date',
                'days.services.slot.*',
                'days.services.meals.id',
                'days.services.meals.status',
                'days.services.meals.recipe.id',
                'days.services.meals.recipe.name',
                'days.services.meals.recipe.servings',
                'days.services.meals.recipe.instructions',
                'days.services.meals.recipe.ingredients.*',
                'days.services.meals.recipe.ingredients.ingredient.id',
                'days.services.meals.recipe.ingredients.ingredient.name',
                'days.services.meals.recipe.ingredients.ingredient.unit',
                'days.services.meals.recipe.ingredients.ingredient.prepLess',
                'days.services.meals.targetDiets.id',
                'days.services.meals.targetDiets.dietCount',
                'days.services.dietCounts.*',
                'days.services.dietCounts.diets.id',
                'days.services.dietCounts.diets.diet',
                'days.plannings.*',
                'days.plannings.slot.*',
                'days.plannings.missions.*',
                'days.plannings.missions.meal',
                'days.plannings.missions.ingredient.*',
                'days.plannings.missions.ingredient.ingredient.id',
                'days.plannings.missions.ingredient.ingredient.name',
                'cooks.*',
                'meals.*',
                'meals.service.*',
                'meals.service.slot.*',
                'meals.service.day.id',
                'meals.service.day.date',
                'meals.recipe.id',
                'meals.recipe.name',
                'meals.recipe.servings',
                'meals.recipe.instructions',
                'meals.recipe.ingredients.*',
                'meals.recipe.ingredients.ingredient.id',
                'meals.recipe.ingredients.ingredient.name',
                'meals.recipe.ingredients.ingredient.unit'
            ].join(),
            deep: JSON.stringify({
                days: {
                    services: {
                        _sort: 'slot.sort'
                    }
                }
            })
        }
    })

    currentEventStore.value = event
}

type ExpandedIngredient = Item_RecipeIngredient<Pick<Item_Ingredient, 'id' | 'name' | 'unit' | 'defaultPrice' | 'prepLess'> | null>

type ExpandedRecipe = Pick<Item_Recipe, 'id' | 'name' | 'servings' | 'instructions'> & {
    ingredients: ExpandedIngredient[]
}

type ExpandedMeal = Item_Meal & {
    recipe: ExpandedRecipe | null
}

type ExpandedMission = Item_Mission<ExpandedIngredient | null>

type ExpandedPlanning = Item_Planning<Item_PlanningSlot | null, ExpandedMission[]>

type CurrentEvent = Item_Event & {
    contacts: Item_Contact[]
    meals: ExpandedMeal[]
    days: (Item_Day<Item_Service, ExpandedPlanning> & {
        services: (Item_Service & {
            meals: ExpandedMeal[]
        })[]
    })[]
}