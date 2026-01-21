'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Shield, Target, User, Zap, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { getUserPreferences, saveUserPreferences } from '@/lib/firebase/ai-db';
import { UserPreferences } from '@/lib/ai/types';

export default function PreferencesPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [prefs, setPrefs] = useState<UserPreferences>({
        userId: '',
        dietary: {
            restrictions: [],
            allergies: [],
            preferences: [],
            dislikedIngredients: []
        },
        health: {
            goals: ['maintenance'],
            activityLevel: 'moderate'
        },
        ordering: {
            favoriteItems: []
        },
        ai: {
            conversationStyle: 'friendly',
            language: 'en',
            voiceEnabled: false,
            notificationPreferences: {
                mealReminders: true,
                nutritionInsights: true,
                orderUpdates: true
            }
        },
        updatedAt: null as any
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
            return;
        }

        if (user) {
            loadPrefs();
        }
    }, [user, authLoading]);

    async function loadPrefs() {
        if (!user) return;
        try {
            const data = await getUserPreferences(user.uid);
            if (data) {
                setPrefs(data);
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!user) return;
        setSaving(true);
        try {
            await saveUserPreferences(user.uid, { ...prefs, userId: user.uid });
            toast.success('Kuro Intelligence updated', {
                description: 'Your preferences have been synced with the neural network.'
            });
        } catch (error) {
            toast.error('Sync failed', {
                description: 'Could not update preferences at this time.'
            });
        } finally {
            setSaving(false);
        }
    }

    const toggleDietary = (res: string) => {
        setPrefs(prev => ({
            ...prev,
            dietary: {
                ...prev.dietary,
                restrictions: prev.dietary.restrictions.includes(res)
                    ? prev.dietary.restrictions.filter(r => r !== res)
                    : [...prev.dietary.restrictions, res]
            }
        }));
    };

    if (authLoading || loading) return <div className="min-h-screen bg-black" />;

    return (
        <div className="min-h-screen bg-black text-white p-6 sm:p-10 pb-32">
            <div className="max-w-4xl mx-auto space-y-12">
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
                            <h1 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] leading-none mb-1">Configuration</h1>
                            <p className="text-2xl font-black text-white uppercase tracking-widest">KURO PREFERENCES</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-white text-black hover:bg-white/90 rounded-2xl px-8 h-12 font-black uppercase tracking-widest text-xs"
                    >
                        {saving ? 'Syncing...' : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                    </Button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Dietary Profile */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-blue-400" />
                            <h2 className="text-sm font-black uppercase tracking-widest">Dietary Profile</h2>
                        </div>
                        <div className="glass-panel p-8 rounded-[2.5rem] border-white/10 bg-white/[0.02] space-y-6">
                            <div className="space-y-4">
                                <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Restrictions</p>
                                <div className="flex flex-wrap gap-2">
                                    {['Veg', 'Non-Veg', 'Jain', 'Gluten-Free', 'Keto', 'Vegan'].map(res => (
                                        <button
                                            key={res}
                                            onClick={() => toggleDietary(res)}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                                prefs.dietary.restrictions.includes(res)
                                                    ? "bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                                                    : "bg-white/5 border-white/5 text-white/40 hover:border-white/20"
                                            )}
                                        >
                                            {res}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Health Goals */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Target className="w-5 h-5 text-blue-400" />
                            <h2 className="text-sm font-black uppercase tracking-widest">Health Goals</h2>
                        </div>
                        <div className="glass-panel p-8 rounded-[2.5rem] border-white/10 bg-white/[0.02] space-y-6">
                            <div className="space-y-4">
                                <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Primary Objective</p>
                                <select
                                    value={prefs.health.goals[0]}
                                    onChange={(e) => setPrefs(prev => ({ ...prev, health: { ...prev.health, goals: [e.target.value] } }))}
                                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-black uppercase tracking-widest focus:outline-none focus:border-blue-500/50 appearance-none"
                                >
                                    <option value="weight-loss">Weight Loss</option>
                                    <option value="muscle-gain">Muscle Gain</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="high-energy">High Energy</option>
                                </select>
                            </div>

                            <div className="space-y-4">
                                <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Activity Level</p>
                                <div className="grid grid-cols-2 gap-4">
                                    {['sedentary', 'moderate', 'active', 'very-active'].map(level => (
                                        <button
                                            key={level}
                                            onClick={() => setPrefs(prev => ({ ...prev, health: { ...prev.health, activityLevel: level as any } }))}
                                            className={cn(
                                                "h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                                prefs.health.activityLevel === level
                                                    ? "bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                                                    : "bg-white/5 border-white/5 text-white/40 hover:border-white/20"
                                            )}
                                        >
                                            {level.replace('-', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* AI Behavior */}
                    <section className="space-y-6 md:col-span-2">
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            <h2 className="text-sm font-black uppercase tracking-widest">Neural Interaction Settings</h2>
                        </div>
                        <div className="glass-panel p-8 rounded-[2.5rem] border-white/10 bg-white/[0.02] grid grid-cols-1 sm:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-white">Conversation Style</p>
                                        <p className="text-[10px] text-white/40 mt-1 uppercase">How Kuro communicates with you</p>
                                    </div>
                                    <select
                                        value={prefs.ai.conversationStyle}
                                        onChange={(e) => setPrefs(prev => ({ ...prev, ai: { ...prev.ai, conversationStyle: e.target.value as any } }))}
                                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase"
                                    >
                                        <option value="friendly">Friendly</option>
                                        <option value="concise">Concise</option>
                                        <option value="detailed">Detailed</option>
                                    </select>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-white">Voice Synthesis</p>
                                        <p className="text-[10px] text-white/40 mt-1 uppercase">Audio responses for meal plans</p>
                                    </div>
                                    <button
                                        onClick={() => setPrefs(prev => ({ ...prev, ai: { ...prev.ai, voiceEnabled: !prev.ai.voiceEnabled } }))}
                                        className={cn(
                                            "w-12 h-6 rounded-full relative transition-all",
                                            prefs.ai.voiceEnabled ? "bg-green-500" : "bg-white/10"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                                            prefs.ai.voiceEnabled ? "left-7" : "left-1"
                                        )} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <p className="text-xs font-black uppercase tracking-widest text-white/40">Neural Notifications</p>
                                {Object.entries(prefs.ai.notificationPreferences).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/80">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                        <button
                                            onClick={() => setPrefs(prev => ({
                                                ...prev,
                                                ai: {
                                                    ...prev.ai,
                                                    notificationPreferences: {
                                                        ...prev.ai.notificationPreferences,
                                                        [key]: !value
                                                    }
                                                }
                                            }))}
                                            className={cn(
                                                "w-10 h-5 rounded-full relative transition-all",
                                                value ? "bg-blue-500" : "bg-white/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all",
                                                value ? "left-5.5" : "left-0.5"
                                            )} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
