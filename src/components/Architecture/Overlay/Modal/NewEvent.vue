<script setup>
import { ref, computed } from 'vue'
import Title from '@/components/Architecture/Overlay/Modal/Title.vue'
import FormStep from '@/components/Architecture/Overlay/Modal/Step.vue'
import DateRangeSelector from '@/components/Form/DateRangeSelector.vue'
import SelectImage from '@/components/Form/SelectImage.vue'
import { useEvents } from '@/composables/events'

const emit = defineEmits(['confirm', 'cancel'])
const { createEvent } = useEvents()

const activeStep = ref(0)
const totalSteps = 4

const title = ref('')
const location = ref('')
const selectedDates = ref({ dateFrom: null, dateTo: null })
const selectedImageFile = ref(null)

const isLastStep = computed(() => activeStep.value === totalSteps - 1)

// Validation for each step
const isTitleValid = computed(() => title.value.trim().length > 0)
const isLocationValid = computed(() => location.value.trim().length > 0)
const isDatesValid = computed(() => selectedDates.value.dateFrom && selectedDates.value.dateTo)
const isImageValid = computed(() => true) // Image is optional

const isCurrentStepValid = computed(() => {
    if (activeStep.value === 0) return isTitleValid.value
    if (activeStep.value === 1) return isLocationValid.value
    if (activeStep.value === 2) return isDatesValid.value
    if (activeStep.value === 3) return isImageValid.value
    return true
})

// Format dates in French with day name and date
const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' })
    return `${dayName.charAt(0).toUpperCase()}${dayName.slice(1)} ${day}/${month}/${year}`
}

const formattedDateFrom = computed(() => formatDate(selectedDates.value.dateFrom))
const formattedDateTo = computed(() => formatDate(selectedDates.value.dateTo))

function handleDateSelect(dates) {
    selectedDates.value = dates
}

function handleImageChange(file) {
    selectedImageFile.value = file
}

function handleImageClear() {
    selectedImageFile.value = null
}

function generateDateRange(dateFromStr, dateToStr) {
    const dates = []
    const [fromYear, fromMonth, fromDay] = dateFromStr.split('-').map(Number)
    const [toYear, toMonth, toDay] = dateToStr.split('-').map(Number)
    
    let current = new Date(fromYear, fromMonth - 1, fromDay)
    const end = new Date(toYear, toMonth - 1, toDay)
    
    while (current <= end) {
        const year = current.getFullYear()
        const month = String(current.getMonth() + 1).padStart(2, '0')
        const day = String(current.getDate()).padStart(2, '0')
        dates.push(`${year}-${month}-${day}`)
        current.setDate(current.getDate() + 1)
    }
    
    return dates
}

function handleSave() {
    const eventDates = generateDateRange(selectedDates.value.dateFrom, selectedDates.value.dateTo)
    
    const eventPayload = {
        title: title.value,
        location: location.value,
        dateFrom: selectedDates.value.dateFrom,
        dateTo: selectedDates.value.dateTo,
        dates: eventDates,
        image: selectedImageFile.value || undefined
    }
    
    createEvent(eventPayload).then((result) => {
        emit('confirm', result)
    }).catch((error) => {
        console.error('Failed to create event:', error)
    })
}

function goToNext() {
    if (activeStep.value < totalSteps - 1) {
        activeStep.value++
    }
}

function goToPrevious() {
    if (activeStep.value > 0) {
        activeStep.value--
    }
}

</script>
<template>
    <div class="full flex column gap20">
        <Title>
            Ajouter un événement
            <span class="colorBeige">({{ activeStep + 1 }}/{{ totalSteps }})</span>
        </Title>

        <form>
            <!-- Step 1: Title -->
            <FormStep
                v-if="activeStep === 0"
                @previous="goToPrevious"
                @next="goToNext"
                :valid="isTitleValid"
                :firstStep="true"
                class="flex column"
            >
                <label
                    for="eventTitle"
                    class="colorBeige"
                >
                    Nom de l'événement
                </label>

                <input 
                    v-model="title"
                    id="eventTitle"
                    type="text"
                    class="translucide w100"
                />
            </FormStep>

            <!-- Step 2: Location -->
            <FormStep
                v-if="activeStep === 1"
                @previous="goToPrevious"
                @next="goToNext"
                :valid="isLocationValid"
                class="flex column"
            >
                <label
                    for="eventLocation"
                    class="colorBeige"
                >
                    Lieu
                </label>

                <input 
                    v-model="location"
                    id="eventLocation"
                    type="text"
                    class="translucide w100"
                />
            </FormStep>

            <!-- Step 3: Dates -->
            <FormStep
                v-if="activeStep === 2"
                @previous="goToPrevious"
                @next="goToNext"
                :valid="isDatesValid"
                class="flex column"
            >
                <DateRangeSelector 
                    @select-dates="handleDateSelect"
                />
            </FormStep>

            <!-- Step 4: Image -->
            <FormStep
                v-if="activeStep === 3"
                @previous="goToPrevious"
                @save="handleSave"
                :valid="isImageValid"
                class="flex column"
                lastStep
            >
                <SelectImage
                    storage
                    @change="handleImageChange"
                    @clear="handleImageClear"
                />
            </FormStep>
        </form>
    </div>
</template>