'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TimeSlot } from '@/lib/time-slots';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (item: { id: string; name: string; price: number }) => void;
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;
    cartTotal: number;
    cartCount: number;
    selectedSlot: TimeSlot | null;
    setSelectedSlot: (slot: TimeSlot | null) => void;
    discountAmount: number;
    finalTotal: number;
    isDrawerOpen: boolean;
    setIsDrawerOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Load cart from local storage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('mrc-cart');
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error('Failed to parse cart from local storage');
            }
        }
    }, []);

    // Save cart to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem('mrc-cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product: { id: string; name: string; price: number }) => {
        setCart((prevCart) => {
            const existing = prevCart.find((item) => item.id === product.id);
            if (existing) {
                return prevCart.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart((prevCart) =>
            prevCart
                .map((item) => (item.id === productId ? { ...item, quantity: item.quantity - 1 } : item))
                .filter((item) => item.quantity > 0)
        );
    };

    const clearCart = () => setCart([]);

    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Calculate discount based on selected slot
    const discountPercent = selectedSlot?.discountPercent || 0;
    const discountAmount = Math.round((cartTotal * discountPercent) / 100);
    const finalTotal = cartTotal - discountAmount;

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            clearCart,
            cartTotal,
            cartCount,
            selectedSlot,
            setSelectedSlot,
            discountAmount,
            finalTotal,
            isDrawerOpen,
            setIsDrawerOpen
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
