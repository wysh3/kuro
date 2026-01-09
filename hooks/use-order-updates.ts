'use client'

import { useState, useEffect, useRef } from 'react'
import { subscribeToOrder, Order } from '@/lib/firebase/db'

export function useOrderUpdates(orderId: string) {
  const [order, setOrder] = useState<Order | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const wasReadyRef = useRef(false)

  useEffect(() => {
    const unsubscribe = subscribeToOrder(
      orderId,
      (firebaseOrder) => {
        if (firebaseOrder) {
          setOrder(firebaseOrder)
          const isOrderReady = firebaseOrder.status === 'ready'
          setIsReady(isOrderReady)
          setLoading(false)

          // Trigger notification when status changes to ready
          if (isOrderReady && !wasReadyRef.current) {
            wasReadyRef.current = true
            triggerNotification(orderId)
          }
        } else {
          setLoading(false)
        }
      },
      (firebaseError) => {
        console.error('Order subscription error:', firebaseError)
        setError(firebaseError.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [orderId])

  return { order, isReady, loading, error }
}

function triggerNotification(orderId: string) {
  // Trigger browser notification if available
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification('Order Ready!', {
        body: `Your order ${orderId} is ready for pickup!`,
        tag: `order-${orderId}`,
      })
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('Order Ready!', {
            body: `Your order ${orderId} is ready for pickup!`,
            tag: `order-${orderId}`,
          })
        }
      })
    }
  }

  // Emit sound notification (using Web Audio API)
  playNotificationSound()
}

// Audio notification helper
function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Create a "ping" sound
    oscillator.frequency.value = 800
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  } catch (e) {
    console.log('Audio notification not available')
  }
}
