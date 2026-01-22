import admin from 'firebase-admin'
import { getMenuItems, getOrdersByUserId } from '../firebase/db-admin'
import { MenuItem } from '../types'

// Helper to get value from args regardless of snake_case or camelCase
const norm = (args: any, ...keys: string[]) => {
    for (const key of keys) {
        if (args[key] !== undefined) return args[key]
        // Convert camel to snake
        const snake = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
        if (args[snake] !== undefined) return args[snake]
        // Convert snake to camel (in case we start with camel)
        const camel = key.replace(/(_\w)/g, m => m[1].toUpperCase())
        if (args[camel] !== undefined) return args[camel]
    }
    return undefined
}

async function handleSearchMenuItems(args: any) {
    try {
        const allItems = await getMenuItems()
        const query = norm(args, 'query')?.toLowerCase() || ''

        let filtered = allItems.filter((item) => {
            const matchesName = item.name.toLowerCase().includes(query)
            const matchesCategory = item.category.toLowerCase().includes(query)
            const matchesDescription = item.description?.toLowerCase().includes(query) || false
            const matchesIngredients = item.ingredients?.some((ing: string) => ing.toLowerCase().includes(query)) || false

            return matchesName || matchesCategory || matchesDescription || matchesIngredients
        })

        const category = norm(args, 'category')
        if (category) {
            filtered = filtered.filter((item) => item.category.toLowerCase() === category.toLowerCase())
        }

        const dietaryRestriction = norm(args, 'dietaryRestriction')
        if (dietaryRestriction) {
            const restriction = dietaryRestriction.toLowerCase()
            filtered = filtered.filter((item) => {
                if (restriction === 'vegan') return item.dietaryTags?.includes('vegan')
                if (restriction === 'vegetarian') return item.dietaryTags?.includes('vegetarian')
                if (restriction === 'gluten-free') return item.dietaryTags?.includes('gluten-free')
                if (restriction === 'dairy-free') return item.dietaryTags?.includes('dairy-free')
                return true
            })
        }

        const results = filtered.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            price: item.price,
            description: item.description || '',
            available: item.available,
            dietaryTags: item.dietaryTags || [],
            allergens: item.allergens || []
        }))

        return {
            count: results.length,
            items: results.slice(0, 20),
            message: results.length === 0
                ? `No items found matching "${query}"`
                : `Found ${results.length} item(s) matching "${query}"`
        }
    } catch (error) {
        console.error('Error in handleSearchMenuItems:', error)
        return { error: 'Failed to search menu items' }
    }
}


export async function executeFunction(
    functionName: string,
    args: any,
    userId: string
): Promise<any> {
    console.log(`Executing AI function: ${functionName}`, args)

    switch (functionName) {
        case 'search_menu_items':
            return await handleSearchMenuItems(args)
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
            return await handleForecastDemand(args, userId)
        case 'recommend_inventory':
            return await handleInventoryRecommendations(args, userId)
        case 'show_ui_options':
            return { status: 'success', message: 'Options displayed to user' }
        default:
            throw new Error(`Unknown function: ${functionName}`)
    }
}

async function handlePlaceOrder(args: any, userId: string) {
    try {
        const allItems = await getMenuItems()
        const validatedItems = []

        // Normalize top-level args (Nvidia models often use snake_case)
        const items = norm(args, 'items') || []
        const scheduledTime = norm(args, 'scheduledTime', 'deliveryTime') || 'ASAP'
        const specialInstructions = norm(args, 'specialInstructions') || ''

        for (const orderItem of items) {
            // Support both itemId and item_id
            const idToQuery = norm(orderItem, 'itemId')

            if (!idToQuery) {
                console.warn('Order item missing ID:', orderItem)
                continue
            }

            const menuItem = allItems.find(
                (m) => m.id === idToQuery || m.name.toLowerCase() === idToQuery.toLowerCase()
            )

            if (!menuItem) {
                continue
            }

            if (!menuItem.available) {
                continue
            }

            validatedItems.push({
                id: menuItem.id,
                name: menuItem.name,
                price: menuItem.price,
                quantity: norm(orderItem, 'quantity') || 1,
                customization: norm(orderItem, 'customization') || '',
                nutrition: menuItem.nutrition
            })
        }

        if (validatedItems.length === 0) {
            return {
                error: 'None of the requested items are available',
                requiresConfirmation: false
            }
        }

        const total = validatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        // ... (rest of logic same)
        const totalNutrition = validatedItems.reduce(
            (acc, item) => {
                const nutrition = item.nutrition
                if (nutrition) {
                    return {
                        calories: acc.calories + nutrition.calories * item.quantity,
                        protein: acc.protein + nutrition.protein * item.quantity,
                        carbs: acc.carbs + nutrition.carbs * item.quantity,
                        fats: acc.fats + nutrition.fats * item.quantity
                    }
                }
                return acc
            },
            { calories: 0, protein: 0, carbs: 0, fats: 0 }
        )

        return {
            preview: true,
            items: validatedItems,
            total,
            nutrition: totalNutrition,
            scheduledTime,
            specialInstructions,
            requiresConfirmation: true,
            confirmationMessage: `I've prepared an order for ${validatedItems.length} item(s) totaling ₹${total}. Would you like to add these to your cart?`
        }
    } catch (error) {
        console.error('Error in handlePlaceOrder:', error)
        return { error: 'Failed to process order' }
    }
}

