'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LogOut, Eye, EyeOff, AlertCircle, ArrowLeft, Target, Zap, Activity, Filter, BarChart3 } from 'lucide-react'
import { MenuItem } from '@/lib/types'
import { subscribeToMenuItems, toggleMenuItemAvailability } from '@/lib/firebase/db'
import { useAuth } from '@/hooks/use-auth'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function KitchenManagePage() {
  const router = useRouter()
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
      return
    }

    if (authLoading || !user) {
      return
    }

    const unsubscribe = subscribeToMenuItems(
      (items) => {
        setMenuItems(items)
        setLoading(false)
      },
      (firebaseError) => {
        console.error('Menu subscription error:', firebaseError)
        setError(firebaseError.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [router, authLoading, user])

  const handleToggleAvailability = async (itemId: string) => {
    try {
      await toggleMenuItemAvailability(itemId)
    } catch (err) {
      console.error('Failed to toggle availability:', err)
      setError(err instanceof Error ? err.message : 'Failed to update item availability')
    }
  }

  const handleLogout = async () => {
    localStorage.removeItem('user')
    await signOut()
    router.push('/')
  }

  const categories = Array.from(new Set(menuItems.map((item) => item.category)))
  const filteredItems = filterCategory ? menuItems.filter((item) => item.category === filterCategory) : menuItems

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-6">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-12 h-12 border-2 border-white/10 border-t-white rounded-full"
        />
        <p className="text-[10px] font-black text-white/30 tracking-[0.4em] uppercase">Accessing Tactical Menu</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/10 no-scrollbar relative">

      {/* Sleek Floating Header */}
      <header className={cn(
        "fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 w-[calc(100%-2rem)] max-w-7xl",
        isScrolled ? "top-4" : "top-6"
      )}>
        <div className={cn(
          "glass-panel rounded-[2rem] px-8 py-4 flex items-center justify-between transition-all duration-700",
          isScrolled ? "bg-black/60 backdrop-blur-3xl shadow-premium border-white/10" : "bg-transparent border-transparent px-4"
        )}>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/kitchen')}
                className="w-10 h-10 rounded-xl hover:bg-white/5 transition-all flex items-center justify-center border border-transparent hover:border-white/10"
              >
                <ArrowLeft className="w-5 h-5 text-white/40" />
              </button>
              <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-premium group">
                <Zap className="w-6 h-6 text-black group-hover:scale-110 transition-transform" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-[11px] font-black tracking-[0.4em] uppercase leading-none text-white/90">MENU CONSOLE</h1>
                <p className="text-[9px] font-bold text-white/30 mt-1.5 uppercase tracking-widest">TACTICAL OVERRIDE</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={() => router.push('/customer')} variant="ghost" className="h-11 px-5 bg-apple-blue/10 hover:bg-apple-blue/20 text-apple-blue transition-all rounded-2xl text-[9px] font-black tracking-widest sm:flex hidden">
              CUSTOMER PORTAL
            </Button>
            <div className="h-8 w-[1px] bg-white/10 mx-2 hidden sm:block" />
            <Button onClick={handleLogout} variant="ghost" className="h-11 w-11 hover:bg-white/5 rounded-2xl text-white/30 hover:text-white">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto pt-36 px-4 md:px-8 pb-20">
        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <Alert className="bg-tesla-red/10 border-tesla-red/20 text-tesla-red rounded-[1.5rem] py-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs font-black uppercase tracking-widest">{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tactical Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="glass-panel border-white/5 rounded-[2rem] p-8 shadow-premium overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-[50px] -z-10" />
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">ONLINE UNITS</p>
            <h3 className="text-5xl font-black text-white italic tracking-tighter">
              {menuItems.filter((i) => i.available).length}
            </h3>
          </Card>
          <Card className="glass-panel border-white/5 rounded-[2rem] p-8 shadow-premium overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-tesla-red/5 blur-[50px] -z-10" />
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">SUSPENDED UNITS</p>
            <h3 className="text-5xl font-black text-tesla-red italic tracking-tighter">
              {menuItems.filter((i) => !i.available).length}
            </h3>
          </Card>
          <Card className="glass-panel border-white/5 rounded-[2rem] p-8 shadow-premium overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-apple-blue/5 blur-[50px] -z-10" />
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">TOTAL CAPACITY</p>
            <h3 className="text-5xl font-black text-apple-blue italic tracking-tighter">
              {menuItems.length}
            </h3>
          </Card>
        </div>

        {/* Category Filtration */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <Filter className="w-4 h-4 text-white/40" />
            </div>
            <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Subsystem Filtration</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setFilterCategory(null)}
              variant="ghost"
              className={cn(
                "h-11 px-6 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all",
                filterCategory === null
                  ? "bg-white text-black shadow-premium"
                  : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
              )}
            >
              All Systems
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => setFilterCategory(category)}
                variant="ghost"
                className={cn(
                  "h-11 px-6 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all",
                  filterCategory === category
                    ? "bg-white text-black shadow-premium"
                    : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                )}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Tactical Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card
                  className={cn(
                    "glass-card rounded-[2.5rem] p-8 border-white/5 shadow-premium overflow-hidden relative group",
                    !item.available && "opacity-60 grayscale border-tesla-red/20 shadow-[0_0_30px_rgba(232,23,30,0.1)]"
                  )}
                >
                  <div className="flex flex-col gap-8 relative z-10">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{item.category}</span>
                        <h4 className="text-2xl font-black italic tracking-tighter text-white uppercase leading-none">{item.name}</h4>
                        <p className="text-xl font-bold text-white/60 tracking-tighter italic">₹{item.price}</p>
                      </div>
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                        item.available ? "bg-green-500/10 text-green-500" : "bg-tesla-red/10 text-tesla-red"
                      )}>
                        {item.available ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-white/10 uppercase tracking-widest mb-1.5">UNIT STATUS</span>
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest",
                          item.available ? "text-green-500" : "text-tesla-red"
                        )}>
                          {item.available ? "Ready for Deployment" : "Suspended"}
                        </span>
                      </div>
                      <Button
                        onClick={() => handleToggleAvailability(item.id)}
                        variant="ghost"
                        className={cn(
                          "h-12 px-6 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95",
                          item.available
                            ? "bg-tesla-red/5 text-tesla-red border-tesla-red/10 hover:bg-tesla-red hover:text-white"
                            : "bg-green-500/5 text-green-500 border-green-500/10 hover:bg-green-500 hover:text-white"
                        )}
                      >
                        {item.available ? "SUSPEND" : "RESTORE"}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
