"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Barcode,
  Package,
  Download,
  Printer,
  Plus,
  Search,
  Trash2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  X,
  Sparkles,
  RefreshCw,
  Filter,
} from "lucide-react"
import { toast } from "sonner"
import {
  ProductBarcode,
  getProductBarcodes,
  getBarcodeStats,
  generateBarcodesForProduct,
  updateBarcodeStatus,
  bulkUpdateBarcodeStatus,
  getNextSequenceNumber,
} from "@/lib/barcode-utils"

interface BarcodeManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  productCode: string
  productName: string
  franchiseId: string
}

export function BarcodeManagementDialog({
  open,
  onOpenChange,
  productId,
  productCode,
  productName,
  franchiseId,
}: BarcodeManagementDialogProps) {
  const [loading, setLoading] = useState(false)
  const [barcodes, setBarcodes] = useState<ProductBarcode[]>([])
  const [filteredBarcodes, setFilteredBarcodes] = useState<ProductBarcode[]>([])
  const [stats, setStats] = useState({ total: 0, available: 0, inUse: 0, damaged: 0, retired: 0, new: 0 })
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [badgeFilter, setBadgeFilter] = useState<string>("all")
  const [selectedBarcodes, setSelectedBarcodes] = useState<string[]>([])
  const [generateQuantity, setGenerateQuantity] = useState("10")
  const [nextSequence, setNextSequence] = useState(1)

  useEffect(() => {
    if (open) {
      fetchBarcodes()
      fetchStats()
      fetchNextSequence()
    }
  }, [open, productId])

  useEffect(() => {
    filterBarcodes()
  }, [barcodes, searchTerm, statusFilter, badgeFilter])

  const fetchBarcodes = async () => {
    setLoading(true)
    const result = await getProductBarcodes(productId)
    if (result.success && result.barcodes) {
      setBarcodes(result.barcodes)
    } else {
      toast.error("Failed to load barcodes")
    }
    setLoading(false)
  }

  const fetchStats = async () => {
    const newStats = await getBarcodeStats(productId)
    setStats(newStats)
  }

  const fetchNextSequence = async () => {
    const next = await getNextSequenceNumber(productId)
    setNextSequence(next)
  }

  const filterBarcodes = () => {
    let filtered = barcodes

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((b) =>
        b.barcode_number.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter (Physical condition)
    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter)
    }

    // Apply badge filter (Usage state)
    if (badgeFilter !== "all") {
      if (badgeFilter === "new") {
        filtered = filtered.filter((b) => b.is_new)
      } else if (badgeFilter === "in_use") {
        filtered = filtered.filter((b) => b.status === "in_use")
      }
    }

    setFilteredBarcodes(filtered)
  }

  const handleGenerateBarcodes = async () => {
    const qty = parseInt(generateQuantity)
    if (isNaN(qty) || qty < 1 || qty > 1000) {
      toast.error("Please enter a valid quantity (1-1000)")
      return
    }

    setLoading(true)
    const result = await generateBarcodesForProduct(productId, productCode, franchiseId, qty, nextSequence)
    
    if (result.success) {
      toast.success(`Generated ${qty} new barcodes successfully`)
      await fetchBarcodes()
      await fetchStats()
      await fetchNextSequence()
      setGenerateQuantity("10")
    } else {
      toast.error(result.error || "Failed to generate barcodes")
    }
    setLoading(false)
  }

  const handleSelectAll = () => {
    if (selectedBarcodes.length === filteredBarcodes.length) {
      setSelectedBarcodes([])
    } else {
      setSelectedBarcodes(filteredBarcodes.map((b) => b.id))
    }
  }

  const handleSelectBarcode = (barcodeId: string) => {
    setSelectedBarcodes((prev) =>
      prev.includes(barcodeId)
        ? prev.filter((id) => id !== barcodeId)
        : [...prev, barcodeId]
    )
  }

  const handleBulkStatusChange = async (status: 'available' | 'damaged' | 'retired' | 'in_use') => {
    if (selectedBarcodes.length === 0) {
      toast.error("Please select at least one barcode")
      return
    }

    setLoading(true)
    const result = await bulkUpdateBarcodeStatus(selectedBarcodes, status)
    
    if (result.success) {
      toast.success(`Updated ${selectedBarcodes.length} barcodes to ${status}`)
      setSelectedBarcodes([])
      await fetchBarcodes()
      await fetchStats()
    } else {
      toast.error(result.error || "Failed to update barcodes")
    }
    setLoading(false)
  }

  const handleDownloadSelected = () => {
    if (selectedBarcodes.length === 0) {
      toast.error("Please select at least one barcode")
      return
    }
    
    const selectedBarcodesData = barcodes.filter((b) => selectedBarcodes.includes(b.id))
    downloadBarcodesAsPDF(selectedBarcodesData)
  }

  const handleDownloadFiltered = () => {
    if (filteredBarcodes.length === 0) {
      toast.error("No barcodes to download")
      return
    }
    
    downloadBarcodesAsPDF(filteredBarcodes)
  }

  const downloadBarcodesAsPDF = (barcodesToDownload: ProductBarcode[]) => {
    // TODO: Implement PDF generation
    toast.info(`Downloading ${barcodesToDownload.length} barcodes... (PDF generation coming soon)`)
    console.log("Barcodes to download:", barcodesToDownload)
  }

  const getStatusBadge = (barcode: ProductBarcode) => {
    // Status represents physical condition
    switch (barcode.status) {
      case "available":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" /> Available
        </Badge>
      case "damaged":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <AlertTriangle className="w-3 h-3 mr-1" /> Damaged
        </Badge>
      case "retired":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          <XCircle className="w-3 h-3 mr-1" /> Retired
        </Badge>
      case "in_use":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Package className="w-3 h-3 mr-1" /> In Use
        </Badge>
    }
  }

  const getUsageBadge = (barcode: ProductBarcode) => {
    // Badge represents temporary usage state
    const badges = []
    
    if (barcode.status === "in_use") {
      badges.push(
        <Badge key="in-use" variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Package className="w-3 h-3 mr-1" /> In Use
        </Badge>
      )
    }
    
    if (barcode.is_new) {
      badges.push(
        <Badge key="new" variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          <Sparkles className="w-3 h-3 mr-1" /> NEW
        </Badge>
      )
    }
    
    return badges.length > 0 ? <div className="flex gap-1">{badges}</div> : <span className="text-muted-foreground">-</span>
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Barcode className="w-5 h-5" />
            Barcode Management: {productName}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="list">Barcode List</TabsTrigger>
            <TabsTrigger value="generate">Generate More</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Barcodes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Available
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{stats.available}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Package className="w-4 h-4 text-blue-600" />
                    In Use
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{stats.inUse}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    Damaged
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">{stats.damaged}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <XCircle className="w-4 h-4 text-gray-600" />
                    Retired
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-600">{stats.retired}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    New
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{stats.new}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Download barcodes by status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setStatusFilter("available")
                    setTimeout(() => handleDownloadFiltered(), 100)
                  }}
                  disabled={stats.available === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download All Available ({stats.available})
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setStatusFilter("new")
                    setTimeout(() => handleDownloadFiltered(), 100)
                  }}
                  disabled={stats.new === 0}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Download New Only ({stats.new})
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setStatusFilter("all")
                    setTimeout(() => handleDownloadFiltered(), 100)
                  }}
                  disabled={stats.total === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download All Barcodes ({stats.total})
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* List Tab */}
          <TabsContent value="list" className="space-y-4 overflow-y-auto flex-1">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search barcodes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5}>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">🟢 Available</SelectItem>
                  <SelectItem value="damaged">🟡 Damaged</SelectItem>
                  <SelectItem value="retired">⚫ Retired</SelectItem>
                </SelectContent>
              </Select>

              <Select value={badgeFilter} onValueChange={setBadgeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Badge" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5}>
                  <SelectItem value="all">All Badges</SelectItem>
                  <SelectItem value="in_use">🔵 In Use</SelectItem>
                  <SelectItem value="new">✨ New</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => {
                  setStatusFilter("all")
                  setBadgeFilter("all")
                  setSearchTerm("")
                }}
                title="Clear all filters"
              >
                <X className="w-4 h-4" />
              </Button>

              <Button variant="outline" size="icon" onClick={fetchBarcodes} disabled={loading} title="Refresh">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {selectedBarcodes.length > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {selectedBarcodes.length} barcode(s) selected
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleDownloadSelected}>
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('available')}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Available
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('in_use')}>
                        <Package className="w-4 h-4 mr-1" />
                        Mark In Use
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('damaged')}>
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Mark Damaged
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('retired')}>
                        <XCircle className="w-4 h-4 mr-1" />
                        Retire
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedBarcodes.length === filteredBarcodes.length && filteredBarcodes.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Badge</TableHead>
                    <TableHead>Booking Info</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Used</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Loading barcodes...
                      </TableCell>
                    </TableRow>
                  ) : filteredBarcodes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No barcodes found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBarcodes.map((barcode) => (
                      <TableRow key={barcode.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedBarcodes.includes(barcode.id)}
                            onCheckedChange={() => handleSelectBarcode(barcode.id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm font-semibold">{barcode.barcode_number}</TableCell>
                        <TableCell>{getStatusBadge(barcode)}</TableCell>
                        <TableCell>{getUsageBadge(barcode)}</TableCell>
                        <TableCell className="text-sm">
                          {barcode.status === 'in_use' && barcode.booking_number ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <Package className="h-3 w-3 text-blue-600" />
                                <span className="font-medium text-blue-600">{barcode.booking_number}</span>
                              </div>
                              {barcode.customer_name && (
                                <div className="text-xs text-muted-foreground">
                                  👤 {barcode.customer_name}
                                </div>
                              )}
                              {barcode.event_date && (
                                <div className="text-xs text-muted-foreground">
                                  📅 {new Date(barcode.event_date).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(barcode.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {barcode.last_used_at ? new Date(barcode.last_used_at).toLocaleDateString() : 'Never'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-4 overflow-y-auto flex-1">
            <Card>
              <CardHeader>
                <CardTitle>Generate Additional Barcodes</CardTitle>
                <CardDescription>
                  Create new barcodes for this product. Useful when you receive new stock.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Total Barcodes</Label>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Number of Barcodes to Generate</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max="1000"
                    value={generateQuantity}
                    onChange={(e) => setGenerateQuantity(e.target.value)}
                    placeholder="Enter quantity"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    New barcodes will be numbered from <strong>{productCode}-{nextSequence.toString().padStart(3, '0')}</strong> to{' '}
                    <strong>{productCode}-{(nextSequence + parseInt(generateQuantity || '0') - 1).toString().padStart(3, '0')}</strong>
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleGenerateBarcodes} disabled={loading} className="flex-1">
                    <Plus className="w-4 h-4 mr-2" />
                    {loading ? 'Generating...' : 'Generate Barcodes'}
                  </Button>
                  <Button variant="outline" onClick={() => setGenerateQuantity("10")}>
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
