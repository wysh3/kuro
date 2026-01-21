import { getAdminDB } from './admin'
import { UserPreferences } from '../ai/types'

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    const db = getAdminDB()
    const prefRef = db.collection('users').doc(userId).collection('preferences').doc('kuro')
    const snapshot = await prefRef.get()
    if (snapshot && snapshot.exists) {
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
    const db = getAdminDB()
    const prefRef = db.collection('users').doc(userId).collection('preferences').doc('kuro')
    await prefRef.set({
      ...preferences,
      updatedAt: new Date()
    })
  } catch (error) {
    console.error('Error saving user preferences:', error)
  }
}

export async function saveMealPlan(userId: string, plan: any): Promise<string> {
  try {
    const db = getAdminDB()
    const plansRef = db.collection('users').doc(userId).collection('meal_plans')
    const newPlan = {
      ...plan,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    const docRef = await plansRef.add(newPlan)
    return docRef.id
  } catch (error) {
    console.error('Error saving meal plan:', error)
    throw error
  }
}

export async function createKuroSession(userId: string, title: string): Promise<string> {
  try {
    const db = getAdminDB()
    const sessionsRef = db.collection('users').doc(userId).collection('kuro_sessions')
    const newSession = {
      userId,
      title,
      messages: [],
      context: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    }
    const docRef = await sessionsRef.add(newSession)
    return docRef.id
  } catch (error) {
    console.error('Error creating Kuro session:', error)
    throw error
  }
}

export async function saveKuroMessage(userId: string, sessionId: string, message: any): Promise<void> {
  try {
    const db = getAdminDB()
    const sessionRef = db.collection('users').doc(userId).collection('kuro_sessions').doc(sessionId)
    const sessionDoc = await sessionRef.get()

    if (sessionDoc && sessionDoc.exists) {
      const data = sessionDoc.data()
      if (!data) return
      const messages = data.messages || []
      const newMessage = {
        ...message,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date()
      }
      await sessionRef.update({
        messages: [...messages, newMessage],
        updatedAt: new Date()
      })
    }
  } catch (error) {
    console.error('Error saving Kuro message:', error)
  }
}
