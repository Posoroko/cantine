<script setup>
import Icon from '@/components/Icon/Main.vue'
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()

const props = defineProps({
    meal: { type: Object, required: true },
    serviceDietCounts: { type: Array, default: () => [] },
    showMenu: { type: Boolean, default: false },
    variant: { type: String, default: 'service' }
})

const emit = defineEmits([
    'toggleMenu',
    'delete',
])

const mealGuestCount = computed(() => {
    const targetIds = props.meal.targetDiets?.map(td => td.dietCount) || []
    if (!targetIds.length) {
        return props.serviceDietCounts.reduce((sum, dc) => sum + dc.count, 0)
    }
    return props.serviceDietCounts
        .filter(dc => targetIds.includes(dc.id))
        .reduce((sum, dc) => sum + dc.count, 0)
})

function openMeal() {
    router.push({
        path: `/plats/${props.meal.id}`,
        query: { previousPage: route.fullPath }
    })
}

</script>

<template>
    <div class="mealCard">
        <div
            @click="openMeal"
            class="
                mealHeader
                flex alignCenter justifyBetween
            "
        >
            <div class="flex alignCenter gap10">
                <Icon
                    size="md"
                >
                    restaurant
                </Icon>

                <span class="mealLabel">
                    {{ meal.recipe?.name || 'Sans recette' }}
                </span>
            </div>

            <div 
                class="
                    flex alignCenter
                    relative
                "
            >
                <Icon
                    v-if="variant === 'list'"
                    :color="meal.service ? 'green' : 'beige'"
                >
                    {{ meal.service ? 'check_circle' : 'radio_button_unchecked' }}
                </Icon>

                <span
                    v-if="mealGuestCount"
                    class="
                        mealGuestCount
                        flex alignCenter gap5
                    "
                >
                    <Icon size="sm">
                        {{ mealGuestCount === 1 ? 'person' : 'group' }}
                    </Icon>
                    {{ mealGuestCount }}
                </span>

                <button
                    @click.stop.prevent="emit('toggleMenu')"
                    class="
                        mealMenuButton
                        pointer
                        flex alignCenter
                    "
                >
                    <Icon size="lg">
                        more_vert
                    </Icon>
                </button>

                <div
                    v-if="showMenu"
                    @click.stop.prevent
                    class="
                        dropdownMenu
                        absolute top0 right0 pad10
                        flex column
                    "
                >
                    <button 
                        @click.stop.prevent="emit('toggleMenu')"
                        class="
                            flex justifyEnd
                        "
                    >
                        <Icon>close</Icon>
                    </button>
                    
                    <button
                        @click.stop.prevent="emit('delete')"
                        class="menuItem deleteItem"
                    >
                        <Icon>
                            delete
                        </Icon>
                        <span>Supprimer</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.mealCard {
    background: transparent;
    padding: 3px 10px 3px 20px;
    border-radius: 20px;
    border: 1px solid var(--beige);
    transition: all 200ms;
}

.mealHeader {
    width: 100%;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 30px;
}

.mealLabel {
    font-size: 24px;
    font-weight: 700;
    text-transform: capitalize;
}

.mealMenuButton {
    width: 32px;
    aspect-ratio: 1;
    color: var(--beige);
}

.dropdownMenu {
    background: var(--green);
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid #ddd;
    z-index: 10;
    min-width: 160px;
}

.menuItem {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 16px;
    border: none;
    background: transparent;
    color: #333;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
}

.menuItem:hover {
    background: rgba(0, 0, 0, 0.1);
}

.deleteItem {
    color: #d32f2f;
}

.dayServiceLabel.unlinked {
    color: var(--beige);
    opacity: 0.5;
}

.closeBottom {
    margin-top: 20px;
    width: 100%;
    padding: 10px;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 200ms;
}

.closeBottom:hover {
    opacity: 1;
}

.noRecipe {
    opacity: 0.5;
    text-align: center;
    padding: 20px 0;
}
</style>
