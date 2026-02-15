<script setup>
import { useRouter } from 'vue-router'
import Icon from '@/components/Icon/Main.vue'
import { dbPatch } from '@/composables/fetch'

const router = useRouter()

const props = defineProps({
    day: {
        type: Object,
        required: true
    },
    isMenuOpen: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['toggle-menu', 'close-menu', 'day-updated'])

const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
    const dayName = dayNames[date.getUTCDay()]
    const dayNum = date.getUTCDate()
    return `${dayName} ${String(dayNum).padStart(2, '0')}`
}

const toggleMenu = () => {
    emit('toggle-menu', props.day.id)
}

const toggleShowDay = async () => {
    try {
        await dbPatch({
            endpoint: `/items/days/${props.day.id}`,
            body: {
                showDay: !props.day.showDay
            }
        })
        props.day.showDay = !props.day.showDay
        emit('close-menu')
        emit('day-updated')
    } catch (error) {
        console.error('Error updating showDay:', error)
    }
}

const toggleServingFood = async () => {
    try {
        await dbPatch({
            endpoint: `/items/days/${props.day.id}`,
            body: {
                servingFood: !props.day.servingFood
            }
        })
        props.day.servingFood = !props.day.servingFood
        emit('close-menu')
        emit('day-updated')
    } catch (error) {
        console.error('Error updating servingFood:', error)
    }
}

const goToDayDetails = () => {
    router.push({
        query: {
            slide: 'dayDetails',
            day: props.day.id
        }
    })
}
</script>

<template>
    <div 
        class="
            dayCard
            flex justifyEnd alignCenter
        "
    >
        <div 
            @click="goToDayDetails"
            class="
                dayHeader
                grow
                flex justifyBetween alignCenter
            "
        >
            <span class="dayDate">
                {{ formatDate(day.date) }}
            </span>

            <div class="dayIcons flex gap10">
                <Icon v-if="day.showDay" size="lg">
                    festival
                </Icon>

                <Icon v-if="day.servingFood" size="lg">
                    restaurant
                </Icon>
            </div>
        </div>

        <div class="menuContainer relative">
            <button
                @click.stop="toggleMenu"
                class="centered"
            >
                <Icon size="lg">
                    menu
                </Icon>
            </button>

            <div 
                v-if="isMenuOpen" 
                @click.stop
                class="dropdownMenu"
            >
                <button 
                    @click="toggleShowDay"
                    class="menuItem"
                >
                    <Icon>
                        {{ day.showDay ? 'check_box' : 'check_box_outline_blank' }}
                    </Icon>
                    <span>
                        <Icon>
                            festival
                        </Icon>
                    </span>
                </button>
                <button 
                    @click="toggleServingFood"
                    class="menuItem"
                >
                    <Icon>
                        {{ day.servingFood ? 'check_box' : 'check_box_outline_blank' }}
                    </Icon>
                    <span>
                        <Icon>
                            restaurant
                        </Icon>
                    </span>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>

.dayCard {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--beige);
    border-radius: 6px;
    cursor: pointer;
}

.dayHeader {
    padding: 16px;
    cursor: pointer;
    transition: all 200ms;
}

.dayHeader:hover {
    background: rgba(0, 0, 0, 0.1);
}

.dayDate {
    color: var(--beige);
    font-weight: 600;
    font-size: 18px;
    text-transform: capitalize;
}

.menuContainer {
    position: relative;
}

.dropdownMenu {
    position: absolute;
    top: 100%;
    right: 0;
    background: var(--green);
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid #ddd;
    z-index: 10;
    min-width: 200px;
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
    text-align: left;
    transition: all 200ms;
}

.menuItem:hover {
    background: rgba(0, 0, 0, 0.05);
}

.menuItem icon {
    color: var(--green);
}

.relative {
    position: relative;
}

</style>
