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

        if (!user) {
            setLoading(false)
            return
        }

        const unsubscribe = subscribeToUserActiveOrders(
            user.uid,
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
            case 'kitchen_received': return 'Confirmed! 🎟️'
            case 'preparing': return 'Chef is at work... 🍳'
            case 'ready': return 'Hooray! Ready! 🥳'
            case 'completed': return 'Picked Up'
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
                <span className="text-[10px] font-black text-apple-blue uppercase tracking-widest">{orders.length} ACTIVE</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                    {orders.map((order, idx) => (
                        <motion.button
                            key={order.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => router.push(`/customer/order/${order.id}`)}
                            className={cn(
                                "group relative overflow-hidden glass-panel rounded-3xl p-6 text-left transition-all hover:bg-white/[0.04] border-white/5 hover:border-white/10 shadow-premium",
                                order.status === 'ready' && "border-green-500/20 bg-green-500/[0.02]"
                            )}
                        >
                            <div className="flex flex-col gap-4 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center",
                                            order.status === 'ready' ? "bg-green-500/10" : "bg-white/5"
                                        )}>
                                            <ShoppingBag className={cn(
                                                "w-5 h-5",
                                                order.status === 'ready' ? "text-green-500" : "text-white/40"
                                            )} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Order ID</p>
                                            <p className="text-xs font-black text-white uppercase tracking-tight">#{order.id.slice(-6).toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                        order.status === 'ready'
                                            ? "bg-green-500 text-black border-transparent shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-pulse"
                                            : "bg-white/5 text-white/40 border-white/5"
                                    )}>
                                        {getStatusLabel(order.status)}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        {order.items.map((item, i) => (
                                            <span key={i} className="text-[9px] font-bold text-white/40 bg-white/5 px-2 py-1 rounded-md uppercase">
                                                {item.quantity}x {item.name}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(order.status)}
                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                                                {order.pickupSlot || 'ASAP'}
                                            </span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            </div>

                            {/* Accent glow for ready orders */}
                            {order.status === 'ready' && (
                                <>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[40px] -z-10" />
                                    <motion.div
                                        animate={{ y: [0, -4, 0] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="absolute -top-1 -right-1"
                                    >
                                        <Sparkles className="w-6 h-6 text-green-500/40" />
                                    </motion.div>
                                </>
                            )}
                        </motion.button>
                    ))}
                </AnimatePresence>
            </div>
        </section>
    )
}
