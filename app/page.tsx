"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { motion } from "framer-motion"
import { Target, Zap, Shield, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const router = useRouter()
  const { user, userProfile, loading, signInWithGoogle } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [authLoading, setAuthLoading] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const guestUser = localStorage.getItem("user")
    console.log('🏠 Login page - Auth state:', { loading, user: !!user, userProfile: !!userProfile, guestUser: !!guestUser, mounted })

    // Check for Firebase user
    if (mounted && !loading && user && userProfile) {
      console.log('🚀 Redirecting to customer page (Firebase)')
      router.replace("/customer")
      return
    }

    // Check for Guest user
    if (mounted && !loading && !user && guestUser) {
      console.log('🚀 Redirecting to customer page (Guest)')
      router.replace("/customer")
      return
    }
  }, [user, userProfile, loading, router, mounted])

  const handleGoogleLogin = async () => {
    setAuthLoading("google")
    try {
      await signInWithGoogle()
    } catch (error: any) {
      console.error("Google login failed:", error)
      alert(error.message || "Failed to sign in with Google")
    } finally {
      setAuthLoading(null)
    }
  }

  const handleGuestLogin = () => {
    setAuthLoading("guest")
    try {
      const guestId = "guest_" + Math.random().toString(36).substr(2, 9)
      const guestUser = {
        id: guestId,
        email: null,
        name: "Guest",
        type: "guest",
      }
      localStorage.setItem("user", JSON.stringify(guestUser))
      router.replace("/customer")
    } catch (error) {
      console.error("Guest login failed:", error)
    } finally {
      setAuthLoading(null)
    }
  }

  const handleKitchenAccess = () => {
    if (!user) {
      alert("Please sign in first")
      return
    }
    router.push("/kitchen")
  }

  const isRedirecting = (user && userProfile) || (typeof window !== 'undefined' && localStorage.getItem("user"))

  if (!mounted || loading || isRedirecting) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-12 h-12 border-2 border-white/10 border-t-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.1)]"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black p-6 selection:bg-white/10 relative overflow-hidden">

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-full max-w-sm space-y-16 relative z-10"
      >
        {/* Apple-style Logo & Header */}
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            className="relative inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white shadow-premium mx-auto overflow-hidden p-2"
          >
            <Image
              src="/logo.png"
              alt="KURO Logo"
              fill
              className="object-contain"
              priority
            />
          </motion.div>
          <div className="space-y-4">
            <h1 className="text-6xl font-black tracking-tighter text-white uppercase leading-none">
              PROJECT <span className="text-gradient">KURO.</span>
            </h1>
            <p className="text-[10px] font-black text-white/30 tracking-[0.4em] uppercase">High Performance Ops</p>
          </div>
        </div>

        {/* Action Interface */}
        <div className="space-y-6">
          {/* Customer Login */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="glass-panel rounded-[2.5rem] p-8 space-y-6 shadow-premium group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-apple-blue/10 flex items-center justify-center border border-apple-blue/20">
                  <Zap className="w-5 h-5 text-apple-blue" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-widest leading-none">INITIATE MISSION</h2>
                  <p className="text-[10px] text-white/30 mt-1.5 uppercase font-bold tracking-widest">Customer Protocol</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  onClick={handleGoogleLogin}
                  disabled={authLoading !== null}
                  className="w-full h-14 bg-white text-black hover:bg-white/90 rounded-[1.2rem] text-xs font-black tracking-widest uppercase shadow-premium transition-all active:scale-95 border-none"
                >
                  {authLoading === "google" ? "AUTHENTICATING..." : "CONTINUE WITH GOOGLE"}
                </Button>
                <Button
                  onClick={handleGuestLogin}
                  disabled={authLoading !== null}
                  variant="ghost"
                  className="w-full h-12 text-[10px] font-black tracking-[0.2em] text-white/30 hover:text-white uppercase transition-all rounded-[1.2rem]"
                >
                  GUEST ACCESS UNIT
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Kitchen Access */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={handleKitchenAccess}
              className="w-full group glass-card rounded-[1.5rem] p-5 flex items-center justify-between transition-all hover:bg-white/[0.05]"
            >
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-white/10 group-hover:border-white/20 transition-all">
                  <Shield className="w-4 h-4 text-white/40 group-hover:text-white/80" />
                </div>
                <div className="text-left">
                  <h3 className="text-[10px] font-black text-white/40 group-hover:text-white/80 uppercase tracking-widest leading-none">MISSION CONTROL</h3>
                  <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-1">STAFF ONLY</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-white/40 group-hover:translate-x-1 transition-all" />
            </button>
          </motion.div>
        </div>

        {/* System Footer */}
        <div className="text-center space-y-6 pt-8">
          <div className="flex items-center justify-center gap-6">
            <div className="h-[1px] w-8 bg-white/10" />
            <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.5em]">
              SECURE MESH ACTIVE
            </p>
            <div className="h-[1px] w-8 bg-white/10" />
          </div>
        </div>
      </motion.div>

      {/* Decorative Lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-linear-to-r from-transparent via-white/[0.03] to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[1px] h-full bg-linear-to-b from-transparent via-white/[0.03] to-transparent" />
      </div>
    </div>
  )
}
