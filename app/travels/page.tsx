"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plane, Hotel, MapPin, Calendar, Phone, Plus, Search } from "lucide-react"

const SAMPLE_TRIPS = [
  { id: 1, client: "Sharma Wedding", destination: "Jaipur", date: "2026-07-15", hotel: "Marriott Jaipur", status: "confirmed", contact: "+91 98765 43210" },
  { id: 2, client: "Verma Event", destination: "Udaipur", date: "2026-08-03", hotel: "Taj Lake Palace", status: "pending", contact: "+91 87654 32109" },
]

const STATUS_COLOR: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
}

export default function TravelsPage() {
  const [search, setSearch] = useState("")

  const filtered = SAMPLE_TRIPS.filter(
    (t) =>
      t.client.toLowerCase().includes(search.toLowerCase()) ||
      t.destination.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-semibold text-gray-900 tracking-tight flex items-center gap-2">
              <Plane className="w-8 h-8 text-[#0891b2]" />
              Travels & Hotels
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage out-of-town event travel, hotel bookings, and stylist logistics
            </p>
          </div>
          <Button className="bg-[#0891b2] hover:bg-[#0e7490] text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Trip
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Trips", value: SAMPLE_TRIPS.length, icon: Plane, color: "#0891b2" },
            { label: "Confirmed", value: SAMPLE_TRIPS.filter(t => t.status === "confirmed").length, icon: Calendar, color: "#22c55e" },
            { label: "Pending", value: SAMPLE_TRIPS.filter(t => t.status === "pending").length, icon: Hotel, color: "#f59e0b" },
            { label: "Destinations", value: new Set(SAMPLE_TRIPS.map(t => t.destination)).size, icon: MapPin, color: "#a855f7" },
          ].map((stat) => (
            <Card key={stat.label} className="border border-gray-200">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${stat.color}15` }}>
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by client or destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Trips list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-14 text-gray-400">
                <Plane className="h-12 w-12 mb-3 opacity-20" />
                <p className="text-sm">No trips found</p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((trip) => (
              <Card key={trip.id} className="border border-gray-200 hover:shadow-sm transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
                        <Plane className="w-5 h-5 text-cyan-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{trip.client}</div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{trip.destination}</span>
                          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(trip.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                          <span className="flex items-center gap-1"><Hotel className="h-3.5 w-3.5" />{trip.hotel}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                          <Phone className="h-3 w-3" />{trip.contact}
                        </div>
                      </div>
                    </div>
                    <Badge className={`text-xs border ${STATUS_COLOR[trip.status] ?? "bg-gray-100 text-gray-600"} shrink-0`}>
                      {trip.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
