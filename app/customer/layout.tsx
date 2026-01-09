'use client'

import * as React from 'react'
import { BottomNav } from '@/components/customer/bottom-nav'
import { CartDrawer } from '@/components/customer/cart-drawer'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function CustomerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { cart } = useCart()
    const pathname = usePathname()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0)

    // Don't show floating cart/nav on specific pages to avoid clutter
    const isMissionPage = pathname.includes('/order/') || pathname.includes('/meal-planner')
    const showNav = !isMissionPage

    if (!mounted) return null

    return (
        <div className="relative min-h-screen">
            <main className="pb-20 md:pb-0">
                {children}
            </main>

            {showNav && (
                <>
                    <BottomNav />

                    {/* Global Floating Cart Button (Mobile) */}
                    <div className="fixed bottom-24 right-6 z-40 md:hidden">
                        <CartDrawer trigger={
                            <button className="relative w-14 h-14 bg-white rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center group active:scale-90 transition-transform">
                                <ShoppingBag className="w-6 h-6 text-black" />
                                <AnimatePresence>
                                    {itemCount > 0 && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-tesla-red border-2 border-black rounded-lg flex items-center justify-center text-[10px] font-black text-white"
                                        >
                                            {itemCount}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        } />
                    </div>
                </>
            )}
        </div>
    )
}
