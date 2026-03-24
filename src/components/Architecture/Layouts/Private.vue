<script setup>
import BottomBar from '@/components/Architecture/Bars/BottomBar.vue'
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
                <slot name="topBar" />

                <p>
                    <slot name="title" />
                </p>

                <div class="grow relative">
                    <div 
                        class="
                            absoluteFull
                            mainSlotBox pad5
                        "
                    >
                        <slot name="main" />
                    </div>
                </div>
            </div>
        </div>

        <div>
            <BottomBar>
                <template #links>
                    <slot name="bottomBarLinks" />
                </template>
            </BottomBar>
        </div>
    </div>
</template>

<style scoped>
h2 {
    font-size: 36px;
    padding: 0 20px;
}
</style>