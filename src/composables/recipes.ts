export function useRecipes() {
    const recipeTagsData = [
        { key: 'tartinades', text: 'Tartinades' },
        { key: 'entree', text: 'Entrée' },
        { key: 'plat', text: 'Plat' },
        { key: 'dessert', text: 'Dessert' },
        { key: 'viande', text: 'Viande' },
        { key: 'fromage', text: 'Fromage' },
        { key: 'salade', text: 'Salade' },
        { key: 'sauce', text: 'Sauce' },
        { key: 'comfortFood', text: 'Plat réconfortant' },
        { key: 'leger', text: 'Léger' },
        { key: 'chaud', text: 'Chaud' },
        { key: 'froid', text: 'Froid' },
        { key: 'sandwich', text: 'Sandwich' },
        { key: 'soupe', text: 'Soupe' },
        { key: 'pickles', text: 'Pickles' },
        { key: 'feculent', text: 'Féculent' },
        { key: 'legumineuse', text: 'Légumineuse' },
        { key: 'poisson', text: 'Poisson' },
        { key: 'fruits', text: 'Fruits' },
        { key: 'legumes', text: 'Légumes' },
        { key: 'pates', text: 'Pâtes' },
        { key: 'riz', text: 'Riz' }
    ]

    const dietsData = [
        { key: 'vegetarian', text: 'Végétarien' },
        { key: 'vegan', text: 'Végan' },
        { key: 'glutenFree', text: 'Sans gluten' },
        { key: 'dairyFree', text: 'Sans lactose' }
    ]

    return {
        recipeTagsData,
        dietsData
    }
}
