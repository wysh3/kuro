import { getToken, onMessage } from 'firebase/messaging'
import { getFirebaseMessaging } from './config'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { getFirebaseDB } from './config'

export async function requestNotificationPermission(userId: string) {
    if (typeof window === 'undefined') return

    try {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
            const messaging = getFirebaseMessaging()
            if (!messaging) return

            const token = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
            })

            if (token) {
                console.log('FCM Token:', token)
                // Save token to user profile
                const db = getFirebaseDB()
                const userRef = doc(db, 'users', userId)
                await updateDoc(userRef, {
                    fcmTokens: arrayUnion(token),
                    notificationsEnabled: true
                })
                return token
            }
        }
    } catch (error) {
        console.error('Error getting notification permission:', error)
    }
    return null
}

export function onMessageListener() {
    const messaging = getFirebaseMessaging()
    if (!messaging) return

    return new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            console.log('Message received: ', payload)
            resolve(payload)
        })
    })
}
