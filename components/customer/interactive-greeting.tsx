'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface InteractiveGreetingProps {
    firstName: string
}

export function InteractiveGreeting({ firstName }: InteractiveGreetingProps) {
    const [greeting, setGreeting] = useState('')
    const [index, setIndex] = useState(0)
    const [displayText, setDisplayText] = useState('')
    const [isTyping, setIsTyping] = useState(true)

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return "Good Morning"
        if (hour < 17) return "Good Afternoon"
        return "Good Evening"
    }

    const baseGreeting = getGreeting()
    const hour = new Date().getHours()
    const phrases = useMemo(() => [
        `${baseGreeting},`,
        "System online,",
        "Ready to fuel up?",
        hour < 11 ? "Morning fuel requested?" : hour < 15 ? "Lunch protocol active," : "Evening modules ready,",
        "Neural link established,",
        "What's on the menu today?",
        "Optimizing your experience,",
        `Welcome back, ${firstName},`,
    ], [baseGreeting, hour, firstName])

    useEffect(() => {
        let currentText = ''
        let charIndex = 0
        const targetText = phrases[index]

        setIsTyping(true)

        const typingInterval = setInterval(() => {
            if (charIndex < targetText.length) {
                currentText += targetText[charIndex]
                setDisplayText(currentText)
                charIndex++
            } else {
                clearInterval(typingInterval)
                setIsTyping(false)

                // Wait then move to next
                setTimeout(() => {
                    setIndex((prev) => (prev + 1) % phrases.length)
                }, 4000)
            }
        }, 50)

        return () => clearInterval(typingInterval)
    }, [index, baseGreeting])

    return (
        <div className="relative min-h-[1.2em]">
            <motion.span
                key={index}
                initial={{ opacity: 1 }}
                className="text-white/20 block"
            >
                {displayText}
                {isTyping && (
                    <motion.span
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="inline-block w-[3px] h-[0.8em] bg-apple-blue ml-1 align-middle"
                    />
                )}
            </motion.span>
        </div>
    )
}
