<template>
    <div 
        class="
            full
        "
    >
        <div
            id="mobileLayoutBox"
            class="box r"
        >
            <slot />
        </div>
    </div>
    
</template>

<style scoped>
.box {
    height: 100%;
    width: min(650px, 100%);
    margin: auto;
}
</style>