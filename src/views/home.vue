<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserState } from '@/composables/userState'
import { useLastRoute } from '@/composables/useLastRoute'
import SignupForm from '@/components/Pages/Home/SignupForm.vue'

const router = useRouter()
const user = useUserState()
const { getLastRoute } = useLastRoute()

onMounted(() => {
    // If user is logged in, redirect to last visited page
    if (user.value.isLoggedIn) {
        router.push(getLastRoute())
    }
})
</script>

<template>
    <div
        class="full r flex column alignCenter justifyCenter gap30"
    >
        <h1
            class="caprasimo flex justifyCenter"
        >
            Cantine
        </h1>

        <SignupForm />
    </div> 
</template>

<style scoped>

h1  {
    color: var(--green);
    font-size: 64px;
    background-color: var(--beige);
    padding: 0px 30px;
    border-radius: 10px;
}
</style>