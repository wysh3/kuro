importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

self.addEventListener('install', (event) => {
    console.log('[FCM SW] Service worker installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[FCM SW] Service worker activated');
    event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
    if (!event.data) return;

    console.log('[FCM SW] Push event received');

    const handlePush = async () => {
        try {
            const rawData = event.data.json();

            let data = {
                title: 'KURO Update',
                body: 'New notification from KURO',
                icon: '/logo_light_mode.png',
                badge: '/logo_light_mode.png',
                tag: 'kuro-notification',
                data: { url: '/customer' }
            };

            if (rawData) {
                data = { ...data, ...rawData };
            }

            const options = {
                body: data.body,
                icon: data.icon,
                badge: data.badge,
                tag: data.tag,
                data: data.data,
                vibrate: [200, 100, 200],
                requireInteraction: true,
                actions: [
                    { action: 'open', title: 'View' },
                    { action: 'dismiss', title: 'Dismiss' }
                ],
                renotify: true
            };

            await self.registration.showNotification(data.title, options);
        } catch (e) {
            console.error('[FCM SW] Error handling push:', e);
        }
    };

    event.waitUntil(handlePush());
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    const handleNotificationClick = async () => {
        let urlToOpen = '/customer';

        try {
            if (event.notification.data && typeof event.notification.data === 'string') {
                urlToOpen = event.notification.data;
            } else if (event.notification.data && event.notification.data.url) {
                urlToOpen = event.notification.data.url;
            }
        } catch (e) {
            console.error('[FCM SW] Error parsing notification data:', e);
        }

        const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });

        for (const client of windowClients) {
            if (client.url.includes(urlToOpen) && 'focus' in client) {
                return client.focus();
            }
        }

        if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
        }
    };

    event.waitUntil(handleNotificationClick());
});

self.addEventListener('notificationclose', (event) => {
    console.log('[FCM SW] Notification closed:', event.notification.tag);
});
