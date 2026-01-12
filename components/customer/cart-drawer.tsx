'use client'

import { useState } from 'react'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { ShoppingBag, ChevronRight, ShoppingCart } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { OrderSummary } from '@/components/customer/order-summary'
import { useAuth } from '@/hooks/use-auth'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CartDrawerProps {
    trigger?: React.ReactNode
    isOpen?: boolean
    onClose?: () => void
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const { cart, cartTotal, removeFromCart, isDrawerOpen, setIsDrawerOpen } = useCart()
    const { user } = useAuth()
    const [showOrder, setShowOrder] = useState(false)

    const isSheetOpen = isOpen !== undefined ? isOpen : isDrawerOpen
    const handleOpenChange = (open: boolean) => {
        setIsDrawerOpen(open)
        if (onClose && !open) onClose()
        if (!open) setShowOrder(false)
    }

    const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0)

    return (
        <Sheet open={isSheetOpen} onOpenChange={handleOpenChange}>

            <SheetContent
                side="right"
                className="w-full sm:max-w-lg bg-black/95 backdrop-blur-3xl border-l border-white/10 p-0 overflow-hidden flex flex-col shadow-premium"
            >
                {/* Apple-style top glow */}
                <div className="absolute inset-x-0 top-0 h-[1px] bg-linear-to-r from-transparent via-white/20 to-transparent" />

                <div className="flex-1 overflow-y-auto p-10 scrollbar-none">
                    <AnimatePresence mode="wait">
                        {!showOrder ? (
                            <motion.div
                                key="cart-view"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-12"
                            >
                                <SheetHeader className="p-0 border-none space-y-2">
                                    <div className="flex items-center gap-3 text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-apple-blue animate-pulse" />
                                        Shopping Cart
                                    </div>
                                    <SheetTitle className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
                                        Your Cart
                                    </SheetTitle>
                                    <SheetDescription className="sr-only">
                                        Review your selected items and proceed to checkout
                                    </SheetDescription>
                                </SheetHeader>

                                {cart.length === 0 ? (
                                    <div className="py-24 flex flex-col items-center justify-center text-center space-y-8">
                                        <div className="w-24 h-24 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-center relative group">
                                            <div className="absolute inset-4 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-colors" />
                                            <ShoppingBag className="w-10 h-10 text-white/10 relative z-10" />
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-sm font-black text-white/40 uppercase tracking-[0.2em]">Cart is Empty</p>
                                            <p className="text-[10px] text-white/20 font-black uppercase tracking-widest max-w-[200px] leading-relaxed">Browse our menu to add items to your cart</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            {cart.map((item) => (
                                                <motion.div
                                                    key={item.id}
                                                    layout
                                                    className="flex items-center justify-between p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/[0.05] group hover:bg-white/[0.05] transition-all"
                                                >
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-black text-white uppercase tracking-tight text-white/90">{item.name}</h4>
                                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-1.5">
                                                            Qty: {item.quantity} × ₹{item.price}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-base font-black text-white tracking-tighter">₹{item.price * item.quantity}</p>
                                                        <button
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="text-[9px] font-black text-tesla-red uppercase tracking-[0.3em] mt-2 opacity-0 group-hover:opacity-100 transition-all hover:scale-105 active:scale-95"
                                                        >
                                                            REMOVE
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>

                                        <div className="pt-8 border-t border-white/5">
                                            <div className="flex justify-between items-end">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Subtotal</span>
                                                    <p className="text-[9px] font-black text-white/10 uppercase tracking-widest">Excl. Fees</p>
                                                </div>
                                                <span className="text-5xl font-black text-white tracking-tighter text-gradient leading-none">₹{cartTotal}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="checkout-view"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full pt-2"
                            >
                                <OrderSummary
                                    cart={cart}
                                    total={cartTotal}
                                    user={user}
                                    onBack={() => setShowOrder(false)}
                                    onRemoveItem={removeFromCart}
                                    variant="plain"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {cart.length > 0 && !showOrder && (
                    <div className="p-8 pb-12 bg-black/40 backdrop-blur-xl border-t border-white/10">
                        <Button
                            onClick={() => setShowOrder(true)}
                            className="w-full h-16 bg-white text-black hover:bg-white/90 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.3em] shadow-premium active:scale-95 transition-all group border-none"
                        >
                            INITIATE CHECKOUT
                            <ChevronRight className="ml-3 w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}
