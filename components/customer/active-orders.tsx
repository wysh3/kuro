'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, CheckCircle2, ChevronRight, ShoppingBag, Sparkles } from 'lucide-react'
import { Order } from '@/lib/types'
import { subscribeToUserActiveOrders } from '@/lib/firebase/db'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

export function ActiveOrders() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (authLoading) return

        let userId: string | null = null

        if (user) {
            userId = user.uid
        } else {
            // Check for guest user in localStorage
            try {
                const guestUserData = localStorage.getItem("user")
                if (guestUserData) {
                    const guestUser = JSON.parse(guestUserData)
                    userId = guestUser.id
                }
            } catch (error) {
                console.error('Error parsing guest user data:', error)
            }
        }

        if (!userId) {
            setLoading(false)
            return
        }

        const unsubscribe = subscribeToUserActiveOrders(
            userId,
            (activeOrders) => {
                setOrders(activeOrders)
                setLoading(false)
            },
            (error) => {
                console.error('Active orders error:', error)
                setLoading(false)
            }
        )

        return () => unsubscribe()
    }, [user, authLoading])

    if (loading || orders.length === 0) return null

    const getStatusLabel = (status: Order['status']) => {
        switch (status) {
            case 'kitchen_received': return 'Confirmed'
            case 'preparing': return 'Preparing'
            case 'ready': return 'Ready for Pickup'
            case 'completed': return 'Handed Over'
            default: return status
        }
    }

    const getStatusIcon = (status: Order['status']) => {
        switch (status) {
            case 'ready': return <CheckCircle2 className="w-4 h-4 text-green-500" />
            default: return <Clock className="w-4 h-4 text-white/40" />
        }
    }

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-label-sm font-black text-white/20 tracking-[0.5em] uppercase">Active Orders</h2>
                <div className="h-[1px] flex-1 bg-white/5 mx-6" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{orders.length} ACTIVE</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                    {orders.map((order, idx) => (
                        <motion.button
                            key={order.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => router.push(`/customer/order/${order.id}`)}
                            className={cn(
                                "group relative overflow-hidden transition-all duration-700 rounded-[2rem] p-6 text-left border shadow-premium glass-panel",
                                order.status === 'ready'
                                    ? "bg-white/[0.06] border-white/20 scale-[1.02] shadow-[0_15px_40px_rgba(0,0,0,0.4)]"
                                    : "bg-white/[0.015] border-white/5 opacity-90 hover:opacity-100 hover:bg-white/[0.03]"
                            )}
                        >
                            <div className="flex flex-col gap-6 relative z-10">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 flex items-center justify-center">
                                            <ShoppingBag className={cn(
                                                "w-6 h-6 transition-all duration-700",
                                                order.status === 'ready' ? "text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]" : "text-white/10"
                                            )} />
                                        </div>
                                        <div>
                                            <p className="text-[7px] font-black text-white/10 uppercase tracking-[0.4em] mb-1">ORDER ID</p>
                                            <p className="text-2xl font-black text-white uppercase tracking-tight">#{order.tokenNumber || order.id.slice(-4).toUpperCase()}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <div className={cn(
                                            "text-[8px] font-black uppercase tracking-[0.3em] transition-all",
                                            order.status === 'ready' ? "text-white" : "text-white/20"
                                        )}>
                                            {getStatusLabel(order.status)}
                                        </div>
                                        {order.status === 'ready' && (
                                            <span className="text-[7px] font-black text-green-500/60 uppercase tracking-[0.3em] mt-1.5 text-center">
                                                Verified Ready
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div className="flex flex-wrap gap-1.5">
                                        {order.items.map((item, i) => (
                                            <span key={i} className="text-[8px] font-black text-white/30 bg-white/[0.02] px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/[0.01]">
                                                {item.quantity}x {item.name}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between pt-5 border-t border-white/[0.04]">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-1 h-1 rounded-full",
                                                order.status === 'ready' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-white/5"
                                            )} />
                                            <span className="text-[8px] font-black text-white/10 uppercase tracking-[0.4em]">
                                                {order.pickupSlot || 'ASAP'}
                                            </span>
                                        </div>
                                        <ChevronRight className="w-3 h-3 text-white/10 group-hover:text-white/30 transition-all" />
                                    </div>
                                </div>
                            </div>

                            {/* Refined side-glare for active state */}
                            {order.status === 'ready' && (
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            )}
                        </motion.button>
                    ))}
                </AnimatePresence>
            </div>
        </section>
    )
}
