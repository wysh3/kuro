import { doc, setDoc, Timestamp, getDoc } from 'firebase/firestore'
import { getFirebaseDB } from './config'
import { CampusStatus } from '../types'

export class FirestoreError extends Error {
    constructor(
        message: string,
        public code?: string,
        public originalError?: unknown
    ) {
        super(message)
        this.name = 'FirestoreError'
    }
}

export async function getCampusStatus(): Promise<CampusStatus | null> {
    try {
        const db = getFirebaseDB()
        const docRef = doc(db, 'campus_status', 'mrc')
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
            return docSnap.data() as CampusStatus
        }
        return null
    } catch (error) {
        console.error('Error fetching campus status:', error)
        throw new FirestoreError('Failed to fetch campus status.', 'fetch-status-error', error)
    }
}

export async function updateCampusStatus(
    status: Partial<CampusStatus>
): Promise<void> {
    try {
        const db = getFirebaseDB()
        const docRef = doc(db, 'campus_status', 'mrc')

        await setDoc(docRef, {
            ...status,
            lastUpdated: Timestamp.now(),
        }, { merge: true })

        console.log('✅ Campus status updated')
    } catch (error) {
        console.error('Error updating campus status:', error)
        throw new FirestoreError('Failed to update campus status.', 'update-status-error', error)
    }
}
