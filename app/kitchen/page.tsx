"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle2, LogOut, Loader2, BarChart3, Zap, Target, Activity } from 'lucide-react'
import { useKitchenOrders } from '@/hooks/use-kitchen-orders'
import { Order, CampusStatus } from '@/lib/types'
import { convertTimestampToISO, subscribeToCampusStatus } from '@/lib/firebase/db'
import { useAuth } from '@/hooks/use-auth'
import { StatusOverrideModal } from '@/components/kitchen/status-override-modal'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function KitchenPage() {
  const router = useRouter()
  const { orders, loading, error, updateOrderStatus } = useKitchenOrders()
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [campusStatus, setCampusStatus] = useState<CampusStatus | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const unsubscribe = subscribeToCampusStatus(
      (status) => {
        setCampusStatus(status)
      },
      (error) => {
        console.error('Campus status subscription error:', error)
      }
    )

    return unsubscribe
  }, [])

  const handleLogout = async () => {
    localStorage.removeItem('user')
    await signOut()
    router.push('/')
  }

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus)
      if (newStatus === 'ready') {
        setNewOrderAlert(true)
        setTimeout(() => setNewOrderAlert(false), 3000)
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
    }
  }

  const preparingOrders = orders.filter((o) => o.status === 'kitchen_received' || o.status === 'preparing')
  const readyOrders = orders.filter((o) => o.status === 'ready')

  const formatTime = (timestamp: any): string => {
    if (!timestamp) return 'N/A'
    const isoString = convertTimestampToISO(timestamp)
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-6">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-12 h-12 border-2 border-white/10 border-t-white rounded-full"
        />
        <p className="text-[10px] font-black text-white/30 tracking-[0.4em] uppercase">Initializing Mission Control</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/10 no-scrollbar relative">

      {/* Sleek Floating Mission Header */}
      <header className={cn(
        "fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 w-[calc(100%-2rem)] max-w-7xl",
        isScrolled ? "top-4" : "top-6"
      )}>
        <div className={cn(
          "glass-panel rounded-[2rem] px-8 py-4 flex items-center justify-between transition-all duration-700",
          isScrolled ? "bg-black/60 backdrop-blur-3xl shadow-premium border-white/10" : "bg-transparent border-transparent px-4"
        )}>
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-premium group cursor-pointer" onClick={() => router.push('/kitchen')}>
                <Target className="w-6 h-6 text-black group-hover:scale-110 transition-transform" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-[11px] font-black tracking-[0.4em] uppercase leading-none text-white/90">MISSION CONTROL</h1>
                <p className="text-[9px] font-bold text-white/30 mt-1.5 uppercase tracking-widest">UNIT // MRC OPS</p>
              </div>
            </div>

            <div className="hidden xl:flex items-center gap-8 border-l border-white/10 pl-10 h-10">
              {campusStatus && (
                <div className="flex items-center gap-8">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1.5">UNIT LOAD</span>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full animate-pulse",
                        campusStatus.crowdLevel === 'low' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' :
                          campusStatus.crowdLevel === 'medium' ? 'bg-yellow-500 shadow-[0_0_10px_#eab308]' :
                            'bg-tesla-red shadow-[0_0_10px_#e8171e]'
                      )} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{campusStatus.crowdLevel}</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1.5">EST. WAIT</span>
                    <span className="text-[10px] font-black tracking-widest uppercase">{campusStatus.estimatedWait} MINS</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Button onClick={() => router.push('/kitchen/analytics')} variant="ghost" className="h-11 px-5 bg-white/5 hover:bg-white/10 transition-all rounded-2xl text-[9px] font-black tracking-widest sm:flex hidden">
                <BarChart3 className="w-4 h-4 mr-2" /> ANALYTICS
              </Button>
              <Button onClick={() => router.push('/kitchen/manage')} variant="ghost" className="h-11 px-5 bg-white/5 hover:bg-white/10 transition-all rounded-2xl text-[9px] font-black tracking-widest sm:flex hidden">
                <Zap className="w-4 h-4 mr-2 text-yellow-500" /> MANAGE MENU
              </Button>
              <Button onClick={() => setShowOverrideModal(true)} variant="ghost" className="h-11 px-5 bg-white/5 hover:bg-white/10 transition-all rounded-2xl text-[9px] font-black tracking-widest">
                <Activity className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">OVERRIDES</span>
              </Button>
              <div className="h-8 w-[1px] bg-white/10 mx-2 hidden sm:block" />
              <Button onClick={() => router.push('/customer')} variant="ghost" className="h-11 px-5 bg-apple-blue/10 hover:bg-apple-blue/20 text-apple-blue transition-all rounded-2xl text-[9px] font-black tracking-widest sm:flex hidden">
                CUSTOMER PORTAL
              </Button>
              <Button onClick={handleLogout} variant="ghost" className="h-11 w-11 hover:bg-white/5 rounded-2xl text-white/30 hover:text-white">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <StatusOverrideModal
        isOpen={showOverrideModal}
        onClose={() => setShowOverrideModal(false)}
        currentStatus={campusStatus}
      />

      <main className="max-w-[1700px] mx-auto pt-36 px-4 md:px-10 pb-20">
        {/* Production Cockpit Ticker */}
        <div className="mb-12 glass-panel border-white/5 rounded-[2.5rem] p-8 sm:p-10 shadow-premium overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[40%] h-full bg-linear-to-l from-apple-blue/5 to-transparent pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="px-3 py-1 bg-white text-black text-[9px] font-black rounded-lg uppercase tracking-[0.2em]">Live Operations</div>
                <div className="h-[1px] w-12 bg-white/10" />
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_#22c55e]" />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Systems Nominal</span>
                </div>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase leading-[0.8] text-gradient">
                Kitchen Cockpit
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:flex items-center gap-8 sm:gap-16">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">Efficiency Rating</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tighter">98.4</span>
                  <span className="text-sm font-black text-green-500">%</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">Throughput Status</span>
                <div className="flex items-center gap-4">
                  <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '65%' }}
                      transition={{ duration: 2, ease: "easeOut" }}
                      className="h-full bg-apple-blue shadow-[0_0_20px_rgba(0,122,255,0.6)]"
                    />
                  </div>
                  <span className="text-[11px] font-black font-mono">65% CAP</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Orders Feed Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <OrdersColumn
            title="Extraction Queue"
            orders={[]}
            accent="border-yellow-500"
            formatTime={formatTime}
            onUpdateStatus={handleUpdateStatus}
            emptyText="No Pending Units"
          />
          <OrdersColumn
            title="In Production"
            orders={preparingOrders}
            accent="border-apple-blue shadow-[0_0_40px_rgba(0,122,255,0.1)]"
            formatTime={formatTime}
            onUpdateStatus={handleUpdateStatus}
            emptyText="Production Idle"
          />
          <OrdersColumn
            title="Ready for Extraction"
            orders={readyOrders}
            accent="border-green-500 shadow-[0_0_40px_rgba(34,197,94,0.1)]"
            formatTime={formatTime}
            onUpdateStatus={handleUpdateStatus}
            emptyText="Extraction Bay Clear"
          />
        </div>
      </main>

      {/* Persistence Notification Layer */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60]"
          >
            <div className="bg-white text-black px-8 py-5 rounded-[2rem] shadow-premium flex items-center gap-5 border border-white/20">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest leading-tight">Extraction Protocol</p>
                <p className="text-lg font-black tracking-tight leading-tight">UNIT READY FOR DEPLOYMENT</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function OrdersColumn({
  title,
  orders,
  accent,
  formatTime,
  onUpdateStatus,
  emptyText
}: {
  title: string,
  orders: Order[],
  accent: string,
  formatTime: any,
  onUpdateStatus: any,
  emptyText: string
}) {
  return (
    <div className="space-y-8">
      <div className={cn("flex items-center justify-between bg-white/[0.03] border-l-4 rounded-2xl p-6 transition-all", accent)}>
        <div className="flex items-center gap-4">
          <span className="text-[12px] font-black tracking-[0.4em] text-white uppercase">{title}</span>
          <div className="bg-white/10 px-3 py-1 rounded-xl text-[11px] font-black text-white/80 font-mono shadow-inner">
            {orders.length.toString().padStart(2, '0')}
          </div>
        </div>
        <div className="w-2 h-2 rounded-full bg-white/20 animate-pulse" />
      </div>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-24 rounded-[2.5rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-6"
            >
              <div className="w-16 h-16 rounded-[2rem] bg-white/[0.02] flex items-center justify-center border border-white/5">
                <Zap className="w-6 h-6 text-white/5" />
              </div>
              <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">{emptyText}</span>
            </motion.div>
          ) : (
            orders.map((order, idx) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 400, damping: 30, delay: idx * 0.04 }}
              >
                <OrderCard order={order} formatTime={formatTime} onUpdateStatus={onUpdateStatus} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function OrderCard({
  order,
  formatTime,
  onUpdateStatus,
}: {
  order: Order
  formatTime: (timestamp: any) => string
  onUpdateStatus: (orderId: string, status: Order['status']) => void
}) {
  const statusConfig = {
    kitchen_received: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.1)]' },
    preparing: { color: 'text-apple-blue', bg: 'bg-apple-blue/10', border: 'border-apple-blue/20 shadow-[0_0_30px_rgba(0,122,255,0.15)]' },
    ready: { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.15)]' },
    completed: { color: 'text-white/40', bg: 'bg-white/5', border: 'border-white/10' },
  }

  const { color, bg, border } = statusConfig[order.status] || statusConfig.completed

  return (
    <Card className={cn("group glass-panel rounded-[2.5rem] border-white/5 hover:border-white/20 transition-all duration-700 overflow-hidden relative shadow-premium", border)}>
      <div className={`absolute -top-10 -right-10 w-40 h-40 blur-[80px] rounded-full opacity-20 transition-all group-hover:opacity-40 animate-pulse-slow ${bg}`} />

      <CardHeader className="p-8 pb-6 border-b border-white/5 relative z-10">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Deployment ID</span>
            <div className="flex items-center gap-4">
              <CardTitle className="text-3xl font-black tracking-tighter uppercase">#{order.tokenNumber || order.id.slice(-4).toUpperCase()}</CardTitle>
              {order.status === 'preparing' && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-apple-blue/10 border border-apple-blue/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-apple-blue animate-pulse" />
                  <span className="text-[9px] font-black text-apple-blue tracking-widest uppercase">ACTIVE</span>
                </div>
              )}
            </div>
          </div>
          <div className={cn("px-4 py-2 rounded-2xl text-[10px] font-black border uppercase tracking-widest shadow-inner", color, border, bg)}>
            {order.status.replace('_', ' ')}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8 pt-6 space-y-8 relative z-10">
        <div className="space-y-4">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center group/item p-3 rounded-2xl bg-white/[0.02] border border-transparent hover:border-white/5 transition-all">
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 rounded-xl bg-white text-black shadow-premium flex items-center justify-center text-xs font-black">
                  {item.quantity}
                </div>
                <span className="text-sm font-black text-white/80 group-hover/item:text-white transition-colors uppercase tracking-tight">
                  {item.name}
                </span>
              </div>
            </div>
          ))}

          <div className="pt-8 border-t border-white/5 grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] block">Time Elapsed</span>
              <div className="flex items-center gap-2 text-xs font-black text-white/60">
                <Clock className="w-4 h-4 text-white/20" />
                {formatTime(order.createdAt)}
              </div>
            </div>
            <div className="text-right space-y-1">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] block">Mission Value</span>
              <span className="text-3xl font-black text-white tracking-tighter">₹{order.total}</span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          {order.status === 'kitchen_received' && (
            <Button
              onClick={() => onUpdateStatus(order.id, 'preparing')}
              className="w-full bg-white text-black hover:bg-white/90 h-14 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-premium transition-all active:scale-95 group/btn border-none"
            >
              <Zap className="w-5 h-5 mr-3 group-hover/btn:scale-125 transition-transform" /> INITIATE PRODUCTION
            </Button>
          ) || (order.status === 'preparing') && (
            <Button
              onClick={() => onUpdateStatus(order.id, 'ready')}
              className="w-full bg-green-500 text-black hover:bg-green-400 h-14 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(34,197,94,0.4)] transition-all active:scale-95 group/btn border-none"
            >
              <CheckCircle2 className="w-5 h-5 mr-3 group-hover/btn:scale-125 transition-transform" /> UNIT COMPLETE
            </Button>
          ) || (order.status === 'ready') && (
            <Button
              onClick={() => onUpdateStatus(order.id, 'completed')}
              className="w-full bg-white text-black hover:bg-white/90 h-14 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-premium transition-all active:scale-95 border-none"
            >
              HANDOVER VERIFIED
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
