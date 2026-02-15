import { useAppState } from './appState'

export {
    useHandleError
}

function useHandleError(error: any) {
    if (!error) return

    const appState = useAppState()

    // Log to console if error logs are enabled
    if (appState.value.showErrorLogs) {
        console.error('Error:', error)
    }

    // TODO: Integrate with toaster when implemented
    // useToaster('show', {
    //     id: `${Math.random()}`,
    //     message: error.message || 'Une erreur est survenue',
    //     type: 'error',
    //     autoClose: true
    // })
}
