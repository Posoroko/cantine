<script setup>
import { computed } from 'vue'

const props = defineProps({
    timestamp: {
        type: String,
        required: true
    },
    format: {
        type: String,
        default: 'text',
        validator: (v) => ['text', 'num', 'textNoYear', 'numNoYear', 'textNoMonth', 'year'].includes(v)
    },
    capitalized: {
        type: Boolean,
        default: true
    }
})

const formatDate = computed(() => {
    if (!props.timestamp) return ''

    let date
    let year, month, day

    // Handle both string (YYYY-MM-DD) and Date objects
    if (typeof props.timestamp === 'string') {
        [year, month, day] = props.timestamp.split('-').map(Number)
        date = new Date(year, month - 1, day)
    } else if (props.timestamp instanceof Date) {
        date = props.timestamp
        year = date.getFullYear()
        month = date.getMonth() + 1
        day = date.getDate()
    } else {
        return ''
    }

    const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' })
    const monthName = date.toLocaleDateString('fr-FR', { month: 'long' })

    const capitalizedDayName = props.capitalized
        ? dayName.charAt(0).toUpperCase() + dayName.slice(1)
        : dayName

    const padDay = String(day).padStart(2, '0')
    const padMonth = String(month).padStart(2, '0')

    switch (props.format) {
        case 'text':
            return `${capitalizedDayName} ${day} ${monthName} ${year}`
        case 'num':
            return `${padDay}-${padMonth}-${year}`
        case 'textNoYear':
            return `${capitalizedDayName} ${day} ${monthName}`
        case 'numNoYear':
            return `${padDay}-${padMonth}`
        case 'textNoMonth':
            return `${capitalizedDayName} ${day}`
        case 'year':
            return `${year}`
        default:
            return ''
    }
})
</script>

<template>
    <span>{{ formatDate }}</span>
</template>
