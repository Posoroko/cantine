<script setup>
import Icon from '@/components/Icon/Main.vue'
const props = defineProps({
    iconKey: String,
    title: String
})
</script>
<template>
    <div 
        class="
            card 
            flex gap20
            pointer
        "
>
        <Icon
            v-if="iconKey"
            color="green"
            size="xl"

        >
            {{ iconKey }}
        </Icon>

        <p
            v-if="title"
            class="caprasimo"
        >
            {{ title }}
        </p>
    </div>
</template>

<style scoped>

.card {
    background-color: var(--beige);
    padding: 20px;
    border-radius: 10px;
    box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.226);
}
.card p {
    color: var(--green);
    font-size: 30px;
}
</style>