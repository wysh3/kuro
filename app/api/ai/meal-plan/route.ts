import { NextRequest, NextResponse } from 'next/server';
import { generateMealPlan } from '@/lib/gemini/meal-planner';
import { getFirebaseDB } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Extract goal from body (can be a string or structured object)
        const goal = typeof body.goal === 'string' ? body.goal : body.goal || 'healthy';
        const daysCount = body.daysCount || 5;
        const budget = body.budget || 500;
        const allergies = body.allergies || [];
        const preferences = body.preferences || [];

        // Map string goals to enum values
        let goalType: 'healthy' | 'budget' | 'protein' | 'weight_loss' | 'custom' = 'custom';
        let customGoal = goal;

        if (goal.toLowerCase().includes('protein') || goal.toLowerCase().includes('💪')) {
            goalType = 'protein';
        } else if (goal.toLowerCase().includes('budget') || goal.toLowerCase().includes('💰')) {
            goalType = 'budget';
        } else if (goal.toLowerCase().includes('healthy') || goal.toLowerCase().includes('🥗')) {
            goalType = 'healthy';
        } else if (goal.toLowerCase().includes('weight') || goal.toLowerCase().includes('⚖️')) {
            goalType = 'weight_loss';
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
                { name: 'Poha', price: 40, category: 'Breakfast', calories: 250, protein: 8, isVeg: true },
                { name: 'Upma', price: 35, category: 'Breakfast', calories: 220, protein: 6, isVeg: true },
                { name: 'Idli Sambar', price: 50, category: 'Breakfast', calories: 280, protein: 10, isVeg: true },
                { name: 'Paneer Tikka', price: 120, category: 'Main Course', calories: 450, protein: 20, isVeg: true },
                { name: 'Dal Tadka with Rice', price: 80, category: 'Main Course', calories: 400, protein: 15, isVeg: true },
                { name: 'Veg Biryani', price: 100, category: 'Main Course', calories: 500, protein: 12, isVeg: true },
                { name: 'Chole Bhature', price: 90, category: 'Main Course', calories: 550, protein: 18, isVeg: true },
                { name: 'Masala Chai', price: 20, category: 'Beverages', calories: 50, protein: 2, isVeg: true },
                { name: 'Coffee', price: 25, category: 'Beverages', calories: 40, protein: 1, isVeg: true },
                { name: 'Samosa', price: 30, category: 'Snacks', calories: 200, protein: 5, isVeg: true },
            ];
        }

        // Generate meal plan
        const plan = await generateMealPlan(
            {
                goal: goalType,
                customGoal: goalType === 'custom' ? customGoal : undefined,
                daysCount: daysCount as 3 | 5 | 7,
                budget,
                allergies,
                preferences
            },
            menuItems
        );

        return NextResponse.json({ success: true, plan });
    } catch (error) {
        console.error('Meal plan generation error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to generate meal plan',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
