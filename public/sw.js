const CACHE_NAME = 'kuro-v1'
const ASSETS_TO_CACHE = [
    '/',
    '/customer',
    '/manifest.json',
    '/logo.png'
]

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE)
        })
    )
    self.skipWaiting()
})

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim())
})

self.addEventListener('fetch', (event) => {
    // Skip cross-origin or non-get requests
    if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
        return
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((fetchResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    // Don't cache everything, just main assets
                    if (ASSETS_TO_CACHE.includes(new URL(event.request.url).pathname)) {
                        cache.put(event.request, fetchResponse.clone())
                    }
                    return fetchResponse
                })
            })
        })
    )
})

// Handle Push Notifications
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {}
    const title = data.title || 'KURO Update'
    const options = {
        body: data.body || 'New update from KURO',
        icon: '/logo.png',
        badge: '/logo.png',
        tag: data.tag || 'kuro-notification',
        data: data.url || '/customer',
        vibrate: [200, 100, 200]
    }

    event.waitUntil(
        self.registration.showNotification(title, options)
    )
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const urlToOpen = event.notification.data || '/customer'

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i]
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus()
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen)
            }
        })
    )
})
