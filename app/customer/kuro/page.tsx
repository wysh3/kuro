'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, ArrowLeft, Plus, ShoppingCart, Check, History, Settings, Bot, Utensils, BarChart2, Mic, Image as ImageIcon, X, Paperclip } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/cart-context';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';
import { KuroMessage, RichContent } from '@/lib/ai/types';
import MealPlanDisplay from '@/components/customer/meal-plan-display';

// Speech Recognition Types
declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

export default function KuroPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { addToCart, cart, setIsDrawerOpen } = useCart();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [sessionId, setSessionId] = useState<string | null>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [messages, setMessages] = useState<KuroMessage[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Greetings. I am Kuro, your personal AI food intelligence agent. How may I optimize your nutrition today?',
            timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Multi-modal states
    const [isListening, setIsListening] = useState(false);
    const [attachment, setAttachment] = useState<{ data: string; mimeType: string; preview: string } | null>(null);

    const ALL_SUGGESTIONS = [
        "Plan my protein-heavy meals for the week",
        "Give me a healthy budget lunch under ₹150",
        "Analyze my eating patterns this month",
        "What are the gluten-free options available?",
        "Recommend a post-workout snack",
        "Create a keto-friendly daily meal plan",
        "Show me my nutrition analytics",
        "Order my usual lunch"
    ];

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

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
        const { getKuroSessions } = await import('@/lib/firebase/ai-db');
        const data = await getKuroSessions(user.uid);
        setSessions(data);
    }

    async function loadSession(id: string) {
        setSessionId(id);
        setIsSidebarOpen(false);
        setLoading(true);
        try {
            const { getFirebaseDB } = await import('@/lib/firebase/config');
            const { doc, getDoc } = await import('firebase/firestore');
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
            content: 'Greetings. I am Kuro, your personal AI food intelligence agent. How may I optimize your nutrition today?',
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

    // Voice Input Handler
    const toggleListening = () => {
        if (isListening) {
            setIsListening(false);
            return;
        }

        const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Speech) {
            toast.error("Voice input not supported in this browser.");
            return;
        }

        const recognition = new Speech();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
            console.error(event.error);
            setIsListening(false);
            toast.error("Voice recognition error.");
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(prev => prev + (prev ? ' ' : '') + transcript);
        };

        recognition.start();
    };

    // Image Input Handler
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image too large. Max 5MB.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            // Extract base64 content
            const base64Data = result.split(',')[1];
            setAttachment({
                data: base64Data,
                mimeType: file.type,
                preview: result
            });
        };
        reader.readAsDataURL(file);
    };

    const handleSendMessage = async (text: string) => {
        if ((!text.trim() && !attachment) || loading || !user) return;

        const currentAttachment = attachment;
        const currentInput = text;

        const userMessage: KuroMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: currentInput,
            timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
            metadata: currentAttachment ? {
                attachments: [{ type: 'image', url: currentAttachment.preview }]
            } : undefined
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setAttachment(null);
        setLoading(true);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.uid,
                    sessionId: sessionId,
                    message: currentInput || (currentAttachment ? "Analyze this image" : ""),
                    history: messages.map(m => ({ role: m.role, content: m.content })),
                    attachments: currentAttachment ? [{ data: currentAttachment.data, mimeType: currentAttachment.mimeType }] : []
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
            toast.error('Kuro is temporarily unavailable');
            setMessages(prev => [...prev, {
                id: 'error-' + Date.now(),
                role: 'assistant',
                content: 'I apologize, but I encountered a neural link failure. Please try again.',
                timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (action: any) => {
        if (action.type === 'place_order') {
            const items = action.result.items;
            items.forEach((item: any) => {
                for (let i = 0; i < (item.quantity || 1); i++) {
                    addToCart({
                        id: item.id,
                        name: item.name,
                        price: item.price
                    });
                }
            });
            setIsDrawerOpen(true);
            toast.success('System: Items synchronized with cart', {
                description: `Successfully imported ${items.length} items to your active order.`
            });
        }
    };

    const renderRichContent = (content: RichContent) => {
        switch (content.type) {
            case 'meal_plan_card':
                return <MealPlanDisplay plan={content.data.plan} onAddToCart={(name) => addToCart({ id: name, name, price: 0 })} />;

            case 'order_preview_card':
                const orderData = content.data;
                return (
                    <div className="space-y-4 mt-4 w-full">
                        <div className="p-6 rounded-[2rem] glass-panel border-white/10 bg-white/[0.02]">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <Utensils className="w-4 h-4 text-purple-400" />
                                </div>
                                <p className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Order Preview</p>
                            </div>
                            <div className="space-y-3 mb-6">
                                {orderData.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <span className="text-white/80">{item.quantity}x {item.name}</span>
                                        <span className="text-white font-mono font-bold">₹{item.price * item.quantity}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-white/10">
                                <span className="text-sm font-black text-white/40 uppercase">Total Estimate</span>
                                <span className="text-xl font-black text-white">₹{orderData.total}</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => handleAction({ type: 'place_order', result: orderData })}
                                className="flex-1 bg-white text-black hover:bg-white/90 rounded-2xl h-14 font-black uppercase tracking-widest text-xs"
                            >
                                <Check className="w-4 h-4 mr-2" />
                                Confirm Items
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-xs border-white/10 text-white/60"
                                onClick={() => toast.info('Order cancelled')}
                            >
                                Dismiss
                            </Button>
                        </div>
                    </div>
                );

            case 'nutrition_chart':
                return (
                    <div className="mt-4 p-6 rounded-[2rem] glass-panel border-white/10 bg-white/[0.02] w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <BarChart2 className="w-4 h-4 text-blue-400" />
                            </div>
                            <p className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Nutrition Insight</p>
                        </div>
                        <p className="text-sm text-white/70 mb-4">{content.data.insight}</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <p className="text-[10px] text-white/40 uppercase mb-1">Total Spending</p>
                                <p className="text-lg font-black text-white">₹{content.data.spending}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <p className="text-[10px] text-white/40 uppercase mb-1">Orders Analyzed</p>
                                <p className="text-lg font-black text-white">{content.data.totalOrders}</p>
                            </div>
                        </div>
                    </div>
                );

            case 'product_carousel':
                return (
                    <div className="mt-4 space-y-3 w-full">
                        <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">Recommendations</p>
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x">
                            {content.data.recommendations.map((item: any) => (
                                <motion.div
                                    key={item.id}
                                    className="flex-shrink-0 w-64 p-5 rounded-[2rem] glass-panel border-white/10 bg-white/[0.02] snap-center hover:border-purple-500/30 transition-all border"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-white text-sm line-clamp-1">{item.name}</h3>
                                        <p className="text-purple-400 font-mono text-xs font-bold">₹{item.price}</p>
                                    </div>
                                    <p className="text-[10px] text-white/40 line-clamp-2 mb-4 h-8">{item.description || 'Recommended based on your preferences.'}</p>
                                    <Button
                                        onClick={() => addToCart(item)}
                                        className="w-full h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-black text-white uppercase"
                                    >
                                        <Plus className="w-3 h-3 mr-2" /> Add to Order
                                    </Button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                );

            default:
                return null
        }
    };

    if (authLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><Spinner /></div>;
    if (!user) return null;

    return (
        <div className="min-h-screen bg-black flex flex-col selection:bg-purple-500/30 relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full animate-pulse delay-1000" />
            </div>

            <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col p-4 md:p-8 relative z-10 h-screen">
                {/* Header */}
                <header className={cn(
                    "fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 w-[calc(100%-2rem)] max-w-4xl",
                    isScrolled ? "top-2" : "top-4"
                )}>
                    <div className={cn(
                        "glass-panel rounded-[2.5rem] px-6 py-4 flex items-center justify-between transition-all duration-700 border-white/10",
                        isScrolled ? "bg-black/60 backdrop-blur-3xl shadow-2xl scale-[0.98]" : "bg-white/[0.03]"
                    )}>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/customer')}
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
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 p-[1px]">
                                    <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
                                        <Bot className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="hidden sm:block">
                                    <h1 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] leading-none mb-1">Neural Core v2.0</h1>
                                    <p className="text-sm font-black text-white uppercase tracking-widest">KURO AI AGENT</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4">
                            <button
                                onClick={() => router.push('/customer/kuro/analytics')}
                                className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex items-center justify-center text-white/40 hover:text-white hidden sm:flex"
                            >
                                <BarChart2 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => router.push('/customer/kuro/meal-plans')}
                                className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex items-center justify-center text-white/40 hover:text-white hidden sm:flex"
                            >
                                <Utensils className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => router.push('/customer/kuro/preferences')}
                                className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex items-center justify-center text-white/40 hover:text-white hidden sm:flex"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setIsDrawerOpen(true)}
                                className="relative w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex items-center justify-center group"
                            >
                                <ShoppingCart className="w-5 h-5 text-white/60 group-hover:text-white" />
                                {cart.length > 0 && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 text-white text-[10px] font-black rounded-xl border-2 border-black flex items-center justify-center shadow-lg"
                                    >
                                        {cart.reduce((acc, item) => acc + item.quantity, 0)}
                                    </motion.div>
                                )}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Chat Container */}
                <div className="flex-1 overflow-y-auto pt-28 pb-40 px-2 custom-scrollbar">
                    <div className="space-y-12 max-w-3xl mx-auto">
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
                                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex-shrink-0 flex items-center justify-center mt-1">
                                            <Bot className="w-6 h-6 text-purple-400" />
                                        </div>
                                    )}

                                    <div className="max-w-[85%] flex flex-col gap-2 scale-100 origin-bottom-left">
                                        <div className={cn(
                                            "px-7 py-5 rounded-[2.5rem] relative transition-all duration-500 text-sm overflow-hidden",
                                            msg.role === 'user'
                                                ? 'bg-white text-black font-black italic rounded-tr-sm'
                                                : 'glass-panel border-white/10 text-white/90 font-medium rounded-tl-sm bg-white/[0.03]'
                                        )}>
                                            {/* User Attachment Display */}
                                            {msg.metadata?.attachments && (
                                                <div className="mb-3 rounded-xl overflow-hidden shadow-lg border border-black/10">
                                                    <img src={msg.metadata.attachments[0].url} alt="Uploaded" className="max-h-60 w-full object-cover" />
                                                </div>
                                            )}
                                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content || (msg.metadata?.attachments ? 'Sent an image' : '')}</p>
                                        </div>

                                        {/* Render Assistant Rich Content */}
                                        {msg.role === 'assistant' && msg.metadata?.richContent && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.2 }}
                                                className="w-full"
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
                                <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                                    <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                                </div>
                                <div className="glass-panel px-6 py-4 rounded-[1.5rem] rounded-tl-sm border border-white/10 flex gap-2 items-center bg-white/[0.03]">
                                    <span className="w-1.5 h-1.5 bg-purple-500/60 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-purple-500/60 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                    <span className="w-1.5 h-1.5 bg-purple-500/60 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="fixed bottom-0 left-0 right-0 p-4 md:p-8 bg-black/60 backdrop-blur-md z-40 border-t border-white/5">
                    <div className="max-w-4xl mx-auto space-y-4">
                        {/* Selected Attachment Preview */}
                        <AnimatePresence>
                            {attachment && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: 10, height: 0 }}
                                    className="relative inline-block"
                                >
                                    <div className="relative rounded-2xl overflow-hidden border border-white/10 w-24 h-24 group">
                                        <img src={attachment.preview} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => setAttachment(null)}
                                            className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 rounded-full p-1 transition-colors"
                                        >
                                            <X className="w-3 h-3 text-white" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Quick Suggestions */}
                        <AnimatePresence>
                            {messages.length === 1 && !input.trim() && !attachment && (
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
                                            className="whitespace-nowrap px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-black text-white/60 uppercase tracking-widest transition-all hover:border-purple-500/30 snap-start"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex gap-4">
                            <div className="flex-1 relative group bg-black/20 rounded-[2rem]"> {/* Wrapper for inputs */}
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSendMessage(input);
                                        }
                                    }}
                                    placeholder={isListening ? "Listening..." : "TRANSMIT TO KURO..."}
                                    disabled={loading}
                                    className={cn(
                                        "w-full h-16 sm:h-20 glass-panel border-white/10 rounded-[2rem] pl-8 pr-32 text-sm font-black text-white placeholder-white/10 focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/5 transition-all shadow-2xl tracking-widest uppercase",
                                        isListening && "border-red-500/50 animate-pulse"
                                    )}
                                />

                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                />

                                {/* Input Action Buttons */}
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
                                        title="Upload Image"
                                    >
                                        <ImageIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={toggleListening}
                                        className={cn(
                                            "w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center transition-all",
                                            isListening ? "text-red-400 bg-red-400/10" : "text-white/40 hover:text-white"
                                        )}
                                        title="Voice Input"
                                    >
                                        <Mic className={cn("w-5 h-5", isListening && "animate-bounce")} />
                                    </button>
                                </div>
                            </div>

                            <Button
                                onClick={() => handleSendMessage(input)}
                                disabled={loading || (!input.trim() && !attachment)}
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-[2.2rem] bg-gradient-to-br from-purple-500 to-blue-600 text-white hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all active:scale-95 flex items-center justify-center p-0 border-none group"
                            >
                                {loading ? (
                                    <div className="w-8 h-8 flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white/10 border-t-white rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    <Send className="w-7 h-7 sm:w-8 sm:h-8 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
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
                                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest leading-none mb-1">Index</p>
                                    <h2 className="text-xl font-black text-white uppercase tracking-widest">SESSIONS</h2>
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
                                                ? "bg-purple-500/10 border-purple-500/40"
                                                : "bg-white/[0.02] border-white/5 hover:border-white/20"
                                        )}
                                    >
                                        <p className={cn(
                                            "text-xs font-black uppercase tracking-widest truncate mb-1",
                                            sessionId === s.id ? "text-white" : "text-white/40 group-hover:text-white/80"
                                        )}>{s.title || 'Tac-Link Session'}</p>
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
