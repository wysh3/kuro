import { MenuItem, toggleMenuItemAvailability, subscribeToMenuItems, getMenuItems as getFirebaseMenuItems } from './firebase/db'

interface MenuStats {
  total: number
  available: number
  unavailable: number
}

let cachedMenuItems: MenuItem[] = []

// Initialize cached menu items
if (typeof window !== 'undefined') {
  const unsubscribe = subscribeToMenuItems(
    (items) => {
      cachedMenuItems = items
    },
    (error) => {
      console.error('Menu subscription error:', error)
    }
  )
}

export const MenuManager = {
  // Get current menu items from cache
  getMenuItems: (): MenuItem[] => {
    return cachedMenuItems
  },

  // Update menu item availability in Firestore
  setAvailability: async (itemId: string, available: boolean): Promise<void> => {
    try {
      await toggleMenuItemAvailability(itemId)
      
      // Emit event for backward compatibility
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('menuUpdated', { detail: { itemId, available } })
        window.dispatchEvent(event)
      }
    } catch (error) {
      console.error('Failed to update availability:', error)
      throw error
    }
  },

  // Check if item is available
  isAvailable: (itemId: string): boolean => {
    const item = cachedMenuItems.find((i) => i.id === itemId)
    return item?.available ?? true
  },

  // Get availability stats
  getStats: (): MenuStats => {
    return {
      total: cachedMenuItems.length,
      available: cachedMenuItems.filter((i) => i.available).length,
      unavailable: cachedMenuItems.filter((i) => !i.available).length,
    }
  },

  // Subscribe to real-time menu updates
  subscribe: subscribeToMenuItems,
}

export type { MenuItem, MenuStats }
