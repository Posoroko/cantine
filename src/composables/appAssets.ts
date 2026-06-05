import { ref } from 'vue'
import { dbGet } from '@/composables/fetch'

export {
    appAssetStore,
    loadAppAssets,
    TIME_SLOT_CONFIG
}

export type {
    Diet,
    FoodCategory,
    SupplyCategory,
    SupplierFoodCategoryLink,
    SupplierSupplyCategoryLink
}

const TIME_SLOT_CONFIG: Record<string, { label: string; icon: string; order: number }> = {
    breakfast: { label: 'Petit-déj',  icon: 'breakfast_dining', order: 1 },
    lunch:     { label: 'Déjeuner',   icon: 'lunch_dining',     order: 2 },
    snackPm:   { label: 'Goûter',     icon: 'bakery_dining',    order: 3 },
    aperoPm:   { label: 'Apéro',      icon: 'wine_bar',         order: 4 },
    supper:    { label: 'Souper',     icon: 'dinner_dining',    order: 5 },
}

//* 
//* c5t_specs_01 
const appAssetStore = ref<{
    diets: Diet[]
    foodCategories: FoodCategory[]
    supplyCategories: SupplyCategory[]
    supplierFoodCategories: SupplierFoodCategoryLink[]
    supplierSupplyCategories: SupplierSupplyCategoryLink[]
}>({
    diets: [],
    foodCategories: [],
    supplyCategories: [],
    supplierFoodCategories: [],
    supplierSupplyCategories: []
})

async function loadAppAssets() {
    const [
        dietsRes, 
        foodCategoriesRes,
        supplyCategoriesRes,
        supplierFoodCategoriesRes,
        supplierSupplyCategoriesRes,
    ] = await Promise.allSettled([
        dbGet<Diet[]>({ endpoint: '/items/diets' }),
        dbGet<FoodCategory[]>({ endpoint: '/items/food_categories' }),
        dbGet<SupplyCategory[]>({ endpoint: '/items/supply_categories' }),
        dbGet<SupplierFoodCategoryLink[]>({ endpoint: '/items/suppliers_food_categories', query: { fields: 'suppliers,foodCategories' } }),
        dbGet<SupplierSupplyCategoryLink[]>({ endpoint: '/items/suppliers_supply_categories', query: { fields: 'suppliers,supplyCategories' } }),
    ])

    appAssetStore.value.diets = dietsRes.status === 'fulfilled' ? dietsRes.value || [] : []
    appAssetStore.value.foodCategories = foodCategoriesRes.status === 'fulfilled' ? foodCategoriesRes.value || [] : []
    appAssetStore.value.supplyCategories = supplyCategoriesRes.status === 'fulfilled' ? supplyCategoriesRes.value || [] : []
    appAssetStore.value.supplierFoodCategories = supplierFoodCategoriesRes.status === 'fulfilled' ? supplierFoodCategoriesRes.value || [] : []
    appAssetStore.value.supplierSupplyCategories = supplierSupplyCategoriesRes.status === 'fulfilled' ? supplierSupplyCategoriesRes.value || [] : []
}

type Diet = {
    value: string
    text: string
    details: string | null
}

type FoodCategory = {
    value: string
    sort: number | null
    text: string | null
    suppliers: number[]
}

type SupplyCategory = {
    value: string
    sort: number | null
    text: string | null
    suppliers: number[]
}

type SupplierFoodCategoryLink = {
    suppliers: number | null
    foodCategories: string | null
}

type SupplierSupplyCategoryLink = {
    suppliers: number | null
    supplyCategories: string | null
}


// c5t_specs_01
// 
// App assets
// Assets are defined in directus collections so it is easy to manage them. 
// They should be seen as "static assets", even though they are fetch and have the abylity to be updated.