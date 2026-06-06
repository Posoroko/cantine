<script setup>
import Icon from '@/components/Icon/Main.vue'
import Date from '@/components/Text/Date.vue'

defineProps({
    day: {
        type: Object,
        required: true
    }
})
</script>

<template>
    <div 
        class="
            dayCard
            flex justifyBetween alignCenter
        "
    >

        <Date
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
                    dinner_dining
                </Icon>
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

</style>
