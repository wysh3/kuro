'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Coffee, Flame, Users, Heart } from 'lucide-react'

export function CampusBuzz() {
    const buzzItems = [
        { icon: <Coffee className="w-4 h-4" />, text: "Double-shot espresso is the current meta.", color: "text-orange-500" },
        { icon: <Flame className="w-4 h-4" />, text: "The Spicy Ramen is trending high.", color: "text-red-500" },
        { icon: <Users className="w-4 h-4" />, text: "Canteen garden is perfectly sunny right now.", color: "text-apple-blue" },
        { icon: <Heart className="w-4 h-4" />, text: "Chef says the cookies are fresh out of the oven!", color: "text-pink-500" },
        { icon: <Flame className="w-4 h-4" />, text: "Rush hour avoided. Great time to order!", color: "text-green-500" },
    ]

    const [index, setIndex] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % buzzItems.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className="h-8 overflow-hidden bg-white/5 backdrop-blur-md rounded-full px-6 flex items-center border border-white/5">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mr-4 border-r border-white/10 pr-4">Campus Buzz</span>
            <div className="relative flex-1">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={index}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="flex items-center gap-3"
                    >
                        <span className={buzzItems[index].color}>{buzzItems[index].icon}</span>
                        <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">
                            {buzzItems[index].text}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="flex gap-1 ml-4">
                {buzzItems.map((_, i) => (
                    <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${i === index ? 'bg-apple-blue w-4' : 'bg-white/10'}`}
                    />
                ))}
            </div>
        </div>
    )
}
