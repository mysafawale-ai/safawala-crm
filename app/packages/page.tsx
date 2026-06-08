"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import {
  Crown, Phone, Calendar, MapPin, CheckCircle, ChevronRight,
  X, Loader2, Star, Package, Lock, Eye, EyeOff, Link2,
  Copy, Plus, Minus, RefreshCw, Shield, ExternalLink
} from "lucide-react"

interface PackageCategory { id: string; name: string; description?: string; display_order?: number }
interface PackageVariant { id: string; name: string; base_price: number; category_id: string; inclusions?: string[]; display_order?: number }

// Sort categories numerically by leading number in name
function sortCategories(cats: PackageCategory[]) {
  return [...cats].sort((a, b) => {
    const numA = parseInt(a.name) || 999
    const numB = parseInt(b.name) || 999
    return numA - numB
  })
}

// ─── Lead Popup Modal ───────────────────────────────────────────
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
    else if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, ""))) e.phone = "Enter valid 10-digit number"
    if (!form.event_date) e.event_date = "Select event date"
    if (!form.location.trim()) e.location = "Enter location"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Enquiry Sent! 🎉</h3>
            <p className="text-gray-500 mb-2">Our team will call you within 2 hours.</p>
            <p className="text-sm text-gray-400">Package: <span className="font-medium text-indigo-600">{variant.name}</span></p>
            <button onClick={onClose} className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 font-semibold transition">Close</button>
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="flex items-start justify-between p-5 border-b">
              <div>
                <div className="text-xs text-indigo-600 font-semibold uppercase tracking-wide mb-1">{category.name}</div>
                <h3 className="text-xl font-bold text-gray-900">{variant.name}</h3>
                {displayPrice > 0 && (
                  <p className="text-2xl font-black text-indigo-600 mt-1">
                    ₹{displayPrice.toLocaleString("en-IN")}
                  </p>
                )}
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Inclusions */}
            {inclusions.length > 0 && (
              <div className="px-5 py-4 bg-indigo-50/50 border-b">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">What's Included</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {inclusions.map((inc, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-sm text-gray-700">
                      <CheckCircle className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                      {inc}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lead Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <p className="text-sm font-semibold text-gray-700">Fill your details — we'll call you!</p>

              <div>
                <input type="text" placeholder="Your Name *" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${errors.name ? "border-red-400" : "border-gray-200"}`} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div className="flex gap-2">
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-500 flex items-center whitespace-nowrap">🇮🇳 +91</div>
                <div className="flex-1">
                  <input type="tel" placeholder="Mobile Number *" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${errors.phone ? "border-red-400" : "border-gray-200"}`} />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input type="date" value={form.event_date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={e => setForm({ ...form, event_date: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${errors.event_date ? "border-red-400" : "border-gray-200"}`} />
                  {errors.event_date && <p className="text-red-500 text-xs mt-1">{errors.event_date}</p>}
                </div>
                <div>
                  <input type="text" placeholder="Event Location *" value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${errors.location ? "border-red-400" : "border-gray-200"}`} />
                  {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                </div>
              </div>

              <textarea placeholder="Any message or special requirements..." value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none" />

              <button type="submit" disabled={submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 font-semibold transition flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <>Send Enquiry — We'll Call You! 📞</>}
              </button>
              <p className="text-center text-gray-400 text-xs">🔒 Your info is safe. No spam ever.</p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Admin Panel ─────────────────────────────────────────────────
function AdminPanel({ variants, onClose }: { variants: PackageVariant[]; onClose: () => void }) {
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [label, setLabel] = useState("")
  const [generating, setGenerating] = useState(false)
  const [generatedLink, setGeneratedLink] = useState("")
  const [links, setLinks] = useState<any[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const init: Record<string, number> = {}
    variants.forEach(v => { init[v.id] = v.base_price })
    setPrices(init)
  }, [variants])

  const adjustPrice = (id: string, delta: number) => {
    setPrices(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }))
  }

  const generateLink = async () => {
    const adminPwd = (document.getElementById("admin-pwd") as HTMLInputElement)?.value
    if (!adminPwd) { alert("Enter admin password"); return }
    setGenerating(true)
    try {
      const res = await fetch("/api/public/price-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPwd, custom_prices: prices, label: label || "Custom Quote" }),
      })
      const data = await res.json()
      if (res.ok) {
        const url = `${window.location.origin}/packages?pk=${data.link_key}`
        setGeneratedLink(url)
        setLinks(prev => [{ link_key: data.link_key, label: label || "Custom Quote", url }, ...prev])
      } else {
        alert(data.error || "Failed to generate link")
      }
    } catch { alert("Error generating link") }
    finally { setGenerating(false) }
  }

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-gray-900">Admin — Custom Pricing</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Admin Password</label>
            <input id="admin-pwd" type="password" placeholder="Enter admin password"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
          </div>

          {/* Label */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Quote Label <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="text" placeholder="e.g. Sharma Wedding Quote" value={label}
              onChange={e => setLabel(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
          </div>

          {/* Price Editor */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Set Custom Prices</label>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {variants.map(v => (
                <div key={v.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
                  <span className="flex-1 text-sm text-gray-700 font-medium truncate">{v.name}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => adjustPrice(v.id, -500)} className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition text-gray-600">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-bold text-indigo-600 min-w-[70px] text-center">
                      ₹{(prices[v.id] || 0).toLocaleString("en-IN")}
                    </span>
                    <button onClick={() => adjustPrice(v.id, 500)} className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition text-gray-600">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <input type="number" value={prices[v.id] || 0}
                      onChange={e => setPrices(prev => ({ ...prev, [v.id]: Number(e.target.value) }))}
                      className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button onClick={generateLink} disabled={generating}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 font-semibold transition flex items-center justify-center gap-2 disabled:opacity-60">
            {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Link2 className="w-4 h-4" /> Generate Shareable Link</>}
          </button>

          {/* Generated Link */}
          {generatedLink && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-indigo-700 mb-2 uppercase tracking-wide">✅ Link Generated!</p>
              <div className="flex items-center gap-2">
                <input readOnly value={generatedLink}
                  className="flex-1 bg-white border border-indigo-200 rounded-lg px-3 py-2 text-xs text-gray-600 focus:outline-none" />
                <button onClick={() => copyLink(generatedLink)}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-2 text-xs font-semibold transition whitespace-nowrap">
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-xs text-indigo-500 mt-2">Share this link with the customer. Opens your packages page with your custom prices.</p>
            </div>
          )}

          {/* Previous Links */}
          {links.length > 1 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Generated This Session</p>
              <div className="space-y-1.5">
                {links.map((l, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <span className="flex-1 text-xs text-gray-600 truncate">{l.label} — ...{l.link_key}</span>
                    <button onClick={() => copyLink(l.url)} className="text-indigo-500 hover:text-indigo-700 transition">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <a href={l.url} target="_blank" className="text-indigo-500 hover:text-indigo-700 transition">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
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

  const [categories, setCategories] = useState<PackageCategory[]>([])
  const [variants, setVariants] = useState<PackageVariant[]>([])
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState<{ variant: PackageVariant; category: PackageCategory } | null>(null)
  const [showAdmin, setShowAdmin] = useState(false)
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const [priceLabel, setPriceLabel] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        // Load packages
        const pkgRes = await fetch("/api/public/packages")
        const pkgData = await pkgRes.json()
        const sorted = sortCategories(pkgData.categories || [])
        setCategories(sorted)
        setVariants(pkgData.variants || [])
        if (sorted.length > 0) setExpandedCat(sorted[0].id)

        // Load custom prices if price key provided
        if (priceKey) {
          const priceRes = await fetch(`/api/public/price-links?key=${priceKey}`)
          if (priceRes.ok) {
            const priceData = await priceRes.json()
            setCustomPrices(priceData.data?.custom_prices || {})
            setPriceLabel(priceData.data?.label || null)
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [priceKey])

  const getPrice = (variant: PackageVariant) =>
    customPrices[variant.id] !== undefined ? customPrices[variant.id] : variant.base_price

  const variantsForCat = (catId: string) =>
    variants.filter(v => v.category_id === catId)

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Crown className="w-4 h-4 text-white fill-white/20" />
            </div>
            <div>
              <span className="text-lg font-black text-gray-900">Safawala</span>
              <span className="text-xs text-indigo-600 ml-1.5 font-medium">Packages</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {priceKey && priceLabel && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-3 py-1">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                {priceLabel}
              </span>
            )}
            <a href="tel:+919876543210"
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-full transition">
              <Phone className="w-3.5 h-3.5" />
              Call Us
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-white border-b border-gray-100 py-10 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full px-3 py-1 mb-4">
            <Crown className="w-3.5 h-3.5" />
            Premium Wedding Accessories Since 2015
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
            Wedding Packages <span className="text-indigo-600">for Every Family</span>
          </h1>
          <p className="text-gray-500 text-base mb-6">
            Premium safas, malas, kalgis & accessories. Select a package to enquire instantly.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
            {["5000+ Happy Customers", "Pan India Delivery", "Same Day Available", "Premium Quality"].map(t => (
              <div key={t} className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages Grid */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Packages coming soon. Please contact us directly.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map(cat => {
              const catVariants = variantsForCat(cat.id)
              const isOpen = expandedCat === cat.id
              return (
                <div key={cat.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Category Header */}
                  <button
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition text-left"
                    onClick={() => setExpandedCat(isOpen ? null : cat.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Package className="w-4.5 h-4.5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900">{cat.name}</h3>
                        {cat.description && <p className="text-xs text-gray-400 mt-0.5">{cat.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{catVariants.length} options</span>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                    </div>
                  </button>

                  {/* Variants */}
                  {isOpen && catVariants.length > 0 && (
                    <div className="px-5 pb-5 border-t border-gray-100">
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
                        {catVariants.map(v => {
                          const price = getPrice(v)
                          const inclusions = Array.isArray(v.inclusions) ? v.inclusions : []
                          const isCustom = priceKey && customPrices[v.id] !== undefined && customPrices[v.id] !== v.base_price
                          return (
                            <button
                              key={v.id}
                              onClick={() => setSelectedVariant({ variant: v, category: cat })}
                              className="text-left p-4 border border-gray-200 rounded-xl hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-100 transition-all group"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-gray-800 text-sm group-hover:text-indigo-700 transition">{v.name}</h4>
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition flex-shrink-0 mt-0.5" />
                              </div>
                              {price > 0 && (
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-lg font-black text-indigo-600">₹{price.toLocaleString("en-IN")}</span>
                                  {isCustom && v.base_price !== price && (
                                    <span className="text-xs text-gray-400 line-through">₹{v.base_price.toLocaleString("en-IN")}</span>
                                  )}
                                </div>
                              )}
                              {inclusions.length > 0 && (
                                <ul className="space-y-1">
                                  {inclusions.slice(0, 4).map((inc, i) => (
                                    <li key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
                                      <CheckCircle className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                                      {inc}
                                    </li>
                                  ))}
                                  {inclusions.length > 4 && (
                                    <li className="text-xs text-indigo-400 font-medium">+{inclusions.length - 4} more included</li>
                                  )}
                                </ul>
                              )}
                              <div className="mt-3 w-full bg-indigo-600 group-hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg py-1.5 text-center transition">
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
      <footer className="border-t border-gray-200 bg-white py-6 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <p className="text-sm text-gray-400">© 2026 Safawala — Premium Indian Wedding Accessories</p>
          {/* Subtle admin toggle */}
          <button
            onClick={() => setShowAdmin(true)}
            className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-gray-500 transition"
            title="Admin"
          >
            <Lock className="w-3 h-3" />
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
        <AdminPanel
          variants={variants}
          onClose={() => setShowAdmin(false)}
        />
      )}
    </div>
  )
}

export default function PackagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
      </div>
    }>
      <PackagesContent />
    </Suspense>
  )
}
