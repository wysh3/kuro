import { getToken, onMessage } from 'firebase/messaging'
import { getFirebaseMessaging } from './config'
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore'
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
            
            const db = getFirebaseDB()
            const userRef = doc(db, 'users', userId)
            const userDoc = await getDoc(userRef)
            
            if (userDoc.exists()) {
                const userData = userDoc.data()
                const existingTokens = userData.fcmTokens || []
                
                if (!existingTokens.includes(token)) {
                    await updateDoc(userRef, {
                        fcmTokens: arrayUnion(token),
                        notificationsEnabled: true
                    })
                    console.log('[Notifications] Token saved to user profile')
                } else {
                    console.log('[Notifications] Token already exists in user profile')
                }
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

export function onMessageListener(): Promise<unknown> | null {
    const messaging = getFirebaseMessaging()
    if (!messaging) return null

    return new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            console.log('[Notifications] Foreground message received:', payload)
            
            if (Notification.permission === 'granted') {
                const { notification } = payload
                if (notification) {
                    navigator.serviceWorker.ready.then((registration) => {
                        registration.showNotification(notification.title || 'KURO', {
                            body: notification.body,
                            icon: '/logo.png',
                            badge: '/logo.png',
                            tag: 'foreground-notification'
                        })
                    })
                }
            }
            
            resolve(payload)
        })
    })
}
