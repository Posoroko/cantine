export type {
    Item_Contact,
    Item_Cook,
    Item_Day,
    Item_Diet,
    Item_DietCount, Item_DietCountS_Diet,
    Item_EventCook,
    Item_Event,
    Item_Ingredient,
    Item_Meal, Item_MealS_DietCount,
    Item_MissionType,
    Item_Mission,
    Item_PlanningSlot,
    Item_Planning,
    Item_RecipeTag,
    Item_Recipe,
    Item_RecipeIngredient,
    Item_ServiceSlot,
    Item_Service,
    Item_Supplier,
    Item_Unit,
    Item_IngredientCategory
}

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
}

type Item_Cook = {
    id: number
    name: string | null
    telephone: string | null
    email: string | null
    avatar: string | null
    events: Item_EventCook[]
}

type Item_Day<
    TServices = number | Item_Service,
    TPlannings = number | Item_Planning
> = {
    id: number
    status: string
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
    plannings: TPlannings[]
}

type Item_Diet = {
    key: "default" | "dairyFree" | "glutenFree" | "vegan" | "vegetarian"
    text: string | null
}

type Item_DietCount = {
    id: number
    count: number
    service: Item_Service['id']
    diets: Item_DietCountS_Diet[]
}

type Item_DietCountS_Diet = {
    id: number
    diet_count: number
    diet: Item_Diet['key']
}

type Item_EventCook = {
    id: number
    event: number | null
    cook: number | null
}

type Item_Event = {
    id: number
    status: string
    user_created: string | null
    date_created: string | null
    user_updated: string | null
    date_updated: string | null
    name: string | null
    description: string | null
    image: string | null
    contacts: Item_Contact[]
    days: Item_Day[]
    cooks: Item_EventCook[]
    meals: Item_Meal[] | Item_Meal['id'][]
}

type Item_Ingredient = {
    id: number
    name: string | null
    category: string | null
    prepLess: boolean
    recipes_ingredients: Item_RecipeIngredient[]
}

type Item_Meal = {
    id: number
    status: string
    user_created: string | null
    date_created: string | null
    user_updated: string | null
    date_updated: string | null
    service: number | null
    recipe: number | null
    event: Item_Event['id']
    targetDiets: Item_MealS_DietCount[]
}

type Item_MealS_DietCount = {
    id: number
    meal: number
    dietCount: Item_DietCount['id']
}

type Item_MissionType = {
    key: string
    text: string | null
}

type Item_Mission<
    TIngredient = number | Item_RecipeIngredient | null
> = {
    id: number
    user_created: string | null
    date_created: string | null
    user_updated: string | null
    date_updated: string | null
    type: string | null
    notes: string | null
    toDo: string | null
    completed: boolean
    planning: number | null
    ingredient: TIngredient
}

type Item_PlanningSlot = {
    key: string
    text: string | null
    icon: string | null
    sort: number | null
}

type Item_Planning<
    TSlot = string | Item_PlanningSlot | null,
    TMissions = Item_Mission[]
> = {
    id: number
    day: number | null
    slot: TSlot
    missions: TMissions
}

type Item_RecipeTag = {
    key: string
    text: string | null
}

type Item_Recipe = {
    id: number
    name: string | null
    instructions: string | null
    servings: number | null
    meals: Item_Meal[]
    ingredients: Item_RecipeIngredient[]
}

type Item_RecipeIngredient<
    TIngredient = number | Item_Ingredient | null
> = {
    id: number
    quantity: string | null
    unit: string | null
    recipe: number | null
    ingredient: TIngredient
}

type Item_ServiceSlot = {
    key: string
    text: string | null
    icon: string | null
    sort: number | null
    services: Item_Service[]
}

type Item_Service = {
    id: number
    user_created: string | null
    date_created: string | null
    user_updated: string | null
    date_updated: string | null
    guestCount: string | null
    day: number | null
    slot: string | null
    meals: Item_Meal[]
    dietCounts: Item_DietCount[]
}

type Item_Supplier = {
    id: number
    status: string
    sort: number | null
    user_created: string | null
    date_created: string | null
    user_updated: string | null
    date_updated: string | null
    name: string | null
    telephone: string | null
    notes: string | null
    location: string | null
}

type Item_Unit = {
    key: string
    sort: number | null
    singular: string | null
    plural: string | null
}

type Item_IngredientCategory = {
    key: string
    text: string | null
}