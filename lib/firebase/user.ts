import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
  query,
  collection,
  where,
  getDocs,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore'
import { getFirebaseDB } from './config'
import { FirestoreError } from './db'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  createdAt: Timestamp
  lastLoginAt: Timestamp
  favoriteOrders?: string[]
  kitchenStaff: boolean
}

export async function getUserProfile(uid: string): Promise<UserProfile> {
  try {
    const db = getFirebaseDB()
    const userDoc = await getDoc(doc(db, 'users', uid))
    
    if (!userDoc.exists()) {
      throw new FirestoreError('User profile not found', 'not-found')
    }
    
    return userDoc.data() as UserProfile
  } catch (error) {
    if (error instanceof FirestoreError) {
      throw error
    }
    throw new FirestoreError(
      'Failed to fetch user profile',
      'unknown',
      error as Error
    )
  }
}

export async function createUserProfile(
  uid: string,
  userData: Partial<UserProfile>
): Promise<UserProfile> {
  try {
    const db = getFirebaseDB()
    const userProfile: UserProfile = {
      uid,
      email: userData.email || '',
      displayName: userData.displayName || '',
      photoURL: userData.photoURL,
      createdAt: Timestamp.now(),
      lastLoginAt: Timestamp.now(),
      favoriteOrders: [],
      kitchenStaff: false
    }
    
    await setDoc(doc(db, 'users', uid), userProfile)
    console.log('✅ User profile created:', uid)
    return userProfile
  } catch (error) {
    if (error instanceof FirestoreError) {
      throw error
    }
    throw new FirestoreError(
      'Failed to create user profile',
      'unknown',
      error as Error
    )
  }
}

export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<void> {
  try {
    const db = getFirebaseDB()
    await updateDoc(doc(db, 'users', uid), {
      ...data,
      lastLoginAt: Timestamp.now()
    })
    console.log('✅ User profile updated:', uid)
  } catch (error) {
    if (error instanceof FirestoreError) {
      throw error
    }
    throw new FirestoreError(
      'Failed to update user profile',
      'unknown',
      error as Error
    )
  }
}

export async function toggleFavoriteOrder(
  uid: string,
  orderId: string
): Promise<void> {
  try {
    const db = getFirebaseDB()
    const userProfile = await getUserProfile(uid)
    const favorites = userProfile.favoriteOrders || []
    
    if (favorites.includes(orderId)) {
      await updateDoc(doc(db, 'users', uid), {
        favoriteOrders: arrayRemove(orderId)
      })
      console.log('✅ Removed from favorites:', orderId)
    } else {
      await updateDoc(doc(db, 'users', uid), {
        favoriteOrders: arrayUnion(orderId)
      })
      console.log('✅ Added to favorites:', orderId)
    }
  } catch (error) {
    if (error instanceof FirestoreError) {
      throw error
    }
    throw new FirestoreError(
      'Failed to toggle favorite order',
      'unknown',
      error as Error
    )
  }
}

export async function getUserFavorites(uid: string): Promise<string[]> {
  try {
    const userProfile = await getUserProfile(uid)
    return userProfile.favoriteOrders || []
  } catch (error) {
    if (error instanceof FirestoreError) {
      throw error
    }
    throw new FirestoreError(
      'Failed to fetch user favorites',
      'unknown',
      error as Error
    )
  }
}

export async function getUserOrders(uid: string): Promise<any[]> {
  try {
    const db = getFirebaseDB()
    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', uid)
    )
    
    const querySnapshot = await getDocs(ordersQuery)
    const orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    return orders.sort((a: any, b: any) => {
      const aDate = a.createdAt?.toMillis?.() || 0
      const bDate = b.createdAt?.toMillis?.() || 0
      return bDate - aDate
    })
  } catch (error) {
    if (error instanceof FirestoreError) {
      throw error
    }
    throw new FirestoreError(
      'Failed to fetch user orders',
      'unknown',
      error as Error
    )
  }
}

export function subscribeToUserProfile(
  uid: string,
  callback: (profile: UserProfile | null) => void
): Unsubscribe {
  try {
    const db = getFirebaseDB()
    return onSnapshot(
      doc(db, 'users', uid),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          callback(docSnapshot.data() as UserProfile)
        } else {
          callback(null)
        }
      },
      (error) => {
        console.error('❌ Error listening to user profile:', error)
        throw new FirestoreError(
          'Failed to listen to user profile',
          'unknown',
          error as Error
        )
      }
    )
  } catch (error) {
    if (error instanceof FirestoreError) {
      throw error
    }
    throw new FirestoreError(
      'Failed to subscribe to user profile',
      'unknown',
      error as Error
    )
  }
}
