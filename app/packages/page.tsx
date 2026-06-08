"use client"

import { useState, useEffect, Suspense } from "react"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import {
  Crown, Phone, CheckCircle, ChevronRight, Calendar,
  X, Loader2, Star, Package, Lock, Link2, Copy, Plus, Minus,
  Shield, ExternalLink, Eye, EyeOff, Users, RotateCcw,
  Sparkles, Check, AlertCircle, PhoneCall, MessageCircle
} from "lucide-react"

// ─── Password Gate ─────────────────────────────────────────────────
function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/public/verify-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (data.success) {
        sessionStorage.setItem("safawala_packages_access", "1")
        onUnlock()
      } else {
        setError("Incorrect password. Please try again.")
        setPassword("")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #eef2ff 0%, #f9fafb 50%, #ede9fe 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 24,
          padding: "40px 36px",
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 20px 60px rgba(79,70,229,0.12), 0 4px 16px rgba(0,0,0,0.06)",
          textAlign: "center",
        }}
      >
        {/* Logo */}
        <div style={{ margin: "0 auto 20px", display: "flex", justifyContent: "center" }}>
          <Image src="/safawalalogo.png" alt="Safawala" width={120} height={60} style={{ objectFit: "contain" }} />
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#111827", marginBottom: 6 }}>
          Safawala Packages
        </h1>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 28 }}>
          Enter the password to view our exclusive wedding packages
        </p>

        <form onSubmit={handleSubmit}>
          {/* Password field */}
          <div style={{ position: "relative", marginBottom: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: `1.5px solid ${error ? "#f87171" : "#e5e7eb"}`,
                borderRadius: 12,
                overflow: "hidden",
                background: "#f9fafb",
                transition: "border-color 0.15s",
              }}
            >
              <Lock
                style={{
                  width: 16,
                  height: 16,
                  color: "#9ca3af",
                  marginLeft: 14,
                  flexShrink: 0,
                }}
              />
              <input
                type={show ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError("") }}
                autoFocus
                style={{
                  flex: 1,
                  border: "none",
                  background: "transparent",
                  padding: "13px 12px",
                  fontSize: 15,
                  color: "#111827",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0 14px",
                  color: "#9ca3af",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {show
                  ? <EyeOff style={{ width: 16, height: 16 }} />
                  : <Eye style={{ width: 16, height: 16 }} />}
              </button>
            </div>
            {error && (
              <p style={{ fontSize: 12, color: "#ef4444", marginTop: 6, textAlign: "left", display: "flex", alignItems: "center", gap: 5 }}>
                <AlertCircle style={{ width: 13, height: 13, flexShrink: 0 }} /> {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              color: "#ffffff",
              border: "none",
              borderRadius: 12,
              padding: "13px 0",
              fontSize: 15,
              fontWeight: 700,
              cursor: loading || !password ? "not-allowed" : "pointer",
              opacity: loading || !password ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "opacity 0.15s",
              boxShadow: "0 4px 14px rgba(79,70,229,0.35)",
            }}
          >
            {loading ? (
              <><Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> Verifying...</>
            ) : (
              <><Shield style={{ width: 16, height: 16 }} /> View Packages</>
            )}
          </button>
        </form>

        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          <Lock style={{ width: 12, height: 12 }} /> Safawala — Premium Indian Wedding Accessories
        </p>
      </div>
    </div>
  )
}

interface PackageCategory { id: string; name: string; description?: string; display_order?: number }
interface PackageVariant { id: string; name: string; base_price: number; category_id: string; inclusions?: string[]; display_order?: number }

// Sort categories numerically by leading number in name (21→31→41→51→61→91→101)
function sortCategories(cats: PackageCategory[]) {
  return [...cats].sort((a, b) => {
    const numA = parseInt(a.name.match(/\d+/)?.[0] || "999")
    const numB = parseInt(b.name.match(/\d+/)?.[0] || "999")
    return numA - numB
  })
}

// ─── Lead Popup Modal ─────────────────────────────────────────────
function LeadModal({
  variant, category, customPrice, onClose
}: {
  variant: PackageVariant
  category: PackageCategory
  customPrice?: number
  onClose: () => void
}) {
  const displayPrice = customPrice ?? variant.base_price
  const [form, setForm] = useState({ name: "", phone: "", event_date: "", location: "", message: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const inclusions = Array.isArray(variant.inclusions) ? variant.inclusions : []

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = "Enter your name"
    if (!form.phone.trim()) e.phone = "Enter phone number"
    if (!form.event_date) e.event_date = "Select event date"
    if (!form.location.trim()) e.location = "Enter location"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          package_interest: `${category.name} — ${variant.name}`,
          source: "packages_page",
        }),
      })
      if (res.ok) setSubmitted(true)
      else alert("Something went wrong. Please call us directly.")
    } catch { alert("Something went wrong.") }
    finally { setSubmitting(false) }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto"
        style={{ background: "#ffffff", color: "#111827" }}
        onClick={e => e.stopPropagation()}
      >
        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#dcfce7" }}>
              <CheckCircle className="w-8 h-8" style={{ color: "#16a34a" }} />
            </div>
            <h3 className="text-2xl font-bold mb-2" style={{ color: "#111827" }}>Enquiry Sent!</h3>
            <p className="mb-2" style={{ color: "#6b7280" }}>Our team will call you within 2 hours.</p>
            <p className="text-sm" style={{ color: "#9ca3af" }}>
              Package: <span className="font-medium" style={{ color: "#4f46e5" }}>{variant.name}</span>
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-xl py-3 font-semibold transition"
              style={{ background: "#4f46e5", color: "#ffffff" }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between p-5" style={{ borderBottom: "1px solid #e5e7eb" }}>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#4f46e5" }}>{category.name}</div>
                <h3 className="text-xl font-bold" style={{ color: "#111827" }}>{variant.name}</h3>
                {displayPrice > 0 && (
                  <p className="text-2xl font-black mt-1" style={{ color: "#4f46e5" }}>
                    ₹{displayPrice.toLocaleString("en-IN")}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition"
                style={{ color: "#9ca3af" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inclusions */}
            {inclusions.length > 0 && (
              <div className="px-5 py-4" style={{ background: "#eef2ff", borderBottom: "1px solid #e5e7eb" }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#6b7280" }}>What's Included</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {inclusions.map((inc, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-sm" style={{ color: "#374151" }}>
                      <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#4f46e5" }} />
                      {inc}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <p className="text-sm font-semibold" style={{ color: "#374151", display: "flex", alignItems: "center", gap: 6 }}>
                <Phone className="w-3.5 h-3.5" style={{ color: "#4f46e5" }} /> Fill your details — we'll call you!
              </p>

              {/* Name */}
              <div>
                <input
                  type="text"
                  placeholder="Your Name *"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  style={{
                    border: `1px solid ${errors.name ? "#f87171" : "#e5e7eb"}`,
                    background: "#ffffff",
                    color: "#111827",
                  }}
                />
                {errors.name && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{errors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  style={{
                    border: `1px solid ${errors.phone ? "#f87171" : "#e5e7eb"}`,
                    background: "#ffffff",
                    color: "#111827",
                  }}
                />
                {errors.phone && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{errors.phone}</p>}
              </div>

              {/* Event Date + Location */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="date"
                    value={form.event_date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={e => setForm({ ...form, event_date: e.target.value })}
                    className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                    style={{
                      border: `1px solid ${errors.event_date ? "#f87171" : "#e5e7eb"}`,
                      background: "#ffffff",
                      color: "#111827",
                      colorScheme: "light",
                    }}
                  />
                  {errors.event_date && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{errors.event_date}</p>}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Event Location *"
                    value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                    className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                    style={{
                      border: `1px solid ${errors.location ? "#f87171" : "#e5e7eb"}`,
                      background: "#ffffff",
                      color: "#111827",
                    }}
                  />
                  {errors.location && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{errors.location}</p>}
                </div>
              </div>

              {/* Message */}
              <textarea
                placeholder="Any special requirements or questions..."
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                rows={2}
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none"
                style={{ border: "1px solid #e5e7eb", background: "#ffffff", color: "#111827" }}
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl py-3 font-semibold transition flex items-center justify-center gap-2"
                style={{ background: "#4f46e5", color: "#ffffff", opacity: submitting ? 0.7 : 1 }}
              >
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                  : <><Phone className="w-4 h-4" /> Send Enquiry — We'll Call You!</>}
              </button>
              <p className="text-center text-xs" style={{ color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <Lock className="w-3 h-3" /> Your info is safe. No spam ever.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Shared helpers ───────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  new:        { label: "New",        bg: "#dbeafe", color: "#1d4ed8" },
  contacted:  { label: "Contacted",  bg: "#fef9c3", color: "#854d0e" },
  interested: { label: "Interested", bg: "#ffedd5", color: "#9a3412" },
  converted:  { label: "Converted",  bg: "#dcfce7", color: "#15803d" },
  expired:    { label: "Expired",    bg: "#f3f4f6", color: "#6b7280" },
  rejected:   { label: "Rejected",   bg: "#fee2e2", color: "#b91c1c" },
}

// ─── Admin Panel ──────────────────────────────────────────────────
function AdminPanel({ variants, categories, onClose }: {
  variants: PackageVariant[]
  categories: PackageCategory[]
  onClose: () => void
}) {
  const [tab, setTab] = useState<"ai" | "manual" | "leads">("ai")
  const [password, setPassword] = useState("")
  const [copied, setCopied] = useState<string | null>(null)
  const [generatedLink, setGeneratedLink] = useState("")
  const [generating, setGenerating] = useState(false)
  const [label, setLabel] = useState("")

  // AI tab state
  const [aiCommand, setAiCommand] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<{ id: string; name: string; original_price: number; new_price: number }[]>([])
  const [aiSummary, setAiSummary] = useState("")
  const [aiError, setAiError] = useState("")

  // Manual tab state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [manualPrices, setManualPrices] = useState<Record<string, number>>({})

  // Leads tab state
  const [leads, setLeads] = useState<any[]>([])
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [leadsLoaded, setLeadsLoaded] = useState(false)
  const [updatingLead, setUpdatingLead] = useState<string | null>(null)

  useEffect(() => {
    const init: Record<string, number> = {}
    variants.forEach(v => { init[v.id] = v.base_price })
    setManualPrices(init)
  }, [variants])

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  // ── AI command ──
  const runAI = async () => {
    if (!password) { setAiError("Enter admin password first"); return }
    if (!aiCommand.trim()) { setAiError("Type a command first"); return }
    setAiLoading(true); setAiError(""); setAiResult([]); setAiSummary(""); setGeneratedLink("")
    try {
      const res = await fetch("/api/public/ai-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, command: aiCommand, variants }),
      })
      const data = await res.json()
      if (!res.ok) { setAiError(data.error || "AI failed"); return }
      setAiResult(data.selected || [])
      setAiSummary(data.summary || "")
    } catch { setAiError("Network error. Try again.") }
    finally { setAiLoading(false) }
  }

  // ── Generate link from AI result or manual selection ──
  const generateLink = async (priceMap: Record<string, number>) => {
    if (!password) { alert("Enter admin password"); return }
    setGenerating(true); setGeneratedLink("")
    try {
      const res = await fetch("/api/public/price-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, custom_prices: priceMap, label: label || "Custom Quote" }),
      })
      const data = await res.json()
      if (res.ok) setGeneratedLink(`${window.location.origin}/packages?pk=${data.link_key}`)
      else alert(data.error || "Failed to generate link")
    } catch { alert("Error") }
    finally { setGenerating(false) }
  }

  const generateFromAI = () => {
    const priceMap: Record<string, number> = {}
    aiResult.forEach(r => { priceMap[r.id] = r.new_price })
    generateLink(priceMap)
  }

  const generateFromManual = () => {
    const priceMap: Record<string, number> = {}
    selectedIds.forEach(id => { priceMap[id] = manualPrices[id] ?? 0 })
    if (!Object.keys(priceMap).length) { alert("Select at least one package"); return }
    generateLink(priceMap)
  }

  // ── Leads ──
  const loadLeads = async () => {
    if (!password) { alert("Enter admin password first"); return }
    setLeadsLoading(true)
    try {
      const res = await fetch("/api/public/leads", {
        headers: { "x-admin-password": password },
      })
      const data = await res.json()
      if (res.ok) { setLeads(data.data || []); setLeadsLoaded(true) }
      else alert(data.error || "Failed to load leads")
    } catch { alert("Error loading leads") }
    finally { setLeadsLoading(false) }
  }

  const updateLeadStatus = async (id: string, status: string) => {
    if (!password) return
    setUpdatingLead(id)
    try {
      const res = await fetch("/api/public/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
      }
    } catch {}
    finally { setUpdatingLead(null) }
  }

  // ── Generated link display ──
  const LinkResult = () => generatedLink ? (
    <div style={{ marginTop: 16, borderRadius: 14, padding: 16, background: "#eef2ff", border: "1px solid #c7d2fe" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
        <CheckCircle style={{ width: 13, height: 13 }} /> Link ready — share with customer
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          readOnly value={generatedLink}
          onClick={e => (e.target as HTMLInputElement).select()}
          style={{ flex: 1, border: "1px solid #c7d2fe", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#6b7280", background: "#fff", outline: "none" }}
        />
        <button
          onClick={() => copy(generatedLink, "link")}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          <Copy style={{ width: 13, height: 13 }} />
          {copied === "link" ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  ) : null

  const TABS = [
    { id: "ai",     icon: <Sparkles style={{ width: 14, height: 14 }} />, label: "AI Command" },
    { id: "manual", icon: <Package  style={{ width: 14, height: 14 }} />, label: "Manual"     },
    { id: "leads",  icon: <Users    style={{ width: 14, height: 14 }} />, label: "Leads"       },
  ] as const

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        style={{ background: "#ffffff", borderRadius: 20, width: "100%", maxWidth: 680, maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.18)", overflow: "hidden" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Shield style={{ width: 18, height: 18, color: "#4f46e5" }} />
            <span style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>Admin Panel</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex" }}>
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Shared: Password + Quote Label */}
        <div style={{ padding: "14px 20px 0", flexShrink: 0, borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>Admin Password</label>
              <input
                type="password" placeholder="Safawala@5678"
                value={password} onChange={e => setPassword(e.target.value)}
                style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", fontSize: 13, color: "#111827", background: "#f9fafb", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>Quote Label</label>
              <input
                type="text" placeholder="e.g. Sharma Wedding — June 2026"
                value={label} onChange={e => setLabel(e.target.value)}
                style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", fontSize: 13, color: "#111827", background: "#f9fafb", outline: "none", boxSizing: "border-box" }}
              />
            </div>
          </div>

          {/* Tab nav */}
          <div style={{ display: "flex", gap: 4 }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: "10px 10px 0 0", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
                  background: tab === t.id ? "#ffffff" : "transparent",
                  color: tab === t.id ? "#4f46e5" : "#6b7280",
                  borderTop: tab === t.id ? "2px solid #4f46e5" : "2px solid transparent",
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content — scrollable */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>

          {/* ── AI COMMAND TAB ── */}
          {tab === "ai" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ borderRadius: 14, padding: 14, background: "#eef2ff", border: "1px solid #c7d2fe" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#4f46e5", marginBottom: 4 }}>How to use AI Command</p>
                <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
                  Type naturally: <em>"Select 41 Safa and 51 Safa, increase price by 40%"</em> or <em>"Pick 21, 31, 41 Safa and reduce by 10%"</em> — AI will pick the packages and calculate round prices automatically.
                </p>
              </div>

              <textarea
                placeholder='e.g. "Select 41 Safa, 51 Safa and 71 Safa, increase price by 40%"'
                value={aiCommand}
                onChange={e => { setAiCommand(e.target.value); setAiError("") }}
                rows={3}
                style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 12, padding: "12px 14px", fontSize: 14, color: "#111827", background: "#f9fafb", outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
              />

              {aiError && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#b91c1c", background: "#fee2e2", borderRadius: 10, padding: "10px 14px" }}>
                  <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} /> {aiError}
                </div>
              )}

              <button
                onClick={runAI}
                disabled={aiLoading || !aiCommand.trim()}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 12, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: aiLoading || !aiCommand.trim() ? "not-allowed" : "pointer", opacity: aiLoading || !aiCommand.trim() ? 0.6 : 1 }}
              >
                {aiLoading
                  ? <><Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> AI is processing...</>
                  : <><Sparkles style={{ width: 16, height: 16 }} /> Process with AI</>}
              </button>

              {/* AI Results */}
              {aiResult.length > 0 && (
                <div>
                  {aiSummary && (
                    <div style={{ borderRadius: 10, padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", marginBottom: 12, fontSize: 13, color: "#15803d", fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
                      <CheckCircle style={{ width: 15, height: 15, flexShrink: 0 }} /> {aiSummary}
                    </div>
                  )}
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                    Selected Packages — review & adjust if needed
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {aiResult.map((r, i) => (
                      <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "#f9fafb", borderRadius: 12, padding: "10px 14px", border: "1px solid #e5e7eb" }}>
                        <Check style={{ width: 15, height: 15, color: "#4f46e5", flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#374151" }}>{r.name}</span>
                        <span style={{ fontSize: 12, color: "#9ca3af", textDecoration: "line-through", marginRight: 4 }}>₹{r.original_price.toLocaleString("en-IN")}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button onClick={() => setAiResult(prev => prev.map((x, j) => j === i ? { ...x, new_price: Math.max(0, x.new_price - 100) } : x))} style={{ width: 24, height: 24, background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
                            <Minus style={{ width: 12, height: 12 }} />
                          </button>
                          <input
                            type="number"
                            value={r.new_price}
                            onChange={e => setAiResult(prev => prev.map((x, j) => j === i ? { ...x, new_price: Math.round(Number(e.target.value) / 100) * 100 } : x))}
                            style={{ width: 80, border: "1px solid #c7d2fe", borderRadius: 8, padding: "4px 6px", fontSize: 13, fontWeight: 700, color: "#4f46e5", textAlign: "center", background: "#eef2ff", outline: "none" }}
                          />
                          <button onClick={() => setAiResult(prev => prev.map((x, j) => j === i ? { ...x, new_price: x.new_price + 100 } : x))} style={{ width: 24, height: 24, background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
                            <Plus style={{ width: 12, height: 12 }} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={generateFromAI}
                    disabled={generating}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", marginTop: 14, background: "#059669", color: "#fff", border: "none", borderRadius: 12, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: generating ? "not-allowed" : "pointer", opacity: generating ? 0.7 : 1 }}
                  >
                    {generating
                      ? <><Loader2 style={{ width: 15, height: 15 }} className="animate-spin" /> Generating...</>
                      : <><Link2 style={{ width: 15, height: 15 }} /> Generate & Share Link</>}
                  </button>
                  <LinkResult />
                </div>
              )}
            </div>
          )}

          {/* ── MANUAL TAB ── */}
          {tab === "manual" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Check the packages to include, then set a custom price for each.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 400, overflowY: "auto" }}>
                {categories.map(cat => {
                  const catVariants = variants.filter(v => v.category_id === cat.id)
                  if (!catVariants.length) return null
                  return (
                    <div key={cat.id}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", margin: "8px 0 4px" }}>{cat.name}</p>
                      {catVariants.map(v => {
                        const checked = selectedIds.has(v.id)
                        return (
                          <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: checked ? "#eef2ff" : "#f9fafb", border: `1px solid ${checked ? "#c7d2fe" : "#e5e7eb"}`, marginBottom: 4, cursor: "pointer" }}
                            onClick={() => setSelectedIds(prev => { const s = new Set(prev); s.has(v.id) ? s.delete(v.id) : s.add(v.id); return s })}
                          >
                            <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${checked ? "#4f46e5" : "#d1d5db"}`, background: checked ? "#4f46e5" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {checked && <Check style={{ width: 11, height: 11, color: "#fff" }} />}
                            </div>
                            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#374151" }}>{v.name}</span>
                            {checked && (
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={e => e.stopPropagation()}>
                                <button onClick={() => setManualPrices(p => ({ ...p, [v.id]: Math.max(0, (p[v.id] || 0) - 100) }))} style={{ width: 22, height: 22, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus style={{ width: 11, height: 11, color: "#6b7280" }} /></button>
                                <input type="number" value={manualPrices[v.id] || 0}
                                  onChange={e => setManualPrices(p => ({ ...p, [v.id]: Math.round(Number(e.target.value) / 100) * 100 }))}
                                  style={{ width: 80, border: "1px solid #c7d2fe", borderRadius: 8, padding: "3px 6px", fontSize: 13, fontWeight: 700, color: "#4f46e5", textAlign: "center", background: "#eef2ff", outline: "none" }}
                                />
                                <button onClick={() => setManualPrices(p => ({ ...p, [v.id]: (p[v.id] || 0) + 100 }))} style={{ width: 22, height: 22, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus style={{ width: 11, height: 11, color: "#6b7280" }} /></button>
                              </div>
                            )}
                            {!checked && <span style={{ fontSize: 12, color: "#9ca3af" }}>₹{(v.base_price || 0).toLocaleString("en-IN")}</span>}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
              <button
                onClick={generateFromManual}
                disabled={generating || !selectedIds.size}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 12, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: generating || !selectedIds.size ? "not-allowed" : "pointer", opacity: generating || !selectedIds.size ? 0.6 : 1 }}
              >
                {generating
                  ? <><Loader2 style={{ width: 15, height: 15 }} className="animate-spin" /> Generating...</>
                  : <><Link2 style={{ width: 15, height: 15 }} /> Generate Link ({selectedIds.size} selected)</>}
              </button>
              <LinkResult />
            </div>
          )}

          {/* ── LEADS TAB ── */}
          {tab === "leads" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {!leadsLoaded ? (
                <div style={{ textAlign: "center", paddingTop: 20 }}>
                  <Users style={{ width: 40, height: 40, color: "#d1d5db", margin: "0 auto 12px" }} />
                  <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>Load all leads submitted through the packages page</p>
                  <button
                    onClick={loadLeads}
                    disabled={leadsLoading}
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#4f46e5", color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: leadsLoading ? "not-allowed" : "pointer", opacity: leadsLoading ? 0.7 : 1 }}
                  >
                    {leadsLoading ? <><Loader2 style={{ width: 15, height: 15 }} className="animate-spin" /> Loading...</> : <><Users style={{ width: 15, height: 15 }} /> Load Leads</>}
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{leads.length} leads total</span>
                    <button onClick={loadLeads} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6b7280", background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}>
                      <RotateCcw style={{ width: 12, height: 12 }} /> Refresh
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 480, overflowY: "auto" }}>
                    {leads.length === 0 ? (
                      <p style={{ textAlign: "center", color: "#9ca3af", padding: "32px 0", fontSize: 14 }}>No leads yet. Share the packages link to start getting enquiries!</p>
                    ) : leads.map(lead => {
                      const sc = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new
                      const date = lead.created_at ? new Date(lead.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""
                      return (
                        <div key={lead.id} style={{ background: "#f9fafb", borderRadius: 14, padding: "12px 14px", border: "1px solid #e5e7eb" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                            <div>
                              <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{lead.name}</span>
                              <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 8 }}>{date}</span>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: sc.bg, color: sc.color }}>{sc.label}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                            <a href={`tel:${lead.phone}`} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#4f46e5", textDecoration: "none", fontWeight: 600 }}>
                              <PhoneCall style={{ width: 13, height: 13 }} /> {lead.phone}
                            </a>
                            <a href={`https://wa.me/${lead.phone?.replace(/[^0-9]/g, "")}`} target="_blank" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#059669", textDecoration: "none" }}>
                              <MessageCircle style={{ width: 12, height: 12 }} /> WhatsApp
                            </a>
                          </div>
                          {lead.package_interest && <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}><Package style={{ width: 12, height: 12, flexShrink: 0 }} /> {lead.package_interest}</p>}
                          {lead.event_date && <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}><Calendar style={{ width: 12, height: 12, flexShrink: 0 }} /> {new Date(lead.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} {lead.location ? `· ${lead.location}` : ""}</p>}
                          {/* Status buttons */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                            {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
                              <button
                                key={s}
                                disabled={updatingLead === lead.id}
                                onClick={() => updateLeadStatus(lead.id, s)}
                                style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, border: "none", cursor: lead.status === s ? "default" : "pointer", background: lead.status === s ? cfg.bg : "#f3f4f6", color: lead.status === s ? cfg.color : "#9ca3af", opacity: updatingLead === lead.id ? 0.5 : 1 }}
                              >
                                {cfg.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────
function PackagesContent() {
  const searchParams = useSearchParams()
  const priceKey = searchParams.get("pk")

  // Access control
  const [unlocked, setUnlocked] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)

  // Page data
  const [categories, setCategories] = useState<PackageCategory[]>([])
  const [variants, setVariants] = useState<PackageVariant[]>([])
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({})
  const [priceLabel, setPriceLabel] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState<{ variant: PackageVariant; category: PackageCategory } | null>(null)
  const [showAdmin, setShowAdmin] = useState(false)
  const [expandedCat, setExpandedCat] = useState<string | null>(null)

  // Check sessionStorage for cached access
  useEffect(() => {
    const cached = sessionStorage.getItem("safawala_packages_access")
    if (cached === "1") setUnlocked(true)
    setCheckingAccess(false)
  }, [])

  // Load packages data — only when unlocked
  useEffect(() => {
    if (!unlocked) return
    const load = async () => {
      setLoading(true)
      try {
        const [pkgRes, priceRes] = await Promise.all([
          fetch("/api/public/packages"),
          priceKey ? fetch(`/api/public/price-links?key=${priceKey}`) : Promise.resolve(null),
        ])

        const pkgData = await pkgRes.json()
        const sorted = sortCategories(pkgData.categories || [])
        setCategories(sorted)
        setVariants(pkgData.variants || [])
        if (sorted.length > 0) setExpandedCat(sorted[0].id)

        if (priceRes?.ok) {
          const priceData = await priceRes.json()
          setCustomPrices(priceData.data?.custom_prices || {})
          setPriceLabel(priceData.data?.label || null)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [priceKey, unlocked])

  // ── Conditional renders (after all hooks) ──
  if (checkingAccess) {
    return (
      <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 style={{ width: 24, height: 24, color: "#4f46e5" }} className="animate-spin" />
      </div>
    )
  }

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} />
  }

  const getPrice = (v: PackageVariant) =>
    customPrices[v.id] !== undefined ? customPrices[v.id] : v.base_price

  const variantsForCat = (catId: string) =>
    variants.filter(v => v.category_id === catId)

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", color: "#111827", fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "#ffffff", borderBottom: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Image src="/safawalalogo.png" alt="Safawala" width={110} height={44} style={{ objectFit: "contain" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {priceKey && priceLabel && (
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, background: "#fef3c7", border: "1px solid #fcd34d", color: "#92400e", borderRadius: 999, padding: "3px 12px" }}>
                <Star style={{ width: 12, height: 12, fill: "#f59e0b", color: "#f59e0b" }} />
                {priceLabel}
              </span>
            )}
            <a
              href="tel:+919876543210"
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#4f46e5", color: "#ffffff", fontSize: 13, fontWeight: 700, padding: "8px 16px", borderRadius: 999, textDecoration: "none" }}
            >
              <Phone style={{ width: 14, height: 14 }} />
              Call Us
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: "#ffffff", borderBottom: "1px solid #f3f4f6", padding: "40px 16px 32px", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#eef2ff", color: "#4f46e5", fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "4px 14px", marginBottom: 16 }}>
            <Crown style={{ width: 13, height: 13 }} />
            Premium Indian Wedding Accessories
          </div>
          <h1 style={{ fontSize: "clamp(24px, 5vw, 40px)", fontWeight: 900, color: "#111827", lineHeight: 1.2, marginBottom: 12 }}>
            Wedding Packages{" "}
            <span style={{ color: "#4f46e5" }}>for Every Family</span>
          </h1>
          <p style={{ color: "#6b7280", fontSize: 16, marginBottom: 24 }}>
            Premium safas, malas, kalgis & accessories. Tap any package to enquire instantly.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
            {["5000+ Happy Customers", "Pan India Delivery", "Premium Quality"].map(t => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#9ca3af" }}>
                <Star style={{ width: 13, height: 13, fill: "#f59e0b", color: "#f59e0b" }} />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "32px 16px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <Loader2 style={{ width: 28, height: 28, color: "#4f46e5" }} className="animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#9ca3af" }}>
            <Package style={{ width: 48, height: 48, margin: "0 auto 12px", opacity: 0.3 }} />
            <p>No packages available. Please contact us directly.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {categories.map(cat => {
              const catVariants = variantsForCat(cat.id)
              if (catVariants.length === 0) return null // Skip empty categories
              const isOpen = expandedCat === cat.id

              return (
                <div key={cat.id} style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
                  <button
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", textAlign: "left", cursor: "pointer", background: "transparent", border: "none", color: "#111827" }}
                    onClick={() => setExpandedCat(isOpen ? null : cat.id)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, background: "#eef2ff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Package style={{ width: 18, height: 18, color: "#4f46e5" }} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>{cat.name}</h3>
                        {cat.description && <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{cat.description}</p>}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>{catVariants.length} options</span>
                      <ChevronRight style={{ width: 16, height: 16, color: "#9ca3af", transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                    </div>
                  </button>

                  {isOpen && (
                    <div style={{ padding: "4px 20px 20px", borderTop: "1px solid #f3f4f6" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, paddingTop: 16 }}>
                        {catVariants.map(v => {
                          const price = getPrice(v)
                          const inclusions = Array.isArray(v.inclusions) ? v.inclusions : []
                          const isCustom = priceKey && customPrices[v.id] !== undefined && customPrices[v.id] !== v.base_price

                          return (
                            <button
                              key={v.id}
                              onClick={() => setSelectedVariant({ variant: v, category: cat })}
                              style={{
                                textAlign: "left", padding: 16, border: "1px solid #e5e7eb", borderRadius: 14,
                                background: "#ffffff", cursor: "pointer", transition: "all 0.15s"
                              }}
                              onMouseEnter={e => {
                                (e.currentTarget as HTMLButtonElement).style.borderColor = "#4f46e5"
                                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(79,70,229,0.12)"
                              }}
                              onMouseLeave={e => {
                                (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb"
                                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = "none"
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                <h4 style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0 }}>{v.name}</h4>
                                <ChevronRight style={{ width: 14, height: 14, color: "#9ca3af", flexShrink: 0, marginTop: 2 }} />
                              </div>
                              {price > 0 && (
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                  <span style={{ fontSize: 20, fontWeight: 900, color: "#4f46e5" }}>₹{price.toLocaleString("en-IN")}</span>
                                  {isCustom && v.base_price !== price && (
                                    <span style={{ fontSize: 12, color: "#9ca3af", textDecoration: "line-through" }}>₹{v.base_price.toLocaleString("en-IN")}</span>
                                  )}
                                </div>
                              )}
                              {inclusions.slice(0, 4).map((inc, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#6b7280", marginBottom: 3 }}>
                                  <CheckCircle style={{ width: 11, height: 11, color: "#4f46e5", flexShrink: 0 }} />
                                  {inc}
                                </div>
                              ))}
                              {inclusions.length > 4 && (
                                <span style={{ fontSize: 11, color: "#4f46e5", fontWeight: 600 }}>+{inclusions.length - 4} more</span>
                              )}
                              <div style={{ marginTop: 12, width: "100%", background: "#4f46e5", color: "#ffffff", borderRadius: 8, padding: "6px 0", fontSize: 12, fontWeight: 700, textAlign: "center" }}>
                                Enquire Now
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #e5e7eb", background: "#ffffff", padding: "24px 16px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>© 2026 Safawala — Premium Indian Wedding Accessories</p>
          <button
            onClick={() => setShowAdmin(true)}
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#d1d5db", background: "none", border: "none", cursor: "pointer" }}
            title="Admin"
          >
            <Lock style={{ width: 12, height: 12 }} />
            Admin
          </button>
        </div>
      </footer>

      {/* Modals */}
      {selectedVariant && (
        <LeadModal
          variant={selectedVariant.variant}
          category={selectedVariant.category}
          customPrice={customPrices[selectedVariant.variant.id]}
          onClose={() => setSelectedVariant(null)}
        />
      )}
      {showAdmin && (
        <AdminPanel variants={variants} categories={categories} onClose={() => setShowAdmin(false)} />
      )}
    </div>
  )
}

export default function PackagesPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 style={{ width: 28, height: 28, color: "#4f46e5" }} className="animate-spin" />
      </div>
    }>
      <PackagesContent />
    </Suspense>
  )
}
