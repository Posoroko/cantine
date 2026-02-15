/**
 * Basic ingredient types
 */

export type {
    BasicIngredient,
    IngredientType
}

type IngredientType = {
    id: number
    sort: number | null
    value: string
    text: string
}

type BasicIngredient = {
    id: number
    name: string
    type: IngredientType
}
