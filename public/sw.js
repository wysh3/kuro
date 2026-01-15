const CACHE_NAME = 'kuro-v1'
const ASSETS_TO_CACHE = [
    '/',
    '/customer',
    '/manifest.json',
    '/logo_light_mode.png',
    '/logo_dark_mode.png'
]

self.addEventListener('install', (event) => {
    const handleInstall = async () => {
        try {
            const cache = await caches.open(CACHE_NAME)
            await cache.addAll(ASSETS_TO_CACHE)
        } catch (e) {
            console.error('[Cache SW] Install error:', e)
        }
    }
    event.waitUntil(handleInstall())
    self.skipWaiting()
})

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim())
})

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
        return
    }

    const handleFetch = async () => {
        try {
            const cachedResponse = await caches.match(event.request)
            if (cachedResponse) return cachedResponse

            const fetchResponse = await fetch(event.request)
            const cache = await caches.open(CACHE_NAME)

            if (ASSETS_TO_CACHE.includes(new URL(event.request.url).pathname)) {
                cache.put(event.request, fetchResponse.clone())
            }

            return fetchResponse
        } catch (e) {
            console.error('[Cache SW] Fetch error:', e)
            return fetch(event.request)
        }
    }

    event.respondWith(handleFetch())
})

self.addEventListener('push', (event) => {
    const handlePush = async () => {
        try {
            const data = event.data ? await event.data.json() : {}
            const title = data.title || 'KURO Update'
            const options = {
                body: data.body || 'New update from KURO',
                icon: '/logo_light_mode.png',
                badge: '/logo_light_mode.png',
                tag: data.tag || 'kuro-notification',
                data: data.url || '/customer',
                vibrate: [200, 100, 200]
            }

            await self.registration.showNotification(title, options)
        } catch (e) {
            console.error('[Cache SW] Push error:', e)
        }
    }

    event.waitUntil(handlePush())
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close()

    const handleClick = async () => {
        const urlToOpen = event.notification.data || '/customer'

        try {
            const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true })

            for (const client of windowClients) {
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus()
                }
            }

            if (clients.openWindow) {
                return clients.openWindow(urlToOpen)
            }
        } catch (e) {
            console.error('[Cache SW] Notification click error:', e)
        }
    }

    event.waitUntil(handleClick())
})
