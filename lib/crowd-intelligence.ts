import { Order, MenuItem, StationConfig, StationQueue, EfficiencyMetrics, CrowdFactors, CrowdIntelligenceResult } from './types'

export const STATIONS: StationConfig[] = [
  {
    name: 'Pizza Oven',
    categories: ['Pizza'],
    capacity: 3,
    cooks: 1
  },
  {
    name: 'Tandoor/Grill',
    categories: ['Starters', 'Bread'],
    capacity: 2,
    cooks: 2
  },
  {
    name: 'Rice/Curry Pot',
    categories: ['Rice', 'Curry'],
    capacity: 2,
    cooks: 2
  },
  {
    name: 'Beverage Counter',
    categories: ['Beverages', 'Desserts'],
    capacity: 1,
    cooks: 1
  },
  {
    name: 'Bread Station',
    categories: ['Bread'],
    capacity: 3,
    cooks: 1
  }
]

export function calculateBatchPrepTime(
  baseTime: number,
  quantity: number
): number {
  if (quantity <= 1) return baseTime;

  let totalTime = baseTime;

  if (quantity >= 2) {
    totalTime += baseTime * 0.8;
  }

  if (quantity >= 3) {
    totalTime += baseTime * 0.6 * (quantity - 2);
  }

  return Math.round(totalTime);
}

export function calculateComplexityMultiplier(itemCount: number): number {
  if (itemCount <= 4) return 1.0;
  if (itemCount <= 7) return 1.25;
  return 1.5;
}

export function calculateStationQueue(
  orders: Order[],
  menuItems: MenuItem[],
  station: StationConfig
): StationQueue {
  let totalPrepTime = 0;
  let totalOrders = 0;
  const items: StationQueue['items'] = [];

  orders.forEach(order => {
    const orderItems = order.items.filter(item =>
      station.categories.some(cat => menuItems.find(m => m.id === item.id)?.category === cat)
    );

    if (orderItems.length === 0) return;

    totalOrders++;

    const complexityMultiplier = calculateComplexityMultiplier(order.items.length);

    orderItems.forEach(orderItem => {
      const menuItem = menuItems.find(m => m.id === orderItem.id);
      if (!menuItem) return;

      const batchTime = calculateBatchPrepTime(
        menuItem.prepTime,
        orderItem.quantity
      );

      const weightedTime = batchTime * complexityMultiplier;

      totalPrepTime += weightedTime;

      items.push({
        orderId: order.id,
        itemName: orderItem.name,
        quantity: orderItem.quantity,
        prepTime: weightedTime
      });
    });
  });

  const effectiveCapacity = station.cooks * station.capacity;
  const waitTime = Math.ceil(totalPrepTime / effectiveCapacity);

  return {
    stationName: station.name,
    totalOrders,
    totalPrepTime: Math.round(totalPrepTime),
    effectiveCapacity,
    waitTime,
    items
  };
}

export function calculateCrowdIntelligence(
  activeOrders: Order[],
  menuItems: MenuItem[],
  currentHour: number
): CrowdIntelligenceResult {
  const stationQueues = STATIONS.map(station =>
    calculateStationQueue(activeOrders, menuItems, station)
  );

  const bottleneck = stationQueues.reduce((max, queue) =>
    queue.waitTime > max.waitTime ? queue : max
  );

  const maxWaitTime = bottleneck.waitTime;

  const isRushHour =
    (currentHour >= 12 && currentHour <= 13) ||
    (currentHour >= 17 && currentHour <= 18);

  const rushHourMultiplier = isRushHour ? 1.3 : 1.0;

  const adjustedWaitTime = Math.ceil(maxWaitTime * rushHourMultiplier);

  const totalItems = activeOrders.reduce((sum, order) => sum + order.items.reduce((s, i) => s + i.quantity, 0), 0);
  const averagePrepTime = Math.round(stationQueues.reduce((sum, q) => sum + q.totalPrepTime, 0) / Math.max(activeOrders.length, 1));

  const individualTotalTime = activeOrders.reduce((sum, order) => {
    return sum + order.items.reduce((s, item) => {
      const menuItem = menuItems.find(m => m.id === item.id);
      return s + (menuItem?.prepTime || 0) * item.quantity;
    }, 0);
  }, 0);

  const batchTotalTime = stationQueues.reduce((sum, q) => sum + q.totalPrepTime, 0);
  const batchEfficiencyGain = Math.round(individualTotalTime - batchTotalTime);

  const activeOrdersCount = activeOrders.length;
  const normalizedOrders = Math.min(activeOrdersCount * 10, 40);
  const normalizedWait = Math.min(adjustedWaitTime * 2, 40);
  const bottleneckPenalty = Math.min(bottleneck.totalOrders * 3, 20);

  const crowdScore = Math.min(
    100,
    normalizedOrders + normalizedWait + bottleneckPenalty
  );

  let crowdLevel: 'low' | 'medium' | 'high';
  if (crowdScore < 30) crowdLevel = 'low';
  else if (crowdScore < 65) crowdLevel = 'medium';
  else crowdLevel = 'high';

  const stationBottlenecks = stationQueues
    .filter(q => q.waitTime >= adjustedWaitTime * 0.8)
    .map(q => q.stationName);

  return {
    crowdLevel,
    crowdScore,
    estimatedWait: adjustedWaitTime,
    stationQueues,
    efficiencyMetrics: {
      batchEfficiencyGain,
      averagePrepTime,
      totalOrders: activeOrdersCount,
      totalItems
    },
    factors: {
      activeOrders: activeOrdersCount,
      stationBottlenecks,
      rushHour: isRushHour,
      rushHourMultiplier,
      staffAvailable: STATIONS.reduce((sum, s) => sum + s.cooks, 0)
    }
  };
}

export async function updateCrowdStatus() {
  const { getFirebaseDB } = await import('./firebase/config');
  const { collection, where, getDocs, query } = await import('firebase/firestore');

  const db = getFirebaseDB();

  try {
    const activeOrdersSnapshot = await getDocs(
      query(
        collection(db, 'orders'),
        where('status', 'in', ['kitchen_received', 'preparing'])
      )
    );

    const activeOrders = activeOrdersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));

    const menuItemsSnapshot = await getDocs(collection(db, 'menu_items'));
    const menuItems = menuItemsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MenuItem));

    const currentHour = new Date().getHours();
    const intelligence = calculateCrowdIntelligence(
      activeOrders,
      menuItems,
      currentHour
    );

    const { updateCampusStatus } = await import('./firebase/status');
    await updateCampusStatus({
      activeOrders: intelligence.factors.activeOrders,
      activeOrderIds: activeOrders.map(o => o.id),
      averagePrepTime: intelligence.efficiencyMetrics.averagePrepTime,
      totalPrepTimeRemaining: intelligence.stationQueues.reduce((sum, q) => sum + q.totalPrepTime, 0),
      kitchenCapacity: STATIONS.reduce((sum, s) => sum + s.cooks * s.capacity, 0),
      staffOnline: intelligence.factors.staffAvailable,
      crowdLevel: intelligence.crowdLevel,
      crowdScore: intelligence.crowdScore,
      estimatedWait: intelligence.estimatedWait,
      isManualOverride: false,
      calculationMethod: 'auto' as const
    });

    console.log('✅ Crowd status updated:', {
      level: intelligence.crowdLevel,
      wait: intelligence.estimatedWait,
      score: intelligence.crowdScore,
      batchEfficiency: `${intelligence.efficiencyMetrics.batchEfficiencyGain} min saved`
    });

  } catch (error) {
    console.error('❌ Error updating crowd status:', error);
    throw error;
  }
}
