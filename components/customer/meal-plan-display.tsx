'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { TrendingUp, DollarSign, Zap, Sparkles } from 'lucide-react'
import { MealPlanResponse } from '@/lib/gemini/meal-planner'

interface MealPlanDisplayProps {
    plan: MealPlanResponse
    onAddToCart?: (item: string) => void
}

export default function MealPlanDisplay({ plan, onAddToCart }: MealPlanDisplayProps) {
    return (
        <div className="space-y-10 w-full">
            {/* Summary Grid */}
            <div className="grid grid-cols-3 gap-4">
                <MetricCard
                    icon={<DollarSign className="w-4 h-4" />}
                    label="TOTAL COST"
                    value={`₹${plan.summary.totalCost}`}
                    accent="text-white"
                />
                <MetricCard
                    icon={<Zap className="w-4 h-4 text-apple-blue" />}
                    label="AVG CALORIES"
                    value={`${plan.summary.avgCaloriesPerDay}`}
                    accent="text-apple-blue"
                />
                <MetricCard
                    icon={<TrendingUp className="w-4 h-4 text-green-500" />}
                    label="TOTAL PROTEIN"
                    value={`${plan.summary.proteinPerDay}G`}
                    accent="text-green-500"
                />
            </div>

            {/* Daily Deployment Log */}
            <div className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                    <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">MEAL SCHEDULE</h3>
                    <div className="h-[1px] flex-1 bg-white/5" />
                </div>

                {plan.plan.map((day, index) => (
                    <motion.div
                        key={day.day}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 * index }}
                        className="glass-panel rounded-[2rem] border-white/5 p-8 space-y-6 shadow-premium"
                    >
                        <div className="flex items-center justify-between">
                            <h4 className="text-lg font-black text-white uppercase tracking-tighter italic">{day.day}</h4>
                            <div className="px-3 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-[8px] font-black text-green-500 uppercase tracking-widest">
                                OPTIMIZED
                            </div>
                        </div>

                        <div className="space-y-3">
                            <MealRow label="BREAKFAST" item={day.breakfast} onAddToCart={() => onAddToCart?.(day.breakfast.item)} />
                            <MealRow label="LUNCH" item={day.lunch} onAddToCart={() => onAddToCart?.(day.lunch.item)} />
                            {day.snack && <MealRow label="SNACK" item={day.snack} onAddToCart={() => onAddToCart?.(day.snack!.item)} />}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* AI Strategic Tips */}
            {plan.tips && plan.tips.length > 0 && (
                <div className="glass-panel rounded-[2.5rem] border-apple-blue/20 bg-apple-blue/[0.02] p-10 relative overflow-hidden shadow-premium">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                        <Sparkles className="w-32 h-32 text-white" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-[10px] font-black text-apple-blue uppercase tracking-[0.4em] mb-6">NUTRITION TIPS</h3>
                        <ul className="space-y-4">
                            {plan.tips.map((tip, index) => (
                                <li key={index} className="flex gap-6 text-sm font-medium text-white/50 leading-relaxed italic group">
                                    <span className="text-apple-blue/40 font-black not-italic text-[10px] mt-1">0{index + 1}</span>
                                    <span className="group-hover:text-white/80 transition-colors">{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    )
}

function MetricCard({ icon, label, value, accent }: { icon: React.ReactNode, label: string, value: string, accent: string }) {
    return (
        <div className="p-6 glass-panel border-white/5 rounded-2xl flex flex-col gap-4 group hover:bg-white/[0.04] transition-all shadow-premium">
            <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/30 group-hover:bg-white group-hover:text-black transition-all duration-500">
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none mb-2">{label}</p>
                <p className={cn("text-xl font-black tracking-tighter", accent)}>{value}</p>
            </div>
        </div>
    )
}

function MealRow({ label, item, onAddToCart }: { label: string, item: any, onAddToCart: () => void }) {
    return (
        <div className="flex items-center justify-between p-5 glass-panel border-white/5 rounded-2xl group hover:border-white/20 hover:bg-white/[0.02] transition-all">
            <div className="space-y-1">
                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-apple-blue transition-colors">{item.item}</p>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">
                    {item.calories} KCAL <span className="text-white/10">•</span> {item.protein}G PROTEIN
                </p>
            </div>
            <div className="flex flex-col items-end gap-3">
                <span className="text-xs font-black text-white tracking-tighter italic">₹{item.cost}</span>
                <button
                    onClick={onAddToCart}
                    className="h-8 px-4 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black text-white/40 uppercase tracking-[0.2em] hover:bg-white hover:text-black hover:border-white transition-all cursor-pointer"
                >
                    ADD TO CART
                </button>
            </div>
        </div>
    )
}
