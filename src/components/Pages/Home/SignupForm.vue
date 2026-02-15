<script setup>
import Button from '@/components/Buttons/SubmitForm.vue'
import Icon from '@/components/Icon/Main.vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/auth'
import { useAppState } from '@/composables/appState'

const appState = useAppState()

const router = useRouter()
const { login } = useAuth()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const error = ref('')

async function handleLogin() {
    if (!email.value || !password.value) {
        error.value = 'Email and password are required'
        return
    }

    isLoading.value = true
    error.value = ''

    try {
        await login(email.value, password.value)
        // Navigate to events on success
        appState.value.navigation.currentView = 'home'
        router.push('/dashboard')
    } catch (err) {
        error.value = 'Login failed. Please check your credentials.'
        console.error(err)
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <form
        @submit.prevent="handleLogin"
        class="panel flex column gap10"
    >
        <div v-if="error" class="errorMessage">
            {{ error }}
        </div>

        <div>
            <label
                for="userEmail"
            >
                email
            </label>
            <input 
                id="userEmail"
                v-model="email"
                name="email"
                type="email"
                autocomplete="email"
                class="w100"
            />
        </div>

        <div>
            <label
                for="userPassword"
                class="marTop20"
            >
                mot de passe
            </label>
            <div
                class="relative"
            >
                <input 
                    id="userPassword"
                    v-model="password"
                    name="password"
                    :type="!showPassword ? 'password' : 'text'"
                    autocomplete="current-password"
                    class="w100"
                />

                <div
                    @click="showPassword = !showPassword"
                    class="
                        absolute top0 right0 bottom 
                        flex alignCenter 
                        h100 
                        pad5 pointer
                    "
                >
                    <icon
                        size="md"
                        :key="showPassword ? 'notVisible' : 'visible'"
                    />
                </div>
                
            </div>
        </div>

        <div 
            class="
                flex justifyCenter
                marTop20
            "
        >
            <button
                type="submit"
                :disabled="isLoading"
                class="button fontWeightSemibold"
            >
                {{ isLoading ? 'Loading...' : 'Entrer' }}
            </button>
        </div>
    </form>
</template>

<style scoped>
.panel {
    width: min(450px, 100%);
}
label {
    font-weight: 700;
    font-family: "Roboto", sans-serif;
    color: var(--beige);
}
input {
    border: none;
    font-family: "Roboto", sans-serif;
    font-weight: 700;
}
.button, input {
    color: var(--green);
    background-color: var(--beige);
}
.button {
    padding: 10px 20px;
    cursor: pointer;
    border: none;
}
.button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
.errorMessage {
    color: var(--red);
    padding: 10px;
    background-color: rgba(255, 0, 0, 0.1);
    border-radius: 4px;
}
</style>