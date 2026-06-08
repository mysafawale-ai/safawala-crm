"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import {
  Crown, Phone, CheckCircle, ChevronRight,
  X, Loader2, Star, Package, Lock, Link2, Copy, Plus, Minus,
  Shield, ExternalLink, Eye, EyeOff
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
        <div
          style={{
            width: 64,
            height: 64,
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: "0 8px 24px rgba(79,70,229,0.3)",
          }}
        >
          <Crown style={{ width: 28, height: 28, color: "#ffffff" }} />
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
              <p style={{ fontSize: 12, color: "#ef4444", marginTop: 6, textAlign: "left" }}>
                ❌ {error}
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

        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 20 }}>
          🔒 Safawala — Premium Indian Wedding Accessories
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

// ─── Country Code Data ────────────────────────────────────────────
const COUNTRIES = [
  { code: "+91", flag: "🇮🇳", name: "India", short: "IN" },
  { code: "+1", flag: "🇺🇸", name: "United States", short: "US" },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom", short: "GB" },
  { code: "+971", flag: "🇦🇪", name: "UAE", short: "AE" },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia", short: "SA" },
  { code: "+61", flag: "🇦🇺", name: "Australia", short: "AU" },
  { code: "+1", flag: "🇨🇦", name: "Canada", short: "CA" },
  { code: "+65", flag: "🇸🇬", name: "Singapore", short: "SG" },
  { code: "+60", flag: "🇲🇾", name: "Malaysia", short: "MY" },
  { code: "+27", flag: "🇿🇦", name: "South Africa", short: "ZA" },
  { code: "+49", flag: "🇩🇪", name: "Germany", short: "DE" },
  { code: "+33", flag: "🇫🇷", name: "France", short: "FR" },
  { code: "+977", flag: "🇳🇵", name: "Nepal", short: "NP" },
  { code: "+880", flag: "🇧🇩", name: "Bangladesh", short: "BD" },
  { code: "+94", flag: "🇱🇰", name: "Sri Lanka", short: "LK" },
  { code: "+92", flag: "🇵🇰", name: "Pakistan", short: "PK" },
  { code: "+974", flag: "🇶🇦", name: "Qatar", short: "QA" },
  { code: "+973", flag: "🇧🇭", name: "Bahrain", short: "BH" },
  { code: "+968", flag: "🇴🇲", name: "Oman", short: "OM" },
  { code: "+31", flag: "🇳🇱", name: "Netherlands", short: "NL" },
]

