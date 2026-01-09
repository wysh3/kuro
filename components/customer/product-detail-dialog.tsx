'use client'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Clock, TrendingUp, ShieldCheck, Zap, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Product {
    id: string
    name: string
    description: string
    price: number
    category: string
    image: string
    available: boolean
    prepTime: number
}

interface ProductDetailDialogProps {
    product: Product | null
    isOpen: boolean
    onClose: () => void
    onAddToCart: (product: Product) => void
}

export function ProductDetailDialog({ product, isOpen, onClose, onAddToCart }: ProductDetailDialogProps) {
    if (!product) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] bg-black/80 backdrop-blur-3xl border-white/10 p-0 overflow-hidden rounded-[2.5rem] shadow-premium top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2">
                <div className="relative h-full flex flex-col">
                    <div className="relative h-[200px] sm:h-[240px] overflow-hidden group flex-shrink-0">
                        <motion.img
                            initial={{ scale: 1.1 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent" />
                        <div className="absolute inset-0 bg-radial-at-b from-black/60 via-transparent to-transparent" />

                        <div className="absolute top-4 left-4 flex gap-2">
                            <div className="px-3 py-1 rounded-lg bg-white text-black text-[7px] font-black uppercase tracking-[0.2em] shadow-premium">
                                {product.category}
                            </div>
                            <div className="px-3 py-1 rounded-lg bg-black/40 backdrop-blur-xl border border-white/20 text-[7px] font-black uppercase tracking-[0.2em] text-white">
                                S-RANK
                            </div>
                        </div>

                        <div className="absolute bottom-4 left-4">
                            <DialogTitle className="text-2xl sm:text-3xl font-black text-white tracking-tighter uppercase leading-none drop-shadow-2xl">
                                {product.name}
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                                Details and specification for {product.name}
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="p-5 sm:p-6 space-y-5 sm:space-y-6 bg-linear-to-b from-transparent to-black/40 flex-1 flex flex-col justify-between">
                        <div className="space-y-5 sm:space-y-6">
                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                <div className="text-center p-2 rounded-xl glass-panel border-white/5">
                                    <Clock className="w-4 h-4 text-apple-blue mx-auto mb-1" />
                                    <p className="text-[8px] text-white/20 font-black uppercase tracking-wider">PREP</p>
                                    <p className="text-sm font-black text-white">{product.prepTime}M</p>
                                </div>
                                <div className="text-center p-2 rounded-xl glass-panel border-white/5">
                                    <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
                                    <p className="text-[8px] text-white/20 font-black uppercase tracking-wider">RATING</p>
                                    <p className="text-sm font-black text-white">98%</p>
                                </div>
                                <div className="text-center p-2 rounded-xl glass-panel border-white/5">
                                    <ShieldCheck className="w-4 h-4 text-white/40 mx-auto mb-1" />
                                    <p className="text-[8px] text-white/20 font-black uppercase tracking-wider">RANK</p>
                                    <p className="text-sm font-black text-white">S</p>
                                </div>
                            </div>

                            <p className="text-white/60 text-sm leading-relaxed font-medium italic">
                                "{product.description || "Precision engineered for maximum metabolic performance. Optimized for high-intensity operational windows."}"
                            </p>
                        </div>

                        <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5 flex-shrink-0">
                            <div>
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-wider block mb-1">COST</span>
                                <span className="text-3xl font-black text-white tracking-tighter italic">₹{product.price}</span>
                            </div>
                            <Button
                                onClick={() => {
                                    onAddToCart(product)
                                    onClose()
                                }}
                                disabled={!product.available}
                                className="h-12 px-6 sm:h-14 sm:px-8 bg-white text-black hover:bg-white/90 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-premium transition-all active:scale-95 group flex-shrink-0 border-none"
                            >
                                ADD TO ORDER
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}


