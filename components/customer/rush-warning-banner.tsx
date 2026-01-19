'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Clock, TrendingUp, X } from 'lucide-react'
import { getUpcomingRushWarning, RushPrediction } from '@/lib/rush-predictor'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function RushWarningBanner({ minimal = false }: { minimal?: boolean }) {
    const [warning, setWarning] = useState<RushPrediction | null>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const upcomingRush = getUpcomingRushWarning(45)
        if (upcomingRush) {
            setWarning(upcomingRush)
            setIsVisible(true)
        }
    }, [])

    if (!warning || !isVisible) return null

    if (minimal) {
        return (
            <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 px-2 py-1 sm:px-3 sm:py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl shadow-premium backdrop-blur-md"
            >
                <AlertTriangle className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-amber-500" />
                <span className="text-[9px] sm:text-[10px] font-black text-amber-500 tracking-widest uppercase truncate max-w-[120px] sm:max-w-none">
                    High Traffic: {warning.time}
                </span>
            </motion.div>
        )
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="px-4 pt-4"
            >
                <div className="glass-panel border-white/10 bg-white/[0.015] rounded-[2rem] p-6 relative overflow-hidden shadow-premium">
                    {/* Subtle Amber Glow (Ambient) */}
                    <div className="absolute top-0 left-0 w-48 h-48 blur-[80px] rounded-full -ml-24 -mt-24 bg-amber-500/10 pointer-events-none" />

                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute top-5 right-5 text-white/10 hover:text-white transition-colors z-20"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex flex-col sm:flex-row gap-6 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)] flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-6 h-6 text-amber-500" />
                        </div>

                        <div className="flex-1 space-y-4">
                            <div className="flex flex-wrap items-center gap-4">
                                <div>
                                    <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] leading-none mb-1">High Traffic Advisory</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[8px] font-black text-amber-500 tracking-widest uppercase">
                                            {warning.confidence}% CONFIDENCE
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs font-bold text-white/60 leading-relaxed uppercase tracking-tight max-w-2xl">
                                System AI predicts peak load at <span className="text-white font-black">{warning.time}</span> due to {warning.reason}.
                                <span className="text-white/40 ml-2">Estimated processing latency will increase by 400%.</span>
                            </p>

                            <div className="flex items-center gap-6 pt-2">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-amber-500/40" />
                                    <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Wait: 25-40m</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-3.5 h-3.5 text-amber-500/40" />
                                    <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Surge Imminent</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-end shrink-0">
                            <Button
                                variant="outline"
                                className="h-10 px-6 rounded-xl border-white/5 bg-white/5 hover:bg-amber-500 hover:border-amber-500 text-white/60 hover:text-black text-[10px] font-black tracking-[0.2em] transition-all uppercase"
                                onClick={() => setIsVisible(false)}
                            >
                                ACKNOWLEDGE
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
