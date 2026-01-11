'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Trash2, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react'
import { createOrder } from '@/lib/firebase/db'
import { useAuth } from '@/hooks/use-auth'
import { RazorpayCheckout } from '@/components/customer/razorpay-checkout'
import { RazorpayPaymentResponse } from '@/lib/razorpay/types'
import { Timestamp } from 'firebase/firestore'
import { TimeSlotSelector } from '@/components/customer/time-slot-selector'
import { useCart } from '@/contexts/cart-context'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Spinner } from '@/components/ui/spinner'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface OrderSummaryProps {
  cart: CartItem[]
  total: number // This is subtotal
  user: any
  onBack: () => void
  onRemoveItem: (productId: string) => void
  variant?: 'card' | 'plain'
}

export function OrderSummary({ cart, total: subtotal, user, onBack, onRemoveItem, variant = 'card' }: OrderSummaryProps) {
  const router = useRouter()
  const { user: firebaseUser, userProfile } = useAuth()
  const { selectedSlot, setSelectedSlot, discountAmount, clearCart } = useCart()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | null>(null)
  const [razorpayOrderId, setRazorpayOrderId] = useState<string | null>(null)
  const [creatingOrder, setCreatingOrder] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)

  const taxAmount = Math.round((subtotal - discountAmount) * 0.05);
  const paymentTotal = (subtotal - discountAmount) + taxAmount;

  const generateReceiptId = () => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 8);
    return `rcpt_${timestamp}_${random}`;
  }

  const createRazorpayOrder = async (amount: number) => {
    const response = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, receipt: generateReceiptId() }),
    })
    const data = await response.json()
    if (!data.success) throw new Error(data.message || 'Failed to create payment order')
    return data.order.id
  }

  const handlePaymentSuccess = async (response: RazorpayPaymentResponse) => {
    setCreatingOrder(true)
    setError(null)
    try {
      const orderId = await createOrder({
        items: cart,
        total: paymentTotal,
        status: 'kitchen_received',
        userId: firebaseUser?.uid || user?.id || 'guest',
        paymentMethod: paymentMethod || 'upi',
        customerName: userProfile?.displayName || firebaseUser?.displayName || user?.name || 'Guest',
        razorpayPaymentId: response.razorpay_payment_id,
        razorpayOrderId: response.razorpay_order_id,
        paymentVerified: true,
        paidAt: Timestamp.now(),
        pickupTime: selectedSlot?.time ? Timestamp.fromDate(new Date(selectedSlot.time)) : Timestamp.now(),
        pickupSlot: selectedSlot?.displayTime || 'ASAP',
        discountApplied: discountAmount
      })
      // Clear cart after successful order
      clearCart()
      router.push(`/customer/order/${orderId}`)
    } catch (err) {
      setError('Order creation failed. Please contact support.')
      setCreatingOrder(false)
    }
  }

  const initiatePayment = async () => {
    setLoading(true)
    setError(null)
    try {
      const orderId = await createRazorpayOrder(paymentTotal)
      setRazorpayOrderId(orderId)
    } catch (err) {
      setError('Payment initialization failed.')
      setLoading(false)
    }
  }

  useEffect(() => {
    if (subtotal === 0 && cart.length === 0) {
      onBack()
    }
  }, [subtotal, cart.length, onBack])

  const content = (
    <div className="space-y-10 pb-12">
      <div className="flex items-center gap-5 border-b border-white/5 pb-8">
        <Button onClick={onBack} variant="ghost" size="icon" className="w-10 h-10 hover:bg-white/5 rounded-xl border border-white/5">
          <ArrowLeft className="w-5 h-5 text-white/40" />
        </Button>
        <div>
          <h1 className="text-sm font-black tracking-[0.3em] uppercase leading-none text-white/90">ORDER SUMMARY</h1>
          <p className="text-[10px] font-bold text-white/20 mt-1.5 uppercase tracking-widest">Review & Confirm Order</p>
        </div>
      </div>

      <div className="space-y-8">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl bg-tesla-red/10 border border-tesla-red/20 text-tesla-red text-[11px] font-black uppercase tracking-widest flex items-center gap-3"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          {cart.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/[0.05] rounded-[1.5rem] group hover:bg-white/[0.04] transition-all">
              <div className="flex-1">
                <p className="text-sm font-black uppercase tracking-tight text-white/90">{item.name}</p>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-1.5">
                  ₹{item.price} × {item.quantity}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-sm font-black tracking-tighter text-white">₹{item.price * item.quantity}</span>
                <Button
                  onClick={() => onRemoveItem(item.id)}
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-white/10 hover:text-tesla-red hover:bg-tesla-red/10 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/5 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Pickup Time</p>
              <p className="text-xs font-black uppercase tracking-widest text-white/80">
                {selectedSlot
                  ? selectedSlot.displayTime === 'ASAP'
                    ? 'ASAP (~15 min)'
                    : selectedSlot.displayTime
                  : 'AS SOON AS POSSIBLE'}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowSchedule(!showSchedule)}
              className="h-10 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest px-5"
            >
              {showSchedule ? 'CANCEL' : 'SCHEDULE'}
            </Button>
          </div>

          <AnimatePresence>
            {showSchedule && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden pt-2"
              >
                <TimeSlotSelector onSelect={setSelectedSlot} selectedSlot={selectedSlot} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-4 border-t border-white/5 pt-8">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
            <span className="text-white/20">Order value</span>
            <span className="text-white/40 font-bold">₹{subtotal}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-green-500">
              <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> Slot savings</span>
              <span className="text-shadow-glow">- ₹{discountAmount}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
            <span className="text-white/20">Service fees (5%)</span>
            <span className="text-white/40 font-bold">₹{taxAmount}</span>
          </div>

          <div className="flex justify-between items-end pt-4">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-1.5">ORDER TOTAL</span>
            <span className="text-4xl font-black text-white tracking-tighter text-gradient leading-none">₹{paymentTotal}</span>
          </div>
        </div>

        <div className="space-y-4 border-t border-white/5 pt-8 pb-4">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">PAYMENT METHOD</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 'upi', label: 'UPI' },
              { id: 'card', label: 'CARD' }
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id as 'upi' | 'card')}
                className={cn(
                  "p-5 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all",
                  paymentMethod === method.id
                    ? 'bg-white text-black border-white shadow-premium'
                    : 'bg-white/[0.02] border-white/5 text-white/20 hover:border-white/20 hover:text-white/40'
                )}
              >
                {method.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          {razorpayOrderId ? (
            <RazorpayCheckout
              amount={paymentTotal}
              orderId={razorpayOrderId}
              receiptId={generateReceiptId()}
              customerName={userProfile?.displayName || firebaseUser?.displayName || user?.name || undefined}
              customerEmail={firebaseUser?.email || undefined}
              customerPhone={firebaseUser?.phoneNumber || undefined}
              paymentMethod={paymentMethod}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={setError}
              loading={creatingOrder}
            />
          ) : (
            <div className="space-y-6">
              <Button
                onClick={initiatePayment}
                disabled={!paymentMethod || loading}
                className="w-full h-16 bg-white text-black hover:bg-white/90 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] shadow-premium active:scale-95 transition-all border-none relative overflow-hidden group"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <Spinner className="w-4 h-4" />
                    CALIBRATING...
                  </div>
                ) : (
                  <>
                    <span className="relative z-10">PAY ₹{paymentTotal}</span>
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                  </>
                )}
              </Button>
              <div className="flex items-center justify-center gap-3">
                <ShieldCheck className="w-4 h-4 text-green-500/40" />
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">
                  Secure Payment Gateway: ACTIVE
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (variant === 'card') {
    return (
      <div className="glass-panel border-white/5 rounded-[2.5rem] p-1 shadow-premium overflow-hidden">
        <div className="bg-white/[0.02] p-8 rounded-[2.2rem]">
          {content}
        </div>
      </div>
    )
  }

  return content
}

