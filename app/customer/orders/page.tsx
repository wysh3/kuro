'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, ChevronRight, ArrowLeft, Clock, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { getOrdersByUserId, Order, convertTimestampToDate } from '@/lib/firebase/db'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export default function OrdersPage() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [isScrolled, setIsScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        async function fetchOrders() {
            if (user) {
                try {
                    const userOrders = await getOrdersByUserId(user.uid)
                    setOrders(userOrders.sort((a, b) => {
                        const dateA = convertTimestampToDate(a.createdAt).getTime()
                        const dateB = convertTimestampToDate(b.createdAt).getTime()
                        return dateB - dateA
                    }))
                } catch (error) {
                    console.error('Error fetching orders:', error)
                } finally {
                    setLoading(false)
                }
            } else if (!authLoading) {
                setLoading(false)
            }
        }
        fetchOrders()
    }, [user, authLoading])

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white/10 relative overflow-hidden">

            {/* Precision Floating Header */}
            <header className={cn(
                "fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 w-[calc(100%-2rem)] max-w-2xl",
                isScrolled ? "top-4" : "top-6"
            )}>
                <div className={cn(
                    "glass-panel rounded-2xl px-6 py-3 flex items-center justify-between transition-all duration-700",
                    isScrolled ? "bg-black/40 backdrop-blur-3xl shadow-premium" : "bg-transparent border-transparent"
                )}>
                    <div className="flex items-center gap-6">
                        <Button variant="ghost" size="icon" onClick={() => router.push('/customer')} className="w-10 h-10 hover:bg-white/5 rounded-xl">
                            <ArrowLeft className="w-5 h-5 text-white/40" />
                        </Button>
                        <div>
                            <h1 className="text-[10px] font-black tracking-[0.4em] uppercase leading-none text-white/40">MISSION LOGS</h1>
                            <p className="text-xs font-black text-white mt-1 uppercase tracking-widest">Order Deployment History</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-6 pt-32 pb-24 relative z-10">
                {orders.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-8">
                        <div className="w-24 h-24 rounded-[2rem] glass-panel border-white/10 flex items-center justify-center shadow-premium group">
                            <ShoppingBag className="w-10 h-10 text-white/10 group-hover:text-white/40 transition-colors duration-500" />
                        </div>
                        <div className="space-y-4 text-center">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Zero Sorties Recorded on this ID</p>
                            <Button
                                onClick={() => router.push('/customer')}
                                className="h-16 px-10 bg-white text-black hover:bg-white/90 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-premium active:scale-95 transition-all"
                            >
                                INITIATE FIRST MISSION
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 px-2 mb-10">
                            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">PRIORITY SORTIES</h3>
                            <div className="h-[1px] flex-1 bg-white/5" />
                        </div>

                        <AnimatePresence mode="popLayout">
                            {orders.map((order, index) => (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => router.push(`/customer/order/${order.id}`)}
                                    className="group glass-panel border-white/5 rounded-[2.2rem] p-8 flex flex-col sm:flex-row items-center justify-between hover:bg-white/[0.03] hover:border-white/10 transition-all cursor-pointer shadow-premium"
                                >
                                    <div className="flex items-center gap-8 w-full sm:w-auto mb-6 sm:mb-0">
                                        <div className={cn(
                                            "w-16 h-16 rounded-[1.2rem] flex items-center justify-center border transition-all duration-700 shadow-inner",
                                            order.status === 'completed'
                                                ? "bg-green-500/10 border-green-500/20 text-green-400 group-hover:bg-green-500 group-hover:text-black"
                                                : "bg-apple-blue/10 border-apple-blue/20 text-apple-blue group-hover:bg-apple-blue group-hover:text-black"
                                        )}>
                                            {order.status === 'completed' ? <CheckCircle2 className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-sm font-black uppercase tracking-tight text-white/90">TOKEN #{order.tokenNumber || '---'}</h4>
                                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                                <span className="text-[9px] font-black text-apple-blue uppercase tracking-widest leading-none">ID: {order.id.slice(0, 8)}</span>
                                            </div>
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">
                                                {format(convertTimestampToDate(order.createdAt), 'EEEE, MMM dd | HH:mm')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-12 w-full sm:w-auto justify-between sm:justify-end">
                                        <div className="text-right space-y-1">
                                            <p className="text-3xl font-black text-white tracking-tighter">₹{order.total}</p>
                                            <p className={cn(
                                                "text-[9px] font-black uppercase tracking-widest",
                                                order.status === 'completed' ? "text-green-500" : "text-apple-blue"
                                            )}>
                                                {order.status.replace('_', ' ')}
                                            </p>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center group-hover:border-white/20 group-hover:bg-white/5 transition-all">
                                            <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white transition-colors" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    )
}
