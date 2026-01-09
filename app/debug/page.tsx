'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertCircle } from 'lucide-react'
import { getAllOrders, getMenuItems, subscribeToOrders, subscribeToMenuItems } from '@/lib/firebase/db'

export default function DebugPage() {
  const [data, setData] = useState<any>({})
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribeOrders = subscribeToOrders(
      (orders) => {
        const user = localStorage.getItem('user')
        setData((prev: any) => ({
          ...prev,
          user: user ? JSON.parse(user) : null,
          orders,
          timestamp: new Date().toLocaleString(),
        }))
        setLoading(false)
      },
      (firebaseError) => {
        console.error('Orders subscription error:', firebaseError)
        setError(firebaseError.message)
        setLoading(false)
      }
    )

    const unsubscribeMenu = subscribeToMenuItems(
      (menuItems) => {
        setData((prev: any) => ({
          ...prev,
          menuItems,
          timestamp: new Date().toLocaleString(),
        }))
        setLoading(false)
      },
      (firebaseError) => {
        console.error('Menu subscription error:', firebaseError)
        setError(firebaseError.message)
        setLoading(false)
      }
    )

    const user = localStorage.getItem('user')
    setData((prev: any) => ({
      ...prev,
      user: user ? JSON.parse(user) : null,
    }))

    return () => {
      unsubscribeOrders()
      unsubscribeMenu()
    }
  }, [])

  const refreshData = async () => {
    setRefreshing(true)
    try {
      const orders = await getAllOrders()
      const menuItems = await getMenuItems()
      const user = localStorage.getItem('user')

      setData({
        user: user ? JSON.parse(user) : null,
        orders,
        menuItems,
        timestamp: new Date().toLocaleString(),
      })
    } catch (err) {
      console.error('Error refreshing data:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh data')
    } finally {
      setRefreshing(false)
    }
  }

  const clearAll = () => {
    if (confirm('Clear all localStorage data?')) {
      localStorage.clear()
      setData((prev: any) => ({ ...prev, user: null }))
      alert('All data cleared')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading debug data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Debug Console</h1>
          <div className="flex gap-2">
            <Button onClick={refreshData} disabled={refreshing} variant="outline">
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button onClick={clearAll} variant="destructive">
              Clear All
            </Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">Last updated: {data.timestamp}</div>

        {/* User Data */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>👤 User</span>
              {data.user && <Badge variant="outline">{data.user.type}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.user ? (
              <pre className="text-xs bg-secondary/30 p-4 rounded overflow-x-auto">
                {JSON.stringify(data.user, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground">No user logged in</p>
            )}
          </CardContent>
        </Card>

        {/* Orders */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📦 Orders ({data.orders?.length || 0})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.orders && data.orders.length > 0 ? (
              <div className="space-y-4">
                {data.orders.map((order: any) => (
                  <div key={order.id} className="bg-secondary/30 p-4 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold">{order.id}</span>
                      <Badge>{order.status}</Badge>
                    </div>
                    <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                      {JSON.stringify(
                        {
                          items: order.items.length,
                          total: order.total,
                          createdAt: order.createdAt,
                          userId: order.userId,
                        },
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No orders yet</p>
            )}
          </CardContent>
        </Card>

        {/* Menu Items */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🍽️ Menu Items ({data.menuItems?.length || 0})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.menuItems && data.menuItems.length > 0 ? (
              <div className="space-y-2">
                {data.menuItems.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-secondary/30 rounded text-sm">
                    <span>{item.name}</span>
                    <Badge variant={item.available ? 'default' : 'destructive'}>
                      {item.available ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No menu items loaded</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => (window.location.href = '/')}>
              Login
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = '/customer')}>
              Customer
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = '/kitchen')}>
              Kitchen (PIN: 1234)
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = '/kitchen/manage')}>
              Menu Mgmt
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