async function handleCreateMealPlan(args: any, userId: string) {
    try {
        const allItems = await getMenuItems()
        const { getUserPreferences, saveMealPlan } = await import('../firebase/ai-db-admin')
        const prefs = await getUserPreferences(userId)

        const duration = norm(args, 'duration') || 'daily'
        const startDateString = norm(args, 'startDate')
        const dietaryRestrictions = norm(args, 'dietaryRestrictions') || prefs?.dietary.restrictions || []
        const mealTypes = norm(args, 'mealTypes') || ['breakfast', 'lunch', 'dinner']

        const filteredItems = allItems.filter((item) => {
            if (!item.available) return false

            if (dietaryRestrictions.includes('vegan') && !item.dietaryTags?.includes('vegan')) return false
            if (dietaryRestrictions.includes('vegetarian') && !item.dietaryTags?.includes('vegetarian'))
                return false
            if (dietaryRestrictions.includes('gluten-free') && !item.dietaryTags?.includes('gluten-free'))
                return false

            if (prefs?.dietary.allergies && item.allergens) {
                const hasAllergen = item.allergens.some((allergen) =>
                    prefs.dietary.allergies.includes(allergen.toLowerCase())
                )
                if (hasAllergen) return false
            }

            return true
        })

        if (filteredItems.length === 0) {
            return {
                error: 'No suitable items found matching your dietary restrictions',
                requiresConfirmation: false
            }
        }

        const planMeals: any[] = []
        const durationDays = duration === 'weekly' ? 7 : duration === 'monthly' ? 30 : 1
        const startDate = new Date(startDateString || new Date())
        const endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + durationDays - 1)

        const { saveMealPlan: savePlan, getUserPreferences: getPrefs } = await import('../firebase/ai-db-admin')
        const userPrefs = await getPrefs(userId)
        const targetCalories = norm(args, 'calorieTarget') || (userPrefs?.health.targetWeight ? 1800 : 2200)

        for (let day = 0; day < durationDays; day++) {
            for (const mealType of mealTypes) {
                const suitableItems = filteredItems.filter((item) => {
                    const name = item.name.toLowerCase()
                    if (mealType === 'breakfast') return name.includes('breakfast') || name.includes('oatmeal')
                    if (mealType === 'lunch') return name.includes('rice') || name.includes('burger')
                    if (mealType === 'dinner') return name.includes('chicken') || name.includes('meal')
                    return true
                })

                const selectedItem = suitableItems[Math.floor(Math.random() * suitableItems.length)] || filteredItems[0]

                planMeals.push({
                    mealType,
                    items: [selectedItem],
                    calories: selectedItem.nutrition?.calories || 400,
                    protein: selectedItem.nutrition?.protein || 20,
                    carbs: selectedItem.nutrition?.carbs || 50,
                    fats: selectedItem.nutrition?.fats || 15
                })
            }
        }

        const totalCalories = planMeals.reduce((sum, m) => sum + m.calories, 0)
        const totalProtein = planMeals.reduce((sum, m) => sum + m.protein, 0)
        const totalCarbs = planMeals.reduce((sum, m) => sum + m.carbs, 0)
        const totalFats = planMeals.reduce((sum, m) => sum + m.fats, 0)

        const planId = await savePlan(userId, {
            userId,
            type: duration,
            startDate: admin.firestore.Timestamp.fromDate(startDate),
            endDate: admin.firestore.Timestamp.fromDate(endDate),
            meals: planMeals.map((m, idx) => ({
                id: Math.random().toString(36).substr(2, 9),
                date: admin.firestore.Timestamp.fromDate(new Date(startDate.getTime() + Math.floor(idx / 3) * 24 * 60 * 60 * 1000)),
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
                protein: norm(args, 'proteinTarget') || 150,
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
            planId,
            plan: planMeals,
            summary: {
                avgCaloriesPerDay: Math.round(totalCalories / durationDays),
                proteinPerDay: Math.round(totalProtein / durationDays),
                calories: Math.round(totalCalories / durationDays),
                protein: Math.round(totalProtein / durationDays),
                carbs: Math.round(totalCarbs / durationDays),
                fats: Math.round(totalFats / durationDays)
            },
            message: `I've created a ${duration} meal plan with ${planMeals.length} meals averaging ${Math.round(totalCalories / durationDays)} calories per day!`
        }
    } catch (error) {
        console.error('Error in handleCreateMealPlan:', error)
        return { error: 'Failed to create meal plan' }
    }
}

async function handleGetNutritionInfo(args: any) {
    try {
        const allItems = await getMenuItems()
        const itemIds = norm(args, 'itemIds') || []
        const info = itemIds.map((id: string) => {
            const item = allItems.find((m) => m.id === id || m.name.toLowerCase() === id.toLowerCase())
            if (!item) return null
            return {
                id: item.id,
                name: item.name,
                nutrition: item.nutrition,
                allergens: item.allergens || [],
                dietaryTags: item.dietaryTags || [],
                ingredients: item.ingredients || []
            }
        }).filter(Boolean)

        return { info }
    } catch (error) {
        return { error: 'Failed to fetch nutrition info' }
    }
}

async function handleAnalyzePatterns(args: any, userId: string) {
    try {
        const orders = await getOrdersByUserId(userId)
        const timeRange = norm(args, 'timeRange') || 'month'

        if (orders.length === 0) {
            return {
                insight: "You haven't placed any orders yet. Once you do, I can analyze your eating patterns!",
                totalOrders: 0,
                spending: 0
            }
        }

        const totalSpending = orders.reduce((sum, o) => sum + (o.total || 0), 0)
        const itemFrequency: Record<string, number> = {}

        orders.forEach((order) => {
            order.items?.forEach((item) => {
                const name = item.name
                itemFrequency[name] = (itemFrequency[name] || 0) + (item.quantity || 1)
            })
        })

        const frequentItems = Object.entries(itemFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name]) => name)

        return {
            period: timeRange,
            totalOrders: orders.length,
            frequentItems,
            spending: totalSpending,
            insight: `Based on your ${orders.length} orders, your most frequent choice is ${frequentItems[0] || 'none'}. You've spent ₹${totalSpending} this ${timeRange}.`
        }
    } catch (error) {
        console.error('Error in handleAnalyzePatterns:', error)
        return { error: 'Failed to analyze patterns' }
    }
}

async function handleGetRecommendations(args: any, userId: string) {
    try {
        const { getUserPreferences } = await import('../firebase/ai-db-admin')
        const prefs = await getUserPreferences(userId)
        const allItems = await getMenuItems()
        const orders = await getOrdersByUserId(userId)

        const itemFrequency: Record<string, number> = {}
        orders.forEach((order) => {
            order.items?.forEach((item) => {
                itemFrequency[item.id] = (itemFrequency[item.id] || 0) + (item.quantity || 1)
            })
        })

        let filtered = allItems.filter((item) => {
            if (!item.available) return false

            if (prefs?.dietary.restrictions) {
                if (prefs.dietary.restrictions.includes('vegan') && !item.dietaryTags?.includes('vegan')) return false
                if (prefs.dietary.restrictions.includes('vegetarian') && !item.dietaryTags?.includes('vegetarian'))
                    return false
                if (prefs.dietary.restrictions.includes('gluten-free') && !item.dietaryTags?.includes('gluten-free'))
                    return false
            }

            if (prefs?.dietary.allergies && item.allergens) {
                const hasAllergen = item.allergens.some((allergen) =>
                    prefs.dietary.allergies.includes(allergen.toLowerCase())
                )
                if (hasAllergen) return false
            }

            return true
        })

        const contextParam = norm(args, 'context')
        const scored = filtered.map((item) => {
            let score = 0

            if (itemFrequency[item.id]) score += itemFrequency[item.id] * 10

            if (contextParam) {
                const context = contextParam.toLowerCase()
                const name = item.name.toLowerCase()

                if (context === 'breakfast' && (name.includes('breakfast') || name.includes('oatmeal'))) score += 20
                if (context === 'lunch' && (name.includes('rice') || name.includes('burger'))) score += 20
                if (context === 'healthy' && item.nutrition && item.nutrition.calories < 500) score += 15
                if (context === 'post-workout' && item.nutrition && item.nutrition.protein > 20) score += 25
            }

            if (prefs?.health.goals) {
                if (prefs.health.goals.includes('weight-loss') && item.nutrition && item.nutrition.calories < 400)
                    score += 10
                if (prefs.health.goals.includes('muscle-gain') && item.nutrition && item.nutrition.protein > 25)
                    score += 15
            }

            return { ...item, matchScore: score / 100 }
        })

        const recommended = scored
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, norm(args, 'maxItems') || 5)
            .map((item) => ({
                id: item.id,
                name: item.name,
                price: item.price,
                description: item.description,
                nutrition: item.nutrition,
                matchScore: Math.min(item.matchScore, 0.99)
            }))

        return { recommendations: recommended }
    } catch (error) {
        console.error('Error in handleGetRecommendations:', error)
        const allItems = await getMenuItems()
        const fallback = allItems
            .filter((item) => item.available)
            .slice(0, norm(args, 'maxItems') || 3)
            .map((item) => ({
                id: item.id,
                name: item.name,
                price: item.price,
                description: item.description,
                matchScore: 0.5
            }))
        return { recommendations: fallback }
    }
}

