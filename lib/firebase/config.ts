import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getAnalytics, Analytics } from 'firebase/analytics'
import { getAuth, Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

let app: FirebaseApp | null = null
let db: Firestore | null = null
let analytics: Analytics | null = null
let auth: Auth | null = null

function initializeFirebaseIfNotInitialized(): { app: FirebaseApp; db: Firestore; analytics: Analytics | null } {
  if (!app && !db) {
    try {
      app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
      
      if (typeof window !== 'undefined') {
        analytics = getAnalytics(app)
      }
      
      db = getFirestore(app)
      
      console.log('✅ Firebase initialized successfully')
    } catch (error) {
      console.error('❌ Firebase initialization error:', error)
      throw new Error('Failed to initialize Firebase. Please check your configuration.')
    }
  }
  
  return { app: app!, db: db!, analytics }
}

export function getFirebaseDB(): Firestore {
  const { db: dbInstance } = initializeFirebaseIfNotInitialized()
  return dbInstance
}

export function getFirebaseApp(): FirebaseApp {
  const { app: appInstance } = initializeFirebaseIfNotInitialized()
  return appInstance
}

export function getFirebaseAuth(): Auth {
  const { app } = initializeFirebaseIfNotInitialized()
  if (!auth) {
    auth = getAuth(app)
  }
  return auth
}

export { initializeFirebaseIfNotInitialized }
