'use client'

import { useState, useEffect } from 'react'
import { subscribeToOrders, updateOrderStatus as updateOrderInFirebase, convertTimestampToISO } from '@/lib/firebase/db'
import { Order } from '@/lib/types'

export function useKitchenOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToOrders(
      (firebaseOrders) => {
        const activeOrders = firebaseOrders.filter((o) => o.status !== 'completed')
        setOrders(activeOrders)
        setLoading(false)
      },
      (firebaseError) => {
        console.error('Orders subscription error:', firebaseError)
        setError(firebaseError.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderInFirebase(orderId, newStatus)

      // Notify customer via browser notification if order is ready
      if (newStatus === 'ready') {
        notifyCustomer(orderId, 'Your order is ready!')
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
      throw error
    }
  }

  return { orders, loading, error, updateOrderStatus }
}

function notifyCustomer(orderId: string, message: string) {
  // Request notification permission
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification('KURO Canteen', { body: message })
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('KURO Canteen', { body: message })
        }
      })
    }
  }

  // Send notification to all open windows via broadcast channel
  if (typeof window !== 'undefined') {
    const channel = new BroadcastChannel('order-updates')
    channel.postMessage({
      type: 'order_ready',
      orderId,
      message,
      timestamp: new Date().toISOString(),
    })
    channel.close()
  }
}
