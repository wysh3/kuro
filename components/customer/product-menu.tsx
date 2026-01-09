'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, AlertCircle, TrendingUp, Clock } from 'lucide-react'
import { MenuItem } from '@/lib/types'
import { subscribeToMenuItems } from '@/lib/firebase/db'
import { motion, AnimatePresence } from 'framer-motion'
import { ProductDetailDialog } from './product-detail-dialog'
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

interface ProductMenuProps {
  onAddToCart: (product: Product) => void
}

export function ProductMenu({ onAddToCart }: ProductMenuProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = subscribeToMenuItems(
      (menuItems) => {
        const transformedProducts: Product[] = menuItems.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          price: item.price,
          category: item.category,
          image: item.image || '/placeholder.svg',
          available: item.available,
          prepTime: item.prepTime,
        }))
        setProducts(transformedProducts)
        setLoading(false)
      },
      (firebaseError) => {
        console.error('Menu subscription error:', firebaseError)
        setError(firebaseError.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const categories = Array.from(new Set(products.map((p) => p.category)))
  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products

  // Smooth scroll to top of menu when category changes
  useEffect(() => {
    if (selectedCategory !== undefined) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedCategory])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <Skeleton className="h-32 w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-3" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Category Filter - Precision sticky position */}
      <div className="sticky top-[88px] z-30 w-full transition-all duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-panel border-white/5 rounded-2xl p-2 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-premium">
            <Button
              onClick={() => setSelectedCategory(null)}
              size="sm"
              className={cn(
                "rounded-xl px-6 h-10 whitespace-nowrap transition-all duration-500 text-[10px] font-black tracking-widest uppercase border-none",
                selectedCategory === null
                  ? "bg-white text-black shadow-premium scale-100"
                  : "bg-transparent text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              ALL MODULES
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                size="sm"
                className={cn(
                  "rounded-xl px-6 h-10 whitespace-nowrap transition-all duration-500 text-[10px] font-black tracking-widest uppercase border-none",
                  selectedCategory === category
                    ? "bg-white text-black shadow-premium scale-100"
                    : "bg-transparent text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="popLayout">
          {filteredProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-32 border border-dashed border-white/5 rounded-3xl"
            >
              <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em]">No modules available in this cluster</p>
            </motion.div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    delay: index * 0.05
                  }}
                >
                  <Card
                    onClick={() => {
                      setSelectedProduct(product)
                      setIsDetailOpen(true)
                    }}
                    className={cn(
                      "group relative overflow-hidden glass-card rounded-[2.5rem] border-white/5 hover:border-white/20 transition-all duration-700 cursor-pointer h-full flex flex-col",
                      !product.available && "opacity-40 grayscale"
                    )}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden m-2 rounded-[2rem]">
                      {product.image ? (
                        <motion.img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-white/5 animate-pulse" />
                      )}

                      {/* Floating Badge */}
                      <div className="absolute top-4 left-4 flex gap-2">
                        {product.available ? (
                          <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                            <span className="text-[8px] font-black text-white/80 tracking-widest uppercase">READY</span>
                          </div>
                        ) : (
                          <div className="px-3 py-1 bg-tesla-red/20 backdrop-blur-md rounded-full border border-tesla-red/20">
                            <span className="text-[8px] font-black text-tesla-red tracking-widest uppercase">DEPLETED</span>
                          </div>
                        )}
                      </div>

                      {/* Overlays */}
                      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-60" />
                    </div>

                    <CardContent className="p-6 flex-1 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-tight group-hover:text-apple-blue transition-colors duration-500">
                            {product.name}
                          </h3>
                        </div>

                        <p className="text-white/40 text-xs font-medium line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-white/20" />
                            <span className="text-[9px] font-black text-white/40 tracking-widest uppercase">{product.prepTime} MIN</span>
                          </div>
                          <div className="w-[1px] h-3 bg-white/10" />
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5 text-apple-blue/40" />
                            <span className="text-[9px] font-black text-white/40 tracking-widest uppercase">POPULAR</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Price Module</span>
                          <span className="text-3xl font-black text-white tracking-tighter">₹{product.price}</span>
                        </div>

                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            product.available && onAddToCart(product)
                          }}
                          size="icon"
                          disabled={!product.available}
                          className={cn(
                            "w-14 h-14 rounded-2xl transition-all duration-500 border-none group-active:scale-90",
                            product.available
                              ? "bg-white text-black hover:bg-apple-blue hover:text-white shadow-premium"
                              : "bg-white/5 text-white/20"
                          )}
                        >
                          <Plus className="w-6 h-6" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ProductDetailDialog
        product={selectedProduct}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onAddToCart={onAddToCart}
      />
    </div>
  )
}
