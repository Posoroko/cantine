export type {
    Item_Event,
    Item_Day,
    Item_Service,
    Item_Meal,
    Item_Contact,
    Item_Supplier,
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
    contacts: TContacts[]
    days: TDays[]
    cooks: any[]
}

// c5t: day — a single day within an event, contains services
type Item_Day<
    TServices = number | Item_Service,
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
    cooks: any[]
}

// c5t: service — a meal slot within a day (e.g. lunch, supper)
// guestCount is the total headcount for this service
type Item_Service<
    TMeals = number | Item_Meal,
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
    diets: any[]
    specialMeals: any[]
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
    recipe: TRecipe
    service: number | null
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
    contacts: TContacts[]
}

// c5t: ingredient — a base food item used in recipes
type Item_Ingredient<
    TFoodCategory = number | Item_FoodCategory,
    TSupplyCategory = number | Item_SupplyCategory,
> = {
    id: number
    name: string | null
    prepLess: boolean | null
    defaultPrice: number | null
    supplyCategory: TSupplyCategory | null
    foodCategory: TFoodCategory | null
    unit: string | null
    recipes: (number | Item_RecipeIngredient)[]
}

// c5t: food category — what kind of food the ingredient is (e.g. Légumes, Poisson, Épices)
type Item_FoodCategory = {
    value: string
    sort: number | null
    text: string | null
}

// c5t: supply category — how the ingredient is supplied (e.g. Sec, Frais, Surgelé, Conserve, Liquide)
type Item_SupplyCategory = {
    value: string
    sort: number | null
    text: string | null
}

// c5t: recipe — a dish with a list of recipe ingredients
type Item_Recipe<
    TIngredients = number | Item_RecipeIngredient,
> = {
    id: number
    name: string | null
    instructions: string | null
    servings: number | null
    ingredients: TIngredients[]
    meals: (number | Item_Meal)[]
}

// c5t: junction row for the recipes ↔ ingredients O2M relationship
type Item_RecipeIngredient<
    TIngredient = number | Item_Ingredient,
> = {
    id: number
    recipe: number | null
    ingredient: TIngredient
    quantity: number | null
}