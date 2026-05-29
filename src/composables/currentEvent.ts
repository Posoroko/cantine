import { ref } from 'vue'
import type {
    Item_Event,
    Item_Contact,
    Item_Day,
    Item_Service,
    Item_Meal,
    Item_Recipe,
    Item_RecipeIngredient,
    Item_Ingredient,
    Item_Supplier,
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
                'id',
                'status',
                'name',
                'description',
                'image',
                'notes',
                'shoppingList',
                'contacts.id',
                'contacts.name',
                'contacts.telephone',
                'contacts.email',
                'contacts.notes',
                'contacts.event',
                'contacts.supplier',
                'days.id',
                'days.status',
                'days.sort',
                'days.notes',
                'days.event',
                'days.date',
                'days.servingFood',
                'days.showDay',
                'days.services.id',
                'days.services.timeSlot',
                'days.services.guestCount',
                'days.services.note',
                'days.services.day',
                'days.services.meals.id',
                'days.services.meals.servingCount',
                'days.services.meals.recipe.id',
                'days.services.meals.recipe.name',
                'days.services.meals.recipe.servings',
                'days.services.meals.recipe.instructions',
                'days.services.meals.type',
                'days.services.meals.recipe.ingredients.id',
                'days.services.meals.recipe.ingredients.quantity',
                'days.services.meals.recipe.ingredients.recipe',
                'days.services.meals.recipe.ingredients.ingredient.id',
                'days.services.meals.recipe.ingredients.ingredient.name',
                'days.services.meals.recipe.ingredients.ingredient.unit',
                'days.services.meals.recipe.ingredients.ingredient.foodCategory.value',
                'days.services.meals.recipe.ingredients.ingredient.foodCategory.text',
                'days.services.meals.recipe.ingredients.ingredient.supplyCategory.value',
                'days.services.meals.recipe.ingredients.ingredient.supplyCategory.text',
                'days.services.meals.recipe.ingredients.ingredient.defaultPrice',
                'days.services.meals.recipe.ingredients.ingredient.prepLess',
                'suppliers',
                'suppliers.supplier.id',
                'suppliers.supplier.name',
                'suppliers.supplier.foodCategories.foodCategory',
                'suppliers.supplier.foodCategories.foodCategory.value',
                'suppliers.supplier.foodCategories.foodCategory.text',
                'suppliers.supplier.supplyCategories.supplyCategory',
                'suppliers.supplier.supplyCategories.supplyCategory.value',
                'suppliers.supplier.supplyCategories.supplyCategory.text',

            ].join(),
        }
    })

    currentEventStore.value = event
}

type ExpandedIngredient = Item_RecipeIngredient<
    (Pick<Item_Ingredient, 'id' | 'name' | 'unit' | 'defaultPrice' | 'prepLess'> & {
        foodCategory: { value: string; text: string | null } | null
        supplyCategory: { value: string; text: string | null } | null
    }) | null
>

type ExpandedRecipe = Pick<Item_Recipe, 'id' | 'name' | 'servings' | 'instructions'> & {
    ingredients: ExpandedIngredient[]
}

type ExpandedMeal = Item_Meal<ExpandedRecipe | null>

type ExpandedService = Item_Service<ExpandedMeal>

type ExpandedSupplier = Pick<Item_Supplier, 'id' | 'name'> & {
    foodCategories?: Array<{ foodCategory: { value: string; text: string | null } }>
    supplyCategories?: Array<{ supplyCategory: { value: string; text: string | null } }>
}

type ExpandedEventSupplierRow = {
    supplier: ExpandedSupplier
}

type CurrentEvent = Item_Event<Item_Contact, Item_Day<ExpandedService>, string, ExpandedEventSupplierRow>