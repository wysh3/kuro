'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, ArrowLeft, Plus, History, BarChart2, Package, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';
import { KuroMessage, RichContent, KuroSession } from '@/lib/ai/types';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { getFirebaseDB } from '@/lib/firebase/config';

export default function KitchenKuroPage() {
    const router = useRouter();
    const { user, userProfile, loading: authLoading } = useAuth();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [sessionId, setSessionId] = useState<string | null>(null);
    const [sessions, setSessions] = useState<KuroSession[]>([]);
    const [messages, setMessages] = useState<KuroMessage[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Command Center Online. I am Kuro, your Kitchen Operations Intelligence. Ready to assist with demand forecasting and inventory management.',
            timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const ALL_SUGGESTIONS = [
        "Forecast demand for lunch rush",
        "Check inventory levels for proteins",
        "Analyze kitchen efficiency metrics",
        "Predict ingredient runout dates",
        "Suggest prep quantities for tomorrow",
        "Draft a reorder list for suppliers"
    ];

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/');
            } else if (userProfile && !userProfile.kitchenStaff) {
                toast.error('Access Denied', { description: 'Kitchen clearance required.' });
                router.push('/customer');
            }
        }
    }, [user, userProfile, authLoading, router]);

    useEffect(() => {
        const shuffled = [...ALL_SUGGESTIONS].sort(() => 0.5 - Math.random());
        setSuggestions(shuffled.slice(0, 3));
    }, []);

    useEffect(() => {
        if (user) {
            loadSessions();
        }
    }, [user]);

    async function loadSessions() {
        if (!user) return;
        try {
            const db = getFirebaseDB();
            // Assuming kitchen sessions are also stored under users but maybe we want a shared kitchen collection?
            // For now, let's keep it personal to the staff member as per schema, 
            // but ideally kitchen ops might be shared. Keeping it personal for MVP simplicity.
            const sessionsRef = collection(db, 'users', user.uid, 'kuro_sessions');
            const q = query(sessionsRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KuroSession));
            setSessions(data);
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    }

    async function loadSession(id: string) {
        setSessionId(id);
        setIsSidebarOpen(false);
        setLoading(true);
        try {
            const db = getFirebaseDB();
            const sessionRef = doc(db, 'users', user!.uid, 'kuro_sessions', id);
            const snapshot = await getDoc(sessionRef);
            if (snapshot.exists()) {
                const data = snapshot.data();
                setMessages(data.messages || []);
            }
        } catch (error) {
            toast.error('Failed to load session');
        } finally {
            setLoading(false);
        }
    }

    const startNewChat = () => {
        setSessionId(null);
        setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: 'Command Center Online. I am Kuro, your Kitchen Operations Intelligence. Ready to assist with demand forecasting and inventory management.',
            timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
        }]);
        setIsSidebarOpen(false);
    };

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || loading || !user) return;

        const userMessage: KuroMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.uid,
                    sessionId: sessionId,
                    message: text,
                    // Pass specific context for kitchen
                    context: {
                        role: 'kitchen_staff'
                    },
                    history: messages.map(m => ({ role: m.role, content: m.content }))
                })
            });

            const data = await response.json();

            if (data.success) {
                const aiMessage: KuroMessage = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: data.message,
                    timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
                    metadata: {
                        richContent: data.richContent,
                        actions: data.actions
                    }
                };

                setMessages(prev => [...prev, aiMessage]);
                if (data.sessionId && !sessionId) {
                    setSessionId(data.sessionId);
                }
            } else {
                throw new Error(data.error || 'Failed to get response');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Kuro Ops System Failure');
            setMessages(prev => [...prev, {
                id: 'error-' + Date.now(),
                role: 'assistant',
                content: 'System error. Neural link unstable. Please retry.',
                timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
            }]);
        } finally {
            setLoading(false);
        }
    };

    const renderRichContent = (content: RichContent) => {
        // We can add specialized renderers for kitchen charts here
        // For now, reuse the basic structure or fallback
        return null;
    };

    if (authLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><Spinner /></div>;
    if (!user) return null;

    return (
        <div className="min-h-screen bg-black flex flex-col selection:bg-white/20 relative overflow-hidden">


            <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col p-4 md:p-8 relative z-10 h-screen">
                {/* Tactical HUD Header */}
                <header className={cn(
                    "fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 w-[calc(100%-2rem)] max-w-6xl",
                    isScrolled ? "top-2" : "top-4"
                )}>
                    <div className={cn(
                        "glass-panel rounded-[2.5rem] px-6 py-4 flex items-center justify-between transition-all duration-700 border-white/10",
                        isScrolled ? "bg-black/60 backdrop-blur-3xl shadow-2xl scale-[0.98]" : "bg-white/[0.03]"
                    )}>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/kitchen')}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl hover:bg-white/5 transition-all flex items-center justify-center border border-white/5 text-white/40 hover:text-white"
                            >
                                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl hover:bg-white/5 transition-all flex items-center justify-center border border-white/5 text-white/40 hover:text-white"
                            >
                                <History className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 p-[1px] border border-white/10">
                                    <div className="w-full h-full bg-black/50 rounded-2xl flex items-center justify-center">
                                        <Sparkles className="w-6 h-6 text-white shadow-glow" />
                                    </div>
                                </div>
                                <div className="hidden sm:block">
                                    <h1 className="text-[10px] font-black text-white/50 uppercase tracking-[0.4em] leading-none mb-1">Kitchen Ops</h1>
                                    <p className="text-sm font-black text-white uppercase tracking-widest">KURO INTELLIGENCE</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4">
                            <button
                                onClick={() => router.push('/kitchen/kuro/forecasts')}
                                className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex items-center justify-center text-white/40 hover:text-white hidden sm:flex"
                                title="Demand Forecasts"
                            >
                                <TrendingUp className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => router.push('/kitchen/kuro/inventory')}
                                className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex items-center justify-center text-white/40 hover:text-white hidden sm:flex"
                                title="Inventory AI"
                            >
                                <Package className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Chat Container */}
                <div className="flex-1 overflow-y-auto pt-28 pb-32 px-2 custom-scrollbar">
                    <div className="space-y-12 max-w-4xl mx-auto">
                        <AnimatePresence mode="popLayout">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    layout
                                    className={`flex gap-4 sm:gap-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center mt-1">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </div>
                                    )}

                                    <div className="max-w-[85%] flex flex-col gap-2">
                                        <div className={cn(
                                            "px-7 py-5 rounded-[2.5rem] relative transition-all duration-500 text-sm",
                                            msg.role === 'user'
                                                ? 'bg-white text-black font-black tracking-tight rounded-tr-sm shadow-[0_0_30px_rgba(255,255,255,0.1)]'
                                                : 'glass-panel border-white/5 text-white/90 font-medium rounded-tl-sm bg-white/[0.02]'
                                        )}>
                                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                        </div>

                                        {/* Render Assistant Rich Content */}
                                        {msg.role === 'assistant' && msg.metadata?.richContent && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.2 }}
                                            >
                                                {renderRichContent(msg.metadata.richContent)}
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {loading && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 sm:gap-6">
                                <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                                    <Sparkles className="w-5 h-5 text-white/20 animate-pulse" />
                                </div>
                                <div className="glass-panel px-6 py-4 rounded-[1.5rem] rounded-tl-sm border border-white/5 flex gap-2 items-center bg-white/[0.02]">
                                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="fixed bottom-0 left-0 right-0 p-4 md:p-8 bg-black/60 backdrop-blur-md z-40 border-t border-white/5">
                    <div className="max-w-6xl mx-auto space-y-4">
                        {/* Quick Suggestions */}
                        <AnimatePresence>
                            {messages.length === 1 && !input.trim() && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x"
                                >
                                    {suggestions.map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSendMessage(suggestion)}
                                            className="whitespace-nowrap px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-black text-white/60 uppercase tracking-widest transition-all hover:border-blue-500/30 snap-start"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex gap-4">
                            <div className="flex-1 relative group">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSendMessage(input);
                                        }
                                    }}
                                    placeholder="TRANSMIT TO OPS COMMAND..."
                                    disabled={loading}
                                    className="w-full h-16 sm:h-20 glass-panel border-white/5 rounded-[2rem] px-8 text-sm font-black text-white placeholder-white/20 focus:outline-none focus:bg-white/[0.08] transition-all shadow-2xl tracking-widest uppercase"
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-20 group-focus-within:opacity-100 transition-opacity hidden sm:flex">
                                    <span className="text-[10px] font-black text-white tracking-[0.2em]">ENTER TO SEND</span>
                                </div>
                            </div>
                            <Button
                                onClick={() => handleSendMessage(input)}
                                disabled={loading || !input.trim()}
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-[2.2rem] bg-white text-black hover:bg-white/90 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all active:scale-95 flex items-center justify-center p-0 border-none group"
                            >
                                {loading ? (
                                    <div className="w-8 h-8 flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white/10 border-t-white rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    <Send className="w-7 h-7 sm:w-8 sm:h-8 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform text-black" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            className="fixed top-0 left-0 bottom-0 w-80 bg-[#050505] border-r border-white/5 z-[101] p-8 flex flex-col"
                        >
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Index</p>
                                    <h2 className="text-xl font-black text-white uppercase tracking-widest">OPS LOGS</h2>
                                </div>
                                <button
                                    onClick={startNewChat}
                                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-white transition-all"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                                {sessions.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => loadSession(s.id)}
                                        className={cn(
                                            "w-full p-4 rounded-2xl border transition-all text-left group",
                                            sessionId === s.id
                                                ? "bg-blue-500/10 border-blue-500/40"
                                                : "bg-white/[0.02] border-white/5 hover:border-white/20"
                                        )}
                                    >
                                        <p className={cn(
                                            "text-xs font-black uppercase tracking-widest truncate mb-1",
                                            sessionId === s.id ? "text-white" : "text-white/40 group-hover:text-white/80"
                                        )}>{s.title || 'Ops Command Session'}</p>
                                        <p className="text-[9px] text-white/20 font-bold uppercase">{new Date(s.updatedAt?.toDate()).toLocaleString()}</p>
                                    </button>
                                ))}
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <style jsx global>{`
              .scrollbar-none::-webkit-scrollbar {
                display: none;
              }
              .scrollbar-none {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
              .custom-scrollbar::-webkit-scrollbar {
                width: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 10px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.1);
              }
            `}</style>
        </div>
    );
}
