'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getAllOrders, getMenuItems } from '@/lib/firebase/db';
import { Order, MenuItem } from '@/lib/types';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { InventoryRecommendation } from '@/lib/ai/types';

export default function InventoryPage() {
    const router = useRouter();
    const { user, userProfile, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [recommendations, setRecommendations] = useState<InventoryRecommendation[]>([]);

    useEffect(() => {
        if (!authLoading) {
            if (!user || ({ ...userProfile } && !userProfile.kitchenStaff)) {
                router.push('/customer');
            } else {
                fetchData();
            }
        }
    }, [user, userProfile, authLoading]);

    async function fetchData() {
        setLoading(true);
        try {
            const [orders, menuItems] = await Promise.all([
                getAllOrders(),
                getMenuItems()
            ]);
            processData(orders, menuItems);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to analyze inventory');
        } finally {
            setLoading(false);
        }
    }

    function processData(orders: Order[], items: MenuItem[]) {
        const itemDemand: Record<string, number> = {};
        orders.forEach((order) => {
            order.items?.forEach((item) => {
                itemDemand[item.id] = (itemDemand[item.id] || 0) + (item.quantity || 1);
            });
        });

        const uniqueDays = new Set(orders.map(o => new Date(o.createdAt.toDate()).toDateString())).size || 1;

        const recs: InventoryRecommendation[] = Object.entries(itemDemand)
            .sort((a, b) => b[1] - a[1]) // High demand first
            .map(([itemId, demand]) => {
                const item = items.find((m) => m.id === itemId);
                const avgDailyDemand = demand / uniqueDays;
                // Recommend 3 days of buffer
                const recommendedStock = Math.ceil(avgDailyDemand * 3);

                return {
                    itemId,
                    itemName: item?.name || 'Unknown',
                    currentStock: 0, // Mocked for now as we don't track live stock
                    recommendedReorder: recommendedStock,
                    urgency: recommendedStock > 50 ? 'high' : recommendedStock > 20 ? 'medium' : 'low',
                    reasoning: `${demand} units sold in ${uniqueDays} days (${avgDailyDemand.toFixed(1)}/day).`,
                };
            });

        setRecommendations(recs);
    }

    if (authLoading || loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Spinner /></div>;

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
                            <p className="text-2xl font-black text-white uppercase tracking-widest">INVENTORY FORECAST</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchData}
                        className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </header>

                <div className="grid grid-cols-1 gap-6">
                    {recommendations.map((rec) => (
                        <motion.div
                            key={rec.itemId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-panel p-6 rounded-[2rem] border-white/10 bg-white/[0.02] flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                        >
                            <div className="flex items-start gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center border",
                                    rec.urgency === 'high' ? "bg-red-500/10 border-red-500/20 text-red-400" :
                                        rec.urgency === 'medium' ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" :
                                            "bg-green-500/10 border-green-500/20 text-green-400"
                                )}>
                                    <Package className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase">{rec.itemName}</h3>
                                    <p className="text-white/40 text-xs font-medium uppercase tracking-wider">{rec.reasoning}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-8 w-full md:w-auto">
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Suggested Buffer</span>
                                    <span className="text-2xl font-black text-white">{rec.recommendedReorder} <span className="text-xs text-white/40 font-normal">units</span></span>
                                </div>
                                <div className="h-10 w-[1px] bg-white/10 hidden md:block" />
                                <div className="flex items-center gap-2">
                                    {rec.urgency === 'high' ? (
                                        <div className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/20 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-red-400" />
                                            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">High Priority</span>
                                        </div>
                                    ) : (
                                        <div className="px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/20 flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                                            <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Stable</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {recommendations.length === 0 && (
                        <div className="text-center py-20">
                            <p className="text-white/40 uppercase tracking-widest text-sm">No inventory data available yet.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
