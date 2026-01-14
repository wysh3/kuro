"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ShoppingCart, Sparkles, Clock, TrendingUp, Search, Plus } from "lucide-react"
import { ProductMenu } from "@/components/customer/product-menu"
import { CrowdStatusCard } from "@/components/customer/crowd-status-card"
import { RushWarningBanner } from "@/components/customer/rush-warning-banner"
import { ActiveOrders } from "@/components/customer/active-orders"
import { InteractiveGreeting } from "@/components/customer/interactive-greeting"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/contexts/cart-context"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export default function CustomerPage() {
  const router = useRouter()
  const { user, userProfile, loading, signOut } = useAuth()
  const { cart, addToCart, removeFromCart, cartTotal, clearCart, setIsDrawerOpen } = useCart()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showHeader, setShowHeader] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Responsive default view mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 640
      setViewMode(isMobile ? 'list' : 'grid')
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    console.log('📱 CustomerPage mounted')
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setIsScrolled(currentScrollY > 20)

      // Hide header on scroll down, show on scroll up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowHeader(false)
      } else {
        setShowHeader(true)
      }
      setLastScrollY(currentScrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [lastScrollY])

  // Timer effect for currentTime
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    console.log('🔐 Auth state:', { loading, user: !!user, userProfile: !!userProfile, mounted })
    const userData = localStorage.getItem("user")
    if (!loading && !user && !userData) {
      console.log('🔄 Redirecting to home - not authenticated')
      router.replace("/")
      return
    }
  }, [user, loading, router, userProfile, mounted])

  if (!mounted || loading) {
    return (
      <div className="fixed inset-0 bg-background z-[100] flex items-center justify-center">
        <motion.div
          initial={{ rotate: 0, scale: 1 }}
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{
            rotate: { duration: 1, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="w-12 h-12 border-2 border-white/5 border-t-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.1)]"
        />
        <div className="absolute bottom-12 text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Establishing Neural Sync</div>
      </div>
    )
  }

  const userName = userProfile?.displayName || user?.displayName || "Guest"
  const firstName = userName.split(' ')[0]
  const userPhoto = user?.photoURL

  const greeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 17) return "Good Afternoon"
    return "Good Evening"
  }



  return (
    <div className="bg-background selection:bg-white/10 relative">

      {/* Sleek Floating Header */}
      <header className={cn(
        "fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 w-[calc(100%-2rem)] max-w-5xl",
        isScrolled ? "top-4 scale-[0.98]" : "top-6 scale-100",
        !showHeader && "-translate-y-32 opacity-0"
      )}>
        <div className={cn(
          "glass-panel rounded-2xl px-6 py-3 flex items-center justify-between transition-all duration-700",
          isScrolled ? "bg-black/40 backdrop-blur-3xl shadow-premium" : "bg-transparent border-transparent"
        )}>
          <div className="flex items-center gap-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => router.push('/customer')}
            >
              <div className="w-9 h-9 rounded-xl bg-white shadow-premium flex items-center justify-center overflow-hidden">
                <Image
                  src="/logo.png"
                  alt="KURO Logo"
                  width={36}
                  height={36}
                  className="object-cover scale-100"
                  loading="eager"
                />
              </div>
              <span className="text-label-sm font-black text-white/90 hidden sm:block tracking-widest">KURO.</span>
            </motion.div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              onClick={() => setIsDrawerOpen(true)}
              variant="ghost"
              size="icon"
              className="relative text-white/60 hover:text-white group bg-white/5 rounded-xl border border-white/5"
            >
              <motion.div
                key={cart.length}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.3 }}
              >
                <ShoppingCart className="w-4.5 h-4.5" />
              </motion.div>
              {cart.length > 0 && (
                <motion.div
                  initial={{ scale: 0, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-black text-[10px] font-black rounded-lg border-2 border-black flex items-center justify-center shadow-premium"
                >
                  {cart.reduce((acc, item) => acc + item.quantity, 0)}
                </motion.div>
              )}
            </Button>

            {userProfile?.kitchenStaff && (
              <Button
                onClick={() => router.push('/kitchen')}
                variant="ghost"
                className="h-10 px-4 bg-white/5 hover:bg-white/10 transition-all rounded-xl text-[9px] font-black tracking-widest sm:flex hidden border border-white/5"
              >
                KITCHEN CONSOLE
              </Button>
            )}

            <div className="h-4 w-[1px] bg-white/10 mx-1" />

            <Button
              onClick={() => router.push('/customer/profile')}
              variant="ghost"
              className="p-1 rounded-xl hover:bg-white/5 transition-all group"
            >
              <Avatar className="w-9 h-9 border border-white/10 group-hover:border-white/30 transition-all shadow-premium">
                <AvatarImage src={userPhoto || undefined} alt={userName} />
                <AvatarFallback className="bg-white/5 text-white text-xs font-black">{userName.charAt(0)}</AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
          {/* Dashboard Header - Immersive Landing Fold */}
          <div className="min-h-0 sm:min-h-[calc(100vh-14rem)] flex flex-col justify-center py-6 sm:py-12 space-y-8 sm:space-y-12">
            {/* Unified Hero Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Immersive Greeting */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="lg:col-span-7 relative"
              >
                <div className="sm:pl-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-2 rounded-full bg-apple-blue animate-pulse" />
                    <span className="text-label-xs font-black text-white/30 uppercase tracking-[0.5em]">Campus Dining Active</span>
                  </div>

                  <h2 className="text-3xl sm:text-7xl font-black tracking-tighter text-white uppercase leading-none mb-4 sm:mb-8 overflow-hidden">
                    <div className="flex flex-col items-start min-h-[2.2em] gap-0 sm:gap-1">
                      <div className="h-[1.1em] flex items-end">
                        <InteractiveGreeting firstName={firstName} />
                      </div>
                      <span className="text-gradient leading-none">{firstName}</span>
                    </div>
                  </h2>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3 px-5 py-3 bg-white/[0.03] border border-white/10 rounded-2xl shadow-premium backdrop-blur-md">
                      <Clock className="w-4 h-4 text-apple-blue" />
                      <span className="text-xs font-black text-white/60 tracking-widest">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 px-5 py-3 bg-white/[0.03] border border-white/10 rounded-2xl shadow-premium backdrop-blur-md">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-black text-white/60 tracking-widest uppercase">Connectivity: High</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Status Integration */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="lg:col-span-5"
              >
                <div className="scale-90 sm:scale-100 origin-left sm:origin-center">
                  <CrowdStatusCard />
                </div>
              </motion.div>
            </div>

            {/* Dashboard Briefing Row */}
            <div className="flex overflow-x-auto sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 scrollbar-none snap-x snap-mandatory pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="min-w-[75vw] sm:min-w-0 snap-center glass-card rounded-[2rem] p-5 sm:p-8 border-white/5 shadow-premium group hover:bg-white/[0.03] transition-all"
              >
                <div className="flex items-center gap-3 mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-apple-blue/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-apple-blue" />
                  </div>
                  <h4 className="text-[9px] sm:text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Kitchen Efficiency</h4>
                </div>
                <div className="space-y-1">
                  <p className="text-xl sm:text-3xl font-black text-white italic tracking-tighter">98% Faster</p>
                  <p className="text-[9px] sm:text-[10px] font-bold text-white/20 uppercase tracking-widest leading-relaxed">System operating at peak speed.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="min-w-[75vw] sm:min-w-0 snap-center glass-card rounded-[2rem] p-5 sm:p-8 border-white/5 shadow-premium group hover:bg-white/[0.03] transition-all"
              >
                <div className="flex items-center gap-3 mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  </div>
                  <h4 className="text-[9px] sm:text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Special</h4>
                </div>
                <div className="space-y-1">
                  <p className="text-xl sm:text-3xl font-black text-white italic tracking-tighter text-gradient">POKE BOWL</p>
                  <p className="text-[9px] sm:text-[10px] font-bold text-white/20 uppercase tracking-widest leading-relaxed">Fresh and healthy choice.</p>
                </div>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                onClick={() => router.push('/customer/meal-planner')}
                className="min-w-[75vw] sm:min-w-0 snap-center w-full text-left group relative overflow-hidden glass-card rounded-[2rem] p-5 sm:p-8 border-white/5 shadow-premium hover:bg-white/[0.03] transition-all"
              >
                <div className="absolute inset-0 bg-radial-at-tr from-apple-blue/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="flex items-center gap-3 mb-3 sm:mb-4 relative z-10">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-apple-blue/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-apple-blue" />
                  </div>
                  <div>
                    <h4 className="text-[9px] sm:text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">AI Planner</h4>
                  </div>
                </div>
                <div className="space-y-1 relative z-10">
                  <p className="text-xl sm:text-3xl font-black text-white italic tracking-tighter uppercase text-gradient">Smart Plan</p>
                  <p className="text-[9px] sm:text-[10px] font-bold text-white/20 uppercase tracking-widest leading-relaxed">Calibrated for your goals.</p>
                </div>
              </motion.button>
            </div>

            {/* Intelligence Layer */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              <RushWarningBanner />
            </div>
          </div>

          {/* Active Orders Section */}
          <ActiveOrders />

          <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-label-sm font-black text-white/20 tracking-[0.5em] uppercase">Selection Protocol</h2>
              <div className="h-[1px] flex-1 bg-white/5 mx-8" />
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "h-8 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300",
                    viewMode === 'grid' ? "bg-white text-black shadow-premium" : "text-white/40 hover:text-white"
                  )}
                >
                  GRID
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "h-8 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300",
                    viewMode === 'list' ? "bg-white text-black shadow-premium" : "text-white/40 hover:text-white"
                  )}
                >
                  LIST
                </Button>
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={viewMode}
                initial={{ opacity: 0, scale: 0.96, y: 15, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 1.02, y: -10, filter: "blur(8px)" }}
                transition={{
                  duration: 0.4,
                  ease: [0.23, 1, 0.32, 1], // "Snappier-Fluid" Physics
                }}
              >
                <ProductMenu onAddToCart={addToCart} viewMode={viewMode} isHeaderVisible={showHeader} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isScrolled ? 0 : 1, y: isScrolled ? 20 : 0 }}
        transition={{ duration: 0.5 }}
        className="fixed bottom-[15px] left-1/2 -translate-x-1/2 z-30 hidden md:flex flex-col items-center gap-3 pointer-events-none"
      >
        <div className="w-5 h-8 rounded-full border border-white/10 backdrop-blur-sm flex justify-center pt-2 shadow-[0_0_15px_rgba(255,255,255,0.02)]">
          <motion.div
            animate={{ y: [0, 6, 0], opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-0.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          />
        </div>
      </motion.div>
    </div>
  )
}