async function handleForecastDemand(args: any, userId: string) {
    const targetDate = norm(args, 'date')
    try {
        const { getAllOrders } = await import('../firebase/db')
        // For forecast, we analyze GLOBAL trends, not just user trends
        const orders = await getAllOrders()
        const allOrders = orders.filter((o) => o.createdAt)

        if (allOrders.length < 5) {
            return {
                date: targetDate,
                predictedOrders: 0,
                confidence: 0.3,
                peakHours: [],
                message: 'Not enough historical data for accurate forecasting. Need at least 5 total system orders.'
            }
        }

        const hourCounts: Record<number, number> = {}
        allOrders.forEach((order) => {
            const hour = new Date(order.createdAt.toDate()).getHours()
            hourCounts[hour] = (hourCounts[hour] || 0) + 1
        })

        const peakHours = Object.entries(hourCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([hour]) => `${hour}:00`)

        // Simple moving average for basic forecasting
        const uniqueDays = new Set(allOrders.map(o => new Date(o.createdAt.toDate()).toDateString())).size || 1
        const avgOrdersPerDay = allOrders.length / uniqueDays
        const predictedOrders = Math.round(avgOrdersPerDay * (args.multiplier || 1.1)) // 10% growth assumption

        return {
            date: targetDate,
            predictedOrders,
            confidence: uniqueDays > 7 ? 0.8 : 0.5,
            peakHours,
            message: `Based on ${allOrders.length} total orders across ${uniqueDays} days, we expect ~${predictedOrders} orders. Peak usage is usually around ${peakHours.join(', ')}.`
        }
    } catch (error) {
        console.error('Error in handleForecastDemand:', error)
        return {
            date: targetDate,
            predictedOrders: 0,
            confidence: 0,
            peakHours: [],
            message: 'Unable to forecast demand at this time.'
        }
    }
}

