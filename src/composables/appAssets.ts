import { ref } from 'vue'
import { dbGet } from '@/composables/fetch'

export {
    appAssetStore,
    loadAppAssets
}

export type {
    RecipeTag,
    Diet,
    IngredientCategory,
    Unit,
    PlanningSlot,
    ServiceSlot
}


//* 
//* c5t_specs_01 
const appAssetStore = ref<{
    recipeTags: RecipeTag[]
    diets: Diet[]
    ingredientCategories: IngredientCategory[]
    units: Unit[]
    planningSlots: PlanningSlot[]
    serviceSlots: ServiceSlot[]
}>({
    recipeTags: [],
    diets: [],
    ingredientCategories: [],
    units: [],
    planningSlots: [],
    serviceSlots: []
})

async function loadAppAssets() {
    const [
        tagsRes, 
        dietsRes, 
        categoriesRes, 
        unitsRes, 
        planningRes, 
        serviceRes
    ] = await Promise.allSettled([
        dbGet<RecipeTag[]>({ endpoint: '/items/recipe_tags' }),
        dbGet<Diet[]>({ endpoint: '/items/diets' }),
        dbGet<IngredientCategory[]>({ endpoint: '/items/ingredient_categories' }),
        dbGet<Unit[]>({ endpoint: '/items/units' }),
        dbGet<PlanningSlot[]>({ endpoint: '/items/planning_slots?sort=sort' }),
        dbGet<ServiceSlot[]>({ endpoint: '/items/service_slots?sort=sort' })
    ])

    appAssetStore.value.recipeTags = tagsRes.status === 'fulfilled' ? tagsRes.value || [] : []
    appAssetStore.value.diets = dietsRes.status === 'fulfilled' ? dietsRes.value || [] : []
    appAssetStore.value.ingredientCategories = categoriesRes.status === 'fulfilled' ? categoriesRes.value || [] : []
    appAssetStore.value.units = unitsRes.status === 'fulfilled' ? unitsRes.value || [] : []
    appAssetStore.value.planningSlots = planningRes.status === 'fulfilled' ? planningRes.value || [] : []
    appAssetStore.value.serviceSlots = serviceRes.status === 'fulfilled' ? serviceRes.value || [] : []
}

type RecipeTag = {
    key: string
    text: string
}

type Diet = {
    key: string
    text: string
}

type IngredientCategory = {
    key: string
    text: string
}

type Unit = {
    key: string
    sort: number | null
    singular: string
    plural: string
}

type PlanningSlot = {
    key: string
    text: string
    icon: string
    sort: number | null
}

type ServiceSlot = {
    key: string
    text: string
    icon: string
    sort: number | null
    services: any[]
}


// c5t_specs_01
// 
// App assets
// Assets are defined in directus collections so it is easy to manage them. 
// They should be seen as "static assets", even though they are fetch and have the abylity to be updated.