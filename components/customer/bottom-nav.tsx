'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Home, Sparkles, ShoppingBag, User } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function BottomNav() {
    const router = useRouter()
    const pathname = usePathname()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const navItems = [
        { name: 'HOME', icon: Home, path: '/customer' },
        { name: 'AI PLAN', icon: Sparkles, path: '/customer/meal-planner' },
        { name: 'ORDERS', icon: ShoppingBag, path: '/customer/orders' }, // Assume /customer/orders for history
        { name: 'PROFILE', icon: '/customer/profile', path: '/customer/profile' },
    ]

    // Filter out any weird paths or fix names
    const items = [
        { id: 'home', label: 'HOME', icon: Home, path: '/customer' },
        { id: 'ai', label: 'AI PLAN', icon: Sparkles, path: '/customer/meal-planner' },
        { id: 'orders', label: 'ORDERS', icon: ShoppingBag, path: '/customer/orders' }, // Placeholder for order history
        { id: 'profile', label: 'PROFILE', icon: User, path: '/customer/profile' },
    ]

    if (!mounted) return null

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed bottom-8 left-0 right-0 z-50 px-8 md:hidden pointer-events-none"
        >
            <div className="max-w-md mx-auto w-full h-20 glass-panel border-white/10 rounded-[2.5rem] shadow-premium flex items-center justify-around px-4 pointer-events-auto relative overflow-hidden">
                {/* Tactical background detail */}
                <div className="absolute inset-0 bg-radial-at-t from-white/[0.05] via-transparent to-transparent opacity-50" />

                {items.map((item) => {
                    const isActive = pathname === item.path || (pathname?.startsWith(item.path) && item.path !== '/customer')

                    return (
                        <button
                            key={item.id}
                            onClick={() => router.push(item.path)}
                            className="relative flex flex-col items-center justify-center w-full h-full group"
                        >
                            <motion.div
                                animate={isActive ? { scale: 1.15, y: -4 } : { scale: 1, y: 0 }}
                                className={cn(
                                    "flex items-center justify-center transition-all duration-500",
                                    isActive ? "text-white" : "text-white/20 group-hover:text-white/40"
                                )}
                            >
                                <item.icon className={cn(
                                    "w-6 h-6 transition-all duration-500",
                                    isActive && "drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]"
                                )} />
                            </motion.div>

                            <span className={cn(
                                "text-[7px] font-black tracking-[0.3em] uppercase mt-2 transition-all duration-500 leading-none",
                                isActive ? "text-white opacity-100" : "text-white/20 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2"
                            )}>
                                {item.label}
                            </span>

                            {isActive && (
                                <motion.div
                                    layoutId="activeTabGlow"
                                    className="absolute -bottom-8 w-12 h-12 bg-white/20 blur-2xl rounded-full"
                                />
                            )}
                        </button>
                    )
                })}
            </div>
        </motion.div>
    )
}
