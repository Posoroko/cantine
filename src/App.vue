<script setup lang="ts">
import Overlay from '@/components/Architecture/Overlay/Main.vue'
</script>

<template>
    <main
        class="
            appFullViewport
            relative
        "
    >
        <div class="appBox">
            <RouterView />

            <Overlay />
        </div>
    
    </main>
</template>

<style scoped>
.appFullViewport {
    width: 100vw;
    height: 100vh;
    background-color: var(--green);
    /* padding: max(2vh, 10px) max(2vh, 10px) */
}
.appBox {
    height: 100%;
    width: min(650px, 100%);
    background-color: var(--green);
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.31);
    margin: auto;
}
</style>
