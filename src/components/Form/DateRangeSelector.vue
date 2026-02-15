<script setup>
import { ref, computed } from 'vue'
import Icon from '@/components/Icon/Main.vue'
import DateComp from '@/components/Text/Date.vue'

const emit = defineEmits(['select-dates'])

const selectedDateFrom = ref(null)
const selectedDateTo = ref(null)
const currentMonth = ref(new Date())

const monthDays = computed(() => {
    const year = currentMonth.value.getFullYear()
    const month = currentMonth.value.getMonth()
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    // Convert from Sunday-first (0=Sun) to Monday-first (0=Mon)
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7
    
    const days = []
    
    // Add days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    const prevMonthYear = month === 0 ? year - 1 : year
    const prevMonth = month === 0 ? 11 : month - 1
    
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i
        days.push({
            day,
            date: new Date(prevMonthYear, prevMonth, day),
            dateStr: `${prevMonthYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            fromOtherMonth: true
        })
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
        days.push({
            day,
            date: new Date(year, month, day),
            dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            fromOtherMonth: false
        })
    }
    
    // Add days from next month to complete the grid
    const nextMonthYear = month === 11 ? year + 1 : year
    const nextMonth = month === 11 ? 0 : month + 1
    const remainingCells = 42 - days.length // 6 weeks * 7 days
    
    for (let day = 1; day <= remainingCells; day++) {
        days.push({
            day,
            date: new Date(nextMonthYear, nextMonth, day),
            dateStr: `${nextMonthYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            fromOtherMonth: true
        })
    }
    
    return days
})

const monthYear = computed(() => {
    return currentMonth.value.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
})

const isDateInRange = (dateStr) => {
    if (!selectedDateFrom.value || !selectedDateTo.value) return false
    
    const [fromYear, fromMonth, fromDay] = selectedDateFrom.value.split('-').map(Number)
    const [toYear, toMonth, toDay] = selectedDateTo.value.split('-').map(Number)
    const [year, month, day] = dateStr.split('-').map(Number)
    
    const checkDate = new Date(year, month - 1, day)
    const startDate = new Date(fromYear, fromMonth - 1, fromDay)
    const endDate = new Date(toYear, toMonth - 1, toDay)
    
    return checkDate >= startDate && checkDate <= endDate
}

const isSelectedDate = (dateStr) => {
    return selectedDateFrom.value === dateStr || selectedDateTo.value === dateStr
}

function selectDate(dayObj) {
    if (!dayObj) return
    
    // If both dates selected, start fresh
    if (selectedDateFrom.value && selectedDateTo.value) {
        selectedDateFrom.value = dayObj.dateStr
        selectedDateTo.value = null
    }
    // If only one date selected, add second date
    else if (selectedDateFrom.value) {
        if (dayObj.dateStr < selectedDateFrom.value) {
            selectedDateTo.value = selectedDateFrom.value
            selectedDateFrom.value = dayObj.dateStr
        } else {
            selectedDateTo.value = dayObj.dateStr
        }
        emit('select-dates', {
            dateFrom: selectedDateFrom.value,
            dateTo: selectedDateTo.value
        })
    }
    // First date selection
    else {
        selectedDateFrom.value = dayObj.dateStr
    }
}

function previousMonth() {
    currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1)
}

function nextMonth() {
    currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1)
}

function clearDates() {
    selectedDateFrom.value = null
    selectedDateTo.value = null
}

</script>

