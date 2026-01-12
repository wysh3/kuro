import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  QuerySnapshot,
  DocumentData,
  Unsubscribe,
  runTransaction,
} from 'firebase/firestore'
import { getFirebaseDB } from './config'
import { MenuItem, Order, CampusStatus } from '../types'

export function convertTimestampToISO(timestamp: Timestamp | Date | string): string {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString()
  }
  if (timestamp instanceof Date) {
    return timestamp.toISOString()
  }
  return timestamp
}

export function convertTimestampToDate(timestamp: Timestamp | Date | string): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate()
  }
  if (timestamp instanceof Date) {
    return timestamp
  }
  return new Date(timestamp)
}

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

export async function getMenuItems(): Promise<MenuItem[]> {
  try {
    const db = getFirebaseDB()
    const menuRef = collection(db, 'menu_items')
    const snapshot = await getDocs(menuRef)

    const items: MenuItem[] = []
    snapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as MenuItem)
    })

    return items
  } catch (error) {
    console.error('Error fetching menu items:', error)
    throw new FirestoreError('Failed to fetch menu items. Please check your connection.', 'fetch-menu-error', error)
  }
}

export function subscribeToMenuItems(
  callback: (items: MenuItem[]) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  try {
    const db = getFirebaseDB()
    const menuRef = collection(db, 'menu_items')
    const unsubscribe = onSnapshot(
      menuRef,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const items: MenuItem[] = []
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as MenuItem)
        })
        callback(items)
      },
      (error) => {
        console.error('Error listening to menu items:', error)
        const firestoreError = new FirestoreError('Real-time updates unavailable. Using cached data.', 'menu-listen-error', error)
        onError?.(firestoreError)
      }
    )

    return unsubscribe
  } catch (error) {
    console.error('Error setting up menu listener:', error)
    const firestoreError = new FirestoreError('Failed to set up real-time updates.', 'menu-setup-error', error)
    onError?.(firestoreError)
    return () => { }
  }
}

export async function getMenuItem(id: string): Promise<MenuItem | null> {
  try {
    const db = getFirebaseDB()
    const docRef = doc(db, 'menu_items', id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as MenuItem
    }
    return null
  } catch (error) {
    console.error('Error fetching menu item:', error)
    throw new FirestoreError('Failed to fetch menu item.', 'fetch-item-error', error)
  }
}

export async function toggleMenuItemAvailability(id: string): Promise<void> {
  try {
    const db = getFirebaseDB()
    const docRef = doc(db, 'menu_items', id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const current = docSnap.data()
      await updateDoc(docRef, {
        available: !current.available,
      })
    }
  } catch (error) {
    console.error('Error toggling menu item availability:', error)
    throw new FirestoreError('Failed to update menu availability.', 'toggle-availability-error', error)
  }
}

export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt'>): Promise<string> {
  try {
    const db = getFirebaseDB()
    const campusStatusRef = doc(db, 'campus_status', 'mrc')
    const ordersRef = collection(db, 'orders')

    let newOrderId = ''
    let assignedToken = 0

    await runTransaction(db, async (transaction) => {
      const statusDoc = await transaction.get(campusStatusRef)

      if (!statusDoc.exists()) {
        throw new Error("Campus status document missing")
      }

      const data = statusDoc.data()
      const lastReset = data.lastOrderReset?.toDate()
      const now = new Date()

      // Check if we need to reset counter (new day)
      const isNewDay = !lastReset ||
        lastReset.getDate() !== now.getDate() ||
        lastReset.getMonth() !== now.getMonth() ||
        lastReset.getFullYear() !== now.getFullYear()

      let currentCount = data.dailyOrderCount || 0

      if (isNewDay) {
        currentCount = 0
      }

      assignedToken = currentCount + 1

      // Create new order reference
      const newOrderRef = doc(ordersRef)
      newOrderId = newOrderRef.id

      // Set order data
      transaction.set(newOrderRef, {
        ...orderData,
        tokenNumber: assignedToken,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      // Update counter
      transaction.update(campusStatusRef, {
        dailyOrderCount: assignedToken,
        lastOrderReset: Timestamp.now()
      })
    })

    console.log(`✅ Order created with ID: ${newOrderId} | Token: ${assignedToken}`)

    // Run side effects (crowd update) asynchronously
    if (typeof window !== 'undefined') {
      import('../crowd-intelligence').then(module => {
        module.updateCrowdStatus().catch((error: unknown) => {
          console.error('Failed to update crowd status:', error)
        })
      }).catch(err => console.debug('Crowd intelligence chunk load skipped:', err))
    }

    return newOrderId
  } catch (error) {
    console.error('Error creating order:', error)
    throw new FirestoreError('Failed to place order. Please try again.', 'create-order-error', error)
  }
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  try {
    const db = getFirebaseDB()
    const docRef = doc(db, 'orders', orderId)
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.now(),
    })

    console.log(`✅ Order ${orderId} status updated to ${status}`)

    if (typeof window !== 'undefined') {
      import('../crowd-intelligence').then(module => {
        module.updateCrowdStatus().catch((error: unknown) => {
          console.error('Failed to update crowd status:', error)
        })
      }).catch(err => console.debug('Crowd intelligence chunk load skipped:', err))
    }
  } catch (error) {
    console.error('Error updating order status:', error)
    throw new FirestoreError('Failed to update order status.', 'update-status-error', error)
  }
}

