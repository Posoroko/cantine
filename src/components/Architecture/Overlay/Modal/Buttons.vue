<script setup>
import Button from '@/components/Buttons/SubmitForm.vue'

const emit = defineEmits(['confirm', 'cancel'])

</script>

<template>
    <div class="flex justifyCenter gap30">
        <Button
            @click="emit('cancel')"
            text="Annuler"
            color="transparent"
        />

        <Button
            @click="emit('confirm')"
            text="Confirmer"
            color="beige"
        />
    </div>
</template>