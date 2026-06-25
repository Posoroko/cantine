<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import Private from '@/components/Architecture/Layouts/Private.vue'
import Loading from '@/components/Loading/Main.vue'
import EventBar from '@/components/Architecture/Bars/EventBar.vue'
import Informations from '@/components/Pages/Events/Informations.vue'
import Cooks from '@/components/Pages/Events/Cooks.vue'
import Days from '@/components/Pages/Events/Days.vue'
import Meals from '@/components/Pages/Events/Meals.vue'
import ShoppingList from '@/components/Pages/Events/ShoppingList.vue'
import GardeManger from '@/components/Pages/Events/GardeManger.vue'
import { dbGet } from '@/composables/fetch'

const route = useRoute()

const activeTab = computed(() => route.query.slide || 'informations')
const event = ref(null)

onMounted(async () => {
    const eventId = parseInt(route.params.eventId)
    const result = await dbGet({
        endpoint: `/items/events/${eventId}`,
        query: {
            fields: [
                'id',
                'name',
                'description',
                'image',
                'notes',
                'shoppingList',
                'pricePerGuest',
                'contacts.id',
                'contacts.name',
                'contacts.telephone',
                'contacts.email',
                'contacts.notes',
                'contacts.supplier',
                'days.id',
                'days.date',
                'days.status',
                'days.sort',
                'days.event',
                'days.servingFood',
                'days.showDay',
                'days.services.id',
                'days.services.timeSlot',
                'days.services.guestCount',
            ].join()
        }
    })
    event.value = result
})

const days = computed(() => event.value?.days)
</script>

<template>
    <Private>
        <template #topBar>
            <EventBar />
        </template>

        <template #main>
            <div 
                class="
                    scrollBox
                    h100 pad10
                    flex column
                "
            >
                <Loading v-if="!event">
                    Chargement...
                </Loading>

                <div 
                    v-else-if="!event" 
                    class="
                        errorText
                    "
                >
                    Événement non trouvé
                </div>

                <div 
                    v-else 
                    class="
                        eventContent
                        flex column w100
                    "
                >
                    <!-- Content Area -->
                    <Informations 
                        v-if="activeTab === 'informations'" 
                        :event="event"
                    />

                    <Cooks
                        v-if="activeTab === 'cooks'"
                        :eventId="event.id"
                    />

                    <Days
                        v-if="activeTab === 'days'"
                        :days="days ?? []"
                    />

                    <Meals
                        v-if="activeTab === 'meals'"
                        :eventId="event.id"
                    />

                    <ShoppingList
                        v-if="activeTab === 'shoppingList'"
                    />

                    <GardeManger
                        v-if="activeTab === 'gardeManger'"
                    />
                </div>
            </div>
        </template>
    </Private>
</template>

<style scoped>
.scrollBox {
    overflow-x: hidden;
    overflow-y: scroll;
}

.loadingText,
.errorText {
    text-align: center;
    color: var(--beige);
    padding: 40px;
    font-size: 16px;
}

.eventContent {
    display: flex;
    flex-direction: column;
}

.contentArea {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.bottomBar {
    padding: 20px;
    border-top: 1px solid var(--beige);
    margin-top: auto;
}
</style>