export async function getOrder(orderId: string): Promise<Order | null> {
  try {
    const db = getFirebaseDB()
    const docRef = doc(db, 'orders', orderId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Order
    }
    return null
  } catch (error) {
    console.error('Error fetching order:', error)
    throw new FirestoreError('Failed to fetch order details.', 'fetch-order-error', error)
  }
}

export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  try {
    const db = getFirebaseDB()
    const ordersRef = collection(db, 'orders')
    const q = query(
      ordersRef,
      where('userId', '==', userId)
    )

    const snapshot = await getDocs(q)
    const orders: Order[] = []

    snapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() } as Order)
    })

    // Sort in-memory to avoid requiring a composite index in Firestore
    return orders.sort((a, b) => {
      const timeA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0
      const timeB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0
      return timeB - timeA // Descending
    })
  } catch (error) {
    console.error('Error fetching user orders:', error)
    throw new FirestoreError('Failed to fetch your orders.', 'fetch-user-orders-error', error)
  }
}

export function subscribeToUserActiveOrders(
  userId: string,
  callback: (orders: Order[]) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  try {
    const db = getFirebaseDB()
    const ordersRef = collection(db, 'orders')
    // Get all orders for user and filter/sort in memory to avoid index requirements
    const q = query(
      ordersRef,
      where('userId', '==', userId)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const orders: Order[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          if (data.status !== 'completed') {
            orders.push({ ...data, id: doc.id } as Order)
          }
        })
        
        // Sort in-memory to avoid requiring a composite index in Firestore
        orders.sort((a, b) => {
          const timeA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0
          const timeB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0
          return timeB - timeA // Descending (newest first)
        });
        
        callback(orders)
      },
      (error) => {
        console.error('Error listening to user active orders:', error)
        const firestoreError = new FirestoreError('Real-time updates unavailable.', 'user-orders-listen-error', error)
        onError?.(firestoreError)
      }
    )

    return unsubscribe
  } catch (error) {
    console.error('Error setting up user orders listener:', error)
    const firestoreError = new FirestoreError('Failed to set up real-time updates.', 'user-orders-setup-error', error)
    onError?.(firestoreError)
    return () => { }
  }
}

export function subscribeToOrders(
  callback: (orders: Order[]) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  try {
    const db = getFirebaseDB()
    const ordersRef = collection(db, 'orders')
    const q = query(ordersRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const orders: Order[] = []
        snapshot.forEach((doc) => {
          orders.push({ id: doc.id, ...doc.data() } as Order)
        })
        callback(orders)
      },
      (error) => {
        console.error('Error listening to orders:', error)
        const firestoreError = new FirestoreError('Real-time updates unavailable. Using cached data.', 'orders-listen-error', error)
        onError?.(firestoreError)
      }
    )

    return unsubscribe
  } catch (error) {
    console.error('Error setting up orders listener:', error)
    const firestoreError = new FirestoreError('Failed to set up real-time updates.', 'orders-setup-error', error)
    onError?.(firestoreError)
    return () => { }
  }
}

export function subscribeToOrder(
  orderId: string,
  callback: (order: Order | null) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  try {
    const db = getFirebaseDB()
    const docRef = doc(db, 'orders', orderId)

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback({ id: docSnap.id, ...docSnap.data() } as Order)
        } else {
          callback(null)
        }
      },
      (error) => {
        console.error('Error listening to order:', error)
        const firestoreError = new FirestoreError('Real-time updates unavailable. Using cached data.', 'order-listen-error', error)
        onError?.(firestoreError)
      }
    )

    return unsubscribe
  } catch (error) {
    console.error('Error setting up order listener:', error)
    const firestoreError = new FirestoreError('Failed to set up real-time updates.', 'order-setup-error', error)
    onError?.(firestoreError)
    return () => { }
  }
}

export { getCampusStatus, updateCampusStatus } from './status'

export function subscribeToCampusStatus(
  callback: (status: CampusStatus | null) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  try {
    const db = getFirebaseDB()
    const docRef = doc(db, 'campus_status', 'mrc')

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as CampusStatus)
        } else {
          callback(null)
        }
      },
      (error) => {
        console.error('Error listening to campus status:', error)
        const firestoreError = new FirestoreError('Real-time updates unavailable. Using cached data.', 'status-listen-error', error)
        onError?.(firestoreError)
      }
    )

    return unsubscribe
  } catch (error) {
    console.error('Error setting up campus status listener:', error)
    const firestoreError = new FirestoreError('Failed to set up real-time updates.', 'status-setup-error', error)
    onError?.(firestoreError)
    return () => { }
  }
}

export async function getAllOrders(): Promise<Order[]> {
  try {
    const db = getFirebaseDB()
    const ordersRef = collection(db, 'orders')
    const q = query(ordersRef, orderBy('createdAt', 'desc'))

    const snapshot = await getDocs(q)
    const orders: Order[] = []

    snapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() } as Order)
    })

    return orders
  } catch (error) {
    console.error('Error fetching all orders:', error)
    throw new FirestoreError('Failed to fetch orders.', 'fetch-all-orders-error', error)
  }
}
