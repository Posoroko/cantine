<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { currentEventStore, loadCurrentEvent } from '@/composables/currentEvent'
import { dbDelete } from '@/composables/fetch'
import { useModal } from '@/composables/modal'
import Loading from '@/components/Loading/Main.vue'
import Icon from '@/components/Icon/Main.vue'
import MealCard from '@/components/Cards/Meal.vue'
import SelectRecipe from '@/components/Architecture/Overlay/Modal/SelectRecipe.vue'
import NewMeal from '@/components/Architecture/Overlay/Modal/NewMeal.vue'
import DietDetails from "@/components/Pages/Events/ServiceDietDetails.vue"
import UpdateServiceDietCounts from '@/components/Architecture/Overlay/Modal/UpdateServiceDietCounts.vue'
import Date from '@/components/Text/Date.vue'

const route = useRoute()
const router = useRouter()

const previousPage = computed(() => {
    return route.query.previousPage || route.path
})

const openMenuMealId = ref(null)
const showServiceMenu = ref(false)

const { showConfirmationModal, showModal } = useModal()

const service = computed(() => {
    const dayId = parseInt(route.query.day)
    const serviceId = parseInt(route.query.service)
    if (!currentEventStore.value || !dayId || !serviceId) return null

    const day = currentEventStore.value.days.find(d => d.id === dayId)
    if (!day) return null

    return day.services.find(s => s.id === serviceId) || null
})

const meals = computed(() => {
    if (!service.value?.meals?.length) return []
    return service.value.meals
})

const addMeal = async () => {
    //1. open SelectREcipe modal, wait for response , recipe object comes back
    //2. open NewMeal modal and pass recipe to modalState
    if (!service.value || !currentEventStore.value) return

    console.log('open selectrecipe')
    const recipe = await showModal(
        SelectRecipe
    )

    console.log('open new meal')
    const res = await showModal(
        NewMeal, 
        {
            recipe: recipe,
            eventId: currentEventStore.value.id,
            serviceId: service.value.id,
            serviceDietCounts: service.value.dietCounts || []
        }
    )
}

const toggleMealMenu = (mealId) => {
    openMenuMealId.value = openMenuMealId.value === mealId ? null : mealId
}

const deleteMeal = async (mealId) => {
    try {
        await dbDelete(`/items/meals/${mealId}`)
        if (currentEventStore.value) {
            await loadCurrentEvent(currentEventStore.value.id)
        }
        openMenuMealId.value = null
    } catch (error) {
        console.error('Error deleting meal:', error)
    }
}

const toggleServiceMenu = () => {
    showServiceMenu.value = !showServiceMenu.value
}

const deleteService = async () => {
    if (!service.value) return

    try {
        await showConfirmationModal({
            title: 'Supprimer le service',
            message: 'Êtes-vous sûr de vouloir supprimer ce service et tous ses plats ?',
            confirmText: 'Supprimer',
            cancelText: 'Annuler'
        })
    } catch {
        return
    }

    await dbDelete(`/items/services/${service.value.id}`)

    if (currentEventStore.value) {
        await loadCurrentEvent(currentEventStore.value.id)
    }

    router.push(previousPage.value)
}

const editService = async () => {
    if (!service.value) return
    showServiceMenu.value = false

    await showModal(UpdateServiceDietCounts, {
        serviceId: service.value.id,
        guestCount: service.value.guestCount,
        dietCounts: service.value.dietCounts || []
    })
}
</script>

