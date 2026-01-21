'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, DollarSign, Calendar, PieChart, Activity, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getOrdersByUserId } from '@/lib/firebase/db';
import { Order } from '@/lib/types';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart as RePieChart, Pie
} from 'recharts';
import { Spinner } from '@/components/ui/spinner';

export default function AnalyticsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
            return;
        }

        if (user) {
            fetchData();
        }
    }, [user, authLoading]);

    async function fetchData() {
        if (!user) return;
        try {
            const data = await getOrdersByUserId(user.uid);
            setOrders(data);
        } catch (error) {
            console.error('Error fetching analytics data:', error);
        } finally {
            setLoading(false);
        }
    }

    const totalSpending = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrderValue = orders.length > 0 ? Math.round(totalSpending / orders.length) : 0;

    // Prepare data for line chart (spending over time)
    const chartData = orders.slice().reverse().map(o => ({
        date: o.createdAt?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: o.total
    }));

    // Prepare data for bar chart (category frequency)
    const categoryData: Record<string, number> = {};
    orders.forEach(o => {
        o.items?.forEach(item => {
            // Since we might not have category in order items, we group by item name for now
            categoryData[item.name] = (categoryData[item.name] || 0) + item.quantity;
        });
    });

    const topItems = Object.entries(categoryData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

    if (authLoading || loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Spinner /></div>;

    return (
        <div className="min-h-screen bg-black text-white p-6 sm:p-10 pb-32">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* Header */}
                <header className="flex items-center gap-6">
                    <button
                        onClick={() => router.push('/customer/kuro')}
                        className="w-12 h-12 rounded-2xl hover:bg-white/5 transition-all flex items-center justify-center border border-white/5"
                    >
                        <ArrowLeft className="w-6 h-6 text-white/40" />
                    </button>
                    <div>
                        <h1 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] leading-none mb-1">Intelligence</h1>
                        <p className="text-2xl font-black text-white uppercase tracking-widest">PERSONAL ANALYTICS</p>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Spending', value: `₹${totalSpending}`, icon: DollarSign, color: 'text-green-400' },
                        { label: 'Orders Placed', value: orders.length, icon: ShoppingCart, color: 'text-blue-400' },
                        { label: 'Avg Order Value', value: `₹${avgOrderValue}`, icon: TrendingUp, color: 'text-blue-400' },
                        { label: 'Active Streak', value: '7 Days', icon: Activity, color: 'text-red-400' },
                    ].map((stat, i) => (
                        <div key={i} className="glass-panel p-6 rounded-[2rem] border-white/10 bg-white/[0.02]">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{stat.label}</p>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <p className="text-2xl font-black text-white">{stat.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Spending Trend */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-blue-400" />
                            <h2 className="text-sm font-black uppercase tracking-widest text-white/60">Spending Trend</h2>
                        </div>
                        <div className="glass-panel p-8 rounded-[3rem] border-white/10 bg-white/[0.01] h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#ffffff20"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#ffffff20"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v) => `₹${v}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="amount"
                                        stroke="#3b82f6"
                                        strokeWidth={4}
                                        dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                                        activeDot={{ r: 6, fill: '#fff' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Most Ordered Items */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <PieChart className="w-5 h-5 text-blue-400" />
                            <h2 className="text-sm font-black uppercase tracking-widest text-white/60">Frequency Distribution</h2>
                        </div>
                        <div className="glass-panel p-8 rounded-[3rem] border-white/10 bg-white/[0.01] h-[400px] flex flex-col items-center justify-center">
                            <ResponsiveContainer width="100%" height="250">
                                <BarChart data={topItems} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        stroke="#ffffff40"
                                        fontSize={10}
                                        axisLine={false}
                                        tickLine={false}
                                        width={100}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#ffffff05' }}
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                        {topItems.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'][index % 5]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="space-y-4 w-full mt-6">
                                {topItems.slice(0, 3).map((item, i) => (
                                    <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/80">{item.name}</p>
                                        <p className="text-xs font-black text-white">{item.value}x</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dynamic AI Insight Footer */}
                <div className="glass-panel p-8 rounded-[2.5rem] border border-blue-500/20 bg-blue-500/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full" />
                    <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/20">
                            <TrendingUp className="w-8 h-8 text-blue-400" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-sm font-black uppercase tracking-widest text-white mb-2">Adaptive Insight</h3>
                            <p className="text-white/60 text-sm leading-relaxed">
                                {orders.length > 0 ? (
                                    <>
                                        Your spending peaked at <span className="text-white font-bold">₹{Math.max(...orders.map(o => o.total || 0))}</span> for a single order.
                                        Based on your {orders.length} orders, your preference for <span className="text-blue-400 font-black">{topItems[0]?.name || 'balanced meals'}</span> is clear.
                                        Adherence to your active nutritional profile is <span className="text-blue-400 font-black">OPTIMAL</span>.
                                    </>
                                ) : (
                                    "Place your first order to generate personalized nutritional insights and spending analytics."
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
