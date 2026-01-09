'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowLeft,
    Wallet,
    ShoppingBag,
    TrendingUp,
    Clock,
    Heart,
    ChevronRight,
    ShieldCheck,
    Zap,
    Bell,
    Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/use-auth'
import { getOrdersByUserId, convertTimestampToDate } from '@/lib/firebase/db'
import { Order } from '@/lib/types'
import { format } from 'date-fns'

export default function CustomerProfilePage() {
    const router = useRouter()
    const { user, userProfile, loading: authLoading } = useAuth()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [isScrolled, setIsScrolled] = useState(false)
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [showInstallBtn, setShowInstallBtn] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setShowInstallBtn(true)
        }
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        return () => {
            window.removeEventListener('scroll', handleScroll)
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        }
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
            setShowInstallBtn(false)
        }
        setDeferredPrompt(null)
    }

    useEffect(() => {
        async function fetchOrders() {
            if (user) {
                try {
                    const userOrders = await getOrdersByUserId(user.uid)
                    setOrders(userOrders)
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
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-full" />
                    <p className="text-sm text-muted-foreground">Calculating your savings...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        router.push('/')
        return null
    }

    // Calculate Metrics
    const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0)
    const totalSaved = orders.reduce((sum, order) => sum + (order.discountApplied || 0), 0)
    const orderCount = orders.length
    // Assume each order saves ~15 mins of queuing time compared to traditional systems
    const timeSavedMinutes = orderCount * 15
    const timeSavedHours = Math.floor(timeSavedMinutes / 60)
    const timeSavedRemMinutes = timeSavedMinutes % 60

    // Chart Data: Last 7 orders or last 7 days
    const chartData = [...orders]
        .reverse()
        .slice(-7)
        .map(order => ({
            date: format(convertTimestampToDate(order.createdAt), 'MMM dd'),
            amount: order.total
        }))

    // Top Items
    const itemCounts: Record<string, { name: string; count: number }> = {}
    orders.forEach(order => {
        order.items.forEach((item: { id: string; name: string; quantity: number }) => {
            if (!itemCounts[item.id]) {
                itemCounts[item.id] = { name: item.name, count: 0 }
            }
            itemCounts[item.id].count += item.quantity
        })
    })

    const topItems = Object.values(itemCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white/10 relative overflow-hidden">

            {/* Precision Header - Seamless transition */}
            <header className={cn(
                "fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 w-[calc(100%-2rem)] max-w-4xl",
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
                            <h1 className="text-[10px] font-black tracking-[0.4em] uppercase leading-none text-white/40">ANALYTICS COMMAND</h1>
                            <p className="text-xs font-black text-white mt-1 uppercase tracking-widest">Performance Protocol</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end mr-2">
                            <p className="text-[10px] font-black text-white leading-none mb-1 uppercase tracking-widest">{user.displayName?.split(' ')[0]}</p>
                            <p className="text-[8px] font-black text-apple-blue uppercase tracking-[0.2em] animate-pulse">Neural Link Active</p>
                        </div>
                        <Avatar className="w-10 h-10 border border-white/10 shadow-premium">
                            <AvatarImage src={user.photoURL || ''} />
                            <AvatarFallback className="bg-white/5 text-white text-[10px] font-black">
                                {user.displayName?.charAt(0) || 'U'}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 pt-32 pb-24 space-y-12">
                {/* User Identity Card */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative group"
                >
                    <div className="glass-panel border-white/5 rounded-[3rem] p-10 sm:p-14 shadow-premium overflow-hidden flex flex-col md:flex-row items-center gap-12 relative">
                        <div className="absolute inset-0 bg-radial-at-tr from-apple-blue/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                        <div className="relative">
                            <div className="absolute inset-0 bg-apple-blue/20 blur-3xl rounded-full animate-pulse" />
                            <Avatar className="w-32 h-32 border-2 border-white/10 p-1 relative z-10 transition-transform group-hover:scale-105 duration-700 shadow-premium">
                                <AvatarImage src={user.photoURL || ''} className="rounded-full object-cover" />
                                <AvatarFallback className="text-3xl bg-black text-white font-black">
                                    {user.displayName?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-6 relative z-10">
                            <div className="space-y-2">
                                <h2 className="text-5xl sm:text-6xl font-black tracking-tighter text-white uppercase leading-none">{user.displayName || 'GUEST OPERATOR'}</h2>
                                <p className="text-xs font-black text-white/20 uppercase tracking-[0.4em]">{user.email}</p>
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                <div className="px-6 py-2 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest shadow-premium">
                                    PREMIUM ACCESS
                                </div>
                                <div className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40">
                                    ESTD. {format(new Date(user.metadata.creationTime || Date.now()), 'yyyy')}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center md:items-end gap-2 px-10 md:border-l border-white/5 relative z-10">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Operational Grade</span>
                            <span className="text-4xl font-black text-apple-blue tracking-tighter italic text-shadow-glow">ELITE OPS</span>
                        </div>
                    </div>
                </motion.section>

                {/* Impact Metrics Grid */}
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ staggerChildren: 0.1 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    <MetricCard
                        title="Operational Export"
                        value={`₹${totalSpent.toLocaleString()}`}
                        icon={<Wallet className="w-5 h-5" />}
                        accent="text-white"
                        desc="Total sorted output"
                    />
                    <MetricCard
                        title="Protocol Savings"
                        value={`₹${totalSaved.toLocaleString()}`}
                        icon={<TrendingUp className="w-5 h-5" />}
                        accent="text-green-500"
                        desc="Optimization delta"
                    />
                    <MetricCard
                        title="Sorties Completed"
                        value={orderCount.toString()}
                        icon={<ShoppingBag className="w-5 h-5" />}
                        accent="text-apple-blue"
                        desc="Mission count"
                    />
                    <MetricCard
                        title="Time Efficiency"
                        value={`${timeSavedHours}h ${timeSavedRemMinutes}m`}
                        icon={<Clock className="w-5 h-5" />}
                        accent="text-tesla-red"
                        desc="Latent time reclaimed"
                    />
                </motion.section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Spending Trend */}
                    <div className="lg:col-span-8 glass-panel border-white/5 rounded-[2.5rem] shadow-premium overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Activity className="w-5 h-5 text-white/20" />
                                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">PAYLOAD TELEMETRY</h3>
                            </div>
                            <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[8px] font-black text-white/20 uppercase tracking-widest">
                                LAST 7 CYCLES
                            </div>
                        </div>
                        <div className="h-[350px] w-full p-10 pt-4">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="rgba(255, 255, 255, 0.12)" stopOpacity={1} />
                                                <stop offset="95%" stopColor="rgba(255, 255, 255, 0)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="6 6" stroke="rgba(255, 255, 255, 0.03)" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            stroke="rgba(255, 255, 255, 0.1)"
                                            fontSize={9}
                                            fontWeight="bold"
                                            tickLine={false}
                                            axisLine={false}
                                            dy={15}
                                        />
                                        <YAxis
                                            stroke="rgba(255, 255, 255, 0.1)"
                                            fontSize={9}
                                            fontWeight="bold"
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `₹${value}`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '20px',
                                                padding: '12px 16px',
                                                fontSize: '10px',
                                                fontWeight: '900',
                                                color: '#fff',
                                                backdropFilter: 'blur(20px)',
                                                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                                            }}
                                            cursor={{ stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 1.5 }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="#fff"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorAmount)"
                                            animationDuration={2500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20">
                                    <Activity className="w-10 h-10" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Signal Flatlined: No Activity</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-10">
                        {/* Favorite Payloads */}
                        <div className="glass-panel border-white/5 rounded-[2.5rem] shadow-premium overflow-hidden flex flex-col">
                            <div className="p-8 border-b border-white/[0.04] bg-white/[0.01]">
                                <div className="flex items-center gap-4">
                                    <Heart className="w-5 h-5 text-tesla-red" />
                                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">PRIORITY GEAR</h3>
                                </div>
                            </div>
                            <div className="p-10 space-y-8">
                                {topItems.length > 0 ? (
                                    topItems.map((item, index) => (
                                        <div key={item.name} className="flex items-center gap-6 group">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[11px] font-black text-white/20 group-hover:bg-white group-hover:text-black transition-all duration-500 shadow-premium">
                                                0{index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-black uppercase tracking-tight text-white/70 group-hover:text-white transition-colors duration-500">{item.name}</p>
                                                <div className="h-1.5 w-full bg-white/5 rounded-full mt-3 overflow-hidden shadow-inner">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(item.count / topItems[0].count) * 100}%` }}
                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                        className="h-full bg-linear-to-r from-apple-blue/10 via-apple-blue to-white/20"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[10px] font-black text-white/10 uppercase tracking-widest text-center py-10 italic">Neural cache cleared</p>
                                )}
                            </div>
                        </div>

                        {/* Special Ops Action */}
                        <AnimatePresence>
                            {showInstallBtn && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="glass-panel bg-linear-to-br from-apple-blue/20 to-transparent border-apple-blue/20 rounded-[2.5rem] p-10 shadow-premium relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative z-10 space-y-6">
                                        <div className="flex items-center gap-4">
                                            <Zap className="w-6 h-6 text-white shadow-glow" />
                                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">DEPLOY NATIVE</h3>
                                        </div>
                                        <p className="text-[11px] font-medium text-white/40 uppercase tracking-widest leading-relaxed">
                                            Integrate KURO directly into your hardware kernel for zero-latency access.
                                        </p>
                                        <Button
                                            onClick={handleInstall}
                                            className="w-full h-14 bg-white text-black hover:bg-white/90 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-premium active:scale-95 transition-all border-none"
                                        >
                                            INITIATE INSTALL
                                        </Button>
                                    </div>
                                    <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-apple-blue/30 blur-[80px] rounded-full" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Recent Deployment List */}
                <section className="space-y-8">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">SORTIE LOGS</h3>
                        <div className="h-[1px] flex-1 mx-10 bg-white/5" />
                        <Button variant="ghost" className="text-[9px] font-black text-white/20 hover:text-white uppercase tracking-widest">Wipe Cache</Button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {orders.slice(0, 5).map((order) => (
                            <motion.div
                                key={order.id}
                                whileHover={{ x: 10 }}
                                className="glass-panel border-white/5 rounded-[2.2rem] p-8 flex flex-col sm:flex-row items-center justify-between hover:bg-white/[0.03] hover:border-white/10 transition-all cursor-pointer group shadow-premium"
                                onClick={() => router.push(`/customer/order/${order.id}`)}
                            >
                                <div className="flex items-center gap-8 w-full sm:w-auto mb-6 sm:mb-0">
                                    <div className="w-16 h-16 rounded-[1.2rem] bg-white/5 flex items-center justify-center transition-all duration-700 group-hover:bg-white group-hover:text-black shadow-inner">
                                        <ShoppingBag className="w-7 h-7 text-white/20 group-hover:text-current transition-colors" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-sm font-black uppercase tracking-tight text-white/90">TOKEN #{order.tokenNumber || '---'}</h4>
                                            <span className="w-1 h-1 rounded-full bg-white/10" />
                                            <span className="text-[9px] font-black text-apple-blue uppercase tracking-widest leading-none">ID: {order.id.slice(0, 8)}</span>
                                        </div>
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                                            {format(convertTimestampToDate(order.createdAt), 'EEEE, MMM dd | HH:mm')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-12 w-full sm:w-auto justify-between sm:justify-end">
                                    <div className="text-right space-y-1">
                                        <p className="text-3xl font-black text-white tracking-tighter">₹{order.total}</p>
                                        <p className={cn(
                                            "text-[9px] font-black uppercase tracking-widest",
                                            order.status === 'ready' ? 'text-green-500' : 'text-white/30'
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
                    </div>
                </section>
            </main>
        </div>
    )
}

function MetricCard({ title, value, icon, accent, desc }: { title: string; value: string; icon: React.ReactNode; accent: string; desc: string }) {
    return (
        <motion.div whileHover={{ y: -8, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <div className="glass-panel border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-premium group h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/30 group-hover:text-white transition-all duration-500 shadow-inner">
                        {icon}
                    </div>
                    <div className="w-2 h-2 rounded-full bg-white/5 group-hover:bg-white/20 transition-all" />
                </div>
                <div className="space-y-1">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] leading-none mb-3">{title}</p>
                    <p className={cn("text-3xl font-black tracking-tighter leading-none", accent)}>{value}</p>
                    <p className="text-[8px] font-black text-white/10 uppercase tracking-widest mt-2">{desc}</p>
                </div>
            </div>
        </motion.div>
    )
}
