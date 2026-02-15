<script setup>
import TopBar from '@/components/Architecture/Bars/TopBar.vue'
</script>

<template>
    <div 
        class="
            full
            flex column justifyBetween
        "
    >
        <div>
            
        </div>
        
        <div
            class="grow relative"
        >
            <div 
                class="
                    absoluteFull
                    flex column
                "
            >
                <p>
                    <slot name="title" />
                </p>

                <div class="grow relative">
                    <div class="absoluteFull">
                        <slot name="main" />
                    </div>
                </div>
            </div>
        </div>

        <div>
            <TopBar>
                <template #links>
                    <slot name="topBarLinks" />
                </template>
            </TopBar>
        </div>
    </div>
</template>

<style scoped>
h2 {
    font-size: 36px;
    padding: 0 20px;
}
</style>