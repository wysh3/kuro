import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { TrendingUp, DollarSign, Zap, Sparkles, Utensils } from 'lucide-react'
import { MealPlan, PlannedMeal } from '@/lib/ai/types'

interface MealPlanDisplayProps {
    plan: any // Allowing flexibility for now between direct AI output and saved plan
    onAddToCart?: (item: string) => void
}

export default function MealPlanDisplay({ plan, onAddToCart }: MealPlanDisplayProps) {
    // Adapter for different structures
    const nutrition = plan.nutritionSummary || plan.summary;
    const meals = plan.meals || plan.plan;

    return (
        <div className="space-y-6 w-full mt-4">
            {/* Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard
                    icon={<Zap className="w-4 h-4 text-yellow-400" />}
                    label="CALORIES"
                    value={`${nutrition.calories || nutrition.avgCaloriesPerDay}kcal`}
                    accent="text-white"
                />
                <MetricCard
                    icon={<TrendingUp className="w-4 h-4 text-blue-400" />}
                    label="PROTEIN"
                    value={`${nutrition.protein || nutrition.proteinPerDay}g`}
                    accent="text-blue-400"
                />
                <MetricCard
                    icon={<TrendingUp className="w-4 h-4 text-purple-400" />}
                    label="CARBS"
                    value={`${nutrition.carbs || 0}g`}
                    accent="text-purple-400"
                />
                <MetricCard
                    icon={<TrendingUp className="w-4 h-4 text-green-400" />}
                    label="FATS"
                    value={`${nutrition.fats || 0}g`}
                    accent="text-green-400"
                />
            </div>

            {/* Meal Items */}
            <div className="space-y-3">
                {meals.map((meal: any, index: number) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="glass-panel rounded-2xl border-white/5 p-4 flex justify-between items-center bg-white/[0.01]"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                <Utensils className="w-5 h-5 text-white/20" />
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">{meal.mealType || meal.day}</p>
                                <p className="text-sm font-bold text-white uppercase">{Array.isArray(meal.items) ? meal.items.join(', ') : meal.item || meal.breakfast?.item || 'Meal Item'}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-white/40">{meal.calories || 0} kcal</p>
                            <button
                                onClick={() => onAddToCart?.(Array.isArray(meal.items) ? meal.items[0] : (meal.item || meal.breakfast?.item))}
                                className="text-[9px] font-black text-blue-400 uppercase mt-1 hover:text-white transition-colors"
                            >
                                Add item
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

function MetricCard({ icon, label, value, accent }: { icon: React.ReactNode, label: string, value: string, accent: string }) {
    return (
        <div className="p-4 glass-panel border-white/5 rounded-2xl bg-white/[0.02] flex flex-col gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                {icon}
            </div>
            <div>
                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">{label}</p>
                <p className={cn("text-sm font-black italic", accent)}>{value}</p>
            </div>
        </div>
    )
}

