<template>
    <private-view title="Cantine">
        <div class="homeGrid">
            <button class="bigCard" @click="goTo('events')">
                <v-icon name="calendar_month" />
                <span>Événements</span>
            </button>
            <button class="bigCard" @click="goTo('recipes')">
                <v-icon name="menu_book" />
                <span>Livre de recettes</span>
            </button>
        </div>
    </private-view>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goTo(path: string) {
    router.push(`/cantine-dashboard/${path}`)
}
</script>

<style scoped>
.homeGrid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    padding: 60px 40px;
    max-width: 700px;
}

.bigCard {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    padding: 56px 32px;
    background: var(--card-face-color, var(--background-normal));
    border: 2px solid var(--border-normal);
    border-radius: 12px;
    cursor: pointer;
    font-size: 20px;
    font-weight: 600;
    color: var(--foreground-normal);
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.1s;
}

.bigCard:hover {
    border-color: var(--primary);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

.bigCard:active {
    transform: translateY(0);
}

.bigCard .v-icon {
    --v-icon-size: 52px;
    color: var(--primary);
}
</style>
