'use client'

import { useState, useEffect, useRef } from 'react'
import { subscribeToOrders, updateOrderStatus as updateOrderInFirebase, convertTimestampToISO } from '@/lib/firebase/db'
import { Order } from '@/lib/types'

let broadcastChannel: BroadcastChannel | null = null

export function useKitchenOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<BroadcastChannel | null>(null)

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

    if (typeof window !== 'undefined' && !broadcastChannel) {
      broadcastChannel = new BroadcastChannel('order-updates')
      channelRef.current = broadcastChannel
    }

    return () => {
      unsubscribe()
      if (channelRef.current && channelRef.current === broadcastChannel) {
        channelRef.current.close()
        broadcastChannel = null
        channelRef.current = null
      }
    }
  }, [])

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderInFirebase(orderId, newStatus)

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

  if (typeof window !== 'undefined' && broadcastChannel) {
    broadcastChannel.postMessage({
      type: 'order_ready',
      orderId,
      message,
      timestamp: new Date().toISOString(),
    })
  }
}
