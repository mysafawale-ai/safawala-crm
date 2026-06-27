"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plane, Hotel, MapPin, Calendar, Phone, Plus, Search, Loader2, RefreshCw, Train, Car } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

const STATUS_COLOR: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700 border-green-200",
  pending:   "bg-yellow-100 text-yellow-700 border-yellow-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  completed: "bg-blue-100 text-blue-700 border-blue-200",
}

const TRAVEL_ICONS: Record<string, any> = {
  flight: Plane,
  train: Train,
  car: Car,
}

const blank = {
  event_name: "", customer_name: "", event_date: "", venue: "", venue_city: "",
  travel_mode: "train", departure_from: "", arrival_at: "",
  departure_date: "", departure_time: "", return_date: "", return_time: "",
  ticket_ref: "", pnr: "",
  hotel_name: "", hotel_address: "", hotel_checkin: "", hotel_checkout: "",
  hotel_ref: "", hotel_contact: "",
  ticket_cost: "", hotel_cost: "", other_cost: "", advance_given: "", notes: "",
}

export default function TravelsPage() {
  const [trips, setTrips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...blank })

  useEffect(() => { fetchTrips() }, [])

  async function fetchTrips() {
    setLoading(true)
    try {
      const res = await fetch("/api/travel-bookings")
      const json = await res.json()
      setTrips(json.data ?? [])
    } catch {
      toast.error("Failed to load trips")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!form.customer_name || !form.event_date) {
      toast.error("Customer name and event date are required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/travel-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ticket_cost: Number(form.ticket_cost) || 0,
          hotel_cost: Number(form.hotel_cost) || 0,
          other_cost: Number(form.other_cost) || 0,
          advance_given: Number(form.advance_given) || 0,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to save")
      toast.success("Trip added successfully!")
      setShowAdd(false)
      setForm({ ...blank })
      fetchTrips()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const filtered = trips.filter(t =>
    (t.customer_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (t.venue ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (t.venue_city ?? "").toLowerCase().includes(search.toLowerCase())
  )

  const upcoming = filtered.filter(t => t.event_date >= format(new Date(), "yyyy-MM-dd"))
  const past     = filtered.filter(t => t.event_date < format(new Date(), "yyyy-MM-dd"))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-semibold text-gray-900 tracking-tight flex items-center gap-2">
              <Plane className="w-8 h-8 text-[#0891b2]" />
              Travels & Hotels
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Out-of-town event travel, hotel stays, and stylist logistics
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchTrips}>
              <RefreshCw className="h-4 w-4 mr-2" />Refresh
            </Button>
            <Button className="bg-[#0891b2] hover:bg-[#0e7490] text-white" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-2" />Add Trip
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Trips",  value: trips.length,                                          icon: Plane,    color: "#0891b2" },
            { label: "Upcoming",     value: trips.filter(t => t.event_date >= format(new Date(), "yyyy-MM-dd")).length, icon: Calendar,  color: "#22c55e" },
            { label: "With Hotel",   value: trips.filter(t => t.travel?.hotel_name).length,        icon: Hotel,    color: "#a855f7" },
            { label: "Pending",      value: trips.filter(t => (t.travel?.status ?? "pending") === "pending").length,  icon: MapPin,    color: "#f59e0b" },
          ].map((stat) => (
            <Card key={stat.label} className="border border-gray-200">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${stat.color}15` }}>
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{loading ? "…" : stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search by client, venue, city..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-14 text-gray-400">
              <Plane className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm">No trips found</p>
              <button onClick={() => setShowAdd(true)} className="mt-2 text-xs text-cyan-500 hover:underline">Add a trip →</button>
            </CardContent>
          </Card>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Upcoming ({upcoming.length})</h3>
                <div className="space-y-3">{upcoming.map(t => <TripCard key={t.id} trip={t} />)}</div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Past ({past.length})</h3>
                <div className="space-y-3 opacity-70">{past.map(t => <TripCard key={t.id} trip={t} />)}</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Trip Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Add Travel & Hotel Booking</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Event Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Customer / Client Name *</Label>
                <Input placeholder="e.g. Sharma Family" value={form.customer_name} onChange={e => set("customer_name", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Event Date *</Label>
                <Input type="date" value={form.event_date} onChange={e => set("event_date", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Event Name</Label>
                <Input placeholder="e.g. Sharma Wedding" value={form.event_name} onChange={e => set("event_name", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Venue City</Label>
                <Input placeholder="e.g. Jaipur" value={form.venue_city} onChange={e => set("venue_city", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Venue / Address</Label>
              <Input placeholder="Venue name or address" value={form.venue} onChange={e => set("venue", e.target.value)} />
            </div>

            {/* Travel */}
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Travel Details</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Mode</Label>
                  <Select value={form.travel_mode} onValueChange={v => set("travel_mode", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flight">✈️ Flight</SelectItem>
                      <SelectItem value="train">🚂 Train</SelectItem>
                      <SelectItem value="car">🚗 Car</SelectItem>
                      <SelectItem value="bus">🚌 Bus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>From</Label>
                  <Input placeholder="Departure city" value={form.departure_from} onChange={e => set("departure_from", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>To</Label>
                  <Input placeholder="Arrival city" value={form.arrival_at} onChange={e => set("arrival_at", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="space-y-1">
                  <Label>Departure Date & Time</Label>
                  <div className="flex gap-2">
                    <Input type="date" value={form.departure_date} onChange={e => set("departure_date", e.target.value)} />
                    <Input type="time" value={form.departure_time} onChange={e => set("departure_time", e.target.value)} className="w-32" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Return Date & Time</Label>
                  <div className="flex gap-2">
                    <Input type="date" value={form.return_date} onChange={e => set("return_date", e.target.value)} />
                    <Input type="time" value={form.return_time} onChange={e => set("return_time", e.target.value)} className="w-32" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="space-y-1">
                  <Label>Ticket / PNR Ref</Label>
                  <Input placeholder="Ticket number or PNR" value={form.pnr} onChange={e => set("pnr", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Ticket Cost (₹)</Label>
                  <Input type="number" placeholder="0" value={form.ticket_cost} onChange={e => set("ticket_cost", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Hotel */}
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Hotel Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Hotel Name</Label>
                  <Input placeholder="Hotel name" value={form.hotel_name} onChange={e => set("hotel_name", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Hotel Contact</Label>
                  <Input placeholder="+91 XXXXX XXXXX" value={form.hotel_contact} onChange={e => set("hotel_contact", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="space-y-1">
                  <Label>Check-in</Label>
                  <Input type="date" value={form.hotel_checkin} onChange={e => set("hotel_checkin", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Check-out</Label>
                  <Input type="date" value={form.hotel_checkout} onChange={e => set("hotel_checkout", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="space-y-1">
                  <Label>Booking Ref</Label>
                  <Input placeholder="Hotel booking ref" value={form.hotel_ref} onChange={e => set("hotel_ref", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Hotel Cost (₹)</Label>
                  <Input type="number" placeholder="0" value={form.hotel_cost} onChange={e => set("hotel_cost", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Costs & Notes */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Other Costs (₹)</Label>
                  <Input type="number" placeholder="0" value={form.other_cost} onChange={e => set("other_cost", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Advance Given (₹)</Label>
                  <Input type="number" placeholder="0" value={form.advance_given} onChange={e => set("advance_given", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1 mt-3">
                <Label>Notes</Label>
                <Textarea placeholder="Any special instructions..." rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#0891b2] hover:bg-[#0e7490] text-white">
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Trip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

function TripCard({ trip }: { trip: any }) {
  const travel = trip.travel
  const status = travel?.status ?? "pending"
  const TravelIcon = TRAVEL_ICONS[travel?.travel_mode ?? "train"] ?? Train

  return (
    <Card className="border border-gray-200 hover:shadow-sm transition-shadow">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
              <TravelIcon className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">{trip.customer_name || trip.order_number}</div>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                {trip.event_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(trip.event_date + "T00:00:00"), "dd MMM yyyy")}
                  </span>
                )}
                {(trip.venue_city || trip.venue) && (
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{trip.venue_city || trip.venue}</span>
                )}
                {travel?.hotel_name && (
                  <span className="flex items-center gap-1"><Hotel className="h-3.5 w-3.5" />{travel.hotel_name}</span>
                )}
                {travel?.departure_from && (
                  <span className="flex items-center gap-1">
                    <TravelIcon className="h-3.5 w-3.5" />{travel.departure_from} → {travel.arrival_at}
                  </span>
                )}
              </div>
              {trip.customer_phone && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Phone className="h-3 w-3" />{trip.customer_phone}
                </p>
              )}
            </div>
          </div>
          <Badge className={`text-xs border shrink-0 ${STATUS_COLOR[status] ?? "bg-gray-100 text-gray-600"}`}>
            {status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
