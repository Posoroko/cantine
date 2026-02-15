import { ref, readonly } from 'vue'

export {
    useAppState,
    useSetAppState
}

type AppState = {
    isLoading: boolean
    showDebugLogs: boolean
    showErrorLogs: boolean
    navigation: {
        currentView: null | 'home' | 'events' | 'crew'
    }
}

const appState = ref<AppState>({
    isLoading: false,
    showDebugLogs: false,
    showErrorLogs: true,
    navigation: {
        currentView: null
    }
})

function useAppState() {
    return appState
}

function useSetAppState(newState: Partial<AppState>) {
    appState.value = {
        ...appState.value,
        ...newState
    }
}
