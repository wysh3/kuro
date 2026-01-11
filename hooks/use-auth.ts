import { useState, useEffect } from 'react'
import { User } from 'firebase/auth'
import {
  signInWithGoogle as signInWithGoogleAuth,
  signOutUser as signOutUserAuth,
  onAuthStateChange
} from '@/lib/firebase/auth'
import {
  getUserProfile,
  createUserProfile,
  UserProfile
} from '@/lib/firebase/user'

interface UseAuthReturn {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    const setupAuthListener = async () => {
      try {
        unsubscribe = onAuthStateChange(async (authUser) => {
          console.log('🔑 Auth state changed:', { user: !!authUser, email: authUser?.email })
          setUser(authUser)
          setLoading(true)
          setError(null)

          if (authUser) {
            try {
              let profile = await getUserProfile(authUser.uid)
              console.log('👤 Profile loaded:', !!profile)
              setUserProfile(profile)
            } catch (err) {
              console.log('📝 Creating new user profile for:', authUser.uid)
              try {
                const newProfile = await createUserProfile(authUser.uid, {
                  email: authUser.email || '',
                  displayName: authUser.displayName || '',
                  photoURL: authUser.photoURL || undefined
                })
                setUserProfile(newProfile)
              } catch (createError) {
                console.error('❌ Failed to create user profile:', createError)
                setError('Failed to create user profile')
              }
            }
          } else {
            setUserProfile(null)
          }

          setLoading(false)
          console.log('✅ Auth state finalized:', { loading: false, user: !!authUser })
        })
      } catch (err) {
        console.error('❌ Error setting up auth listener:', err)
        setError('Failed to initialize authentication')
        setLoading(false)
      }
    }

    setupAuthListener()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  const signInWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      await signInWithGoogleAuth()
    } catch (err: any) {
      console.error('❌ Sign-in error:', err)
      setError(err.message || 'Failed to sign in')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      await signOutUserAuth()
      setUser(null)
      setUserProfile(null)
    } catch (err: any) {
      console.error('❌ Sign-out error:', err)
      setError(err.message || 'Failed to sign out')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    userProfile,
    loading,
    error,
    signInWithGoogle,
    signOut
  }
}