<template>
    <div class="serviceDetailsContainer">
        <Loading v-if="!service">
            Chargement...
        </Loading>

        <div
            v-if="service"
            class="
                serviceDetailsContent
                flex column
            "
        >
            <div
                class="
                    flex justifyBetween alignCenter
                "
            >
                <div
                    class="flex alignCenter"
                >
                    <router-link
                        :to="previousPage"
                        class="pad10 flex alignCenter"
                    >
                        <Icon size="lg">
                            arrow_back
                        </Icon>
                    </router-link>

                    <div
                        class="
                            beigeCardGreenText
                            detailTab
                            textLg
                            flex alignCenter gap5
                        "
                    >
                        <Icon
                            class="icon"
                            size="sm"
                        >
                            event
                        </Icon>

                        <Date
                            :timestamp="service.day.date"
                            format="textNoMonth"
                        />
                    </div>
                </div>

                <div 
                    class="
                        menuBox
                        flex alignCenter
                        pad10
                        pointer
                    "
                >
                    <Icon
                        @click="toggleServiceMenu"
                        size="lg"
                    >
                        menu
                    </Icon>

                    <div
                        v-if="showServiceMenu"
                        class="
                            serviceMenu
                            flex column
                        "
                    >
                        <button
                            @click="editService"
                            class="
                                serviceMenuItem
                                flex alignCenter gap10
                            "
                        >
                            <Icon size="sm">
                                edit
                            </Icon>
                            Modifier
                        </button>

                        <button
                            @click="deleteService"
                            class="
                                serviceMenuItem
                                flex alignCenter gap10
                            "
                        >
                            <Icon size="sm">
                                delete
                            </Icon>
                            Supprimer
                        </button>
                    </div>
                </div>
            </div>

            <div class="flex column gap20 marTop20">
                <div>
                    <h2 
                        class="
                            serviceTitle
                            flex alignCenter gap10
                        "
                    >
                        

                        <div
                            class="
                                beigeCardGreenText
                                detailTab
                                textLg
                                flex alignCenter gap5
                            "
                        >
                            <Icon
                                class="icon"
                                size="sm"
                            >
                                event
                            </Icon>

                            {{ service.slot?.text || '' }}
                        </div>

                        <div
                            class="
                                beigeCardGreenText
                                detailTab
                                textLg
                                flex alignCenter gap5
                            "
                        >
                            <Icon
                                class="icon"
                                size="sm"
                            >
                                person
                            </Icon>
                            {{ service.guestCount }}
                        </div>
                    </h2>
                    
                    <DietDetails
                        :baseGuestCount="service.guestCount"
                        :dietCounts="service.dietCounts || []"
                    />
                </div>

                <div
                    class="
                        mealsGrid
                        flex column gap10
                    "
                >
                    <div class="flex">
                        <h2
                            class=""
                        >
                            Menu
                        </h2>
                    </div>

                    <MealCard
                        v-for="meal in meals" :key="meal.id"
                        @toggleMenu="toggleMealMenu(meal.id)"
                        @delete="deleteMeal(meal.id)"
                        :meal="meal"
                        :serviceDietCounts="service?.dietCounts || []"
                        :showMenu="openMenuMealId === meal.id"
                    />

                    <button
                        @click="addMeal"
                        class="
                            mealTile empty
                            flex alignCenter gap30
                        "
                    >
                        <Icon
                            size="xl"
                            class="mealIcon"
                        >
                            add
                        </Icon>

                        <span class="mealLabel">
                            Ajouter un plat
                        </span>
                    </button>
                </div>
            </div>
        </div>

        <p v-else class="noData">
            Erreur lors du chargement du service
        </p>
    </div>
</template>

<style scoped>

.serviceTitle {
    color: var(--beige);
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 10px;
}
.detailTab {
    padding: 0 5px;
    border-radius: 5px;
}

.noData {
    text-align: center;
    color: var(--beige);
    padding: 40px;
}

.menuBox {
    position: relative;
}

.serviceMenu {
    position: absolute;
    top: 100%;
    right: 0;
    min-width: 160px;
    background: var(--green);
    border: 1px solid rgba(169, 169, 132, 0.3);
    border-radius: 8px;
    overflow: hidden;
    z-index: 10;
}

.serviceMenuItem {
    padding: 12px 16px;
    background: transparent;
    color: var(--beige);
    border: none;
    cursor: pointer;
    font-size: 15px;
    transition: background 200ms;
}

.serviceMenuItem:hover {
    background: rgba(169, 169, 132, 0.15);
}
</style>
