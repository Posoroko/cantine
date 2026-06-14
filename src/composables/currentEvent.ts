import { ref } from 'vue'
import { dbGet } from '@/composables/fetch'

export {
    eventDaysStore,
    loadEventDays,
}

// c5t: cached days with full service/meal/ingredient data for the currently viewed event
// only fetches from directus if not already loaded for the same eventId
const eventDaysStore = ref<any[] | null>(null)
let loadedForEventId: number | null = null

async function loadEventDays(eventId: number) {
    if (loadedForEventId === eventId && eventDaysStore.value !== null) return
    const result = await dbGet<any[]>({
        endpoint: '/items/days',
        query: {
            'filter[event][_eq]': eventId,
            sort: 'date',
            fields: [
                'id',
                'date',
                'event',
                'event.pricePerGuest',
                'services.id',
                'services.timeSlot',
                'services.guestCount',
                'services.note',
                'services.diets.count',
                'services.diets.diets',
                'services.diets.diets.id',
                'services.diets.diets.diets.value',
                'services.diets.diets.diets.text',
                'services.meals.id',
                'services.meals.type',
                'services.meals.servingCount',
                'services.meals.recipe.id',
                'services.meals.recipe.name',
                'services.meals.recipe.servings',
                'services.meals.recipe.ingredients.id',
                'services.meals.recipe.ingredients.quantity',
                'services.meals.recipe.ingredients.ingredient.id',
                'services.meals.recipe.ingredients.ingredient.name',
                'services.meals.recipe.ingredients.ingredient.unit',
                'services.meals.recipe.ingredients.ingredient.defaultPrice',
            ].join()
        }
    })
    eventDaysStore.value = Array.isArray(result) ? result : []
    loadedForEventId = eventId
}
