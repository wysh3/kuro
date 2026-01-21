import { getAdminDB } from './admin'
import { MenuItem, Order } from '../types'

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

export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  try {
    const db = getAdminDB()
    const ordersRef = db.collection('orders')
    const snapshot = await ordersRef.where('userId', '==', userId).get()

    const orders: Order[] = []

    snapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data()
      orders.push({ 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      } as Order)
    })

    return orders.sort((a, b) => {
      const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
      const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0
      return timeB - timeA
    })
  } catch (error) {
    console.error('Error fetching user orders:', error)
    throw new FirestoreError('Failed to fetch your orders.', 'fetch-user-orders-error', error)
  }
}

export async function getMenuItem(id: string): Promise<MenuItem | null> {
  try {
    const db = getAdminDB()
    const docRef = db.collection('menu_items').doc(id)
    const docSnap = await docRef.get()

    if (docSnap && docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() } as MenuItem
    }
    return null
  } catch (error) {
    console.error('Error fetching menu item:', error)
    throw new FirestoreError('Failed to fetch menu item.', 'fetch-item-error', error)
  }
}

export async function getMenuItems(): Promise<MenuItem[]> {
  try {
    const db = getAdminDB()
    const menuRef = db.collection('menu_items')
    const snapshot = await menuRef.get()

    const items: MenuItem[] = []
    snapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      items.push({ id: doc.id, ...doc.data() } as MenuItem)
    })

    return items
  } catch (error) {
    console.error('Error fetching menu items:', error)
    throw new FirestoreError('Failed to fetch menu items. Please check your connection.', 'fetch-menu-error', error)
  }
}
