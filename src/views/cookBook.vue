<script setup>
import Private from '@/components/Architecture/Layouts/Private.vue'
import TitleWithCreateButton from '@/components/Text/TitleWithCreateButton.vue'
</script>

<template>
    <Private>
        <template #main>
            <div 
                class="
                    flex column gap20
                    pad20
                "
            >
                <TitleWithCreateButton>
                    Recettes
                </TitleWithCreateButton>
            </div>
        </template>
    </Private>
</template>