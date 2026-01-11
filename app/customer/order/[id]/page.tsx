"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useOrderUpdates } from '@/hooks/use-order-updates'
import { Order } from '@/lib/types'
import { convertTimestampToISO } from '@/lib/firebase/db'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, CheckCircle2, Home, Bell, AlertCircle, Activity, Zap, Shield, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function OrderTrackingPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const { order, isReady, loading, error } = useOrderUpdates(orderId)
  const [notificationGranted, setNotificationGranted] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        setNotificationGranted(permission === 'granted')
      })
    } else if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationGranted(true)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-6">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-12 h-12 border-2 border-white/10 border-t-white rounded-full"
        />
        <p className="text-[10px] font-black text-white/30 tracking-[0.4em] uppercase">Checking Order Status</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-8">
          <AlertCircle className="w-10 h-10 text-white/10" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-3">ACCESS TERMINATED</h2>
        <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-10">
          {error || "ORDER ID NOT FOUND IN ORDER HISTORY"}
        </p>
        <Button onClick={() => router.push('/customer')} variant="ghost" className="h-14 px-10 rounded-2xl bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-white/90">
          <ChevronLeft className="w-4 h-4 mr-2" /> RETURN HOME
        </Button>
      </div>
    )
  }

  const statusSteps = [
    { key: 'pending', label: 'Order Received', icon: CheckCircle2 },
    { key: 'kitchen_received', label: 'Order Confirmed', icon: Clock },
    { key: 'preparing', label: 'Preparing Order', icon: Clock },
    { key: 'ready', label: 'Ready for Pickup', icon: CheckCircle2 },
  ]

  const currentStepIndex = statusSteps.findIndex((s) => s.key === order.status)

  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return 'N/A'
    const isoString = convertTimestampToISO(timestamp)
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/10 relative">

      {/* Sleek Floating Status Header */}
      <header className={cn(
        "fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 w-[calc(100%-2rem)] max-w-2xl",
        isScrolled ? "top-4" : "top-6"
      )}>
        <div className={cn(
          "glass-panel rounded-[2rem] px-8 py-4 flex items-center justify-between transition-all duration-700",
          isScrolled ? "bg-black/60 shadow-premium border-white/10 py-3" : "bg-transparent border-transparent"
        )}>
          <div className="flex items-center gap-4" onClick={() => router.push('/customer')}>
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center cursor-pointer shadow-premium active:scale-95 transition-all">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-[10px] font-black tracking-[0.4em] uppercase leading-none text-white/80">ORDER ID</h1>
              <p className="text-[9px] font-bold text-white/30 mt-1.5 uppercase tracking-widest">#{order.id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          <Button onClick={() => router.push('/customer')} variant="ghost" className="h-10 px-5 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black tracking-widest uppercase">
            <Home className="w-4 h-4 mr-2" /> EXIT
          </Button>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="max-w-2xl mx-auto px-6 pt-32 pb-20 space-y-10 relative z-10">
        <AnimatePresence>
          {isReady && (
            <motion.div
              initial={{ y: -20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel border-green-500/20 bg-green-500/[0.03] rounded-[2.5rem] p-8 relative overflow-hidden shadow-[0_0_50px_rgba(34,197,94,0.15)]"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/10 rounded-full blur-[80px] -mr-24 -mt-24" />
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 rounded-[1.5rem] bg-green-500 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                  <Bell className="w-8 h-8 text-black" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">READY FOR PICKUP</h3>
                  <p className="text-[11px] text-green-500 font-bold uppercase tracking-[0.2em] mt-1">Head to the pickup counter now</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Precision Digital Token */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-[3rem] p-12 text-center shadow-premium relative group overflow-hidden"
        >
          <div className="absolute inset-0 bg-linear-to-b from-white/[0.02] to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-linear-to-t from-apple-blue/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

          <span className="text-[9px] font-black text-white/20 tracking-[0.5em] uppercase mb-10 block">DIGITAL ACCESS TOKEN</span>

          <div className="relative inline-block py-10 px-16">
            <div className="absolute inset-0 bg-white shadow-premium rounded-[3.5rem] opacity-[0.02] group-hover:opacity-[0.04] transition-opacity duration-700" />
            <div className="absolute inset-0 bg-white shadow-premium rounded-[3.5rem] opacity-[0.01] group-hover:opacity-[0.02] transition-opacity duration-700" />

            <div className="relative z-10">
              <div className="absolute inset-0 bg-apple-blue/20 blur-[100px] rounded-full opacity-30 group-hover:opacity-60 transition-opacity" />
              <h2 className="text-[10rem] sm:text-[12rem] font-black text-white tracking-tighter relative leading-[0.8]">
                {order.tokenNumber || '---'}
              </h2>
            </div>
          </div>

          <div className="mt-12 flex items-center justify-center gap-6">
            <div className="h-[1px] w-12 bg-white/5" />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Present at Counter</span>
            <div className="h-[1px] w-12 bg-white/5" />
          </div>
        </motion.div>

        {/* Order Status History */}
        <div className="grid grid-cols-1 gap-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel rounded-[2.5rem] p-1 shadow-premium overflow-hidden"
          >
            <div className="bg-white/[0.02] p-8 rounded-[2.2rem] space-y-10">
              <div className="flex items-center justify-between pb-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <Activity className="w-5 h-5 text-apple-blue" />
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">ORDER STATUS</h3>
                </div>
                <div className="px-3 py-1 rounded-lg bg-apple-blue/10 border border-apple-blue/20 text-[9px] font-black text-apple-blue tracking-widest uppercase animate-pulse">
                  REAL-TIME UPDATES
                </div>
              </div>

              <div className="space-y-12 pl-4">
                {statusSteps.map((step, index) => {
                  const Icon = step.icon
                  const isCompleted = index <= currentStepIndex
                  const isCurrent = index === currentStepIndex

                  return (
                    <div key={step.key} className="flex gap-8 group relative">
                      {index < statusSteps.length - 1 && (
                        <div className={cn(
                          "absolute left-6 top-14 w-[2px] h-10 rounded-full transition-all duration-1000",
                          isCompleted ? "bg-white/20" : "bg-white/5 shadow-none"
                        )} />
                      )}

                      <div className="relative">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700",
                          isCompleted ? "bg-white text-black shadow-premium" : "bg-white/[0.03] text-white/10 border border-white/5",
                          isCurrent && "scale-110 ring-8 ring-white/5"
                        )}>
                          {isCurrent ? <Zap className="w-5 h-5 animate-pulse" /> : <Icon className="w-5 h-5" />}
                        </div>
                      </div>

                      <div className="flex-1 pt-2">
                        <h4 className={cn(
                          "text-sm font-black uppercase tracking-widest transition-all duration-700",
                          isCompleted ? "text-white" : "text-white/20"
                        )}>
                          {step.label}
                        </h4>
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.03] w-32 border border-white/[0.05]">
                          {isCompleted && (
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              className={cn("h-full", isCurrent ? "bg-apple-blue" : "bg-white/40")}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>

          {/* Unit Manifest Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel rounded-[2.5rem] p-1 shadow-premium overflow-hidden"
          >
            <div className="bg-white/[0.02] p-8 rounded-[2.2rem] space-y-8">
              <div className="flex items-center gap-4 pb-6 border-b border-white/5">
                <Shield className="w-5 h-5 text-white/20" />
                <h3 className="text-sm font-black text-white shadow-premium uppercase tracking-[0.2em]">ORDER ITEMS</h3>
              </div>

              <div className="space-y-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between group p-3 rounded-2xl bg-white/[0.01] border border-transparent hover:border-white/5 transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center text-[10px] font-black shadow-premium">
                        {item.quantity}
                      </div>
                      <span className="text-sm font-black text-white/70 group-hover:text-white transition-colors uppercase tracking-tight">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-xs font-black text-white/30 tracking-tighter">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="pt-8 mt-4 border-t border-white/5 grid grid-cols-2 gap-8">
                <div className="space-y-2 text-left">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] block">Time Placed</span>
                  <span className="text-[11px] font-black text-white/50">{formatTimestamp(order.createdAt)}</span>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] block">Total Amount</span>
                  <span className="text-4xl font-black text-white tracking-tighter">₹{order.total}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Browser Sync Layer */}
        {!notificationGranted && (
          <div className="glass-panel border-white/5 bg-white/[0.01] rounded-[1.5rem] p-6 text-center">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] leading-relaxed">
              Enable notifications to receive pickup alerts
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
