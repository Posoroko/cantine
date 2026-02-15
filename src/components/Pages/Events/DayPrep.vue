<script setup>
const props = defineProps({
    day: {
        type: Object,
        required: true
    }
})
</script>

<template>
    <div class="prepContainer">
        <p>Planification</p>
    </div>
</template>

<style scoped>

.prepContainer {
    padding: 20px 0;
    color: var(--beige);
    text-align: center;
}

</style>