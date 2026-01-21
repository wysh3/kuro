import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    orderBy,
    Timestamp,
    addDoc,
    limit
} from 'firebase/firestore'
import { getFirebaseDB } from './config'
import { KuroSession, UserPreferences, MealPlan, KuroMessage } from '../ai/types'

export async function createKuroSession(userId: string, title: string): Promise<string> {
    try {
        const db = getFirebaseDB()
        const sessionsRef = collection(db, 'users', userId, 'kuro_sessions')
        const newSession = {
            userId,
            title,
            messages: [],
            context: {},
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            isActive: true
        }
        const docRef = await addDoc(sessionsRef, newSession)
        return docRef.id
    } catch (error) {
        console.error('Error creating Kuro session:', error)
        throw error
    }
}

export async function getKuroSessions(userId: string): Promise<KuroSession[]> {
    try {
        const db = getFirebaseDB()
        const sessionsRef = collection(db, 'users', userId, 'kuro_sessions')
        const q = query(sessionsRef, orderBy('updatedAt', 'desc'))
        const snapshot = await getDocs(q)
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KuroSession))
    } catch (error) {
        console.error('Error fetching Kuro sessions:', error)
        return []
    }
}

export async function saveKuroMessage(userId: string, sessionId: string, message: Omit<KuroMessage, 'id' | 'timestamp'>): Promise<void> {
    try {
        const db = getFirebaseDB()
        const sessionRef = doc(db, 'users', userId, 'kuro_sessions', sessionId)
        const sessionDoc = await getDoc(sessionRef)

        if (sessionDoc.exists()) {
            const data = sessionDoc.data()
            const messages = data.messages || []
            const newMessage = {
                ...message,
                id: Math.random().toString(36).substr(2, 9),
                timestamp: Timestamp.now()
            }
            await updateDoc(sessionRef, {
                messages: [...messages, newMessage],
                updatedAt: Timestamp.now()
            })
        }
    } catch (error) {
        console.error('Error saving Kuro message:', error)
    }
}

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
        const db = getFirebaseDB()
        const prefRef = doc(db, 'users', userId, 'preferences', 'kuro')
        const snapshot = await getDoc(prefRef)
        if (snapshot.exists()) {
            return snapshot.data() as UserPreferences
        }
        return null
    } catch (error) {
        console.error('Error fetching user preferences:', error)
        return null
    }
}

export async function saveUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
    try {
        const db = getFirebaseDB()
        const prefRef = doc(db, 'users', userId, 'preferences', 'kuro')
        await setDoc(prefRef, {
            ...preferences,
            updatedAt: Timestamp.now()
        })
    } catch (error) {
        console.error('Error saving user preferences:', error)
    }
}

export async function saveMealPlan(userId: string, plan: Omit<MealPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
        const db = getFirebaseDB()
        const plansRef = collection(db, 'users', userId, 'meal_plans')
        const newPlan = {
            ...plan,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        }
        const docRef = await addDoc(plansRef, newPlan)
        return docRef.id
    } catch (error) {
        console.error('Error saving meal plan:', error)
        throw error
    }
}
