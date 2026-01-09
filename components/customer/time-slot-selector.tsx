'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingDown, AlertTriangle, Star } from 'lucide-react';
import { TimeSlot, generateTimeSlots } from '@/lib/time-slots';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface TimeSlotSelectorProps {
    onSelect: (slot: TimeSlot) => void;
    selectedSlot?: TimeSlot | null;
}

export function TimeSlotSelector({ onSelect, selectedSlot }: TimeSlotSelectorProps) {
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [asapSlot, setAsapSlot] = useState<TimeSlot | null>(null);

    useEffect(() => {
        // Generate slots on mount
        const generatedSlots = generateTimeSlots();
        setSlots(generatedSlots);

        // Create ASAP slot (15 minutes from now)
        const now = new Date();
        const asapTime = new Date(now.getTime() + (15 * 60 * 1000));
        const asap: TimeSlot = {
            time: asapTime,
            displayTime: 'ASAP',
            isOffPeak: false,
            discountPercent: 0,
            isAvailable: true,
            isRecommended: true,
            rushWarning: undefined
        };
        setAsapSlot(asap);

        // Auto-select ASAP if no slot is selected
        if (!selectedSlot) {
            onSelect(asap);
        }
    }, []); // Run once on mount

    if (slots.length === 0) {
        return (
            <div className="p-8 text-center glass-panel border-white/5 bg-white/[0.02] rounded-[2rem]">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Zero latency slots available at present</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-apple-blue" />
                    </div>
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">
                        DEPLOYMENT WINDOW
                    </label>
                </div>
                {slots.some(s => s.isOffPeak) && (
                    <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-[8px] font-black text-green-500 uppercase tracking-[0.2em] flex items-center bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20"
                    >
                        <TrendingDown className="w-3 h-3 mr-2" />
                        ECONOMY MODE ACTIVE
                    </motion.span>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar p-1">
                {/* ASAP Slot */}
                {asapSlot && (
                    <motion.button
                        whileHover={{ scale: 1.04, y: -2 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onSelect(asapSlot)}
                        className={cn(
                            "relative flex flex-col items-center justify-center p-6 rounded-[1.5rem] border transition-all duration-500 group shadow-premium",
                            selectedSlot?.displayTime === 'ASAP'
                                ? "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                                : "glass-panel border-white/5 text-white/40 hover:border-white/20 hover:bg-white/[0.04]"
                        )}
                    >
                        {/* ASAP Badge */}
                        {selectedSlot?.displayTime !== 'ASAP' && (
                            <div className="absolute top-2 right-2">
                                <Star className="w-3 h-3 fill-apple-blue text-apple-blue shadow-glow" />
                            </div>
                        )}

                        {/* Time */}
                        <span className={cn(
                            "text-2xl font-black tracking-tighter italic leading-none mb-3",
                            selectedSlot?.displayTime === 'ASAP' ? "text-black" : "text-white"
                        )}>
                            ASAP
                        </span>

                        {/* Status */}
                        <div className="flex flex-col items-center gap-2 w-full">
                            <div className={cn(
                                "px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border",
                                selectedSlot?.displayTime === 'ASAP' ? "bg-black/10 border-black/10 text-black" : "bg-apple-blue/10 border-apple-blue/20 text-apple-blue"
                            )}>
                                ~15 MIN
                            </div>
                        </div>
                    </motion.button>
                )}

                {/* Generated Time Slots */}
                {slots.map((slot, index) => {
                    const isSelected = selectedSlot?.time.getTime() === slot.time.getTime();

                    return (
                        <motion.button
                            key={index}
                            whileHover={{ scale: 1.04, y: -2 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => onSelect(slot)}
                            className={cn(
                                "relative flex flex-col items-center justify-center p-6 rounded-[1.5rem] border transition-all duration-500 group shadow-premium",
                                isSelected
                                    ? "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                                    : "glass-panel border-white/5 text-white/40 hover:border-white/20 hover:bg-white/[0.04]",
                                !slot.isAvailable && "opacity-20 cursor-not-allowed grayscale"
                            )}
                            disabled={!slot.isAvailable}
                        >
                            {/* Badger/Indicator */}
                            {slot.isRecommended && !isSelected && (
                                <div className="absolute top-2 right-2">
                                    <Star className="w-3 h-3 fill-apple-blue text-apple-blue shadow-glow" />
                                </div>
                            )}

                            {/* Time */}
                            <span className={cn(
                                "text-2xl font-black tracking-tighter italic leading-none mb-3",
                                isSelected ? "text-black" : "text-white"
                            )}>
                                {slot.displayTime}
                            </span>

                            {/* Status Text & Badges */}
                            <div className="flex flex-col items-center gap-2 w-full">
                                {slot.isOffPeak ? (
                                    <div className={cn(
                                        "px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border",
                                        isSelected ? "bg-black/10 border-black/10 text-black" : "bg-green-500/10 border-green-500/20 text-green-500"
                                    )}>
                                        SAVINGS ACTIVE
                                    </div>
                                ) : slot.rushWarning ? (
                                    <div className={cn(
                                        "px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border border-yellow-500/20",
                                        isSelected ? "bg-black/10 text-black" : "bg-yellow-500/10 text-yellow-500"
                                    )}>
                                        HIGH LOAD
                                    </div>
                                ) : (
                                    <span className="text-[7px] font-black uppercase tracking-widest opacity-40">Standard</span>
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
