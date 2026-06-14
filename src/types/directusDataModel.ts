export type {
    Item_Event,
    Item_Day,
    Item_Service,
    Item_Meal,
    Item_Diet,
    Item_DietCount,
    Item_DietCountDiets,
    Item_SpecialMeal,
    Item_Contact,
    Item_Supplier,
    Item_EventSupplier,
    Item_CookEvent,
    Item_WorkDay,
    Item_SupplierFoodCategory,
    Item_SupplierSupplyCategory,
    Item_FoodCategory,
    Item_SupplyCategory,
    Item_Ingredient,
    Item_Recipe,
    Item_RecipeIngredient,
}

// c5t: event — top-level container for days and contacts
type Item_Event<
    TContacts = number | Item_Contact,
    TDays = number | Item_Day,
    TCooks = string,
    TSuppliers = number | Item_Supplier,
> = {
    id: number
    status: string | null
    user_created: string | null
    date_created: string | null
    user_updated: string | null
    date_updated: string | null
    name: string | null
    description: string | null
    image: string | null
    notes: string | null
    shoppingList: any | null
    contacts: TContacts[]
    days: TDays[]
    cooks: TCooks[]
    suppliers: TSuppliers[]
}

// c5t: day — a single day within an event, contains services
type Item_Day<
    TServices = number | Item_Service,
    TCooks = string,
> = {
    id: number
    status: string | null
    sort: number | null
    user_created: string | null
    date_created: string | null
    user_updated: string | null
    date_updated: string | null
    notes: string | null
    event: number | null
    date: string | null
    servingFood: boolean | null
    showDay: boolean | null
    services: TServices[]
    cooks: TCooks[]
}

// c5t: service — a meal slot within a day (e.g. lunch, supper)
// guestCount is the total headcount for this service
type Item_Service<
    TMeals = number | Item_Meal,
    TDiets = number | Item_DietCount,
    TSpecialMeals = number,
> = {
    id: number
    user_created: string | null
    date_created: string | null
    user_updated: string | null
    date_updated: string | null
    timeSlot: string | null
    guestCount: number | null
    note: string | null
    day: number | null
    meals: TMeals[]
    diets: TDiets[]
    specialMeals: TSpecialMeals[]
}

// c5t: meal — a recipe assigned to a service, with an optional serving count override
// servingCount overrides the service guestCount for scaling the recipe
// type — the role of the dish in the service (starter, main, side, dessert, beverage)
type Item_Meal<
    TRecipe = number | Item_Recipe,
> = {
    id: number
    user_created: string | null
    date_created: string | null
    user_updated: string | null
    date_updated: string | null
    servingCount: number | null
    type: string | null
    recipe: TRecipe | null
    service: number | null
}

// c5t: diet entry used by services and special meals
type Item_Diet<
    TDietCounts = number,
> = {
    value: string
    text: string | null
    details: string | null
    dietCounts: TDietCounts[]
}

// c5t: service-level diet count rows with M2M to diets
type Item_DietCount<
    TDiets = string | Item_Diet,
    TService = number | Item_Service,
> = {
    id: number
    service: TService | null
    count: number | null
    diets: TDiets[]
}

// c5t: m2m row linking diet_counts and diets
type Item_DietCountDiets = {
    id: number
    diet_count: number | null
    diets: string | null
}

// c5t: special meal row tied to a diet and service
type Item_SpecialMeal<
    TDiet = string | Item_Diet,
    TRecipe = number | Item_Recipe,
    TService = number | Item_Service,
> = {
    id: number
    servingCount: number | null
    diet: TDiet | null
    recipe: TRecipe | null
    service: TService | null
    details: string | null
}

// c5t: contact — a person linked to an event or a supplier
type Item_Contact = {
    id: number
    user_created: string | null
    date_created: string | null
    user_updated: string | null
    date_updated: string | null
    name: string | null
    telephone: string | null
    email: string | null
    notes: string | null
    event: number | null
    supplier: number | null
}

// c5t: supplier — a vendor that provides ingredients
type Item_Supplier<
    TContacts = number | Item_Contact,
    TEvents = number,
    TFoodCategories = string,
    TSupplyCategories = string,
> = {
    id: number
    status: string | null
    sort: number | null
    user_created: string | null
    date_created: string | null
    user_updated: string | null
    date_updated: string | null
    name: string | null
    telephone: string | null
    notes: string | null
    location: string | null
    logo: string | null
    contacts: TContacts[]
    events: TEvents[]
    foodCategories: TFoodCategories[]
    supplyCategories: TSupplyCategories[]
}

// c5t: m2m row linking events and suppliers
type Item_EventSupplier = {
    id: number
    event: number | null
    supplier: number | null
}

// c5t: m2m row linking directus users to events
type Item_CookEvent = {
    id: number
    cook: string | null
    event: number | null
}

// c5t: m2m row linking directus users to days
type Item_WorkDay = {
    id: number
    cook: string | null
    day: number | null
}

// c5t: supplier ↔ food category junction row
type Item_SupplierFoodCategory = {
    id: number
    suppliers: number | null
    foodCategories: string | null
}

// c5t: supplier ↔ supply category junction row
type Item_SupplierSupplyCategory = {
    id: number
    suppliers: number | null
    supplyCategories: string | null
}

// c5t: ingredient — a base food item used in recipes
type Item_Ingredient<
    TFoodCategory = string,
    TSupplyCategory = string,
    TRecipes = number,
> = {
    id: number
    name: string | null
    prepLess: boolean | null
    defaultPrice: number | null
    supplyCategory: TSupplyCategory | null
    foodCategory: TFoodCategory | null
    unit: string | null
    recipes: TRecipes[]
}

// c5t: food category — what kind of food the ingredient is (e.g. Légumes, Poisson, Épices)
type Item_FoodCategory<
    TIngredients = number,
    TSuppliers = number,
> = {
    value: string
    sort: number | null
    user_created: string | null
    date_created: string | null
    user_updated: string | null
    date_updated: string | null
    text: string | null
    ingredients: TIngredients[]
    suppliers: TSuppliers[]
}

// c5t: supply category — how the ingredient is supplied (e.g. Sec, Frais, Surgelé, Conserve, Liquide)
type Item_SupplyCategory<
    TIngredients = number,
    TSuppliers = number,
> = {
    value: string
    sort: number | null
    user_created: string | null
    date_created: string | null
    user_updated: string | null
    date_updated: string | null
    text: string | null
    ingredients: TIngredients[]
    suppliers: TSuppliers[]
}

// c5t: recipe — a dish with a list of recipe ingredients
type Item_Recipe<
    TIngredients = number,
    TMeals = number,
> = {
    id: number
    name: string | null
    instructions: string | null
    servings: number | null
    ingredients: TIngredients[]
    meals: TMeals[]
}

// c5t: junction row for the recipes ↔ ingredients O2M relationship
type Item_RecipeIngredient<
    TIngredient = number,
    TRecipe = number,
> = {
    id: number
    quantity: number | null
    recipe: TRecipe | null
    ingredient: TIngredient | null
}