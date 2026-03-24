<template>
    <div
        class="
            full
            flex column alignCenter justifyCenter gap20
        "
    >
        <div class="spinner"></div>

        <span class="loadingText">
            <slot />
        </span>
    </div>
</template>

<style scoped>
.spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(169, 169, 132, 0.3);
    border-top-color: var(--beige);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.loadingText {
    color: var(--beige);
    font-size: 14px;
}
</style>
