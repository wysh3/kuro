import { Timestamp } from 'firebase/firestore'

export interface MenuItem {
    id: string
    name: string
    category: string
    price: number
    available: boolean
    prepTime: number
    image?: string
    description?: string
    createdAt: Timestamp
}

export interface Order {
    id: string
    items: Array<{
        id: string
        name: string
        price: number
        quantity: number
    }>
    total: number
    status: 'kitchen_received' | 'preparing' | 'ready' | 'completed'
    createdAt: Timestamp
    updatedAt?: Timestamp
    userId: string
    paymentMethod?: 'upi' | 'card'
    customerName?: string
    razorpayPaymentId: string
    razorpayOrderId: string
    paymentVerified: boolean
    paidAt: Timestamp
    pickupTime?: Timestamp
    pickupSlot?: string
    discountApplied?: number
    tokenNumber?: number
}

export interface CampusStatus {
    crowdLevel: 'low' | 'medium' | 'high'
    crowdScore: number
    estimatedWait: number
    lastUpdated: Timestamp
    activeOrders: number
    activeOrderIds: string[]
    averagePrepTime: number
    totalPrepTimeRemaining: number
    kitchenCapacity: number
    staffOnline: number
    isManualOverride: boolean
    manualOverrideReason?: string
    calculationMethod: 'auto' | 'manual'
    dailyOrderCount?: number
    lastOrderReset?: Timestamp
}

export interface StationConfig {
    name: string
    categories: string[]
    capacity: number
    cooks: number
}

export interface StationQueue {
    stationName: string
    totalOrders: number
    totalPrepTime: number
    effectiveCapacity: number
    waitTime: number
    items: {
        orderId: string
        itemName: string
        quantity: number
        prepTime: number
    }[]
}

export interface EfficiencyMetrics {
    batchEfficiencyGain: number
    averagePrepTime: number
    totalOrders: number
    totalItems: number
}

export interface CrowdFactors {
    activeOrders: number
    stationBottlenecks: string[]
    rushHour: boolean
    rushHourMultiplier: number
    staffAvailable: number
}

export interface CrowdIntelligenceResult {
    crowdLevel: 'low' | 'medium' | 'high'
    crowdScore: number
    estimatedWait: number
    stationQueues: StationQueue[]
    efficiencyMetrics: EfficiencyMetrics
    factors: CrowdFactors
}
