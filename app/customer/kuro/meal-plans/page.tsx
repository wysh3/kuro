'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Calendar, Check, Utensils, Zap, ShoppingCart, Info, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getFirebaseDB } from '@/lib/firebase/config';
import { MealPlan } from '@/lib/ai/types';
import { Spinner } from '@/components/ui/spinner';
import { useCart } from '@/contexts/cart-context';

export default function MealPlansPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { addToCart, setIsDrawerOpen } = useCart();
    const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
            return;
        }

        if (user) {
            fetchMealPlans();
        }
    }, [user, authLoading]);

    async function fetchMealPlans() {
        if (!user) return;
        try {
            const db = getFirebaseDB();
            const plansRef = collection(db, 'users', user.uid, 'meal_plans');
            const q = query(plansRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MealPlan));
            setMealPlans(data);
        } catch (error) {
            console.error('Error fetching meal plans:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!user) return;
        try {
            const db = getFirebaseDB();
            await deleteDoc(doc(db, 'users', user.uid, 'meal_plans', id));
            setMealPlans(prev => prev.filter(p => p.id !== id));
            toast.success('Protocol purged', {
                description: 'The meal plan has been removed from your local cortex.'
            });
        } catch (error) {
            toast.error('Purge failed');
        }
    }

    const orderToday = (plan: MealPlan) => {
        // Simple logic: find meals for "today" or just the first set of meals
        plan.meals.forEach(meal => {
            meal.items.forEach(item => {
                const itemName = typeof item === 'string' ? item : item.name;
                const itemId = typeof item === 'string' ? item.toLowerCase().replace(/\s+/g, '-') : item.id;
                const price = typeof item === 'string' ? 0 : item.price;

                addToCart({
                    id: itemId,
                    name: itemName,
                    price: price
                });
            });
        });
        setIsDrawerOpen(true);
        toast.success(`${plan.type.toUpperCase()} Meals synced to cart`);
    };

    if (authLoading || loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Spinner /></div>;

    return (
        <div className="min-h-screen bg-black text-white p-6 sm:p-10 pb-32">
            <div className="max-w-5xl mx-auto space-y-12">
                {/* Header */}
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => router.push('/customer/kuro')}
                            className="w-12 h-12 rounded-2xl hover:bg-white/5 transition-all flex items-center justify-center border border-white/5"
                        >
                            <ArrowLeft className="w-6 h-6 text-white/40" />
                        </button>
                        <div>
                            <h1 className="text-[10px] font-black text-green-400 uppercase tracking-[0.4em] leading-none mb-1">Dietary Protocols</h1>
                            <p className="text-2xl font-black text-white uppercase tracking-widest">ACTIVE MEAL PLANS</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => router.push('/customer/kuro')}
                        className="bg-white text-black hover:bg-white/90 rounded-2xl px-6 h-12 font-black uppercase tracking-widest text-xs"
                    >
                        <Plus className="w-4 h-4 mr-2" /> New Protocol
                    </Button>
                </header>

                <div className="grid grid-cols-1 gap-8">
                    {mealPlans.length === 0 ? (
                        <div className="glass-panel p-20 rounded-[3rem] border border-dashed border-white/10 bg-white/[0.01] flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center mb-6">
                                <Calendar className="w-10 h-10 text-white/20" />
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-widest text-white mb-2">No Active Protocols</h3>
                            <p className="text-white/40 max-w-sm mb-8 uppercase text-[10px] tracking-widest leading-relaxed">
                                You haven't generated any tactical meal plans yet. Ask Kuro to plan your healthy week.
                            </p>
                            <Button
                                onClick={() => router.push('/customer/kuro')}
                                variant="outline"
                                className="rounded-2xl border-white/10 text-[10px] font-black uppercase tracking-[0.3em] px-10 h-14"
                            >
                                TRANSMIT COMMAND
                            </Button>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {mealPlans.map((plan, idx) => (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="glass-panel p-8 rounded-[3rem] border-white/10 bg-white/[0.02] relative group overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-900/10 blur-[100px] rounded-full group-hover:bg-green-600/10 transition-colors" />

                                    <div className="flex flex-col lg:row gap-8 relative z-10">
                                        <div className="flex-1 space-y-6">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                                                            <p className="text-[9px] font-black text-green-400 uppercase tracking-widest">{plan.type} PLAN</p>
                                                        </div>
                                                        <p className="text-[10px] text-white/40 uppercase font-black">Generated {new Date(plan.createdAt?.toDate()).toLocaleDateString()}</p>
                                                    </div>
                                                    <p className="text-xl font-black text-white uppercase mt-2">Tactical Nutrition Cycle</p>
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(plan.id)}
                                                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/5 hover:border-red-500/20 flex items-center justify-center transition-all group/trash"
                                                >
                                                    <Trash2 className="w-4 h-4 text-white/20 group-hover/trash:text-red-400" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                {plan.meals.map((meal, mIdx) => (
                                                    <div key={mIdx} className="p-5 rounded-2xl bg-white/5 border border-white/5">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                                                                <Utensils className="w-4 h-4 text-green-400" />
                                                            </div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/80">{meal.mealType}</p>
                                                        </div>
                                                        <div className="space-y-1 mb-3">
                                                            {meal.items.map((it, iIdx) => (
                                                                <p key={iIdx} className="text-xs font-bold text-white line-clamp-1">
                                                                    <span className="text-green-500 mr-2">/</span> {typeof it === 'string' ? it : it.name}
                                                                </p>
                                                            ))}
                                                        </div>
                                                        <p className="text-[10px] font-mono text-white/40">{meal.totalNutrition.calories} CAL</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="lg:w-72 lg:border-l lg:border-white/10 lg:pl-8 space-y-6">
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Macro Analytics</p>
                                                <div className="space-y-3">
                                                    {[
                                                        { label: 'Avg Calories', value: plan.nutritionSummary.calories, unit: 'kcal' },
                                                        { label: 'Prot Target', value: plan.nutritionSummary.protein, unit: 'g' },
                                                        { label: 'Carbs', value: plan.nutritionSummary.carbs, unit: 'g' },
                                                        { label: 'Fats', value: plan.nutritionSummary.fats, unit: 'g' },
                                                    ].map((stat, sIdx) => (
                                                        <div key={sIdx} className="flex justify-between items-center text-xs">
                                                            <span className="text-white/60 font-medium">{stat.label}</span>
                                                            <span className="text-white font-black">{stat.value}{stat.unit}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => orderToday(plan)}
                                                className="w-full bg-green-600 hover:bg-green-500 text-white rounded-2xl h-14 font-black uppercase tracking-widest text-xs"
                                            >
                                                <ShoppingCart className="w-4 h-4 mr-2" /> Sync Protocol
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
}
