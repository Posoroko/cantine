<script setup>
import { useUserState } from '@/composables/userState'
import { useAuth } from '@/composables/auth'
import { useModal } from '@/composables/modal'
import { useRouter } from 'vue-router'
import Icon from '@/components/Icon/Main.vue'
import { keepScreenOn } from '@/composables/wakeLock'

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
        <div
            class="flex justifyBetween"
        >
            <p class="configSectionLabel">Profil</p>
            <Icon
                @click="emit('cancel')"
                size="xl"
                class="pointer"
            >
                close
            </Icon>
        </div>

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

        <!-- config section -->
        <div class="configSection flex column gap10">
            <p class="configSectionLabel">Préférences</p>

            <div class="configRow flex alignCenter justifyBetween">
                <div class="flex column gap2">
                    <span class="configLabel">Garder l’écran allumé</span>
                    <span class="configHint">Empêche la mise en veille</span>
                </div>
                <button
                    class="toggle"
                    :class="{ on: keepScreenOn }"
                    @click="keepScreenOn = !keepScreenOn"
                >
                    <span class="toggleThumb" />
                </button>
            </div>
        </div>
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

/* config section */

.configSection {
    border-top: 1px solid color-mix(in srgb, var(--beige) 15%, transparent);
    padding-top: 16px;
}

.configSectionLabel {
    color: var(--beige);
    font-size: 0.75em;
    font-weight: 700;
    letter-spacing: 0.08em;
    opacity: 0.5;
    text-transform: uppercase;
}

.configRow {
    padding: 4px 0;
}

.configLabel {
    color: var(--beige);
    font-size: 0.95em;
    font-weight: 600;
}

.configHint {
    color: var(--beige);
    font-size: 0.75em;
    opacity: 0.4;
}

/* toggle switch */

.toggle {
    background: color-mix(in srgb, var(--beige) 20%, transparent);
    border: none;
    border-radius: 999px;
    cursor: pointer;
    flex-shrink: 0;
    height: 28px;
    padding: 3px;
    position: relative;
    transition: background 0.2s;
    width: 50px;
}

.toggle.on {
    background: var(--green, #2d6a4f);
    border: 1px solid var(--beige);
}

.toggleThumb {
    background: var(--beige);
    border-radius: 50%;
    display: block;
    height: 22px;
    left: 3px;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    transition: left 0.2s;
    width: 22px;
}

.toggle.on .toggleThumb {
    left: calc(100% - 25px);
}
</style>
