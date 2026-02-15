import { useUserState, useClearUserState, useAppInitialized } from '@/composables/userState'
import { useLastRoute } from '@/composables/useLastRoute'
import { dbPost, dbGet } from '@/composables/fetch'

export { useAuth }

function useAuth() {
    const user = useUserState()
    const appInitialized = useAppInitialized()
    const { clearLastRoute } = useLastRoute()
    const clearUserState = useClearUserState()

    async function login(email: string, password: string) {
        try {
            const res = await dbPost({
                endpoint: '/auth/login',
                body: {
                    email,
                    password,
                    mode: 'session'
                }
            })

            console.log('Login response:', res)
            await loadUserData()
        } catch (error) {
            console.error('Login error details:', error)
            throw error
        }
    }

    async function loadUserData() {
        try {
            const data = await dbGet<{
                id: string
                email: string
                first_name: string
                avatar: string
            }>({
                endpoint: '/users/me'
            })

            console.log('[useAuth] Loaded user data:', data)
            user.value.id = data.id
            user.value.email = data.email
            user.value.username = data.first_name
            user.value.avatar = data.avatar
            user.value.isLoggedIn = true
        } catch (error) {
            console.log('[useAuth] No valid session:', error)
            clearUserState()
        } finally {
            // Mark app as initialized whether session exists or not
            appInitialized.value = true
        }
    }

    async function logout() {
        try {
            await dbPost({
                endpoint: '/auth/logout',
                body: {
                    mode: 'session'
                }
            })
        } catch (error) {
            // Logout might fail if session already invalid
            console.log('[useAuth] Logout request completed (may fail if session invalid):', error)
        }
        
        // Manually clear the session cookie to ensure clean state
        document.cookie = 'directus_session_token=; Max-Age=0; Path=/; Domain=.demande-a-tutu.com; SameSite=Lax'
        
        clearLastRoute()
        clearUserState()
    }

    return { login, logout, loadUserData }
}
