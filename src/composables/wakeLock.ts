import { ref, watch } from 'vue'
import { useCookie } from '@/composables/useCookie'

export { keepScreenOn, initWakeLock }

// c5t: persisted preference — defaults to true, stored as 'true'/'false' cookie string
const keepScreenOnCookie = useCookie('keepScreenOn', 'true')
const keepScreenOn = ref(keepScreenOnCookie.value !== 'false')

let wakeLock: WakeLockSentinel | null = null
let visibilityListenerAdded = false

watch(keepScreenOn, (val) => {
    keepScreenOnCookie.value = val ? 'true' : 'false'
    if (val) requestWakeLock()
    else releaseWakeLock()
})

async function requestWakeLock() {
    if (!('wakeLock' in navigator)) return
    if (wakeLock) return
    try {
        wakeLock = await (navigator as any).wakeLock.request('screen')
        wakeLock!.addEventListener('release', () => { wakeLock = null })
    } catch {
        // c5t: not supported or permission denied — fail silently
    }
}

async function releaseWakeLock() {
    if (wakeLock) {
        await wakeLock.release()
        wakeLock = null
    }
}

// c5t: call once on app mount — requests wake lock and re-requests it after tab visibility changes
async function initWakeLock() {
    if (keepScreenOn.value) await requestWakeLock()

    if (!visibilityListenerAdded) {
        visibilityListenerAdded = true
        document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState === 'visible' && keepScreenOn.value) {
                await requestWakeLock()
            }
        })
    }
}
