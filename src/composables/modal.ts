/**
 * Modal.ts
 * 
 * Simple modal composable for displaying components as modals.
 * Components handle their own content, styling, and logic.
 * 
 * Usage:
 * const { showModal, showConfirmationModal } = useModal()
 * 
 * const result = await showModal(MyComponent)
 * const confirmed = await showConfirmationModal({ title: 'Delete?', message: 'Sure?' })
 */

import { ref } from 'vue'
import ConfirmationModal from '@/components/Architecture/Overlay/Modal/ConfirmationModal.vue'

interface ConfirmationModalProps {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
}

interface ModalState {
    visible: boolean
    modal: any
    modalType?: 'confirmation' | 'custom'
    data?: Record<string, any>
    confirmationProps?: ConfirmationModalProps
    resolveFn?: (value: any) => void
    rejectFn?: (reason?: any) => void
}

const modalState = ref<ModalState>({
    visible: false,
    modal: undefined,
    confirmationProps: undefined,
    resolveFn: undefined,
    rejectFn: undefined
})

function useModal() {
    /**
     * Show a modal component and return a promise
     * @param modal - Vue component to display
     * @param data - Optional data accessible via modalState.data in the modal
     * @returns Promise that resolves when confirm() is called
     */
    const showModal = (
        modal: any, 
        data?: Record<string, any>
    ) => {
        modalState.value.modal = modal
        modalState.value.modalType = 'custom'
        modalState.value.data = data
        modalState.value.visible = true

        return new Promise((resolve, reject) => {
            modalState.value.resolveFn = resolve
            modalState.value.rejectFn = reject
        })
    }

    /**
     * Confirm and close the modal
     * @param data - Optional data to return to caller
     */
    const confirm = (data?: any) => {
        modalState.value.visible = false

        if (modalState.value.resolveFn) {
            modalState.value.resolveFn(data !== undefined ? data : true)
        }

        resetModalState()
    }

    /**
     * Cancel and close the modal
     * @param reason - Optional rejection reason
     */
    const cancel = (reason?: any) => {
        modalState.value.visible = false

        if (modalState.value.rejectFn) {
            modalState.value.rejectFn(reason !== undefined ? reason : false)
        }

        resetModalState()
    }

    /**
     * Show a confirmation modal with title, message, and buttons
     * @param props - Configuration object with title, message, confirmText, cancelText
     * @returns Promise that resolves when confirm is clicked
     */
    const showConfirmationModal = (props: ConfirmationModalProps) => {
        modalState.value.modal = ConfirmationModal
        modalState.value.modalType = 'confirmation'
        modalState.value.confirmationProps = props
        modalState.value.visible = true

        return new Promise((resolve, reject) => {
            modalState.value.resolveFn = resolve
            modalState.value.rejectFn = reject
        })
    }

    /**
     * Reset modal state after closing
     */
    const resetModalState = () => {
        setTimeout(() => {
            modalState.value.modal = undefined
            modalState.value.modalType = undefined
            modalState.value.data = undefined
            modalState.value.confirmationProps = undefined
            modalState.value.resolveFn = undefined
            modalState.value.rejectFn = undefined
        }, 300)
    }

    return {
        modalState,
        showModal,
        showConfirmationModal,
        confirm,
        cancel
    }
}

export { useModal }