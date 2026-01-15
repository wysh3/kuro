'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { doc, onSnapshot } from 'firebase/firestore';
import { Clock, Users, Activity, TrendingUp } from 'lucide-react';
import { getFirebaseDB } from '@/lib/firebase/config';
import { CampusStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

export function CrowdStatusCard() {
    const [status, setStatus] = useState<CampusStatus | null>(null);

    useEffect(() => {
        const db = getFirebaseDB();
        const unsubscribe = onSnapshot(
            doc(db, 'campus_status', 'mrc'),
            (snapshot) => {
                if (snapshot.exists()) {
                    setStatus(snapshot.data() as CampusStatus);
                }
            }
        );
        return unsubscribe;
    }, []);

    if (!status) {
        return (
            <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-white/5 to-white/5 backdrop-blur-xl border border-white/10">
                <div className="text-center text-sm text-gray-400">Loading crowd status...</div>
            </div>
        );
    }

    const colors = {
        low: {
            dot: 'bg-green-500',
            glow: 'shadow-[0_0_30px_rgba(34,197,94,0.5)]',
            text: 'text-green-400',
            bg: 'from-green-500/10 to-green-500/5',
            border: 'border-green-500/20'
        },
        medium: {
            dot: 'bg-yellow-500',
            glow: 'shadow-[0_0_30px_rgba(234,179,8,0.5)]',
            text: 'text-yellow-400',
            bg: 'from-yellow-500/10 to-yellow-500/5',
            border: 'border-yellow-500/20'
        },
        high: {
            dot: 'bg-red-500',
            glow: 'shadow-[0_0_30px_rgba(239,68,68,0.5)]',
            text: 'text-red-400',
            bg: 'from-red-500/10 to-red-500/5',
            border: 'border-red-500/20'
        }
    };

    const theme = colors[status.crowdLevel];
    const secondsSinceUpdate = Math.round((Date.now() - status.lastUpdated.toDate().getTime()) / 1000);
    const minutesSinceUpdate = Math.round(secondsSinceUpdate / 60);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 glass-panel border border-white/10 shadow-premium transition-all duration-500 bg-white/[0.015] hover:bg-white/[0.04]"
        >
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className={`absolute top-0 right-0 w-48 h-48 blur-[80px] rounded-full -mr-24 -mt-24 opacity-15 transition-colors duration-1000 ${theme.dot}`} />

            <div className="relative space-y-3 sm:space-y-6">
                {/* Tactical Header */}
                <div className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <motion.div
                                animate={{ scale: [1, 2, 1], opacity: [0.1, 0.3, 0.1] }}
                                transition={{ repeat: Infinity, duration: 3 }}
                                className={`absolute inset-0 rounded-full blur-xl ${theme.dot}`}
                            />
                            <div className={`w-2 h-2 rounded-full relative z-10 shadow-[0_0_10px_rgba(255,255,255,0.1)] ${theme.dot}`} />
                        </div>
                        <div>
                            <h3 className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mb-1 sm:mb-1.5">Kitchen Traffic</h3>
                            <p className={`text-lg sm:text-xl font-black tracking-tighter uppercase leading-none ${theme.text}`}>
                                {status.crowdLevel === 'low' && 'Optimal'}
                                {status.crowdLevel === 'medium' && 'Steady'}
                                {status.crowdLevel === 'high' && 'Peak'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mb-1 sm:mb-1.5">Wait Time</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl sm:text-2xl font-black text-white tracking-tighter leading-none">{status.estimatedWait}</span>
                            <span className="text-[9px] font-black text-white/20 tracking-widest uppercase">MIN</span>
                        </div>
                    </div>
                </div>

                {/* Instrument Readouts */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-3 sm:pt-6 border-t border-white/[0.05]">
                    <StatusMetric label="Orders" value={status.activeOrders.toString()} icon={<Activity className="w-3 h-3" />} color="text-white" />
                    <StatusMetric label="Density" value={status.crowdScore.toString()} icon={<Users className="w-3 h-3" />} color="text-white" />
                    <StatusMetric label="Crew" value={status.staffOnline.toString()} icon={<TrendingUp className="w-3 h-3" />} color="text-white" />
                </div>

                {/* Precision Analytics */}
                <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-3 sm:pt-6 border-t border-white/[0.05]">
                    <div className="space-y-1 sm:space-y-2">
                        <div className="flex items-center gap-2 text-white/20">
                            <TrendingUp className="w-3 h-3" />
                            <span className="text-[8px] font-black uppercase tracking-[0.3em]">Efficiency</span>
                        </div>
                        <p className="text-lg sm:text-xl font-black text-white tracking-tighter">98.2%</p>
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                        <div className="flex items-center gap-2 text-white/20">
                            <Clock className="w-3 h-3" />
                            <span className="text-[8px] font-black uppercase tracking-[0.3em]">Special</span>
                        </div>
                        <p className="text-lg sm:text-xl font-black text-white tracking-tighter leading-none">POKE BOWL</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function StatusMetric({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
    return (
        <div className="flex flex-col items-center gap-2 sm:gap-3 group/metric text-center">
            <div className="flex items-center gap-2 text-white/20 group-hover/metric:text-white/40 transition-colors">
                {icon}
                <span className="text-[7px] font-black uppercase tracking-[0.4em] leading-none">{label}</span>
            </div>
            <p className={cn("text-lg sm:text-2xl font-black tracking-tighter leading-none transition-all group-hover/metric:scale-110", color)}>{value}</p>
        </div>
    )
}

