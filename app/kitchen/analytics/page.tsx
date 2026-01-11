'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowLeft,
    IndianRupee,
    ShoppingBag,
    Clock,
    TrendingUp,
    BarChart3,
    PieChart as PieChartIcon,
    Calendar,
    AlertCircle,
    Activity,
    Target,
    Zap
} from 'lucide-react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { Order } from '@/lib/types'
import { getAllOrders, convertTimestampToDate } from '@/lib/firebase/db'
import { format, isSameDay } from 'date-fns'
import { cn } from '@/lib/utils'

const COLORS = ['#007AFF', '#FF3B30', '#34C759', '#AF52DE', '#FF9500']

export default function KitchenAnalyticsPage() {
    const router = useRouter()
    const { user, userProfile, loading: authLoading } = useAuth()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [isScrolled, setIsScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/')
            return
        }
    }, [user, authLoading, router])

    useEffect(() => {
        async function fetchOrders() {
            try {
                const allOrders = await getAllOrders()
                setOrders(allOrders)
            } catch (error) {
                console.error('Error fetching orders:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchOrders()
    }, [])

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-6">
                <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-12 h-12 border-2 border-white/10 border-t-white rounded-full"
                />
                <p className="text-[10px] font-black text-white/30 tracking-[0.4em] uppercase">Generating Business Insights</p>
            </div>
        )
    }

    const today = new Date()
    const todayOrders = orders.filter(order => isSameDay(convertTimestampToDate(order.createdAt), today))

    const todayRevenue = todayOrders
        .filter(o => o.status === 'completed' || o.status === 'ready')
        .reduce((sum, o) => sum + (o.total || 0), 0)

    const completedToday = todayOrders.filter(o => o.status === 'completed').length
    const totalToday = todayOrders.length

    const completedWithTimes = todayOrders.filter(o => o.status === 'completed' && o.updatedAt && o.createdAt)
    const avgPrepTime = completedWithTimes.length > 0
        ? completedWithTimes.reduce((sum, o) => {
            const start = convertTimestampToDate(o.createdAt).getTime()
            const end = convertTimestampToDate(o.updatedAt!).getTime()
            return sum + (end - start) / (1000 * 60)
        }, 0) / completedWithTimes.length
        : 0

    const hourlyData: Record<number, number> = {}
    for (let i = 8; i <= 21; i++) hourlyData[i] = 0

    todayOrders.forEach(o => {
        const hour = convertTimestampToDate(o.createdAt).getHours()
        if (hourlyData[hour] !== undefined) {
            hourlyData[hour]++
        }
    })

    const peakHoursData = Object.entries(hourlyData).map(([hour, count]) => ({
        hour: `${hour}:00`,
        orders: count
    }))

    const itemCounts: Record<string, { name: string; count: number }> = {}
    todayOrders.forEach(order => {
        order.items.forEach(item => {
            if (!itemCounts[item.id]) {
                itemCounts[item.id] = { name: item.name, count: 0 }
            }
            itemCounts[item.id].count += item.quantity
        })
    })

    const popularItemsData = Object.values(itemCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white/10 no-scrollbar relative">

            {/* Sleek Floating Header */}
            <header className={cn(
                "fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 w-[calc(100%-2rem)] max-w-7xl",
                isScrolled ? "top-4" : "top-6"
            )}>
                <div className={cn(
                    "glass-panel rounded-[2rem] px-8 py-4 flex items-center justify-between transition-all duration-700",
                    isScrolled ? "bg-black/60 backdrop-blur-3xl shadow-premium border-white/10" : "bg-transparent border-transparent px-4"
                )}>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/kitchen')}
                                className="w-10 h-10 rounded-xl hover:bg-white/5 transition-all flex items-center justify-center border border-transparent hover:border-white/10"
                            >
                                <ArrowLeft className="w-5 h-5 text-white/40" />
                            </button>
                            <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-premium group">
                                <BarChart3 className="w-6 h-6 text-black group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="text-[11px] font-black tracking-[0.4em] uppercase leading-none text-white/90">ANALYTICS DASHBOARD</h1>
                                <p className="text-[9px] font-bold text-white/30 mt-1.5 uppercase tracking-widest">DATA INSIGHTS</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                            <Calendar className="w-3 h-3 text-apple-blue" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{format(today, 'MMMM dd, yyyy')}</span>
                        </div>
                        <div className="h-8 w-[1px] bg-white/10 mx-2 hidden sm:block" />
                        <Button onClick={() => router.push('/customer')} variant="ghost" className="h-11 px-5 bg-apple-blue/10 hover:bg-apple-blue/20 text-apple-blue transition-all rounded-2xl text-[9px] font-black tracking-widest sm:flex hidden">
                            CUSTOMER PORTAL
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto pt-36 px-4 md:px-8 pb-20">
                {/* Tactical Metrics Grid */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <MetricCard
                        title="Live Revenue"
                        value={`₹${todayRevenue.toLocaleString()}`}
                        icon={<IndianRupee className="w-4 h-4" />}
                        subValue="Live Today"
                        accent="text-white"
                        glowColor="bg-white/10"
                    />
                    <MetricCard
                        title="Fulfillment Rate"
                        value={`${completedToday}/${totalToday}`}
                        icon={<ShoppingBag className="w-4 h-4" />}
                        subValue="Finished Orders"
                        accent="text-apple-blue"
                        glowColor="bg-apple-blue/10"
                    />
                    <MetricCard
                        title="Avg Prep Time"
                        value={`${Math.round(avgPrepTime)}m`}
                        icon={<Clock className="w-4 h-4" />}
                        subValue="Service Speed"
                        accent="text-purple-400"
                        glowColor="bg-purple-400/10"
                    />
                    <MetricCard
                        title="Kitchen Load"
                        value="85%"
                        icon={<Activity className="w-4 h-4" />}
                        subValue="Current Capacity"
                        accent="text-tesla-red"
                        glowColor="bg-tesla-red/10"
                    />
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Hourly Deployment Chart */}
                    <Card className="glass-panel border-white/5 rounded-[2.5rem] overflow-hidden shadow-premium">
                        <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between border-b border-white/5">
                            <div className="space-y-1">
                                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Traffic Analysis</span>
                                <CardTitle className="text-xl font-black italic tracking-tighter uppercase text-white">Hourly Order Volume</CardTitle>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                <Activity className="w-5 h-5 text-apple-blue" />
                            </div>
                        </CardHeader>
                        <CardContent className="h-[350px] w-full p-8">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={peakHoursData}>
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#007AFF" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#007AFF" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="4 4" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="hour"
                                        stroke="rgba(255, 255, 255, 0.2)"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: 'rgba(255,255,255,0.4)', fontWeight: 900 }}
                                    />
                                    <YAxis
                                        stroke="rgba(255, 255, 255, 0.2)"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: 'rgba(255,255,255,0.4)', fontWeight: 900 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                                        contentStyle={{
                                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '16px',
                                            fontSize: '10px',
                                            fontWeight: 900,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.1em'
                                        }}
                                    />
                                    <Bar
                                        dataKey="orders"
                                        fill="url(#barGradient)"
                                        radius={[8, 8, 0, 0]}
                                        barSize={20}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Popular Units Chart */}
                    <Card className="glass-panel border-white/5 rounded-[2.5rem] overflow-hidden shadow-premium">
                        <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between border-b border-white/5">
                            <div className="space-y-1">
                                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Sales Data</span>
                                <CardTitle className="text-xl font-black italic tracking-tighter uppercase text-white">Most Popular Items</CardTitle>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                <Target className="w-5 h-5 text-tesla-red" />
                            </div>
                        </CardHeader>
                        <CardContent className="h-[350px] w-full p-8 flex flex-col justify-center">
                            {popularItemsData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={popularItemsData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={100}
                                            paddingAngle={8}
                                            dataKey="count"
                                            nameKey="name"
                                            stroke="none"
                                        >
                                            {popularItemsData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '16px',
                                                fontSize: '10px',
                                                fontWeight: 900,
                                                textTransform: 'uppercase'
                                            }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            align="center"
                                            iconType="circle"
                                            wrapperStyle={{
                                                fontSize: '9px',
                                                textTransform: 'uppercase',
                                                fontWeight: 900,
                                                color: 'rgba(255,255,255,0.4)',
                                                paddingTop: '30px',
                                                letterSpacing: '0.1em'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center gap-4 text-white/10">
                                    <Target className="w-12 h-12" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">No Sales Data</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Tactical Alert */}
                <AnimatePresence>
                    {avgPrepTime > 15 && (
                        <motion.section
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-12 bg-tesla-red/5 border border-tesla-red/20 rounded-[2rem] p-8 flex items-center gap-8 shadow-[0_0_50px_rgba(232,23,30,0.1)]"
                        >
                            <div className="w-16 h-16 rounded-[1.5rem] bg-tesla-red/10 flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="w-8 h-8 text-tesla-red" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[12px] font-black text-tesla-red uppercase tracking-[0.2em]">Efficiency Threshold Breached</p>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed max-w-2xl">
                                    Service latency is currently at {Math.round(avgPrepTime)} minutes. Deploy efficiency protocols or enable manual overrides to maintain service advantage.
                                </p>
                            </div>
                            <Button
                                onClick={() => router.push('/kitchen')}
                                className="ml-auto h-12 px-6 rounded-2xl bg-tesla-red text-white text-[9px] font-black uppercase tracking-widest hover:bg-tesla-red/80 transition-all shadow-premium"
                            >
                                KITCHEN CONSOLE
                            </Button>
                        </motion.section>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}

function MetricCard({ title, value, icon, subValue, accent, glowColor }: { title: string; value: string; icon: React.ReactNode; subValue: string; accent: string; glowColor: string }) {
    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className="group"
        >
            <Card className="glass-panel border-white/5 rounded-[2rem] p-8 shadow-premium overflow-hidden relative h-full">
                <div className={cn("absolute -top-12 -right-12 w-32 h-32 blur-[60px] rounded-full opacity-20 -z-10 transition-all group-hover:opacity-40", glowColor)} />
                <div className="flex items-center justify-between mb-8">
                    <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-colors border border-white/5">
                        {icon}
                    </div>
                    <Zap className="w-3 h-3 text-white/10 group-hover:text-apple-blue transition-colors" />
                </div>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">{title}</p>
                        <p className={cn("text-4xl font-black italic tracking-tighter leading-none transition-all", accent)}>{value}</p>
                    </div>
                    <div className="h-[1px] w-full bg-white/5" />
                    <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.2em]">{subValue}</p>
                </div>
            </Card>
        </motion.div>
    )
}