async function handleInventoryRecommendations(args: any, userId: string) {
    try {
        const allItems = await getMenuItems()
        const { getAllOrders } = await import('../firebase/db')
        const orders = await getAllOrders()
        const forecastDays = norm(args, 'forecastDays') || 3

        const itemDemand: Record<string, number> = {}
        orders.forEach((order) => {
            order.items?.forEach((item) => {
                itemDemand[item.id] = (itemDemand[item.id] || 0) + (item.quantity || 1)
            })
        })

        const recommendations = Object.entries(itemDemand)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([itemId, demand]) => {
                const item = allItems.find((m) => m.id === itemId)
                // Assuming "demand" is total historical. 
                // We need daily rate.
                const uniqueDays = new Set(orders.map(o => new Date(o.createdAt.toDate()).toDateString())).size || 1
                const avgDailyDemand = demand / uniqueDays
                const recommendedStock = Math.ceil(avgDailyDemand * forecastDays)

                return {
                    itemId,
                    itemName: item?.name || 'Unknown',
                    currentStock: 0, // We don't track real stock yet in DB, assum 0 for 'needs refill'
                    recommendedReorder: recommendedStock,
                    urgency: recommendedStock > 50 ? 'high' : recommendedStock > 20 ? 'medium' : 'low',
                    reasoning: `High velocity item: ${demand} sold total (${avgDailyDemand.toFixed(1)}/day).`
                }
            })

        return {
            recommendations,
            message: `Generated ${recommendations.length} inventory recommendations based on global demand velocity.`
        }
    } catch (error) {
        console.error('Error in handleInventoryRecommendations:', error)
        return {
            recommendations: [],
            message: 'Unable to generate inventory recommendations at this time.'
        }
    }
}
