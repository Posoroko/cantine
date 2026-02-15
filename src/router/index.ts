import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/home.vue'
import Events from '@/views/events.vue'
import EventDetail from '@/views/eventDetail.vue'
import Dashboard from '@/views/dashboard.vue'
import IngredientCatalogue from '@/views/ingredientCatalogue.vue'
import CookBook from '@/views/cookBook.vue'
import Cooks from '@/views/cooks.vue'
import { useUserState, useAppInitialized } from '@/composables/userState'
import { useLastRoute } from '@/composables/useLastRoute'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'Home',
            component: Home,
            meta: { requiresAuth: false }
        },
        {
            path: '/evenements',
            name: 'Events',
            component: Events,
            meta: { requiresAuth: true }
        },
        {
            path: '/evenements/:eventId',
            name: 'EventDetail',
            component: EventDetail,
            meta: { requiresAuth: true }
        },
        {
            path: '/dashboard',
            name: 'Dashboard',
            component: Dashboard,
            meta: { requiresAuth: true }
        },
        {
            path: '/catalogue-ingredients',
            name: 'IngredientCatalogue',
            component: IngredientCatalogue,
            meta: { requiresAuth: true }
        },
        {
            path: '/livre-de-recettes',
            name: 'CookBook',
            component: CookBook,
            meta: { requiresAuth: true }
        },
        {
            path: '/cuistots',
            name: 'Cooks',
            component: Cooks,
            meta: { requiresAuth: true }
        },
    ]
})

// Route guard to check authentication
router.beforeEach((to, from, next) => {
    const user = useUserState()
    const appInitialized = useAppInitialized()
    const requiresAuth = to.meta.requiresAuth

    // Don't enforce protection until app has checked for existing session
    if (!appInitialized.value) {
        next()
        return
    }

    if (requiresAuth && !user.value.isLoggedIn) {
        // User not logged in and route requires auth - redirect to home
        next('/')
    } else {
        next()
    }
})

// Track route changes for last visited page
router.afterEach((to) => {
    const { saveCurrentRoute } = useLastRoute()
    saveCurrentRoute(to.fullPath)
})

export default router
