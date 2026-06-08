"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import {
  Users, Phone, MapPin, Calendar, Search, RefreshCw, Filter,
  CheckCircle, Clock, TrendingUp, X, MessageSquare, ExternalLink,
  Copy, ChevronDown, Loader2, Star
} from "lucide-react"
import { toast } from "sonner"

interface Lead {
  id: string
  name: string
  phone: string
  event_date: string | null
  location: string | null
  message: string | null
  package_interest: string | null
  status: "new" | "contacted" | "interested" | "converted" | "lost"
  source: string
  notes: string | null
  created_at: string
}

const STATUS_CONFIG = {
  new:        { label: "New",        color: "bg-blue-500/10 text-blue-400 border-blue-500/20",      dot: "bg-blue-400" },
  contacted:  { label: "Contacted",  color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", dot: "bg-yellow-400" },
  interested: { label: "Interested", color: "bg-purple-500/10 text-purple-400 border-purple-500/20", dot: "bg-purple-400" },
  converted:  { label: "Converted ✓", color: "bg-green-500/10 text-green-400 border-green-500/20",  dot: "bg-green-400" },
  lost:       { label: "Lost",       color: "bg-red-500/10 text-red-400 border-red-500/20",          dot: "bg-red-400" },
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [noteInput, setNoteInput] = useState("")

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (search) params.set("search", search)
      const res = await fetch(`/api/leads?${params}`)
      const data = await res.json()
      setLeads(data.data || [])
    } catch (err) {
      toast.error("Failed to load leads")
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search])

  useEffect(() => {
    const t = setTimeout(fetchLeads, 300)
    return () => clearTimeout(t)
  }, [fetchLeads])

  const updateStatus = async (id: string, status: string, notes?: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, notes }),
      })
      if (res.ok) {
        toast.success("Lead updated")
        fetchLeads()
        if (selectedLead?.id === id) {
          setSelectedLead((prev) => prev ? { ...prev, status: status as any, notes: notes ?? prev.notes } : null)
        }
      }
    } catch {
      toast.error("Failed to update")
    } finally {
      setUpdatingId(null)
    }
  }

  const copyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone)
    toast.success("Phone copied!")
  }

  const counts = {
    all: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    interested: leads.filter((l) => l.status === "interested").length,
    converted: leads.filter((l) => l.status === "converted").length,
    lost: leads.filter((l) => l.status === "lost").length,
  }

  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/packages`
    : "/packages"

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-500" />
            Leads
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Enquiries from your public packages page
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              navigator.clipboard.writeText(publicUrl)
              toast.success("Link copied! Share it with customers.")
            }}
            className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2 hover:bg-accent transition"
          >
            <ExternalLink className="w-4 h-4" />
            Copy Public Link
          </button>
          <a
            href="/packages"
            target="_blank"
            className="flex items-center gap-2 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded-lg px-3 py-2 transition"
          >
            <ExternalLink className="w-4 h-4" />
            View Public Page
          </a>
          <button
            onClick={fetchLeads}
            className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2 hover:bg-accent transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 px-6 py-4 border-b">
        {(["new", "contacted", "interested", "converted", "lost"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s === statusFilter ? "all" : s)}
            className={`rounded-xl p-3 border text-left transition-all ${
              statusFilter === s ? "border-purple-500 bg-purple-500/10" : "border-border hover:border-purple-500/30"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`} />
              <span className="text-xs text-muted-foreground">{STATUS_CONFIG[s].label}</span>
            </div>
            <p className="text-2xl font-bold">{counts[s]}</p>
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3 px-6 py-3 border-b">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search by name, phone, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none"
        >
          <option value="all">All Status ({counts.all})</option>
          <option value="new">New ({counts.new})</option>
          <option value="contacted">Contacted ({counts.contacted})</option>
          <option value="interested">Interested ({counts.interested})</option>
          <option value="converted">Converted ({counts.converted})</option>
          <option value="lost">Lost ({counts.lost})</option>
        </select>
      </div>

      {/* Table + Detail Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Lead List */}
        <div className={`flex flex-col overflow-auto transition-all ${selectedLead ? "w-[55%]" : "w-full"}`}>
          {loading ? (
            <div className="flex items-center justify-center flex-1 py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-20 text-muted-foreground">
              <Users className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium">No leads yet</p>
              <p className="text-sm mt-1">Share your public packages link to get enquiries</p>
              <button
                onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success("Link copied!") }}
                className="mt-4 text-sm bg-purple-600 text-white rounded-lg px-4 py-2 hover:bg-purple-500 transition"
              >
                Copy Public Link
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background border-b">
                <tr className="text-muted-foreground text-xs uppercase tracking-wide">
                  <th className="text-left px-6 py-3 font-medium">Lead</th>
                  <th className="text-left px-4 py-3 font-medium">Event</th>
                  <th className="text-left px-4 py-3 font-medium">Package</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Received</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.map((lead) => {
                  const cfg = STATUS_CONFIG[lead.status]
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => { setSelectedLead(lead); setNoteInput(lead.notes || "") }}
                      className={`hover:bg-accent/50 cursor-pointer transition ${selectedLead?.id === lead.id ? "bg-accent" : ""}`}
                    >
                      <td className="px-6 py-3">
                        <div className="font-medium">{lead.name}</div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {lead.phone}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {lead.event_date ? (
                          <div className="flex items-center gap-1 text-xs">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(lead.event_date), "d MMM yyyy")}
                          </div>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                        {lead.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {lead.location}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {lead.package_interest ? (
                          <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full px-2 py-0.5">
                            {lead.package_interest}
                          </span>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs border rounded-full px-2 py-0.5 flex items-center gap-1 w-fit ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {format(new Date(lead.created_at), "d MMM, h:mm a")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${lead.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="w-7 h-7 flex items-center justify-center bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition"
                            title="Call"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/91${lead.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            onClick={(e) => e.stopPropagation()}
                            className="w-7 h-7 flex items-center justify-center bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition"
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Panel */}
        {selectedLead && (
          <div className="w-[45%] border-l flex flex-col overflow-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-semibold">Lead Details</h3>
              <button
                onClick={() => setSelectedLead(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-accent transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-5 space-y-5">
              {/* Contact */}
              <div className="bg-accent/50 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Contact</h4>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">{selectedLead.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{selectedLead.phone}</span>
                  <button
                    onClick={() => copyPhone(selectedLead.phone)}
                    className="text-muted-foreground hover:text-foreground transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-3 mt-3">
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white rounded-lg py-2 text-sm font-medium transition"
                  >
                    <Phone className="w-4 h-4" /> Call
                  </a>
                  <a
                    href={`https://wa.me/91${selectedLead.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2 text-sm font-medium transition"
                  >
                    <MessageSquare className="w-4 h-4" /> WhatsApp
                  </a>
                </div>
              </div>

              {/* Event Info */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Event Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-accent/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Event Date</p>
                    <p className="font-medium text-sm">
                      {selectedLead.event_date
                        ? format(new Date(selectedLead.event_date), "d MMMM yyyy")
                        : "Not specified"}
                    </p>
                  </div>
                  <div className="bg-accent/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Location</p>
                    <p className="font-medium text-sm">{selectedLead.location || "Not specified"}</p>
                  </div>
                </div>
                {selectedLead.package_interest && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                    <p className="text-xs text-purple-400 mb-1">Package Interest</p>
                    <p className="font-medium text-sm text-purple-300">{selectedLead.package_interest}</p>
                  </div>
                )}
                {selectedLead.message && (
                  <div className="bg-accent/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Message</p>
                    <p className="text-sm">{selectedLead.message}</p>
                  </div>
                )}
              </div>

              {/* Status Update */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Update Status</h4>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(STATUS_CONFIG) as (keyof typeof STATUS_CONFIG)[]).map((s) => {
                    const cfg = STATUS_CONFIG[s]
                    return (
                      <button
                        key={s}
                        onClick={() => updateStatus(selectedLead.id, s)}
                        disabled={updatingId === selectedLead.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          selectedLead.status === s
                            ? cfg.color + " ring-2 ring-offset-1 ring-offset-background"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Internal Notes</h4>
                <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Add notes about this lead..."
                  rows={4}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none"
                />
                <button
                  onClick={() => updateStatus(selectedLead.id, selectedLead.status, noteInput)}
                  disabled={updatingId === selectedLead.id}
                  className="w-full text-sm bg-purple-600 hover:bg-purple-500 text-white rounded-lg py-2 font-medium transition flex items-center justify-center gap-2"
                >
                  {updatingId === selectedLead.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save Notes
                </button>
              </div>

              <div className="text-xs text-muted-foreground">
                Received: {format(new Date(selectedLead.created_at), "d MMMM yyyy, h:mm a")}
                {selectedLead.source && ` · via ${selectedLead.source}`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
