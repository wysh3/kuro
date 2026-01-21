import { createOrder, getMenuItem, getMenuItems, getOrdersByUserId } from '../firebase/db'
import { Timestamp } from 'firebase/firestore'
import { MenuItem, Order } from '../types'

export async function executeFunction(
    functionName: string,
    args: any,
    userId: string
): Promise<any> {
    console.log(`Executing AI function: ${functionName}`, args)

    switch (functionName) {
        case 'place_order':
            return await handlePlaceOrder(args, userId)

        case 'create_meal_plan':
            return await handleCreateMealPlan(args, userId)

        case 'get_nutrition_info':
            return await handleGetNutritionInfo(args)

        case 'analyze_eating_patterns':
            return await handleAnalyzePatterns(args, userId)

        case 'get_recommendations':
            return await handleGetRecommendations(args, userId)

        case 'forecast_kitchen_demand':
            return await handleForecastDemand(args)

        case 'recommend_inventory':
            return await handleInventoryRecommendations(args)

        default:
            throw new Error(`Unknown function: ${functionName}`)
    }
}

async function handlePlaceOrder(args: any, userId: string) {
    try {
        const items = await Promise.all(
            args.items.map(async (item: any) => {
                const menuItem = await getMenuItem(item.itemId)
                if (!menuItem) throw new Error(`Item ${item.itemId} not found`)
                return {
                    id: menuItem.id,
                    name: menuItem.name,
                    price: menuItem.price,
                    quantity: item.quantity,
                    customization: item.customization
                }
            })
        )

        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

        // Return preview for confirmation
        return {
            preview: true,
            items,
            total,
            scheduledTime: args.scheduledTime || 'ASAP',
            specialInstructions: args.specialInstructions,
            requiresConfirmation: true,
            message: `I've prepared an order for ${items.length} items totaling ₹${total}. Would you like me to place it?`
        }
    } catch (error) {
        console.error('Error in handlePlaceOrder:', error)
        return { error: 'Failed to prepare order' }
    }
}

async function handleCreateMealPlan(args: any, userId: string) {
    try {
        const allItems = await getMenuItems()
        const dietaryRestrictions = args.dietaryRestrictions || []

        // Filter items based on dietary restrictions
        const allowedItems = allItems.filter(item => {
            if (!item.available) return false
            if (dietaryRestrictions.length === 0) return true
            return dietaryRestrictions.every((res: string) =>
                item.dietaryTags?.includes(res.toLowerCase()) ||
                !item.allergens?.includes(res.toLowerCase())
            )
        })

        const mealTypes = args.mealTypes || ['breakfast', 'lunch', 'dinner']
        const planMeals = []
        let totalCalories = 0
        let totalProtein = 0
        let totalCarbs = 0
        let totalFats = 0

        // Simple heuristic: pick one item for each meal type
        for (const type of mealTypes) {
            const typeItems = allowedItems.filter(item => {
                if (type === 'breakfast') return item.category.toLowerCase().includes('breakfast')
                if (type === 'snack') return item.category.toLowerCase().includes('snack') || item.category.toLowerCase().includes('beverages')
                return !item.category.toLowerCase().includes('breakfast') && !item.category.toLowerCase().includes('beverages')
            })

            const selected = typeItems.length > 0
                ? typeItems[Math.floor(Math.random() * typeItems.length)]
                : allowedItems[Math.floor(Math.random() * allowedItems.length)]

            if (selected) {
                planMeals.push({
                    mealType: type,
                    items: [selected.name],
                    calories: selected.nutrition?.calories || 0,
                    protein: selected.nutrition?.protein || 0,
                    carbs: selected.nutrition?.carbs || 0,
                    fats: selected.nutrition?.fats || 0
                })
                totalCalories += selected.nutrition?.calories || 0
                totalProtein += selected.nutrition?.protein || 0
                totalCarbs += selected.nutrition?.carbs || 0
                totalFats += selected.nutrition?.fats || 0
            }
        }

        const durationDays = args.duration === 'weekly' ? 7 : args.duration === 'monthly' ? 30 : 1
        const startDate = new Date(args.startDate || new Date())
        const endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + durationDays - 1)

        const { saveMealPlan, getUserPreferences } = await import('../firebase/ai-db')
        const prefs = await getUserPreferences(userId)
        const targetCalories = args.calorieTarget || prefs?.health.targetWeight ? 1800 : 2200

        const planId = await saveMealPlan(userId, {
            userId,
            type: args.duration,
            startDate: Timestamp.fromDate(startDate),
            endDate: Timestamp.fromDate(endDate),
            meals: planMeals.map((m, idx) => ({
                id: Math.random().toString(36).substr(2, 9),
                date: Timestamp.fromDate(new Date(startDate.getTime() + (Math.floor(idx / 3) * 24 * 60 * 60 * 1000))),
                mealType: m.mealType as any,
                items: m.items,
                totalNutrition: {
                    calories: m.calories,
                    protein: m.protein,
                    carbs: m.carbs,
                    fats: m.fats
                },
                isOrdered: false
            })),
            nutritionTargets: {
                dailyCalories: targetCalories,
                protein: 150,
                carbs: 200,
                fats: 60
            },
            nutritionSummary: {
                calories: totalCalories,
                protein: totalProtein,
                carbs: totalCarbs,
                fats: totalFats
            },
            dietaryRestrictions,
            generatedBy: 'ai',
            status: 'active'
        })

        return {
            success: true,
            planId,
            plan: {
                type: args.duration,
                startDate: args.startDate || new Date().toISOString(),
                meals: planMeals,
                nutritionSummary: {
                    calories: totalCalories,
                    protein: totalProtein,
                    carbs: totalCarbs,
                    fats: totalFats
                }
            },
            message: `I've created and saved a ${args.duration} meal plan for you.`
        }
    } catch (error) {
        console.error('Error in handleCreateMealPlan:', error)
        return { error: 'Failed to generate meal plan' }
    }
}

