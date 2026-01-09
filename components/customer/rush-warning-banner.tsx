'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Clock, TrendingUp, X } from 'lucide-react'
import { getUpcomingRushWarning, RushPrediction } from '@/lib/rush-predictor'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function RushWarningBanner() {
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

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="px-4 pt-4"
            >
                <div className="glass-panel border-amber-500/20 bg-amber-500/[0.03] rounded-3xl p-6 relative overflow-hidden shadow-premium">
                    {/* Pulsing Alert Background */}
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50" />

                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex flex-col sm:flex-row gap-6 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-6 h-6 text-black" />
                        </div>

                        <div className="flex-1 space-y-4">
                            <div className="flex flex-wrap items-center gap-4">
                                <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest leading-none">High Traffic Advisory</h3>
                                <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-black text-amber-500 tracking-[0.2em]">
                                    {warning.confidence}% CONFIDENCE
                                </div>
                            </div>

                            <p className="text-xs font-bold text-white/60 leading-relaxed uppercase tracking-tight max-w-2xl">
                                System AI predicts peak load at <span className="text-white font-black">{warning.time}</span> due to {warning.reason}.
                                <span className="text-white/40 ml-2">Estimated processing latency will increase by 400%.</span>
                            </p>

                            <div className="flex items-center gap-6 pt-2">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-amber-500/60" />
                                    <span className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest">Wait: 25-40m</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-3.5 h-3.5 text-amber-500/60" />
                                    <span className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest">Surge Imminent</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-end shrink-0">
                            <Button
                                variant="outline"
                                className="h-10 rounded-xl border-amber-500/20 bg-amber-500/5 hover:bg-amber-500 text-amber-500 hover:text-black text-[10px] font-black tracking-widest transition-all"
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
