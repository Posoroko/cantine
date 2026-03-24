import { ref } from 'vue'

export {
    toasts,
    showToast,
    removeToast
}

export type {
    Toast,
    ToastType,
    ToastPosition
}


const toasts = ref<Toast[]>([])

let nextId = 0

function showToast(options: {
    text: string
    icon?: string
    type?: ToastType
    position?: ToastPosition
}) {
    const toast: Toast = {
        id: nextId++,
        text: options.text,
        icon: options.icon,
        type: options.type || 'success',
        position: options.position || 'bottom'
    }

    toasts.value.push(toast)

    return toast.id
}

function removeToast(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
}


type ToastType = 'success' | 'error' | 'warning' | 'info'

type ToastPosition = 'top' | 'bottom'

type Toast = {
    id: number
    text: string
    icon?: string
    type: ToastType
    position: ToastPosition
}
