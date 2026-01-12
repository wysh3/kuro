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
    console.log('[FCM SW] Push event received:', event.data?.json());

    let data = {
        title: 'KURO Update',
        body: 'New notification from KURO',
        icon: '/logo.png',
        badge: '/logo.png',
        tag: 'kuro-notification',
        data: { url: '/customer' }
    };

    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (e) {
            console.error('[FCM SW] Error parsing push data:', e);
        }
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

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    console.log('[FCM SW] Notification clicked:', event.action);

    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

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

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
            return null;
        })
    );
});

self.addEventListener('notificationclose', (event) => {
    console.log('[FCM SW] Notification closed:', event.notification.tag);
});
