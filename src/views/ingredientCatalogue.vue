<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import Private from '@/components/Architecture/Layouts/Private.vue'
import { dbGet } from '@/composables/fetch'

type Unit = {
    singular: string | null
}

type Ingredient = {
    id: number
    name: string | null
    defaultPrice: number | null
    unit: Unit | null
}

const ingredients = ref<Ingredient[]>([])
const searchQuery = ref('')

// c5t: ingredient search filters by case-insensitive name match
const filteredIngredients = computed(() => {
    if (!searchQuery.value) return ingredients.value

    const query = searchQuery.value.toLowerCase()
    return ingredients.value.filter((ingredient) => {
        const name = (ingredient.name || '').toLowerCase()
        return name.includes(query)
    })
})

function formatPrice(value: number | null): string {
    if (value === null) return 'Prix indisponible'
    return value.toFixed(2) + ' €'
}

async function fetchIngredients() {
    const data = await dbGet<Ingredient[]>({
        endpoint: '/items/ingredients',
        query: {
            fields: [
                'id',
                'name',
                'defaultPrice',
                'unit',
            ].join(),
        }
    })

    ingredients.value = data.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
}

onMounted(async () => {
    await fetchIngredients()
})
</script>

<template>
    <Private>
        <template #main>
            <div 
                class="
                    full
                    flex column gap20
                    pad20
                "
            >
                <input 
                    v-model="searchQuery"
                    type="text"
                    placeholder="Rechercher un ingrédient..."
                    class="defaultInputStyles"
                />

                <div
                    class="
                        scrollBox
                        flex column gap5
                    "
                >
                    <article
                        v-for="ingredient in filteredIngredients"
                        :key="ingredient.id"
                        class="ingredientCard flex alignCenter justifyBetween gap15 pad15 rounded10"
                    >
                        <h2 class="ingredientName grow">
                            {{ ingredient.name }}
                        </h2>

                        <span class="ingredientPrice shrink0">
                            {{ formatPrice(ingredient.defaultPrice) }}
                            <template v-if="ingredient.unit"> / {{ ingredient.unit }}</template>
                        </span>
                    </article>

                    <p
                        v-if="!filteredIngredients.length"
                        class="emptyText"
                    >
                        Aucun ingrédient trouvé
                    </p>
                </div>
            </div>
        </template>
    </Private>
</template>

<style scoped>
.scrollBox {
    overflow-y: scroll;
}

.ingredientCard {
    background: color-mix(in srgb, var(--beige) 6%, transparent);
    color: var(--beige);
}

.ingredientName {
    font-size: 18px;
    font-weight: 700;
    text-transform: capitalize;
}

.ingredientPrice {
    font-size: 14px;
    font-weight: 600;
    opacity: 0.9;
    text-align: right;
}

.emptyText {
    opacity: 0.6;
}
</style>