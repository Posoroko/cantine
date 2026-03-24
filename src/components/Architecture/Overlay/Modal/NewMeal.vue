<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Item_DietCount } from '@/types/directusDataModel'

import Title from '@/components/Architecture/Overlay/Modal/Title.vue'
import Icon from '@/components/Icon/Main.vue'
import { dbPost } from '@/composables/fetch'
import { loadCurrentEvent, currentEventStore } from '@/composables/currentEvent'
import { modalState } from '@/composables/modal'
import { appAssetStore } from '@/composables/appAssets'

const emit = defineEmits(['confirm', 'cancel'])

const eventId: number = modalState.value.data?.eventId
const serviceId: number | null = modalState.value.data?.serviceId || null
const serviceDietCounts: Item_DietCount[] = modalState.value.data?.serviceDietCounts || []

// -- Multi-step state
const step = ref<1 | 2>(1)

// -- Step 1: Recipe + diets
const selectedRecipe = computed(() => {
    return modalState.value.data?.recipe || "Pas de recette sélectionnée"
})
const targetAll = ref(true)
const selectedDietCountIds = ref<number[]>([])
const totalGuestCount = computed(() => serviceDietCounts.reduce((sum, dc) => sum + dc.count, 0))
const selectedGuestCount = computed(() => {
    if (targetAll.value) return totalGuestCount.value
    return serviceDietCounts
        .filter(dc => selectedDietCountIds.value.includes(dc.id))
        .reduce((sum, dc) => sum + dc.count, 0)
})

// -- Step 2: Notes
const notes = ref('')

const diets = computed(() => appAssetStore.value.diets)

function getDietLabels(dietCount: Item_DietCount): string {
    return dietCount.diets
        .map(d => {
            if (d.diet === 'default') return 'Classique'
            return diets.value.find(diet => diet.key === d.diet)?.text || d.diet
        })
        .join(', ')
}

function toggleDietCount(id: number) {
    targetAll.value = false
    const idx = selectedDietCountIds.value.indexOf(id)
    if (idx >= 0) {
        selectedDietCountIds.value.splice(idx, 1)
        if (selectedDietCountIds.value.length === 0) {
            targetAll.value = true
        }
    } else {
        selectedDietCountIds.value.push(id)
    }
}

function selectAll() {
    targetAll.value = true
    selectedDietCountIds.value = []
}

function goToStep2() {
    step.value = 2
}

function goBack() {
    step.value = 1
}

async function submit() {
    if (!selectedRecipe.value) return

    const body: Record<string, any> = {
        event: eventId,
        service: serviceId,
        recipe: selectedRecipe.value.id,
        notes: notes.value || null
    }

    if (!targetAll.value && selectedDietCountIds.value.length > 0) {
        body.targetDiets = selectedDietCountIds.value.map(id => ({
            dietCount: id
        }))
    }

    await dbPost({
        endpoint: '/items/meals',
        body
    })

    if (currentEventStore.value) {
        loadCurrentEvent(currentEventStore.value.id)
    }

    emit('confirm')
}
</script>

<template>
    <div
        class="
            full
            flex column gap20
        "
    >
        <!-- ======================== Step 1: Recipe + diets -->
        <template v-if="step === 1">
            <Title>
                Nouveau plat
            </Title>

            <div
                class="
                    recipeSelector
                    flex alignCenter justifyBetween
                "
            >
                <div
                    class="
                        flex alignCenter gap20
                    "
                >
                    <Icon size="xl">
                        menu_book
                    </Icon>

                    <span class="recipeSelectorLabel">
                        {{ selectedRecipe?.name || 'Sélectionner une recette' }}
                    </span>
                </div>

                <span class="dietCount flex alignCenter gap4">
                    <Icon size="sm">
                        {{ selectedGuestCount === 1 ? 'person' : 'group' }}
                    </Icon>
                    {{ selectedGuestCount }}
                </span>
            </div>

            <div
                v-if="serviceDietCounts.length"
                class="formLabel"
            >
                <div
                    class="
                        flex column gap10
                    "
                >
                    <button
                        @click="selectAll"
                        class="
                            dietPill 
                            flex alignCenter justifyBetween
                        "
                        :class="[
                            targetAll ? 'active beigeCardGreenText' : ''
                        ]"
                    >
                        <span class="dietLabels">
                            Tout le monde
                        </span>

                        <span class="dietCount flex alignCenter gap5">
                            <Icon 
                                size="sm"
                                :color="targetAll ? 'green' : 'beige'"
                            >
                                {{ totalGuestCount === 1 ? 'person' : 'group' }}
                            </Icon>
                            {{ totalGuestCount }}
                        </span>
                    </button>

                    <button
                        v-for="dc in serviceDietCounts"
                        :key="dc.id"
                        @click="toggleDietCount(dc.id)"
                        class="
                            dietPill 
                            flex alignCenter justifyBetween
                        "
                        :class="[
                            selectedDietCountIds.includes(dc.id) ? 'active beigeCardGreenText' : ''
                        ]"
                    >
                        <span class="dietLabels">
                            {{ getDietLabels(dc) }}
                        </span>

                        <span class="dietCount flex alignCenter gap5">
                            <Icon
                                size="sm"
                                :color="selectedDietCountIds.includes(dc.id) ? 'green' : 'beige'"
                            >
                                {{ dc.count === 1 ? 'person' : 'group' }}
                            </Icon>
                            {{ dc.count }}
                        </span>
                    </button>
                </div>
            </div>

            <button
                @click="goToStep2"
                :disabled="!selectedRecipe"
                class="
                    submitButton
                    fontWeightBold
                "
            >
                Suivant
            </button>
        </template>

        <!-- ======================== Step 2: Notes -->
        <template v-if="step === 2">
            <div class="flex alignCenter gap10">
                <Icon
                    @click="goBack"
                    class="pointer"
                    size="lg"
                >
                    arrow_back
                </Icon>

                <Title>
                    {{ selectedRecipe?.name }}
                </Title>
            </div>

            <label 
                class="
                    formLabel
                    flex column gap5
                "
            >
                <span>
                    Notes
                </span>

                <textarea
                    v-model="notes"
                    class="formTextarea"
                    rows="4"
                />
            </label>

            <button
                @click="submit"
                class="
                    submitButton
                    fontWeightBold
                "
            >
                Créer le plat
            </button>
        </template>
    </div>
</template>

<style scoped>

.recipeSelector:hover {
    border-color: var(--green);
    background: rgba(13, 139, 95, 0.15);
}

.formTextarea {
    color: var(--beige);
    background-color: rgba(0, 0, 0, 0.042);
    outline: none;
    border: none;
    border-bottom: 1px solid var(--beige);
    padding: 8px;
    resize: vertical;
}

.dietPill {
    padding: 6px 12px;
    border-radius: 5px;
    border: 1px solid rgba(169, 169, 132, 0.4);
    cursor: pointer;
}

.submitButton {
    padding: 14px;
    border-radius: 8px;
    border: none;
    background: var(--green);
    color: var(--beige);
    font-size: 16px;
    cursor: pointer;
    transition: opacity 200ms;
}

.submitButton:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}
</style>
