<script setup>
import { useUserState } from '@/composables/userState'
import { useAuth } from '@/composables/auth'
import { useModal } from '@/composables/modal'
import { useRouter } from 'vue-router'
import Icon from '@/components/Icon/Main.vue'

const me = useUserState()
const { logout } = useAuth()
const emit = defineEmits(['cancel'])
const router = useRouter()

async function handleLogout() {
    await logout()
    emit('cancel')
    router.push('/')
}

</script>
<template>
    <div class="full flex column gap20">
        <h1>
            Profil
        </h1>

        <div class="infoBox flex gap10">
            <Icon>email</Icon>
            <p class="value">{{ me.email }}</p>
        </div>

        <button
            @click="handleLogout"
            class="logoutBtn"
        >
            Déconnexion
        </button>
    </div>
</template>

<style scoped>
.infoBox {
    padding: 15px;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 10px;
}

.label {
    font-size: 12px;
    color: var(--beige);
    margin: 0 0 5px 0;
}

.value {
    font-size: 14px;
    color: var(--beige);
    margin: 0;
    word-break: break-all;
}

.logoutBtn {
    padding: 10px 20px;
    color: var(--beige);
    font-weight: 700;
}

.logoutBtn:hover {
    opacity: 0.9;
}
</style>
