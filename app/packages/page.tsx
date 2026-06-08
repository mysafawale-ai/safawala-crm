"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Crown, Phone, Calendar, MapPin, CheckCircle, Sparkles, Star, ChevronDown, Loader2 } from "lucide-react"

interface PackageCategory {
  id: string
  name: string
  description?: string
  display_order?: number
}

interface PackageVariant {
  id: string
  name: string
  base_price: number
  category_id: string
  inclusions?: string[]
  display_order?: number
}

const STATUS_COLORS: Record<string, string> = {
  "Royal": "from-yellow-900/40 to-yellow-700/20 border-yellow-600/30",
  "Premium": "from-purple-900/40 to-purple-700/20 border-purple-600/30",
  "Classic": "from-blue-900/40 to-blue-700/20 border-blue-600/30",
  "Basic": "from-gray-900/40 to-gray-700/20 border-gray-600/30",
}

export default function PublicPackagesPage() {
  const [categories, setCategories] = useState<PackageCategory[]>([])
  const [variants, setVariants] = useState<PackageVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [openCategory, setOpenCategory] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: "",
    phone: "",
    event_date: "",
    location: "",
    message: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch("/api/public/packages")
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories || [])
        setVariants(d.variants || [])
        if (d.categories?.length) setOpenCategory(d.categories[0].id)
      })
      .finally(() => setLoading(false))
  }, [])

  const variantsForCategory = (catId: string) =>
    variants.filter((v) => v.category_id === catId)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = "Please enter your name"
    if (!form.phone.trim()) e.phone = "Please enter your phone number"
    else if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, "")))
      e.phone = "Enter a valid 10-digit Indian mobile number"
    if (!form.event_date) e.event_date = "Please select your event date"
    if (!form.location.trim()) e.location = "Please enter your event location"
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
          package_interest: selectedPackage || undefined,
          source: "packages_page",
        }),
      })
      if (res.ok) setSubmitted(true)
      else alert("Something went wrong. Please call us directly.")
    } catch {
      alert("Something went wrong. Please call us directly.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0c0a14] text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0c0a14]/95 backdrop-blur border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/safawalalogo.png" alt="Safawala" className="h-8 w-auto" onError={(e: any) => { e.target.style.display = 'none' }} />
            <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
              Safawala
            </span>
          </div>
          <a
            href="tel:+919876543210"
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-2 rounded-full text-sm transition-all"
          >
            <Phone className="w-4 h-4" />
            Call Us
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-yellow-900/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-4 py-1.5 text-yellow-400 text-sm mb-6">
            <Crown className="w-4 h-4" />
            Premium Wedding Accessories
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
            Make Your Wedding
            <span className="block bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent">
              Unforgettable
            </span>
          </h1>
          <p className="text-lg text-white/60 max-w-xl mx-auto mb-8">
            Premium safas, malas, kalgis & accessories for grooms and their family.
            Trusted by thousands of families across India.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/50">
            {["5000+ Happy Customers", "Premium Quality", "Pan India Delivery", "Same Day Available"].map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-center mb-2">Our Packages</h2>
        <p className="text-white/50 text-center mb-10 text-sm">Choose the perfect package for your wedding day</p>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <Crown className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Packages coming soon. Please contact us directly.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((cat) => {
              const catVariants = variantsForCategory(cat.id)
              const isOpen = openCategory === cat.id
              const colorKey = Object.keys(STATUS_COLORS).find(k => cat.name.includes(k)) || "Classic"
              return (
                <div
                  key={cat.id}
                  className={`rounded-2xl border bg-gradient-to-br ${STATUS_COLORS[colorKey]} overflow-hidden transition-all`}
                >
                  <button
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-white/5 transition"
                    onClick={() => setOpenCategory(isOpen ? null : cat.id)}
                  >
                    <div>
                      <h3 className="text-xl font-bold text-white">{cat.name}</h3>
                      {cat.description && (
                        <p className="text-white/50 text-sm mt-0.5">{cat.description}</p>
                      )}
                    </div>
                    <ChevronDown className={`w-5 h-5 text-white/50 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6">
                      {catVariants.length === 0 ? (
                        <p className="text-white/40 text-sm py-4">Contact us for pricing on this package.</p>
                      ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                          {catVariants.map((v) => {
                            const inclusions = Array.isArray(v.inclusions) ? v.inclusions : []
                            const isSelected = selectedPackage === v.name
                            return (
                              <button
                                key={v.id}
                                onClick={() => setSelectedPackage(isSelected ? "" : v.name)}
                                className={`text-left rounded-xl p-4 border transition-all ${
                                  isSelected
                                    ? "border-yellow-500 bg-yellow-500/10"
                                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
                                }`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-semibold text-white text-sm">{v.name}</h4>
                                  {isSelected && (
                                    <CheckCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                  )}
                                </div>
                                {v.base_price > 0 && (
                                  <p className="text-yellow-400 font-bold text-lg mb-3">
                                    ₹{v.base_price.toLocaleString("en-IN")}
                                  </p>
                                )}
                                {inclusions.length > 0 && (
                                  <ul className="space-y-1">
                                    {inclusions.slice(0, 5).map((inc, i) => (
                                      <li key={i} className="flex items-center gap-1.5 text-xs text-white/60">
                                        <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                                        {inc}
                                      </li>
                                    ))}
                                    {inclusions.length > 5 && (
                                      <li className="text-xs text-white/40">+{inclusions.length - 5} more included</li>
                                    )}
                                  </ul>
                                )}
                                {isSelected && (
                                  <p className="text-yellow-400 text-xs mt-3 font-medium">✓ Selected — fill form below</p>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Lead Form */}
      <section id="enquiry" className="max-w-2xl mx-auto px-4 pb-24">
        <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 border border-purple-500/20 rounded-2xl p-8">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Enquiry Received! 🎉</h3>
              <p className="text-white/60 mb-6">
                Thank you {form.name}! Our team will call you within 2 hours.
              </p>
              <div className="bg-white/5 rounded-xl p-4 text-sm text-white/50">
                For urgent bookings, call us directly at{" "}
                <a href="tel:+919876543210" className="text-yellow-400 font-semibold">
                  +91 98765 43210
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Book Your Enquiry</h3>
                  <p className="text-white/50 text-sm">
                    {selectedPackage ? `Package selected: ${selectedPackage}` : "Select a package above or enquire directly"}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">
                    Your Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-yellow-500/50 transition ${
                      errors.name ? "border-red-500" : "border-white/10"
                    }`}
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">
                    Mobile Number <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white/50 text-sm flex items-center">
                      🇮🇳 +91
                    </div>
                    <input
                      type="tel"
                      placeholder="98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className={`flex-1 bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-yellow-500/50 transition ${
                        errors.phone ? "border-red-500" : "border-white/10"
                      }`}
                    />
                  </div>
                  {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                </div>

                {/* Event Date + Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">
                      <Calendar className="w-3.5 h-3.5 inline mr-1" />
                      Event Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.event_date}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                      className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition [color-scheme:dark] ${
                        errors.event_date ? "border-red-500" : "border-white/10"
                      }`}
                    />
                    {errors.event_date && <p className="text-red-400 text-xs mt-1">{errors.event_date}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">
                      <MapPin className="w-3.5 h-3.5 inline mr-1" />
                      Event Location <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Pune, Maharashtra"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-yellow-500/50 transition ${
                        errors.location ? "border-red-500" : "border-white/10"
                      }`}
                    />
                    {errors.location && <p className="text-red-400 text-xs mt-1">{errors.location}</p>}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">
                    Additional Message (Optional)
                  </label>
                  <textarea
                    placeholder="Any specific requirements, questions or details..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-yellow-500/50 transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black font-bold py-4 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-base"
                >
                  {submitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Sending Enquiry...</>
                  ) : (
                    <><Sparkles className="w-5 h-5" /> Send Enquiry — We'll Call You!</>
                  )}
                </button>

                <p className="text-center text-white/30 text-xs">
                  🔒 Your information is safe with us. No spam, ever.
                </p>
              </form>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-white/30 text-sm">
        <p>© 2026 Safawala — Premium Indian Wedding Accessories</p>
        <p className="mt-1">Made with ❤️ for Indian weddings</p>
      </footer>
    </div>
  )
}
