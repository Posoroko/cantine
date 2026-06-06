self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', () => self.clients.claim())

// c5t: network-first — app is always up-to-date, offline falls back to cache
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const clone = response.clone()
                caches.open('cantinification-v1').then((cache) => cache.put(event.request, clone))
                return response
            })
            .catch(() => caches.match(event.request))
    )
})
