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
    const { cart, isDrawerOpen, setIsDrawerOpen } = useCart()
    const pathname = usePathname()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
        console.log('🎨 CustomerLayout mounted')
    }, [])

    const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0)

    // Don't show floating cart/nav on specific pages to avoid clutter
    const isOrderPage = pathname.includes('/order/')
    const isMealPlanner = pathname.includes('/meal-planner')
    const showNav = !isOrderPage && !isMealPlanner && mounted
    return (
        <div className="relative min-h-screen">
            <main className="pb-40 md:pb-0">
                {children}
            </main>

            <CartDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

            {showNav && <BottomNav />}
        </div>
    )
}
