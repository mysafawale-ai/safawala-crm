"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import {
  Lock, Unlock, Plus, Trash2, Loader2, User, MapPin, Phone,
  FileText, Calendar, Search, RefreshCw, AlertTriangle
} from "lucide-react"

interface LockedDate {
  id: string
  locked_date: string
  whatsapp_number: string | null
  notes: string | null
  created_at: string
}

function parseLockNote(raw: string | null) {
  if (!raw) return { personName: "", city: "", note: "" }
  const personMatch = raw.match(/^PERSON:\s*([^|]+)\|/)
  const cityMatch = raw.match(/\|CITY:\s*([^|]+)(\||$)/)
  const noteMatch = raw.match(/\|NOTE:\s*([\s\S]*)$/)
  return {
    personName: personMatch ? personMatch[1].trim() : "",
    city: cityMatch ? cityMatch[1].trim() : "",
    note: noteMatch ? noteMatch[1].trim() : (!personMatch ? raw : ""),
  }
}

export default function LockDatesPage() {
  const [lockedDates, setLockedDates] = useState<LockedDate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming")
  const [userRole, setUserRole] = useState<string>("")

  // Form state
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [personName, setPersonName] = useState("")
  const [city, setCity] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    const raw = localStorage.getItem("safawala_user")
    if (raw) { try { const u = JSON.parse(raw); setUserRole(u.role || "") } catch {} }
    loadDates()
  }, [])

  async function loadDates() {
    setLoading(true)
    try {
      const res = await fetch("/api/locked-dates")
      const json = await res.json()
      setLockedDates(json.data ?? [])
    } catch { toast.error("Failed to load locked dates") }
    finally { setLoading(false) }
  }

  async function handleLock() {
    if (!date) { toast.error("Select a date"); return }
    if (!personName.trim()) { toast.error("Person name is required"); return }
    setSaving(true)
    const encodedNotes = `PERSON: ${personName.trim()}|CITY: ${city.trim() || "—"}|NOTE: ${notes.trim()}`
    try {
      const res = await fetch("/api/locked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locked_date: date, whatsapp_number: whatsapp || null, notes: encodedNotes }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed")
      toast.success(`🔒 ${format(new Date(date + "T00:00:00"), "dd MMM yyyy")} locked!`)
      setLockedDates(prev => [...prev, json.data].sort((a, b) => a.locked_date.localeCompare(b.locked_date)))
      setDate(format(new Date(), "yyyy-MM-dd"))
      setPersonName("")
      setCity("")
      setWhatsapp("")
      setNotes("")
    } catch (e: any) {
      toast.error(e.message)
    } finally { setSaving(false) }
  }

  async function handleUnlock(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/locked-dates?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      setLockedDates(prev => prev.filter(d => d.id !== id))
      toast.success("Date unlocked")
    } catch (e: any) {
      toast.error(e.message)
    } finally { setDeletingId(null) }
  }

  const today = format(new Date(), "yyyy-MM-dd")
  const canManage = ["franchise_admin", "franchise_owner", "super_admin"].includes(userRole)

  const filtered = lockedDates.filter(ld => {
    const parsed = parseLockNote(ld.notes)
    const matchSearch = !search ||
      ld.locked_date.includes(search) ||
      parsed.personName.toLowerCase().includes(search.toLowerCase()) ||
      parsed.city.toLowerCase().includes(search.toLowerCase()) ||
      (ld.whatsapp_number || "").includes(search)
    const matchFilter =
      filter === "all" ? true :
      filter === "upcoming" ? ld.locked_date >= today :
      ld.locked_date < today
    return matchSearch && matchFilter
  }).sort((a, b) => a.locked_date.localeCompare(b.locked_date))

  const upcoming = lockedDates.filter(ld => ld.locked_date >= today)
  const past = lockedDates.filter(ld => ld.locked_date < today)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Lock className="h-6 w-6 text-red-500" />
              Lock Dates
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage blocked dates — no new bookings on locked dates</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadDates} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm bg-red-50">
            <CardContent className="p-4">
              <div className="text-2xl font-black text-red-700">{lockedDates.length}</div>
              <div className="text-xs font-semibold text-red-500 mt-0.5">Total Locked</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-orange-50">
            <CardContent className="p-4">
              <div className="text-2xl font-black text-orange-700">{upcoming.length}</div>
              <div className="text-xs font-semibold text-orange-500 mt-0.5">Upcoming</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gray-50">
            <CardContent className="p-4">
              <div className="text-2xl font-black text-gray-500">{past.length}</div>
              <div className="text-xs font-semibold text-gray-400 mt-0.5">Past (locked)</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add new lock date form */}
          {canManage && (
            <div className="lg:col-span-1">
              <Card className="border border-indigo-200 shadow-sm sticky top-6">
                <CardHeader className="bg-indigo-50 border-b border-indigo-100 pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-indigo-800">
                    <Plus className="h-4 w-4" />
                    Lock a New Date
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Date *
                    </Label>
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-9 bg-white" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-1.5">
                        <User className="h-3.5 w-3.5" /> Person Name *
                      </Label>
                      <Input
                        placeholder="Rahul Sharma"
                        value={personName}
                        onChange={e => setPersonName(e.target.value)}
                        className="h-9 bg-white text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-1.5">
                        <MapPin className="h-3.5 w-3.5" /> City
                      </Label>
                      <Input
                        placeholder="Surat"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        className="h-9 bg-white text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-1.5">
                      <Phone className="h-3.5 w-3.5" /> WhatsApp
                    </Label>
                    <Input
                      type="tel"
                      placeholder="+91 97252 95691"
                      value={whatsapp}
                      onChange={e => setWhatsapp(e.target.value)}
                      className="h-9 bg-white text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-1.5">
                      <FileText className="h-3.5 w-3.5" /> Notes
                    </Label>
                    <Textarea
                      placeholder="Reason for locking..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={2}
                      className="text-sm resize-none bg-white"
                    />
                  </div>

                  <Button
                    onClick={handleLock}
                    disabled={saving || !date || !personName.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-9"
                  >
                    {saving
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Locking...</>
                      : <><Lock className="h-4 w-4 mr-2" />Lock This Date</>}
                  </Button>

                  <p className="text-[10px] text-gray-400 text-center">
                    Locked dates appear red on the booking calendar
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Locked dates list */}
          <div className={canManage ? "lg:col-span-2" : "lg:col-span-3"}>
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-base text-gray-900">
                    Locked Dates List
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {/* Filter */}
                    <div className="flex rounded-lg border overflow-hidden">
                      {(["upcoming", "all", "past"] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => setFilter(f)}
                          className={`px-3 py-1 text-xs font-semibold capitalize ${filter === f ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        placeholder="Search name, city..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="h-8 pl-8 text-xs w-44"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <Lock className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">No {filter !== "all" ? filter : ""} locked dates</p>
                    {canManage && <p className="text-xs mt-1">Use the form to lock a date</p>}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filtered.map(ld => {
                      const parsed = parseLockNote(ld.notes)
                      const isToday = ld.locked_date === today
                      const isPast = ld.locked_date < today
                      return (
                        <div
                          key={ld.id}
                          className={`flex items-start justify-between px-5 py-4 hover:bg-gray-50 ${isToday ? "bg-red-50" : ""}`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isToday ? "bg-red-100" : isPast ? "bg-gray-100" : "bg-red-50"}`}>
                              <Lock className={`h-4 w-4 ${isToday ? "text-red-600" : isPast ? "text-gray-400" : "text-red-500"}`} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-bold text-sm ${isToday ? "text-red-700" : isPast ? "text-gray-500" : "text-gray-900"}`}>
                                  {format(new Date(ld.locked_date + "T00:00:00"), "EEEE, dd MMMM yyyy")}
                                </span>
                                {isToday && <Badge className="bg-red-500 text-white text-[10px] py-0 px-1.5">TODAY</Badge>}
                                {isPast && <Badge variant="secondary" className="text-[10px] py-0 px-1.5">Past</Badge>}
                              </div>

                              {parsed.personName && (
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                    <User className="h-3.5 w-3.5 text-indigo-500" />
                                    {parsed.personName}
                                  </span>
                                  {parsed.city && parsed.city !== "—" && (
                                    <span className="text-sm text-gray-500 flex items-center gap-1">
                                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                      {parsed.city}
                                    </span>
                                  )}
                                </div>
                              )}

                              {ld.whatsapp_number && (
                                <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  <a href={`https://wa.me/91${ld.whatsapp_number.replace(/\D/g, "").slice(-10)}`} target="_blank" className="text-green-600 hover:underline">
                                    {ld.whatsapp_number}
                                  </a>
                                </div>
                              )}

                              {parsed.note && (
                                <p className="mt-1 text-xs text-gray-500 flex items-start gap-1">
                                  <FileText className="h-3 w-3 mt-0.5 shrink-0" />
                                  {parsed.note}
                                </p>
                              )}

                              <p className="mt-1 text-[10px] text-gray-400">
                                Locked on {format(new Date(ld.created_at), "dd MMM yyyy, h:mm a")}
                              </p>
                            </div>
                          </div>

                          {canManage && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnlock(ld.id)}
                              disabled={deletingId === ld.id}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0 shrink-0 ml-2"
                              title="Unlock this date"
                            >
                              {deletingId === ld.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Trash2 className="h-3.5 w-3.5" />}
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {!canManage && (
              <div className="mt-4 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Only franchise owners and admins can lock or unlock dates.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
