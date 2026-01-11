'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Sparkles, MessageCircle, Utensils } from 'lucide-react'

export function KuroPersona() {
    const [mood, setMood] = useState<string | null>(null)
    const [message, setMessage] = useState("Hi! I'm Kuro. How are you feeling today?")
    const [isHovered, setIsHovered] = useState(false)

    const moods = [
        { emoji: '🎒', label: 'Busy', note: 'Sending energy! Try something quick.', suggestions: ['Sandwich', 'Protein Bar'] },
        { emoji: '🥱', label: 'Tired', note: 'Coffee protocol advised. ☕', suggestions: ['Espresso', 'Cookie'] },
        { emoji: '🥳', label: 'Happy', note: 'Yay! Time for a treat!', suggestions: ['Cupcake', 'Smoothie'] },
        { emoji: '🧐', label: 'Studious', note: 'Brain fuel incoming...', suggestions: ['Fruit Bowl', 'Nuts'] },
    ]

    const handleMoodSelect = (m: any) => {
        setMood(m.label)
        setMessage(`Got it! Since you're feeling ${m.label.toLowerCase()}, I recommend: ${m.suggestions.join(' or ')}. ${m.note}`)
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel rounded-[2.5rem] p-8 border-white/5 shadow-premium relative overflow-hidden group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-opacity">
                <Heart className="w-12 h-12 text-tesla-red animate-pulse" />
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left">
                <div className="relative">
                    <motion.div
                        animate={isHovered ? { scale: 1.1, rotate: [0, -5, 5, 0] } : {}}
                        className="w-20 h-20 rounded-3xl bg-linear-to-br from-apple-blue to-purple-500 p-0.5 shadow-premium"
                    >
                        <div className="w-full h-full rounded-[1.4rem] bg-black flex items-center justify-center overflow-hidden">
                            <span className="text-4xl animate-bounce-slow">✨</span>
                        </div>
                    </motion.div>
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute -top-2 -right-2 bg-white text-black text-[8px] font-black px-2 py-0.5 rounded-full shadow-premium uppercase"
                    >
                        LIVE
                    </motion.div>
                </div>

                <div className="flex-1 space-y-4">
                    <div className="space-y-1">
                        <h3 className="text-[10px] font-black text-apple-blue uppercase tracking-[0.4em]">Personal Assistant</h3>
                        <p className="text-sm font-medium text-white/80 leading-relaxed italic">"{message}"</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {!mood ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex flex-wrap justify-center sm:justify-start gap-3"
                            >
                                {moods.map((m) => (
                                    <button
                                        key={m.label}
                                        onClick={() => handleMoodSelect(m)}
                                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-xs flex items-center gap-2 group/btn active:scale-90"
                                    >
                                        <span>{m.emoji}</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover/btn:text-white">{m.label}</span>
                                    </button>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => { setMood(null); setMessage("How are you feeling now?") }}
                                className="text-[9px] font-black text-white/20 hover:text-white/60 uppercase tracking-widest flex items-center gap-2 transition-all"
                            >
                                <Utensils className="w-3 h-3" /> Change Vibe
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Micro-sparkles for interactivity */}
            {isHovered && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0, x: 100, y: 100 }}
                            animate={{
                                opacity: [0, 1, 0],
                                scale: [0, 1, 0],
                                x: Math.random() * 400,
                                y: Math.random() * 200
                            }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                            className="absolute text-yellow-500/40"
                        >
                            <Sparkles className="w-4 h-4" />
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    )
}
