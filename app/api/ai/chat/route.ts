import { NextRequest, NextResponse } from 'next/server';
import { chatWithAgent, ChatMessage } from '@/lib/gemini/chat-agent';
import { getFirebaseDB } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, conversationHistory = [], userPreferences = {} } = body;

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Message is required' },
                { status: 400 }
            );
        }

        // Fetch menu items from Firestore
        let menuItems: any[] = [];
        try {
            const db = getFirebaseDB();
            const menuSnapshot = await getDocs(collection(db, 'menu_items'));
            menuItems = menuSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching menu items:', error);
            // Use mock menu if Firestore fails
            menuItems = [
                { id: '1', name: 'Poha', price: 40, category: 'Breakfast', calories: 250, protein: 8, isVeg: true },
                { id: '2', name: 'Upma', price: 35, category: 'Breakfast', calories: 220, protein: 6, isVeg: true },
                { id: '3', name: 'Idli Sambar', price: 50, category: 'Breakfast', calories: 280, protein: 10, isVeg: true },
                { id: '4', name: 'Paneer Tikka', price: 120, category: 'Main Course', calories: 450, protein: 20, isVeg: true },
                { id: '5', name: 'Dal Tadka with Rice', price: 80, category: 'Main Course', calories: 400, protein: 15, isVeg: true },
                { id: '6', name: 'Veg Biryani', price: 100, category: 'Main Course', calories: 500, protein: 12, isVeg: true },
                { id: '7', name: 'Chole Bhature', price: 90, category: 'Main Course', calories: 550, protein: 18, isVeg: true },
                { id: '8', name: 'Masala Chai', price: 20, category: 'Beverages', calories: 50, protein: 2, isVeg: true },
                { id: '9', name: 'Coffee', price: 25, category: 'Beverages', calories: 40, protein: 1, isVeg: true },
                { id: '10', name: 'Samosa', price: 30, category: 'Snacks', calories: 200, protein: 5, isVeg: true },
            ];
        }

        // Call chat agent
        const response = await chatWithAgent(message, {
            menuItems,
            conversationHistory: conversationHistory as ChatMessage[],
            userPreferences
        });

        return NextResponse.json({ success: true, response });
    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to process chat message',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
