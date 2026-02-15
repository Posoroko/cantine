<script setup>
import { ref, onMounted } from 'vue'
import Title from '@/components/Architecture/Overlay/Modal/Title.vue'
import Buttons from '@/components/Architecture/Overlay/Modal/Buttons.vue'
import { useModal } from '@/composables/modal'
import { dbGet, dbPost } from '@/composables/fetch'

const emit = defineEmits(['confirm', 'cancel'])

const name = ref('')
const selectedTypeId = ref(null)
const ingredientTypes = ref([])

onMounted(async () => {
    ingredientTypes.value = await dbGet({
        endpoint: '/items/ingredient_types'
    })
})

async function onConfirm() {
    if (!name.value || !selectedTypeId.value) return

    const newIngredient = await dbPost({
        endpoint: '/items/ingredients',
        body: {
            name: name.value,
            type: selectedTypeId.value
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
                        Type
                    </label>

                    <div class="flex wrap gap5">
                        <div
                            v-for="t in ingredientTypes" :key="t.id"
                            @click="selectedTypeId = t.id"
                            class="typeCard"
                            :class="[
                                selectedTypeId === t.id ? 'selected' : ''
                            ]"
                        >
                            {{ t.text }}
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
