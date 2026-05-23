<script setup>
import Private from '@/components/Architecture/Layouts/Private.vue'
import MenuCard from '@/components/Cards/MenuCard.vue'
import { useAppState } from '@/composables/appState'
const appState = useAppState()

</script>

<template>
    <Private>
        <template #main>
            <div 
                class="
                    flex column gap20
                    pad20 justifyCenter h100
                "
            >
                <RouterLink
                    to="/evenements"
                >
                    <MenuCard
                        iconKey="festival"
                        title="Evénements"
                    />
                </RouterLink>
                

                <RouterLink
                    to="/livre-de-recettes"
                >
                    <MenuCard
                        iconKey="menu_book"
                        title="Livre de recettes"
                    />
                </RouterLink>

                <RouterLink
                    to="/catalogue-ingredients"
                >
                    <MenuCard
                        iconKey="grocery"
                        title="Catalogue d'ingrédients"
                    />
                </RouterLink>
                

                <RouterLink
                    to="/cuistots"
                >
                    <MenuCard
                        iconKey="group"
                        title="Cuistots"
                    />
                </RouterLink>
                
            </div>
        </template>

        <template #bottomBar>

        </template>
    </Private>
</template>