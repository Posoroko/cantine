import { useCookie } from '@/composables/useCookie'

export { useLastRoute }

function useLastRoute() {
    // Store the last visited route in a cookie
    const lastRoute = useCookie('lastRoute', '/dashboard')

    function saveCurrentRoute(path: string) {
        // Don't save the login page as the last route
        if (path !== '/') {
            lastRoute.value = path
        }
    }

    function getLastRoute(): string {
        return lastRoute.value || '/dashboard'
    }

    function clearLastRoute() {
        lastRoute.value = '/dashboard'
    }

    return {
        lastRoute,
        saveCurrentRoute,
        getLastRoute,
        clearLastRoute
    }
}
