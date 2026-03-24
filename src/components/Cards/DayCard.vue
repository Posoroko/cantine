<script setup>
import { useRouter, useRoute } from 'vue-router'
import Icon from '@/components/Icon/Main.vue'
import { dbPatch } from '@/composables/fetch'
import Date from '@/components/Text/Date.vue'

const router = useRouter()
const route = useRoute()

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
            day: props.day.id,
            previousPage: route.fullPath
        }
    })
}
</script>

<template>
    <div 
        class="
            dayCard
            flex justifyBetween alignCenter
        "
    >

        <Date
            @click="goToDayDetails"
            :timestamp="day.date"
            format="textNoMonth"
            class="
                dateCard
                fontWeightBold text3xl caprasimo
                colorGreen
                pointer
            "
        />

        <div
            class="flex alignCenter"
        >
            <div 
                class="
                    dayIcons 
                    flex gap10
                "
            >
                <Icon v-if="day.showDay" size="lg">
                    festival
                </Icon>

                <Icon v-if="day.servingFood" size="lg">
                    restaurant
                </Icon>
            </div>
            
            <div 
                class="
                    menuContainer relative
                "
            >
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
                    class="
                        dropdownMenu
                    "
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
    </div>
</template>

<style scoped>

.dayCard {
    border-radius: 6px;
}
.dateCard {
    background-color: var(--beige);
    padding: 0px 14px;
    border-radius: 10px;
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
