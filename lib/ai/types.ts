import { Timestamp } from 'firebase/firestore'
import { MenuItem } from '../types'

export interface KuroMessage {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: Timestamp
    metadata?: {
        functionCalls?: any[]
        attachments?: any[]
        richContent?: RichContent
        actions?: any[]
        buttons?: QuickAction[]
    }
}

export interface QuickAction {
    label: string
    value: string
    variant?: 'default' | 'primary' | 'outline'
}

export interface RichContent {
    type: 'meal_plan_card' | 'order_preview_card' | 'nutrition_chart' | 'product_carousel'
    data: any
}

export interface KuroSession {
    id: string
    userId: string
    title: string
    messages: KuroMessage[]
    context: SessionContext
    createdAt: Timestamp
    updatedAt: Timestamp
    isActive: boolean
}

export interface SessionContext {
    userPreferences?: UserPreferences
    recentOrders?: string[]
    activeMealPlan?: string
    conversationSummary?: string
}

export interface MealPlan {
    id: string
    userId: string
    type: 'daily' | 'weekly' | 'monthly'
    startDate: Timestamp
    endDate: Timestamp
    meals: PlannedMeal[]
    nutritionTargets: NutritionGoals
    nutritionSummary: NutritionInfo
    dietaryRestrictions: string[]
    generatedBy: 'ai' | 'manual'
    status: 'active' | 'completed' | 'cancelled'
    createdAt: Timestamp
    updatedAt: Timestamp
}

export interface PlannedMeal {
    id: string
    date: Timestamp
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    items: (MenuItem | string)[]
    totalNutrition: NutritionInfo
    notes?: string
    isOrdered: boolean
    orderId?: string
}

export interface NutritionGoals {
    dailyCalories: number
    protein: number
    carbs: number
    fats: number
    fiber?: number
    customGoals?: Record<string, number>
}

export interface NutritionInfo {
    calories: number
    protein: number
    carbs: number
    fats: number
    fiber?: number
    sugar?: number
    sodium?: number
}

export interface UserPreferences {
    userId: string
    dietary: {
        restrictions: string[]
        allergies: string[]
        preferences: string[]
        dislikedIngredients: string[]
    }
    health: {
        goals: string[]
        activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active'
        currentWeight?: number
        targetWeight?: number
        height?: number
        age?: number
        gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say'
    }
    ordering: {
        favoriteItems: string[]
        defaultDeliveryTime?: string
        preferredPaymentMethod?: string
        specialInstructions?: string
    }
    ai: {
        conversationStyle: 'concise' | 'detailed' | 'friendly'
        language: string
        voiceEnabled: boolean
        notificationPreferences: {
            mealReminders: boolean
            nutritionInsights: boolean
            orderUpdates: boolean
        }
    }
    updatedAt: Timestamp
}

export interface KitchenAIAnalytics {
    demandForecasts: DemandForecast[]
    inventoryRecommendations: InventoryRecommendation[]
    performanceMetrics: PerformanceMetric[]
    insights: KitchenInsight[]
    lastUpdated: Timestamp
}

export interface DemandForecast {
    date: Timestamp
    timeSlot: string
    predictedOrders: number
    confidence: number
    recommendedPrepQuantities: Record<string, number>
    basedOn: {
        historicalData: boolean
        campusEvents: boolean
        weatherData: boolean
        dayOfWeek: boolean
    }
}

export interface InventoryRecommendation {
    itemId: string
    itemName: string
    currentStock: number
    recommendedReorder: number
    urgency: 'low' | 'medium' | 'high'
    reasoning: string
    estimatedRunoutDate?: Timestamp
}

export interface PerformanceMetric {
    name: string
    value: number
    unit: string
    trend: 'up' | 'down' | 'stable'
    description: string
}

export interface KitchenInsight {
    id: string
    type: 'efficiency' | 'waste' | 'popularity' | 'cost'
    title: string
    description: string
    impact: 'low' | 'medium' | 'high'
    actionable: boolean
    suggestedAction?: string
    createdAt: Timestamp
}
