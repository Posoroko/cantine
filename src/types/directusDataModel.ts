export type {
    Item_Event,
    Item_Day,
    Item_Contact,
    Item_Supplier,
    Item_FoodCategory,
    Item_SupplyCategory,
    Item_Ingredient,
    Item_Recipe,
    Item_RecipeIngredient,
    Item_Meal,
    Item_MealIngredient,
}

// c5t: event — top-level container for days and contacts
type Item_Event<
    TContacts = number | Item_Contact,
    TDays = number | Item_Day,
> = {
    id: number
    user_created: string | null
    date_created: string | null
    user_updated: string | null
    date_updated: string | null
    name: string | null
    description: string | null
    image: string | null
    contacts: TContacts[]
    days: TDays[]
}

// c5t: day — a single day within an event
type Item_Day = {
    id: number
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
// defaultPrice is a fallback for simple/stable items; planning-time price is always on Item_MealIngredient
type Item_Ingredient<
    TFoodCategory = number | Item_FoodCategory,
    TSupplyCategory = number | Item_SupplyCategory,
    TRecipes = number | Item_RecipeIngredient,
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
type Item_FoodCategory = {
    value: string
    text: string | null
}

// c5t: supply category — how the ingredient is supplied (e.g. Sec, Frais, Surgelé, Conserve, Liquide)
type Item_SupplyCategory = {
    value: string
    text: string | null
}

// c5t: recipe — a dish with a list of ingredients and cooking instructions
type Item_Recipe<
    TIngredients = number | Item_RecipeIngredient,
> = {
    id: number
    status: 'published' | 'draft' | 'archived'
    name: string | null
    instructions: string | null
    servings: number | null
    ingredients: TIngredients[]
}

// c5t: junction row for the recipes ↔ ingredients M2M relationship
// quantity and unit override the ingredient's defaults for this specific recipe
type Item_RecipeIngredient<
    TIngredient = number | Item_Ingredient,
> = {
    id: number
    recipe: number | null
    ingredient: TIngredient
    quantity: number | null
    unit: string | null
}

// c5t: meal — a recipe planned for an event day, scaled to a headcount
type Item_Meal<
    TEvent = number | Item_Event,
    TRecipe = number | Item_Recipe,
    TIngredients = number | Item_MealIngredient,
> = {
    id: number
    user_created: string | null
    date_created: string | null
    user_updated: string | null
    date_updated: string | null
    event: TEvent
    recipe: TRecipe
    headcount: number | null
    day: string | null
    notes: string | null
    ingredients: TIngredients[]
}

// c5t: meal ingredient — a price/supplier snapshot for one ingredient at planning time
// price is captured from the quote JSON at the moment the meal is planned, not a live catalogue lookup
type Item_MealIngredient<
    TMeal = number | Item_Meal,
    TIngredient = number | Item_Ingredient,
    TSupplier = number | Item_Supplier,
> = {
    id: number
    meal: TMeal
    ingredient: TIngredient
    supplier: TSupplier
    quantity: number | null
    unit: string | null
    price: number | null
}