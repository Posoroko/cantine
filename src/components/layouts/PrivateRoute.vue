<script setup lang="ts">
/**
 * PrivateRoute - Layout for authenticated pages
 * Wraps content that requires user login
 */
</script>

<template>
    <div class="privateRoute full flex column">
        <slot name="main" />

        <slot name="bottomBar" />
    </div>
</template>

<style scoped>

</style>
