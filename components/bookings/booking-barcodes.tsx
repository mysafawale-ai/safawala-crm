"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Package, 
  CheckCircle, 
  Truck, 
  RotateCcw, 
  AlertCircle,
  Barcode as BarcodeIcon,
  RefreshCw
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BookingBarcodesProps {
  bookingId: string
  bookingType: 'package' | 'product'
}

interface BarcodeAssignment {
  id: string
  barcode_number: string
  product_name: string
  product_code: string
  product_category: string
  status: 'assigned' | 'delivered' | 'with_customer' | 'returned' | 'completed'
  assigned_at: string
  delivered_at?: string
  returned_at?: string
  completed_at?: string
  assigned_by_name?: string
}

interface BarcodeStats {
  total_assigned: number
  total_delivered: number
  total_with_customer: number
  total_returned: number
  total_completed: number
  total_pending: number
}

export function BookingBarcodes({ bookingId, bookingType }: BookingBarcodesProps) {
  const { toast } = useToast()
  const [barcodes, setBarcodes] = useState<BarcodeAssignment[]>([])
  const [stats, setStats] = useState<BarcodeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBarcodes = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/bookings/${bookingId}/barcodes?type=${bookingType}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch barcodes')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setBarcodes(data.barcodes || [])
        setStats(data.stats || null)
      } else {
        throw new Error(data.error || 'Failed to fetch barcodes')
      }
    } catch (err: any) {
      console.error('[Booking Barcodes] Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (bookingId) {
      fetchBarcodes()
    }
  }, [bookingId, bookingType])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      assigned: { variant: 'secondary', icon: CheckCircle, label: 'Assigned' },
      delivered: { variant: 'default', icon: Truck, label: 'Delivered' },
      with_customer: { variant: 'default', icon: Package, label: 'With Customer' },
      returned: { variant: 'outline', icon: RotateCcw, label: 'Returned' },
      completed: { variant: 'outline', icon: CheckCircle, label: 'Completed' },
    }
    
    const config = variants[status] || { variant: 'secondary', icon: AlertCircle, label: status }
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const handleRefresh = () => {
    fetchBarcodes()
    toast({ title: 'Refreshed', description: 'Barcode data updated' })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="bg-amber-50 dark:bg-amber-950">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarcodeIcon className="h-5 w-5" />
            📊 Assigned Barcodes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="bg-amber-50 dark:bg-amber-950">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarcodeIcon className="h-5 w-5" />
            📊 Assigned Barcodes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!barcodes || barcodes.length === 0) {
    return (
      <Card>
        <CardHeader className="bg-amber-50 dark:bg-amber-950">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarcodeIcon className="h-5 w-5" />
            📊 Assigned Barcodes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-center py-6 text-muted-foreground">
            <BarcodeIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No barcodes assigned to this booking yet</p>
            <p className="text-xs mt-1">Barcodes will be auto-assigned when products are added</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Group barcodes by product
  const groupedBarcodes = barcodes.reduce((acc, barcode) => {
    const key = barcode.product_id || 'unknown'
    if (!acc[key]) {
      acc[key] = {
        product_name: barcode.product_name,
        product_code: barcode.product_code,
        product_category: barcode.product_category,
        barcodes: []
      }
    }
    acc[key].barcodes.push(barcode)
    return acc
  }, {} as Record<string, { product_name: string; product_code: string; product_category: string; barcodes: BarcodeAssignment[] }>)

  return (
    <Card>
      <CardHeader className="bg-amber-50 dark:bg-amber-950">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarcodeIcon className="h-5 w-5" />
            📊 Assigned Barcodes
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total_assigned}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.total_delivered}</div>
              <div className="text-xs text-muted-foreground">Delivered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.total_with_customer}</div>
              <div className="text-xs text-muted-foreground">With Customer</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.total_returned}</div>
              <div className="text-xs text-muted-foreground">Returned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.total_completed}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.total_pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
          </div>
        )}

        {/* Grouped Barcodes by Product */}
        <div className="space-y-4">
          {Object.entries(groupedBarcodes).map(([productId, group]) => (
            <div key={productId} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{group.product_name}</h4>
                  <p className="text-xs text-muted-foreground">{group.product_code}</p>
                </div>
                <Badge variant="secondary">{group.barcodes.length} items</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {group.barcodes.map((barcode) => (
                  <div key={barcode.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded text-sm">
                    <div className="flex-1">
                      <code className="font-mono text-xs font-semibold">{barcode.barcode_number}</code>
                    </div>
                    <div>
                      {getStatusBadge(barcode.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
