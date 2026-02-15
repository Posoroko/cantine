<script setup>
import Icon from '@/components/Icon/Main.vue'
import { useUserState } from '@/composables/userState'
import { useModal } from '@/composables/modal'
import UserMenu from '@/components/Architecture/Overlay/Modal/UserMenu.vue'
import AppConfig from '@/composables/appConfig'

const me = useUserState()
const { showModal } = useModal()

function openUserMenu() {
    showModal(UserMenu)
}
</script>

<template>
    <nav
        class="flex justifyBetween alignCenter"
    >
        <RouterLink
            to="/dashboard"
            class="link"
            @click="changeView('home')"
        >
            <Icon>
                home
            </Icon>
        </RouterLink>

        <div>
            <slot name="links" />
        </div>

        <button
            @click="openUserMenu"
        >
            <img
                v-if="me.avatar"
                class="avatar"
                :src="`${AppConfig.dbUrl}/assets/${me.avatar}`" 
            >

            <Icon
                v-else
            >
                menu
            </Icon>
        </button>
    </nav>
</template>

<style scoped>
nav {
    padding: 5px;
    border-bottom: 1px solid var(--beige);
}
button {
    padding: 5px 10px;
    cursor: pointer;
}
.avatar {
    width: 30px;
    height: 30px;
    border-radius: 500px;
}
</style>