<template>
    <div class="dateRangeSelector flex column gap15">
        <!-- Month/Year header with navigation -->
        <div class="flex alignCenter justifyBetween">
            <button
                @click="previousMonth"
                type="button"
                class="btn"
            >
                ←
            </button>
            
            <h3 class="colorBeige">
                {{ monthYear }}
            </h3>
            
            <button
                @click="nextMonth"
                type="button"
                class="btn"
            >
                →
            </button>
        </div>

        <!-- Day labels (Mon-Sun) -->
        <div class="calendarHeader flex">
            <div class="dayLabel">L</div>
            <div class="dayLabel">M</div>
            <div class="dayLabel">M</div>
            <div class="dayLabel">J</div>
            <div class="dayLabel">V</div>
            <div class="dayLabel">S</div>
            <div class="dayLabel">D</div>
        </div>

        <!-- Calendar grid -->
        <div class="calendarGrid flex column">
            <div 
                v-for="(week, idx) in Math.ceil(monthDays.length / 7)" 
                :key="idx"
                class="weekRow flex"
            >
                <button 
                    v-for="(day, dayIdx) in monthDays.slice(idx * 7, (idx + 1) * 7)"
                    :key="dayIdx"
                    @click="selectDate(day)"
                    type="button"
                    class="calendarDay"
                    :class="{
                        'selected': day && isSelectedDate(day.dateStr),
                        'inRange': day && isDateInRange(day.dateStr),
                        'first': day && selectedDateFrom === day.dateStr,
                        'last': day && selectedDateTo === day.dateStr,
                        'fromOtherMonth': day && day.fromOtherMonth
                    }"
                    :disabled="day && day.fromOtherMonth"
                >
                    {{ day?.day }}
                </button>
            </div>
        </div>

        <div class="flex justifyBetween">
            <!-- Selected range display -->
            <div class="selectedRange flex column gap10">
                <div class="colorBeige small">
                    du: 
                    <DateComp
                        v-if="selectedDateFrom" 
                        :timestamp="selectedDateFrom" 
                        format="textNoYear" 
                    />
                </div>

                <div class="colorBeige small">
                    au:    
                    <DateComp 
                        v-if="selectedDateTo" 
                        :timestamp="selectedDateTo" 
                        format="textNoYear"
                    />
                </div>
            </div>

            <button
                v-if="selectedDateFrom || selectedDateTo"
                @click.prevent="clearDates"
                type="button"
                class="clearBtn"
            >
                <Icon>cancel_presentation</Icon>
            </button>
        </div>
    </div>
</template>

<style scoped>
.dateRangeSelector {
    padding: 20px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
}

.calendarHeader {
    margin-bottom: 10px;
    font-weight: bold;
    gap: 5px;
}

.dayLabel {
    flex: 1;
    text-align: center;
    font-size: 12px;
    color: var(--beige);
    opacity: 0.6;
}

.calendarGrid {
    gap: 5px;
}

.weekRow {
    gap: 5px;
}

.calendarDay {
    flex: 1;
    aspect-ratio: 1;
    border: 1px solid var(--beige);
    background: transparent;
    color: var(--beige);
    cursor: pointer;
    border-radius: 2px;
    font-size: 14px;
    transition: all 0.2s;
}

.calendarDay:not(.empty):hover:not(:disabled) {
    background: rgba(169, 169, 132, 0.2);
    border-color: var(--beige);
}

.calendarDay.empty {
    border: none;
    background: transparent;
    cursor: default;
}

.calendarDay.inRange {
    background: rgba(169, 169, 132, 0.3);
    border-color: var(--beige);
}

.calendarDay.selected {
    background: var(--beige);
    color: var(--green);
    font-weight: bold;
    border-color: var(--beige);
}

.calendarDay:disabled {
    cursor: not-allowed;
    opacity: 0.3;
}

.selectedRange {
    padding-top: 10px;
    border-top: 1px solid rgba(169, 169, 132, 0.3);
    font-size: 12px;
}

.btn {
    background: transparent;
    border: 1px solid var(--beige);
    color: var(--beige);
    padding: 5px 10px;
    cursor: pointer;
    border-radius: 2px;
    transition: all 0.2s;
}

.btn:hover {
    background: rgba(169, 169, 132, 0.2);
}

.clearBtn {
    background: transparent;
    border: none;
    color: var(--beige);
    cursor: pointer;
    padding: 0;
    display: flex;
    alignItems: center;
    transition: all 0.2s;
}

.clearBtn:hover {
    opacity: 0.7;
}

h3 {
    margin: 0;
    font-size: 16px;
    text-transform: capitalize;
}

.small {
    font-size: 12px;
}
</style>