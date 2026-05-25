<script setup lang="ts">
import { computed } from 'vue'
import { appAssetStore } from '@/composables/appAssets'

const props = defineProps<{
    baseGuestCount: number
    dietCounts: any[]
}>()

const specialDietCounts = computed(() =>
    props.dietCounts.filter((dc: any) =>
        !dc.diets.some((d: any) => d.diet === 'default')
    )
)

const standardDietCount = computed(() => {
    const defaultEntry = props.dietCounts.find((dc: any) =>
        dc.diets.some((d: any) => d.diet === 'default')
    )
    if (defaultEntry) return defaultEntry.count

    if (props.dietCounts.length === 0) return props.baseGuestCount

    const specialDietTotal = specialDietCounts.value.reduce(
        (sum: number, dietCount: any) => sum + dietCount.count,
        0
    )

    return props.baseGuestCount - specialDietTotal
})

const getDietTextFromAppAssetStore = (dietKey: string): string => {
    const diet = appAssetStore.value.diets.find(d => d.key === dietKey)
    return diet?.text || dietKey
}
</script>

<template>
    <div
        class="
            box
            textXl
        "
    >
        <p class="flex gap20">
            <span
                class="count"
            >
                {{ standardDietCount }}
            </span>

            <span>
                classique
            </span>
        </p>

        <p
            v-for="dietCount in specialDietCounts"
            :key="dietCount.id"
            class="flex gap20"
        >
            <span
                class="count"
            >
                {{ dietCount.count }}
            </span>

            <span>
                <span
                    v-for="(diet, index) in dietCount.diets"
                    :key="diet.id"
                >
                    {{ getDietTextFromAppAssetStore(diet.diet) }}<span v-if="index < dietCount.diets.length - 1">, </span>
                </span>
            </span>
        </p>
    </div>
</template>

<style scoped>
.box {
    padding: 8px 15px;
    border: 1px solid var(--beige);
    border-left: 5px solid var(--beige);
    border-radius: 10px;
}
.count {
    width: 50px;
}
</style>