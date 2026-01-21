'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Home, Sparkles, ShoppingBag, User } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useCart } from '@/contexts/cart-context'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

export function BottomNav() {
    const router = useRouter()
    const pathname = usePathname()
    const { setIsDrawerOpen, cart } = useCart()
    const { user } = useAuth()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const items = [
        { id: 'home', icon: Home, path: '/customer' },
        { id: 'profile', icon: User, path: '/customer/profile' },
        { id: 'ai', icon: Sparkles, path: '/customer/meal-planner' },
        { id: 'cart', icon: ShoppingBag, path: 'cart' },
    ]

    if (!mounted) return null

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed bottom-6 left-0 right-0 z-50 px-4 sm:px-8 md:hidden pointer-events-none"
        >
            <div className="max-w-md mx-auto w-full h-16 sm:h-20 glass-panel border-white/10 rounded-[2rem] sm:rounded-[2.5rem] shadow-premium flex items-center justify-around px-2 sm:px-4 pointer-events-auto relative overflow-hidden">
                {/* Tactical background detail */}
                <div className="absolute inset-0 bg-radial-at-t from-white/[0.05] via-transparent to-transparent opacity-50" />

                {items.map((item) => {
                    const isActive = pathname === item.path || (pathname?.startsWith(item.path) && item.path !== '/customer')

                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (item.id === 'cart') {
                                    setIsDrawerOpen(true)
                                } else if ((item.id === 'profile' || item.id === 'ai') && !user) {
                                    // Show toast and redirect guests to login for protected pages
                                    const message = item.id === 'profile'
                                        ? 'Please sign in to access your profile and order history.'
                                        : 'Please sign in to use the AI Meal Planner.'

                                    toast.error('Login Required', {
                                        description: message,
                                        duration: 3000,
                                    })
                                    setTimeout(() => router.push('/'), 500)
                                } else {
                                    router.push(item.path)
                                }
                            }}
                            className="relative flex flex-col items-center justify-center w-full h-full group"
                        >
                            <motion.div
                                animate={isActive ? { scale: 1.15, y: -2 } : { scale: 1, y: 0 }}
                                className={cn(
                                    "relative flex items-center justify-center transition-all duration-500",
                                    isActive ? "text-white" : "text-white/20 group-hover:text-white/40"
                                )}
                            >
                                <item.icon className={cn(
                                    "w-6 h-6 sm:w-7 h-7 transition-all duration-500",
                                    isActive && "drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]"
                                )} />
                                {item.id === 'cart' && cart.length > 0 && (
                                    <motion.div
                                        key="cart-count"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                                        className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-white text-black text-[9px] font-black rounded-full flex items-center justify-center border-2 border-black"
                                    >
                                        <motion.span
                                            key={cart.length}
                                            initial={{ y: 5 }}
                                            animate={{ y: 0 }}
                                        >
                                            {cart.reduce((acc, i) => acc + i.quantity, 0)}
                                        </motion.span>
                                    </motion.div>
                                )}
                            </motion.div>

                            {isActive && (
                                <motion.div
                                    layoutId="activeTabDot"
                                    className="absolute bottom-2 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                                />
                            )}
                        </button>
                    )
                })}
            </div>
        </motion.div >
    )
}
