import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router/index'
import { useAuth } from '@/composables/auth'
import { loadAppAssets } from '@/composables/appAssets'

import '@/css/_styles_.css'

const app = createApp(App)

// Global function to access environment variables
app.config.globalProperties.$getEnvVar = function(varName: string): string | undefined {
    return import.meta.env[`VITE_${varName}`] as string | undefined
}

app.use(router)

loadAppAssets()

// Try to load user data on app startup (session validation)
const { loadUserData } = useAuth()
loadUserData().then(() => {
    app.mount('#app')
}).catch(() => {
    // No valid session, mount app anyway - user will see login page
    app.mount('#app')
})
