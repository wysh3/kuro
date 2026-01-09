'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { doc, onSnapshot } from 'firebase/firestore';
import { Clock, Users, Activity, TrendingUp } from 'lucide-react';
import { getFirebaseDB } from '@/lib/firebase/config';
import { CampusStatus } from '@/lib/types';

export function CrowdStatusCard() {
  const [status, setStatus] = useState<CampusStatus | null>(null);

  useEffect(() => {
    const db = getFirebaseDB();
    const unsubscribe = onSnapshot(
      doc(db, 'campus_status', 'mrc'),
      (snapshot) => {
        if (snapshot.exists()) {
          setStatus(snapshot.data() as CampusStatus);
        }
      }
    );
    return unsubscribe;
  }, []);

  if (!status) {
    return (
      <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-white/5 to-white/5 backdrop-blur-xl border border-white/10">
        <div className="text-center text-sm text-gray-400">Loading crowd status...</div>
      </div>
    );
  }

  const colors = {
    low: {
      dot: 'bg-green-500',
      glow: 'shadow-[0_0_30px_rgba(34,197,94,0.5)]',
      text: 'text-green-400',
      bg: 'from-green-500/10 to-green-500/5',
      border: 'border-green-500/20'
    },
    medium: {
      dot: 'bg-yellow-500',
      glow: 'shadow-[0_0_30px_rgba(234,179,8,0.5)]',
      text: 'text-yellow-400',
      bg: 'from-yellow-500/10 to-yellow-500/5',
      border: 'border-yellow-500/20'
    },
    high: {
      dot: 'bg-red-500',
      glow: 'shadow-[0_0_30px_rgba(239,68,68,0.5)]',
      text: 'text-red-400',
      bg: 'from-red-500/10 to-red-500/5',
      border: 'border-red-500/20'
    }
  };

  const theme = colors[status.crowdLevel];
  const secondsSinceUpdate = Math.round((Date.now() - status.lastUpdated.toDate().getTime()) / 1000);
  const minutesSinceUpdate = Math.round(secondsSinceUpdate / 60);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[2.5rem] p-10 bg-white/[0.02] border border-white/10 shadow-premium group transition-all duration-700 hover:bg-white/[0.04]"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full -mr-16 -mt-16 opacity-20 ${theme.dot}`} />

      <div className="relative space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className={`absolute inset-0 rounded-full blur-sm ${theme.dot}`}
              />
              <div className={`w-3 h-3 rounded-full relative z-10 ${theme.dot}`} />
            </div>
            <div>
              <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] leading-none mb-2">LIVE FREQUENCY</h3>
              <p className={`text-2xl font-black tracking-tighter uppercase ${theme.text}`}>
                {status.crowdLevel === 'low' && 'Operational Clear'}
                {status.crowdLevel === 'medium' && 'Moderate Load'}
                {status.crowdLevel === 'high' && 'Maximum Capacity'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">WAIT TIME</p>
            <p className="text-3xl font-black text-white tracking-tighter">{status.estimatedWait}M</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/5">
          <StatusMetric label="SORTIES" value={status.activeOrders.toString()} icon={<Activity className="w-3.5 h-3.5" />} />
          <StatusMetric label="DENSITY" value={status.crowdScore.toString()} icon={<Users className="w-3.5 h-3.5" />} />
          <StatusMetric label="OPERATORS" value={status.staffOnline.toString()} icon={<TrendingUp className="w-3.5 h-3.5" />} />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-apple-blue animate-pulse" />
            <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Neural Sync Active</span>
          </div>
          {minutesSinceUpdate > 0 && (
            <span className="text-[8px] font-black text-white/10 uppercase tracking-[0.2em]">
              T-{minutesSinceUpdate}M LATEST
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatusMetric({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-white/20">
        {icon}
        <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-xl font-black text-white tracking-tighter">{value}</p>
    </div>
  )
}
