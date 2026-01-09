import { geminiModel, isMockMode } from './config';

export interface MealPlanRequest {
    goal: 'healthy' | 'budget' | 'protein' | 'weight_loss' | 'custom';
    customGoal?: string;
    budget?: number; // Max spend per week
    allergies?: string[];
    preferences?: string[];
    daysCount: 3 | 5 | 7;
}

export interface MealItem {
    item: string;
    calories: number;
    cost: number;
    protein?: number;
}

export interface DayPlan {
    day: string;
    breakfast: MealItem;
    lunch: MealItem;
    snack?: MealItem;
    dinner?: MealItem;
}

export interface MealPlanResponse {
    plan: DayPlan[];
    summary: {
        totalCost: number;
        avgCaloriesPerDay: number;
        proteinPerDay: number;
    };
    tips: string[];
}

interface MenuItem {
    id?: string;
    name: string;
    price: number;
    category: string;
    calories?: number;
    protein?: number;
    isVeg?: boolean;
    [key: string]: any;
}

// Mock response for testing without API key
function getMockMealPlan(request: MealPlanRequest): MealPlanResponse {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const selectedDays = days.slice(0, request.daysCount);

    const plan: DayPlan[] = selectedDays.map((day, index) => ({
        day,
        breakfast: {
            item: index % 2 === 0 ? 'Poha' : 'Upma',
            calories: 250,
            cost: 40,
            protein: 8
        },
        lunch: {
            item: index % 3 === 0 ? 'Paneer Tikka' : index % 3 === 1 ? 'Dal Tadka with Rice' : 'Veg Biryani',
            calories: 450,
            cost: 120,
            protein: 15
        },
        snack: {
            item: 'Masala Chai',
            calories: 50,
            cost: 20,
            protein: 2
        }
    }));

    return {
        plan,
        summary: {
            totalCost: plan.reduce((sum, day) =>
                sum + day.breakfast.cost + day.lunch.cost + (day.snack?.cost || 0), 0
            ),
            avgCaloriesPerDay: 750,
            proteinPerDay: 25
        },
        tips: [
            'Drink 2L water daily',
            'Walk 10 mins after lunch',
            'Avoid sugary drinks',
            'Include variety in your diet'
        ]
    };
}

export async function generateMealPlan(
    request: MealPlanRequest,
    menuItems: MenuItem[]
): Promise<MealPlanResponse> {
    // Return mock data if in mock mode
    if (isMockMode) {
        console.log('🤖 Using mock meal plan (no API key configured)');
        return getMockMealPlan(request);
    }

    try {
        // 1. Build context-rich prompt
        const menuJSON = JSON.stringify(menuItems.map(item => ({
            name: item.name,
            price: item.price,
            category: item.category,
            calories: item.calories || 300,
            protein: item.protein || 10,
            isVeg: item.isVeg !== false
        })));

        const goalDescriptions: Record<Exclude<MealPlanRequest['goal'], 'custom'>, string> = {
            healthy: 'balanced nutrition with variety',
            budget: `maximum value under ₹${request.budget || 500}/week`,
            protein: 'high protein content (min 20g per meal)',
            weight_loss: 'calorie deficit (1200-1500 cal/day)'
        };

        const prompt = `
You are a nutritionist for Amity University's MRC canteen.

AVAILABLE MENU (VEG + EGG ONLY):
${menuJSON}

STUDENT GOAL: ${request.goal === 'custom' ? request.customGoal : goalDescriptions[request.goal]}

CONSTRAINTS:
- Student budget: ₹${request.budget || 500}/week
- Allergies: ${request.allergies?.join(', ') || 'None'}
- Preferences: ${request.preferences?.join(', ') || 'None'}
- Days: ${request.daysCount}

TASK:
Generate a ${request.daysCount}-day meal plan using ONLY items from the menu above.

FORMAT (JSON):
{
  "plan": [
    {
      "day": "Monday",
      "breakfast": { "item": "Poha", "calories": 250, "cost": 40, "protein": 8 },
      "lunch": { "item": "Paneer Tikka", "calories": 450, "cost": 120, "protein": 20 },
      "snack": { "item": "Masala Chai", "calories": 50, "cost": 20, "protein": 2 }
    }
  ],
  "summary": {
    "totalCost": 480,
    "avgCaloriesPerDay": 1350,
    "proteinPerDay": 45
  },
  "tips": ["Drink 2L water daily", "Walk 10 mins after lunch"]
}

RULES:
1. Use realistic portions
2. Balance nutrients
3. Stay within budget
4. Variety across days
5. No repeats in same day
6. Return ONLY valid JSON, no markdown formatting
`;

        // 2. Call Gemini API
        console.log('🤖 Calling Gemini API...');
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('📝 Gemini response received, length:', text?.length || 0);

        // 3. Parse JSON (handle potential markdown wrapper)
        if (!text || text.trim().length === 0) {
            throw new Error('Empty response from Gemini API');
        }

        const jsonText = text
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        console.log('🔍 Parsing JSON response...');
        const mealPlan: MealPlanResponse = JSON.parse(jsonText);

        console.log('✅ Meal plan generated successfully');
        return mealPlan;
    } catch (error) {
        console.error('❌ Error generating meal plan:', error);
        console.log('⚠️ Falling back to mock meal plan due to error');
        return getMockMealPlan(request);
    }
}
