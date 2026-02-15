import { ref } from 'vue'

export {
    useUserState,
    useClearUserState,
    useAppInitialized
}

type UserState = {
    isLoggedIn: boolean
    username: string
    email: string
    id: string
    avatar: string
}

const userState = ref<UserState>({
    isLoggedIn: false,
    username: '',
    email: '',
    id: '',
    avatar: ''
})

const appInitialized = ref(false)

function useUserState() {
    return userState
}

function useAppInitialized() {
    return appInitialized
}

function useClearUserState() {
    return () => {
        userState.value = {
            isLoggedIn: false,
            username: '',
            email: '',
            id: '',
            avatar: ''
        }
    }
}
