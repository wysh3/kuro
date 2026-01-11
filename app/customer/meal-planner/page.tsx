'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, ArrowLeft, Plus, ShoppingCart, Check } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import MealPlanDisplay from '@/components/customer/meal-plan-display';
import { MealPlanResponse } from '@/lib/gemini/meal-planner';
import { ChatResponse, ChatMessage } from '@/lib/gemini/chat-agent';
import { useCart } from '@/contexts/cart-context';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Activity, Shield, Zap, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

export default function MealPlannerPage() {
    const router = useRouter();
    const { addToCart, cart, setIsDrawerOpen } = useCart();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            content: 'Hi! I\'m your personal AI nutritionist. I can help you find healthy options, plan your meals, or stick to a budget using the MRC menu. What\'s on your mind today?'
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [pendingOrder, setPendingOrder] = useState<any>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const ALL_SUGGESTIONS = [
        "Plan a high protein diet for today",
        "I need a healthy lunch under ₹150",
        "Suggest a low calorie snack",
        "What are the best vegetarian options?",
        "I'm feeling tired, suggest high energy food",
        "Plan a cheat meal for dinner",
        "Show me options with paneer",
        "I want something spicy for lunch",
        "Gym workout meal plan",
        "Light breakfast ideas"
    ];

    useEffect(() => {
        // Randomly select 3 suggestions on mount
        const shuffled = [...ALL_SUGGESTIONS].sort(() => 0.5 - Math.random());
        setSuggestions(shuffled.slice(0, 3));
    }, []);

    useEffect(() => {
        // Disable browser scroll restoration and force top
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);

        // Safety delay
        const timer = setTimeout(() => window.scrollTo(0, 0), 100);

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('scroll', handleScroll);
            if ('scrollRestoration' in history) {
                history.scrollRestoration = 'auto';
            }
        };
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || loading) return;

        // Optimistically add user message
        const userMessage: ChatMessage = { role: 'user', content: text };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            // Call Chat API
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    conversationHistory: messages
                })
            });

            const data = await response.json();

            if (data.success && data.response) {
                const aiResponse: ChatResponse = data.response;

                // Add AI message
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: aiResponse.message
                }]);

                // Handle meal plans
                if (aiResponse.mealPlan) {
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: JSON.stringify({ type: 'meal_plan', plan: aiResponse.mealPlan })
                    }]);
                }

                // Handle order confirmation
                if (aiResponse.orderConfirmation) {
                    setPendingOrder(aiResponse.orderConfirmation);
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: JSON.stringify({ type: 'order_confirmation', ...aiResponse.orderConfirmation })
                    }]);
                }

                // Handle suggested items
                if (aiResponse.suggestedItems && aiResponse.suggestedItems.length > 0) {
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: JSON.stringify({ type: 'suggestions', items: aiResponse.suggestedItems })
                    }]);
                }

            } else {
                throw new Error(data.error || 'Failed to get response');
            }
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'I had a bit of trouble connecting to the kitchen. Could you try asking that again?'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const addItemToCart = (item: any, showCartAfter = true) => {
        // Create a stable ID from the name since Gemini might not return one
        const id = item.name.toLowerCase().replace(/\s+/g, '-');
        addToCart({
            id,
            name: item.name,
            price: item.price
        });
        toast.success(`Added ${item.name} to cart`);
        if (showCartAfter) {
            setIsDrawerOpen(true);
        }
    };

    const handleConfirmOrder = () => {
        if (pendingOrder && pendingOrder.items) {
            pendingOrder.items.forEach((item: any) => {
                addItemToCart(item, false);
            });
            setPendingOrder(null);
            setIsDrawerOpen(true);
            toast.success('Order added to cart! Review and checkout when ready.');
        }
    };

    // Custom renderer for messages
    const renderMessageContent = (msg: ChatMessage) => {
        // Try to parse JSON content for structured messages
        if (typeof msg.content === 'string' && (msg.content.startsWith('{') || msg.content.startsWith('['))) {
            try {
                const parsed = JSON.parse(msg.content);

                // Render Meal Plan
                if (parsed.type === 'meal_plan' || parsed.plan) {
                    const planData = parsed.plan || parsed;
                    return <MealPlanDisplay plan={planData} onAddToCart={(itemName) => {
                        addItemToCart({ name: itemName, price: 0 }); // Fallback price
                    }} />;
                }

                // Render Order Confirmation
                if (parsed.type === 'order_confirmation') {
                    return (
                        <div className="space-y-4 mt-2 w-full">
                            <div className="p-5 rounded-2xl bg-apple-blue/10 border border-apple-blue/20">
                                <p className="text-sm font-black text-white mb-3 uppercase tracking-widest">📋 Order Summary</p>
                                <div className="space-y-2 mb-4">
                                    {parsed.items?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between text-xs">
                                            <span className="text-white/80">{item.name}</span>
                                            <span className="text-green-400 font-mono font-bold">₹{item.price}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-white/10">
                                    <span className="text-sm font-black text-white uppercase">Total</span>
                                    <span className="text-lg font-black text-gradient">₹{parsed.total}</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => {
                                        handleConfirmOrder();
                                        setPendingOrder(parsed);
                                    }}
                                    className="flex-1 bg-white text-black hover:bg-white/90 rounded-xl h-12 font-black uppercase tracking-widest text-xs"
                                >
                                    <Check className="w-4 h-4 mr-2" />
                                    Confirm Order
                                </Button>
                                <Button
                                    onClick={() => setPendingOrder(null)}
                                    variant="outline"
                                    className="flex-1 rounded-xl h-12 font-black uppercase tracking-widest text-xs border-white/10"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    );
                }

                // Render Suggestions
                if (parsed.type === 'suggestions') {
                    return (
                        <div className="space-y-3 mt-2 w-full">
                            <p className="text-sm text-gray-400 mb-2 font-medium">✨ Recommended for you:</p>
                            <div className="grid gap-3">
                                {parsed.items.map((item: any, idx: number) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all group"
                                    >
                                        <div className="flex-1 mr-3">
                                            <div className="flex justify-between items-start">
                                                <p className="font-semibold text-white group-hover:text-blue-400 transition-colors">{item.name}</p>
                                                <p className="text-sm text-green-400 font-mono font-bold">₹{item.price}</p>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1 leading-snug">{item.reason}</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                addItemToCart(item);
                                            }}
                                            className="bg-blue-600 hover:bg-blue-500 text-white rounded-full h-9 w-9 p-0 flex-shrink-0 shadow-lg shadow-blue-900/20 relative z-50 cursor-pointer pointer-events-auto"
                                        >
                                            <Plus className="w-5 h-5 pointer-events-none" />
                                        </Button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    );
                }
            } catch (e) {
                // Not valid JSON, ignore and render as text
            }
        }

        // Default text rendering
        return <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>;
    };

    return (
        <div className="min-h-screen bg-black flex flex-col selection:bg-white/10 relative overflow-hidden">

            <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col p-6 relative z-10">
                {/* Precision Floating Header */}
                <header className={cn(
                    "fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 w-[calc(100%-2rem)] max-w-3xl",
                    isScrolled ? "top-4" : "top-6"
                )}>
                    <div className={cn(
                        "glass-panel rounded-2xl px-6 py-3 flex items-center justify-between transition-all duration-700",
                        isScrolled ? "bg-black/40 backdrop-blur-3xl shadow-premium" : "bg-transparent border-transparent"
                    )}>
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => router.push('/customer')}
                                className="w-10 h-10 rounded-xl hover:bg-white/5 transition-all flex items-center justify-center border border-transparent hover:border-white/10"
                            >
                                <ArrowLeft className="w-5 h-5 text-white/40" />
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white shadow-premium flex items-center justify-center overflow-hidden">
                                    <Image
                                        src="/logo.png"
                                        alt="KURO Logo"
                                        width={36}
                                        height={36}
                                        className="object-cover"
                                    />
                                </div>
                                <div>
                                    <h1 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] leading-none">AI ASSISTANT</h1>
                                    <p className="text-xs font-black text-white mt-1 uppercase tracking-widest">AI MEAL PLANNER</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsDrawerOpen(true)}
                                className="relative w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all flex items-center justify-center group"
                            >
                                <ShoppingCart className="w-5 h-5 text-white/60 group-hover:text-white" />
                                {cart.length > 0 && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-black text-[10px] font-black rounded-lg border-2 border-black flex items-center justify-center shadow-premium"
                                    >
                                        {cart.reduce((acc, item) => acc + item.quantity, 0)}
                                    </motion.div>
                                )}
                            </button>
                            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                                <div className="w-1.5 h-1.5 rounded-full bg-apple-blue animate-pulse shadow-[0_0_10px_rgba(0,122,255,0.8)]" />
                                <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Neural Link Active</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Chat History / Messages */}
                <div className="flex-1 space-y-10 mt-32 mb-32 overflow-y-auto pb-4 custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                        {messages.map((msg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={`flex gap-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="w-11 h-11 rounded-[1.2rem] bg-white shadow-premium flex-shrink-0 flex items-center justify-center mt-1 border border-white/10 transition-transform duration-500 overflow-hidden">
                                        <Image
                                            src="/logo.png"
                                            alt="KURO AI"
                                            width={32}
                                            height={32}
                                            className="object-cover"
                                        />
                                    </div>
                                )}

                                <div className={`
                                        max-w-[85%] p-7 rounded-[2.2rem] shadow-premium relative transition-all duration-500
                                        ${msg.role === 'user'
                                        ? 'bg-white text-black text-sm font-black rounded-tr-sm italic tracking-tight'
                                        : 'glass-panel border-white/5 text-white/80 text-sm font-medium rounded-tl-sm'
                                    }
                                    `}>
                                    {renderMessageContent(msg)}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {loading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                            <div className="w-11 h-11 rounded-[1.2rem] bg-white/5 flex items-center justify-center border border-white/10">
                                <Sparkles className="w-5 h-5 text-apple-blue animate-pulse" />
                            </div>
                            <div className="glass-panel p-6 rounded-[1.5rem] rounded-tl-sm border border-white/10 flex gap-2 items-center">
                                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce delay-75"></span>
                                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce delay-150"></span>
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Chat Input Interface */}
                <div className="fixed bottom-0 left-0 right-0 p-8 bg-linear-to-t from-black via-black/80 to-transparent z-40">
                    <div className="max-w-3xl mx-auto space-y-4">
                        {/* Quick Suggestions */}
                        <AnimatePresence>
                            {suggestions.length > 0 && messages.length === 1 && !input.trim() && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="flex gap-3 overflow-x-auto pb-2 scrollbar-none"
                                >
                                    {suggestions.map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSendMessage(suggestion)}
                                            className="whitespace-nowrap px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-[10px] font-black text-white/80 uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
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
                                    placeholder="ASK THE SYSTEM..."
                                    disabled={loading}
                                    className="w-full h-20 glass-panel border-white/10 rounded-[2rem] px-8 text-sm font-black text-white placeholder-white/10 focus:outline-none focus:border-white/30 focus:ring-[12px] focus:ring-white/[0.03] transition-all shadow-premium tracking-widest uppercase"
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-20 group-focus-within:opacity-100 transition-opacity">
                                    <span className="text-[10px] font-black text-white tracking-[0.2em]">⌘ ENTER</span>
                                </div>
                            </div>
                            <Button
                                onClick={() => handleSendMessage(input)}
                                disabled={loading || !input.trim()}
                                className="w-20 h-20 rounded-[2rem] bg-white text-black hover:bg-white/90 shadow-premium transition-all active:scale-90 flex items-center justify-center p-0 border-none group"
                            >
                                {loading ? <Spinner className="w-8 h-8" /> : <Send className="w-8 h-8 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
