<script setup lang="ts">


const model = defineModel('')

const props = defineProps<{
    type: 'text' | 'password'
    preset: 'beige' | 'green'
}>()


</script>

<template>
    <input 
        v-model="model"
        :type="type"
    />
</template>

<style scoped>
input {
    font-size: 20px;
    font-weight: 700;
    color: var(--beige);
    background-color: rgba(0, 0, 0, 0.042);
    outline: none;
    border: none;
    border-bottom: 1px solid var(--beige);
}
</style>