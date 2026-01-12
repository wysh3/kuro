'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { RazorpayCheckoutOptions, RazorpayPaymentResponse } from '@/lib/razorpay/types'
import { getRazorpayKeyId } from '@/lib/razorpay/config'
import { Spinner } from '@/components/ui/spinner'

interface RazorpayCheckoutProps {
  amount: number
  orderId: string
  receiptId: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  paymentMethod?: 'upi' | 'card' | null
  onPaymentSuccess: (response: RazorpayPaymentResponse) => void
  onPaymentError: (error: string) => void
  loading?: boolean
  disabled?: boolean
}

export function RazorpayCheckout({
  amount,
  orderId,
  receiptId,
  customerName,
  customerEmail,
  customerPhone,
  paymentMethod,
  onPaymentSuccess,
  onPaymentError,
  loading = false,
  disabled = false,
}: RazorpayCheckoutProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [initiatingPayment, setInitiatingPayment] = useState(false)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => setScriptLoaded(true)
    script.onerror = () => {
      onPaymentError('Failed to load payment gateway. Please refresh and try again.')
    }
    document.body.appendChild(script)

    return () => {
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
      if (existingScript) {
        document.body.removeChild(existingScript)
      }
    }
  }, [onPaymentError])

  const handlePayment = () => {
    if (!scriptLoaded || initiatingPayment || disabled) return

    setInitiatingPayment(true)

    const options: RazorpayCheckoutOptions = {
      key: getRazorpayKeyId(),
      amount: amount * 100,
      currency: 'INR',
      name: 'KURO Canteen',
      description: `Order ${receiptId}`,
      order_id: orderId,
      prefill: {
        name: customerName,
        email: customerEmail,
        contact: customerPhone,
        method: paymentMethod === 'upi' ? 'upi' : paymentMethod === 'card' ? 'card' : undefined,
      },
      theme: {
        color: '#000000',
      },
      handler: (response: RazorpayPaymentResponse) => {
        setInitiatingPayment(false)
        onPaymentSuccess(response)
      },
      modal: {
        ondismiss: () => {
          setInitiatingPayment(false)
          onPaymentError('Payment cancelled')
        },
      },
    }

    try {
      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', function (response: any) {
        setInitiatingPayment(false)
        const errorMessage = response.error?.description || 'Payment failed. Please try again.'
        onPaymentError(errorMessage)
      })

      // IMPORTANT: Radix UI Sheet sets pointer-events: none on body when open.
      // We must override this so user can interact with Razorpay modal.
      document.body.style.pointerEvents = 'auto'
      rzp.open()
    } catch (error) {
      setInitiatingPayment(false)
      console.error('Error initiating Razorpay:', error)
      onPaymentError('Failed to initialize payment. Please try again.')
    }
  }

  if (!scriptLoaded) {
    return (
      <Button disabled className="w-full">
        <Spinner className="mr-2 h-4 w-4" />
        Loading payment gateway...
      </Button>
    )
  }

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Secure payment powered by Razorpay. Your payment information is encrypted and safe.
        </AlertDescription>
      </Alert>

      <Button
        onClick={handlePayment}
        disabled={disabled || initiatingPayment || loading}
        className="w-full"
        size="lg"
      >
        {(initiatingPayment || loading) ? (
          <>
            <Spinner className="mr-2 h-4 w-4" />
            Processing Payment...
          </>
        ) : (
          `Pay ₹${amount}`
        )}
      </Button>
    </div>
  )
}
