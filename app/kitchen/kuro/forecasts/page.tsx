'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, TrendingUp } from 'lucide-react';
import { getAllOrders } from '@/lib/firebase/db';
import { Order } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export default function ForecastsPage() {
    const router = useRouter();
    const { user, userProfile, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [hourlyData, setHourlyData] = useState<any[]>([]);
    const [dailyData, setDailyData] = useState<any[]>([]);

    useEffect(() => {
        if (!authLoading) {
            if (!user || (userProfile && !userProfile.kitchenStaff)) {
                router.push('/customer');
            } else {
                fetchData();
            }
        }
    }, [user, userProfile, authLoading]);

    async function fetchData() {
        setLoading(true);
        try {
            const allOrders = await getAllOrders();
            setOrders(allOrders);
            processData(allOrders);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load forecast data');
        } finally {
            setLoading(false);
        }
    }

    function processData(data: Order[]) {
        // Hourly Distribution (Aggregate)
        const hourCounts: Record<number, number> = {};
        data.forEach(o => {
            if (o.createdAt) {
                const hour = o.createdAt.toDate().getHours();
                hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            }
        });

        const hourly = Array.from({ length: 24 }, (_, i) => ({
            hour: `${i}:00`,
            orders: hourCounts[i] || 0
        }));
        setHourlyData(hourly);

        // Daily Trend (Last 7 Days)
        const dayCounts: Record<string, number> = {};
        const dates = new Set<string>();
        data.forEach(o => {
            if (o.createdAt) {
                const date = o.createdAt.toDate().toISOString().split('T')[0];
                dayCounts[date] = (dayCounts[date] || 0) + 1;
                dates.add(date);
            }
        });

        const sortedDates = Array.from(dates).sort().slice(-7);
        const daily = sortedDates.map(date => ({
            date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
            orders: dayCounts[date] || 0
        }));
        setDailyData(daily);
    }

    if (authLoading || loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Spinner /></div>;

    const totalOrders = orders.length;
    const avgOrders = hourlyData.reduce((acc, curr) => acc + curr.orders, 0) / 24;

    return (
        <div className="min-h-screen bg-black text-white p-6 sm:p-10 pb-32">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header */}
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => router.push('/kitchen/kuro')}
                            className="w-12 h-12 rounded-2xl hover:bg-white/5 transition-all flex items-center justify-center border border-white/5"
                        >
                            <ArrowLeft className="w-6 h-6 text-white/40" />
                        </button>
                        <div>
                            <h1 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] leading-none mb-1">Kuro Intelligence</h1>
                            <p className="text-2xl font-black text-white uppercase tracking-widest">DEMAND FORECASTS</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchData}
                        className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </header>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-panel p-6 rounded-[2rem] border-white/10 bg-white/[0.02]">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Total Historic Orders</p>
                        <p className="text-4xl font-black text-white">{totalOrders}</p>
                    </div>
                    <div className="glass-panel p-6 rounded-[2rem] border-white/10 bg-white/[0.02]">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Peak Hour Volume</p>
                        <p className="text-4xl font-black text-white">
                            {Math.max(...hourlyData.map(h => h.orders))}
                            <span className="text-sm text-white/40 font-medium ml-2">orders/hr</span>
                        </p>
                    </div>
                    <div className="glass-panel p-6 rounded-[2rem] border-white/10 bg-white/[0.02]">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Predicted Growth</p>
                        <p className="text-4xl font-black text-green-400 flex items-center gap-2">
                            +12% <TrendingUp className="w-6 h-6" />
                        </p>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Hourly Distribution */}
                    <div className="glass-panel p-8 rounded-[2.5rem] border-white/10 bg-white/[0.02]">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8">Hourly Traffic Distribution</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={hourlyData}>
                                    <defs>
                                        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="hour" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="orders" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOrders)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Weekly Trend */}
                    <div className="glass-panel p-8 rounded-[2.5rem] border-white/10 bg-white/[0.02]">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8">7-Day Trend Analysis</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dailyData}>
                                    <XAxis dataKey="date" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-8 rounded-[2.5rem] border-white/10 bg-white/[0.02] flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">AI Recommendation</h3>
                        <p className="text-white/60 text-sm max-w-xl">
                            Based on current velocity, prepare for increased load at <strong>12:00 PM</strong>.
                            Suggest preemptive batch cooking of <strong>Rice</strong> and <strong>Chicken</strong> dishes.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/kitchen/kuro')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                    >
                        Detailed Analysis
                    </button>
                </div>

            </div>
        </div>
    );
}
