import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  Unsubscribe
} from 'firebase/auth'
import { getFirebaseAuth } from './config'

export class AuthError extends Error {
  code: string
  constructor(message: string, code: string = 'auth/unknown') {
    super(message)
    this.name = 'AuthError'
    this.code = code
  }
}

interface FirebaseError {
  code: string
  message: string
}

function isFirebaseError(error: unknown): error is FirebaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as FirebaseError).code === 'string'
  )
}

export async function signInWithGoogle(): Promise<User> {
  try {
    const auth = getFirebaseAuth()
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    console.log('✅ User signed in with Google:', result.user.email)
    return result.user
  } catch (error) {
    if (isFirebaseError(error)) {
      console.error('❌ Google Sign-In error:', error.code, error.message)
      throw new AuthError(
        getAuthErrorMessage(error.code),
        error.code
      )
    }
    console.error('❌ Unknown sign-in error:', error)
    throw new AuthError('Failed to sign in with Google. Please try again.')
  }
}

export async function signOutUser(): Promise<void> {
  try {
    const auth = getFirebaseAuth()
    await signOut(auth)
    console.log('✅ User signed out')
  } catch (error) {
    if (isFirebaseError(error)) {
      console.error('❌ Sign-out error:', error.code, error.message)
      throw new AuthError(
        getAuthErrorMessage(error.code),
        error.code
      )
    }
    console.error('❌ Unknown sign-out error:', error)
    throw new AuthError('Failed to sign out. Please try again.')
  }
}

export function onAuthStateChange(
  callback: (user: User | null) => void
): Unsubscribe {
  const auth = getFirebaseAuth()
  return onAuthStateChanged(auth, (user) => {
    console.log('🔄 Auth state changed:', user ? user.email : 'null')
    callback(user)
  })
}

export function getCurrentUser(): User | null {
  const auth = getFirebaseAuth()
  return auth.currentUser
}

export function isAuthenticated(): boolean {
  const auth = getFirebaseAuth()
  return auth.currentUser !== null
}

function getAuthErrorMessage(code: string): string {
  const errorMessages: Record<string, string> = {
    'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
    'auth/popup-blocked': 'Popup was blocked. Please allow popups for this site.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'Account not found. Please sign up first.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'Email is already in use.',
    'auth/weak-password': 'Password is too weak.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/cancelled-popup-request': 'Only one sign-in request at a time.',
    'auth/account-exists-with-different-credential': 'Account exists with different sign-in method.',
  }
  return errorMessages[code] || 'Authentication failed. Please try again.'
}