// ─── Country Code Selector ────────────────────────────────────────
function CountryCodeSelector({
  value, onChange
}: {
  value: string
  onChange: (code: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  const selected = COUNTRIES.find(c => c.code === value && (value !== "+1" || c.short === "IN")) ||
    COUNTRIES.find(c => c.code === value) ||
    COUNTRIES[0]

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.includes(search) ||
    c.short.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition whitespace-nowrap"
      >
        <span className="text-base">{selected.flag}</span>
        <span className="font-medium">{selected.code}</span>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                autoFocus
                placeholder="Search country..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.map((c, i) => (
              <button
                key={`${c.short}-${i}`}
                type="button"
                onClick={() => { onChange(c.code); setOpen(false); setSearch("") }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-indigo-50 transition text-left ${
                  c.code === value ? "bg-indigo-50 text-indigo-700" : "text-gray-700"
                }`}
              >
                <span className="text-base">{c.flag}</span>
                <span className="flex-1">{c.name}</span>
                <span className="text-gray-400 text-xs">{c.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
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
            <h3 className="text-2xl font-bold mb-2" style={{ color: "#111827" }}>Enquiry Sent! 🎉</h3>
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
              <p className="text-sm font-semibold" style={{ color: "#374151" }}>Fill your details — we'll call you! 📞</p>

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
                  : <>Send Enquiry — We'll Call You! 📞</>}
              </button>
              <p className="text-center text-xs" style={{ color: "#9ca3af" }}>🔒 Your info is safe. No spam ever.</p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Admin Panel ──────────────────────────────────────────────────
function AdminPanel({ variants, onClose }: { variants: PackageVariant[]; onClose: () => void }) {
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [label, setLabel] = useState("")
  const [password, setPassword] = useState("")
  const [generating, setGenerating] = useState(false)
  const [generatedLink, setGeneratedLink] = useState("")
  const [sessionLinks, setSessionLinks] = useState<{ key: string; label: string; url: string }[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const init: Record<string, number> = {}
    variants.forEach(v => { init[v.id] = v.base_price })
    setPrices(init)
  }, [variants])

  const adjust = (id: string, delta: number) =>
    setPrices(p => ({ ...p, [id]: Math.max(0, (p[id] || 0) + delta) }))

  const generate = async () => {
    if (!password) { alert("Enter admin password"); return }
    setGenerating(true)
    try {
      const res = await fetch("/api/public/price-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, custom_prices: prices, label: label || "Custom Quote" }),
      })
      const data = await res.json()
      if (res.ok) {
        const url = `${window.location.origin}/packages?pk=${data.link_key}`
        setGeneratedLink(url)
        setSessionLinks(prev => [{ key: data.link_key, label: label || "Custom Quote", url }, ...prev])
      } else alert(data.error || "Failed")
    } catch { alert("Error") }
    finally { setGenerating(false) }
  }

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: "#ffffff", color: "#111827" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" style={{ color: "#4f46e5" }} />
            <h3 className="text-lg font-bold">Admin — Custom Pricing & Links</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: "#9ca3af" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Password */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "#374151" }}>Admin Password</label>
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              style={{ border: "1px solid #e5e7eb", background: "#f9fafb", color: "#111827" }}
            />
          </div>

          {/* Label */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "#374151" }}>
              Quote Label <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Sharma Wedding — June 2026"
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              style={{ border: "1px solid #e5e7eb", background: "#f9fafb", color: "#111827" }}
            />
          </div>

          {/* Price Editor */}
          <div>
            <label className="block text-sm font-semibold mb-3" style={{ color: "#374151" }}>Set Custom Prices</label>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {variants.map(v => (
                <div key={v.id} className="flex items-center gap-3 rounded-xl px-4 py-2.5" style={{ background: "#f9fafb" }}>
                  <span className="flex-1 text-sm font-medium truncate" style={{ color: "#374151" }}>{v.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => adjust(v.id, -500)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition"
                      style={{ background: "#ffffff", border: "1px solid #e5e7eb", color: "#6b7280" }}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-bold min-w-[80px] text-center" style={{ color: "#4f46e5" }}>
                      ₹{(prices[v.id] || 0).toLocaleString("en-IN")}
                    </span>
                    <button
                      onClick={() => adjust(v.id, 500)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition"
                      style={{ background: "#ffffff", border: "1px solid #e5e7eb", color: "#6b7280" }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      value={prices[v.id] || 0}
                      onChange={e => setPrices(p => ({ ...p, [v.id]: Number(e.target.value) }))}
                      className="w-20 rounded-lg px-2 py-1 text-xs text-center focus:outline-none"
                      style={{ border: "1px solid #e5e7eb", background: "#ffffff", color: "#111827" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Generate */}
          <button
            onClick={generate}
            disabled={generating}
            className="w-full rounded-xl py-3 font-semibold transition flex items-center justify-center gap-2"
            style={{ background: "#4f46e5", color: "#ffffff", opacity: generating ? 0.7 : 1 }}
          >
            {generating
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              : <><Link2 className="w-4 h-4" /> Generate Shareable Link</>}
          </button>

          {/* Generated Link */}
          {generatedLink && (
            <div className="rounded-xl p-4" style={{ background: "#eef2ff", border: "1px solid #c7d2fe" }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#4f46e5" }}>✅ Link Ready — Share with Customer</p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={generatedLink}
                  className="flex-1 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  style={{ background: "#ffffff", border: "1px solid #c7d2fe", color: "#6b7280" }}
                  onClick={e => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={() => copy(generatedLink, "main")}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition"
                  style={{ background: "#4f46e5", color: "#ffffff" }}
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied === "main" ? "Copied! ✓" : "Copy Link"}
                </button>
              </div>
              <p className="text-xs mt-2" style={{ color: "#818cf8" }}>
                Customer opens this link → sees your custom prices. Each link is unique.
              </p>
            </div>
          )}

          {/* Previous Links This Session */}
          {sessionLinks.length > 1 && (
            <div>
              <p className="text-sm font-semibold mb-2" style={{ color: "#374151" }}>Generated This Session</p>
              {sessionLinks.map((l, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2 mb-1.5" style={{ background: "#f9fafb" }}>
                  <span className="flex-1 text-xs truncate" style={{ color: "#6b7280" }}>{l.label} — ...{l.key}</span>
                  <button onClick={() => copy(l.url, l.key)} style={{ color: copied === l.key ? "#4f46e5" : "#9ca3af" }}>
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <a href={l.url} target="_blank" style={{ color: "#9ca3af" }}>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "#4f46e5", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Crown style={{ width: 16, height: 16, color: "#ffffff" }} />
            </div>
            <div>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#111827" }}>Safawala</span>
              <span style={{ fontSize: 12, color: "#4f46e5", marginLeft: 6, fontWeight: 600 }}>Packages</span>
            </div>
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
        <AdminPanel variants={variants} onClose={() => setShowAdmin(false)} />
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
