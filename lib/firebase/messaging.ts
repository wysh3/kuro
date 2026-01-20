import { getToken, onMessage } from 'firebase/messaging'
import { getFirebaseMessaging } from './config'
import { doc, updateDoc, arrayUnion, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { getFirebaseDB } from './config'

export function getNotificationPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined') return 'default'
    return Notification.permission
}

export async function requestNotificationPermission(userId: string): Promise<string | null> {
    if (typeof window === 'undefined') return null

    try {
        const permissionStatus = getNotificationPermissionStatus()

        if (permissionStatus === 'denied') {
            console.warn('[Notifications] Permission already denied')
            return null
        }

        if (permissionStatus === 'granted') {
            console.log('[Notifications] Permission already granted, checking for existing token...')
        }

        console.log('[Notifications] Requesting permission...')
        const permission = await Notification.requestPermission()

        if (permission !== 'granted') {
            console.warn('[Notifications] Permission not granted:', permission)
            return null
        }

        console.log('[Notifications] Permission granted')

        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        if (!vapidKey) {
            console.error('[Notifications] FCM VAPID key not configured')
            return null
        }

        const messaging = getFirebaseMessaging()
        if (!messaging) {
            console.error('[Notifications] Messaging not available')
            return null
        }

        const token = await getToken(messaging, {
            vapidKey: vapidKey
        })

        if (token) {
            console.log('[Notifications] FCM Token received:', token.substring(0, 20) + '...')

            // Only save to DB if it's a real authenticated user (not a guest)
            if (userId && !userId.includes('guest')) {
                const db = getFirebaseDB()
                const tokenRef = doc(db, 'fcm_tokens', userId)

                try {
                    const tokenDoc = await getDoc(tokenRef)

                    if (tokenDoc.exists()) {
                        const existingTokens = tokenDoc.data().fcmTokens || []
                        if (!existingTokens.includes(token)) {
                            await updateDoc(tokenRef, {
                                fcmTokens: arrayUnion(token),
                                lastUpdated: Timestamp.now()
                            })
                            console.log('[Notifications] Token added to fcm_tokens')
                        }
                    } else {
                        await setDoc(tokenRef, {
                            userId,
                            fcmTokens: [token],
                            createdAt: Timestamp.now(),
                            lastUpdated: Timestamp.now()
                        })
                        console.log('[Notifications] Token doc created in fcm_tokens')
                    }
                } catch (err) {
                    console.error('[Notifications] Failed to save token to Firestore:', err)
                }
            } else {
                console.log('[Notifications] Guest token skip DB storage')
            }

            return token
        } else {
            console.warn('[Notifications] No token returned from FCM')
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('[Notifications] Error getting permission:', errorMessage)

        if (errorMessage.includes('failed-service-worker-registration')) {
            console.error('[Notifications] Service worker not registered. Please refresh the page.')
        }
    }

    return null
}

export async function revokeNotificationPermission(): Promise<void> {
    if (typeof window === 'undefined') return

    try {
        const permission = await Notification.permission
        if (permission === 'granted') {
            console.log('[Notifications] Permission revoked by user')
        }
    } catch (error) {
        console.error('[Notifications] Error revoking permission:', error)
    }
}

export function onMessageListener() {
    const messaging = getFirebaseMessaging()
    if (!messaging) return null

    return onMessage(messaging, (payload) => {
        console.log('[Notifications] Foreground message received:', payload)

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            const { notification } = payload
            if (notification) {
                // Try to show notification via service worker for better background/foreground handling
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.ready.then((registration) => {
                        registration.showNotification(notification.title || 'KURO', {
                            body: notification.body,
                            icon: '/logo_light_mode.png',
                            badge: '/logo_light_mode.png',
                            tag: 'foreground-notification'
                        })
                    }).catch(() => {
                        // Fallback to simple browser notification
                        new Notification(notification.title || 'KURO', {
                            body: notification.body,
                            icon: '/logo_light_mode.png'
                        })
                    })
                } else {
                    new Notification(notification.title || 'KURO', {
                        body: notification.body,
                        icon: '/logo_light_mode.png'
                    })
                }
            }
        }
    })
}