async function handleGetNutritionInfo(args: any) {
    try {
        const info = await Promise.all(
            args.itemIds.map(async (id: string) => {
                const item = await getMenuItem(id)
                return {
                    id,
                    name: item?.name,
                    nutrition: item?.nutrition,
                    allergens: args.includeAllergens ? item?.allergens : undefined
                }
            })
        )
        return { info }
    } catch (error) {
        return { error: 'Failed to fetch nutrition info' }
    }
}

async function handleAnalyzePatterns(args: any, userId: string) {
    try {
        const orders = await getOrdersByUserId(userId)

        if (orders.length === 0) {
            return {
                insight: "You haven't placed any orders yet. Once you do, I can analyze your eating patterns!",
                totalOrders: 0,
                spending: 0
            }
        }

        const totalSpending = orders.reduce((sum, o) => sum + (o.total || 0), 0)
        const itemFrequency: Record<string, number> = {}
        let totalProt = 0
        let orderCountWithNutr = 0

        orders.forEach(order => {
            order.items?.forEach(item => {
                const name = item.name
                itemFrequency[name] = (itemFrequency[name] || 0) + (item.quantity || 1)
            })
        })

        const frequentItems = Object.entries(itemFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name]) => name)

        return {
            period: args.timeRange,
            totalOrders: orders.length,
            frequentItems,
            spending: totalSpending,
            insight: `Based on your ${orders.length} orders, your most frequent choice is ${frequentItems[0] || 'none'}. You've spent ₹${totalSpending} this ${args.timeRange}.`
        }
    } catch (error) {
        console.error('Error in handleAnalyzePatterns:', error)
        return { error: 'Failed to analyze patterns' }
    }
}

async function handleGetRecommendations(args: any, userId: string) {
    const allItems = await getMenuItems()
    // Basic filtering for mock
    const recommended = allItems
        .filter(item => item.available)
        .slice(0, args.maxItems || 3)
        .map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            description: item.description,
            matchScore: 0.95
        }))

    return { recommendations: recommended }
}

async function handleForecastDemand(args: any) {
    return {
        date: args.date,
        predictedOrders: 45,
        confidence: 0.88,
        peakHours: ['12:30', '13:30', '19:00'],
        message: "High demand expected during lunch rush."
    }
}

async function handleInventoryRecommendations(args: any) {
    return {
        recommendations: [
            { itemName: 'Chicken Patties', currentStock: 12, recommendedReorder: 50, urgency: 'high' },
            { itemName: 'Burger Buns', currentStock: 8, recommendedReorder: 100, urgency: 'high' }
        ]
    }
}
