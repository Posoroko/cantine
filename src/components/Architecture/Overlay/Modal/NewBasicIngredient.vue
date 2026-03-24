<script setup>
import { ref, onMounted } from 'vue'
import Title from '@/components/Architecture/Overlay/Modal/Title.vue'
import Buttons from '@/components/Architecture/Overlay/Modal/Buttons.vue'
import { useModal } from '@/composables/modal'
import { dbPost } from '@/composables/fetch'
import { appAssetStore } from '@/composables/appAssets'

const emit = defineEmits(['confirm', 'cancel'])

const name = ref('')
const selectedCategoryKey = ref(null)
const categories = ref([])

onMounted(async () => {
    categories.value = appAssetStore.value.ingredientCategories || []
})

async function onConfirm() {
    if (!name.value || !selectedCategoryKey.value) return

    const newIngredient = await dbPost({
        endpoint: '/items/ingredients',
        body: {
            name: name.value,
            category: selectedCategoryKey.value
        }
    })

    emit('confirm', newIngredient)
}

function onCancel() {
    emit('cancel')
}

</script>
<template>
    <div class="full flex column gap20">
        <Title>
            Ajouter un ingrédient
        </Title>

        <form>
            <div
                class="flex column gap20"
            >
                <div
                    class="flex column gap5"
                >
                    <label
                        for="ingredientName"
                        class="colorBeige"
                    >
                        Nom
                    </label>

                    <input
                        v-model="name"
                        id="ingredientName"
                        type="text"
                        class="translucide"
                    />
                </div>

                <div
                    class="flex column gap5"
                >
                    <label
                        class="colorBeige"
                    >
                        Catégorie
                    </label>

                    <div class="flex wrap gap5">
                        <div
                            v-for="cat in categories" :key="cat.key"
                            @click="selectedCategoryKey = cat.key"
                            class="typeCard"
                            :class="[
                                selectedCategoryKey === cat.key ? 'selected' : ''
                            ]"
                        >
                            {{ cat.text }}
                        </div>
                    </div>
                </div>
            </div>
        </form>

        <Buttons
            @confirm="onConfirm"
            @cancel="onCancel"
        />
    </div>
</template>

<style scoped>
.typeCard {
    padding: 6px 14px;
    border-radius: 20px;
    border: 1px solid var(--beige);
    color: var(--beige);
    cursor: pointer;
    font-size: 14px;
}

.typeCard.selected {
    background-color: var(--beige);
    color: var(--green);
}
</style>
