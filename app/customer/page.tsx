"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ShoppingCart, LogOut, Sparkles, Clock, TrendingUp, Search, Plus } from "lucide-react"
import { ProductMenu } from "@/components/customer/product-menu"
import { CartDrawer } from "@/components/customer/cart-drawer"
import { CrowdStatusCard } from "@/components/customer/crowd-status-card"
import { RushWarningBanner } from "@/components/customer/rush-warning-banner"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/contexts/cart-context"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export default function CustomerPage() {
  const router = useRouter()
  const { user, userProfile, loading, signOut } = useAuth()
  const { cart, addToCart, removeFromCart, cartTotal, clearCart } = useCart()
  const [showOrder, setShowOrder] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    console.log('📱 CustomerPage mounted')
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Removed redundant scroll to top effect that was causing jumps on state changes

  useEffect(() => {
    console.log('🔐 Auth state:', { loading, user: !!user, userProfile: !!userProfile, mounted })
    const userData = localStorage.getItem("user")
    if (!loading && !user && !userData) {
      console.log('🔄 Redirecting to home - not authenticated')
      router.replace("/")
      return
    }
  }, [user, loading, router, userProfile, mounted])

  const handleLogout = async () => {
    localStorage.removeItem("user")
    clearCart()
    await signOut()
    router.replace("/")
  }

  if (!mounted || loading) {
    return (
      <div className="fixed inset-0 bg-background z-[100] flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-12 h-12 border-2 border-white/10 border-t-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.1)]"
        />
        <div className="absolute bottom-12 text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Establishing Neural Sync</div>
      </div>
    )
  }

  const userName = userProfile?.displayName || user?.displayName || "Guest"
  const firstName = userName.split(' ')[0]
  const userPhoto = user?.photoURL

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 17) return "Good Afternoon"
    return "Good Evening"
  }



  return (
    <div className="bg-background selection:bg-white/10 relative">

      {/* Sleek Floating Header */}
      <header className={cn(
        "fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 w-[calc(100%-2rem)] max-w-5xl",
        isScrolled ? "top-4" : "top-6"
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
                />
              </div>
              <span className="text-label-sm font-black text-white/90 hidden sm:block tracking-widest">KURO.</span>
            </motion.div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <CartDrawer trigger={
              <Button variant="ghost" size="icon" className="relative text-white/60 hover:text-white group bg-white/5 rounded-xl border border-white/5">
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
            } />

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
      <main className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Dashboard Header - Simplified Structure */}
          <div className="space-y-12">
            {/* Unified Hero Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Immersive Greeting */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="lg:col-span-7 relative"
              >
                <div className="absolute -left-6 top-2 w-1.5 h-32 bg-apple-blue shadow-[0_0_30px_rgba(0,122,255,0.6)] rounded-full hidden sm:block" />
                <div className="sm:pl-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-2 rounded-full bg-apple-blue animate-pulse" />
                    <span className="text-label-xs font-black text-white/30 uppercase tracking-[0.5em]">Sector 7 Access Active</span>
                  </div>
                  <h2 className="text-6xl sm:text-8xl font-black tracking-tighter text-white uppercase leading-[0.85] mb-8">
                    <span className="text-white/20">{greeting()},</span> <br />
                    <span className="text-gradient inline-block mt-2">{firstName}</span>
                  </h2>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3 px-5 py-3 bg-white/[0.03] border border-white/10 rounded-2xl shadow-premium backdrop-blur-md">
                      <Clock className="w-4 h-4 text-apple-blue" />
                      <span className="text-xs font-black text-white/60 tracking-widest">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="lg:col-span-5"
              >
                <CrowdStatusCard />
              </motion.div>
            </div>

            {/* Dashboard Briefing Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="glass-card rounded-[2rem] p-8 border-white/5 shadow-premium group hover:bg-white/[0.03] transition-all"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-apple-blue/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-apple-blue" />
                  </div>
                  <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">DAILY PERFORMANCE</h4>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-black text-white italic tracking-tighter">98% OPTIMAL</p>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-relaxed">Fueling efficiency at peak levels. Minimal latency detected in metabolic sync.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="glass-card rounded-[2rem] p-8 border-white/5 shadow-premium group hover:bg-white/[0.03] transition-all"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-green-500" />
                  </div>
                  <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">ACTIVE MISSION</h4>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-black text-white italic tracking-tighter text-gradient">LUNCH OPS</p>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-relaxed">System ready for deployment. Menu modules calibrated for current timeframe.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="glass-card rounded-[2rem] p-8 border-white/5 shadow-premium group hover:bg-white/[0.03] transition-all lg:col-span-1 md:col-span-2 lg:hidden xl:block"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-tesla-red/10 flex items-center justify-center">
                    <LogOut className="w-5 h-5 text-tesla-red" />
                  </div>
                  <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">QUICK LOGOUT</h4>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest max-w-[140px]">Terminate current authorized session</p>
                  <Button onClick={handleLogout} variant="ghost" className="h-10 px-4 rounded-xl bg-tesla-red/5 hover:bg-tesla-red border border-tesla-red/20 text-tesla-red hover:text-white transition-all text-[9px] font-black tracking-widest">DISCONNECT</Button>
                </div>
              </motion.div>
            </div>

            {/* Intelligence Layer */}
            <div className="grid grid-cols-1 gap-6">
              <RushWarningBanner />
            </div>

            {/* AI Meal Planner Card - Re-engineered */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <button
                onClick={() => router.push('/customer/meal-planner')}
                className="w-full text-left group relative overflow-hidden glass-card rounded-[3rem] p-8 sm:p-14 transition-all duration-700 hover:ring-1 hover:ring-white/20 shadow-premium"
              >
                <div className="absolute inset-0 bg-radial-at-tr from-apple-blue/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-apple-blue/10 blur-[100px] -z-10 translate-x-1/2 translate-y-1/2 group-hover:translate-x-1/4 group-hover:translate-y-1/4 transition-transform duration-1000" />

                <div className="flex flex-col sm:flex-row items-start justify-between gap-12 relative z-10">
                  <div className="flex-1 space-y-8">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-white shadow-premium flex items-center justify-center text-black group-hover:rotate-[15deg] transition-transform duration-700">
                        <Sparkles className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="flex items-center gap-4">
                          <h3 className="text-4xl font-black text-white uppercase tracking-tighter">AI NAVIGATOR</h3>
                          <span className="px-3 py-1 text-[9px] font-black bg-apple-blue text-white rounded-md uppercase tracking-[0.2em]">S-CLASS AI</span>
                        </div>
                        <p className="text-white/30 font-bold text-xs tracking-[0.4em] uppercase mt-1">Core Neural Engine: GEMINI 3.0</p>
                      </div>
                    </div>

                    <p className="text-2xl text-white/60 font-medium leading-relaxed max-w-2xl italic tracking-tight">
                      "Precision fueling engineered for the modern operative. Calibrate your nutritional mission with predictive AI intelligence."
                    </p>

                    <div className="flex flex-wrap gap-3">
                      {['5-DAY STREAK', 'HP MODE ACTIVE', 'ENERGY CRITICAL', 'METABOLIC SYNC'].map(tag => (
                        <div key={tag} className="px-5 py-2 text-[10px] font-black bg-white/5 border border-white/5 rounded-xl text-white/30 group-hover:text-white/90 group-hover:border-white/20 group-hover:bg-white/10 transition-all tracking-widest">
                          {tag}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="hidden md:block">
                    <div className="w-48 h-48 rounded-full border border-white/5 flex items-center justify-center relative">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-2 border-t-2 border-apple-blue/40 rounded-full"
                      />
                      <Sparkles className="w-16 h-16 text-white/10 group-hover:text-white/40 transition-colors duration-500" />
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-label-sm font-black text-white/20 tracking-[0.5em] uppercase">Selection Protocol</h2>
              <div className="h-[1px] flex-1 bg-white/5 mx-8" />
              <Button variant="ghost" size="sm" className="text-label-xs text-white/40 hover:text-white uppercase tracking-widest">View Grid</Button>
            </div>
            <ProductMenu onAddToCart={addToCart} />
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
