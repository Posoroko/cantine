/**
 * App state types
 */

export type {
    AppState
}

type AppState = {
    isLoading: boolean
    showDebugLogs: boolean
    showErrorLogs: boolean
    navigation: {
        currentView: null | 'home' | 'events' | 'crew'
    }
}
