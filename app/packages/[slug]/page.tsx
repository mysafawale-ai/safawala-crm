"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { PhoneCall, MessageCircle, Package, CheckCircle, Loader2, AlertCircle, Send, ChevronDown, ChevronUp } from "lucide-react"

interface PriceLink {
  id: string
  label: string
  custom_prices: Record<string, number> // variantId → price
  is_active: boolean
}

interface Variant {
  id: string
  name: string
  base_price: number
  category_id: string
  inclusions?: string[]
}

interface Category {
  id: string
  name: string
  display_order?: number
}

const WHATSAPP_NUMBER = "919725295692"
const CALL_NUMBER = "+919725295691"

function Header() {
  return (
    <header style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
      <Image src="/safawalalogo.png" alt="Safawala" width={110} height={50} style={{ objectFit: "contain" }} />
      <div style={{ display: "flex", gap: 10 }}>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#22c55e", color: "#fff", fontWeight: 600, fontSize: 13, borderRadius: 10, padding: "8px 14px", textDecoration: "none" }}
        >
          <MessageCircle style={{ width: 15, height: 15 }} /> Catalogue
        </a>
        <a
          href={`tel:${CALL_NUMBER}`}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#4f46e5", color: "#fff", fontWeight: 600, fontSize: 13, borderRadius: 10, padding: "8px 14px", textDecoration: "none" }}
        >
          <PhoneCall style={{ width: 15, height: 15 }} /> Call Us
        </a>
      </div>
    </header>
  )
}

function EnquiryForm({ linkId, label, onSuccess }: { linkId: string; label: string; onSuccess: () => void }) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [date, setDate] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) { setError("Name and phone are required."); return }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          event_date: date || null,
          message: message.trim() || null,
          source: "package_link",
          link_label: label,
          price_link_id: linkId,
        }),
      })
      const data = await res.json()
      if (data.success) {
        onSuccess()
      } else {
        setError(data.error || "Something went wrong.")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    border: "1.5px solid #e5e7eb",
    borderRadius: 10,
    fontSize: 14,
    background: "#f9fafb",
    outline: "none",
    boxSizing: "border-box",
  }

  return (
    <div style={{ background: "#fff", borderRadius: 20, padding: "28px 24px", boxShadow: "0 4px 24px rgba(79,70,229,0.08)", border: "1px solid #e5e7eb", maxWidth: 480, margin: "0 auto" }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 6, textAlign: "center" }}>Book Your Enquiry</h3>
      <p style={{ fontSize: 13, color: "#6b7280", textAlign: "center", marginBottom: 20 }}>Fill in your details and we'll get back to you soon</p>
      {error && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} /> {error}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input style={inputStyle} placeholder="Your Name *" value={name} onChange={e => setName(e.target.value)} required />
        <input style={inputStyle} placeholder="Phone Number *" value={phone} onChange={e => setPhone(e.target.value)} type="tel" required />
        <input style={inputStyle} placeholder="Event Date (optional)" value={date} onChange={e => setDate(e.target.value)} type="date" />
        <textarea
          style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
          placeholder="Message (optional)"
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ background: loading ? "#a5b4fc" : "#4f46e5", color: "#fff", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 12, padding: "13px", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          {loading ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : <Send style={{ width: 16, height: 16 }} />}
          {loading ? "Sending…" : "Send Enquiry"}
        </button>
      </form>
    </div>
  )
}

function PackageCard({ variant, price, category }: { variant: Variant; price: number; category?: Category }) {
  const [open, setOpen] = useState(false)
  const inclusions = variant.inclusions || []

  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e5e7eb", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
      <div style={{ padding: "18px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1 }}>
          {category && (
            <span style={{ fontSize: 11, fontWeight: 600, color: "#7c3aed", background: "#ede9fe", borderRadius: 6, padding: "2px 8px", display: "inline-block", marginBottom: 6 }}>
              {category.name}
            </span>
          )}
          <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{variant.name}</div>
          {inclusions.length > 0 && (
            <button
              onClick={() => setOpen(o => !o)}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 12, color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              {open ? <ChevronUp style={{ width: 13, height: 13 }} /> : <ChevronDown style={{ width: 13, height: 13 }} />}
              {open ? "Hide" : "View"} inclusions
            </button>
          )}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#4f46e5" }}>₹{price.toLocaleString("en-IN")}</div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>per event</div>
        </div>
      </div>
      {open && inclusions.length > 0 && (
        <div style={{ borderTop: "1px solid #f3f4f6", padding: "14px 20px", background: "#f9fafb" }}>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {inclusions.map((inc, i) => (
              <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "#374151" }}>
                <CheckCircle style={{ width: 14, height: 14, color: "#22c55e", marginTop: 1, flexShrink: 0 }} />
                {inc}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function SlugPage({ params }: { params: { slug: string } }) {
  const { slug } = params

  const [link, setLink] = useState<PriceLink | null>(null)
  const [variants, setVariants] = useState<Variant[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError("")
      try {
        // 1. Fetch the price link by slug
        const linkRes = await fetch(`/api/public/price-links?key=${encodeURIComponent(slug)}`)
        const linkJson = await linkRes.json()
        if (!linkJson.success || !linkJson.data) {
          setError("This link is invalid or has expired.")
          setLoading(false)
          return
        }
        const priceLink: PriceLink = linkJson.data

        // 2. Fetch all packages to get variant details + categories
        const pkgRes = await fetch("/api/public/packages")
        const pkgJson = await pkgRes.json()

        const allVariants: Variant[] = pkgJson.variants || []
        const allCategories: Category[] = pkgJson.categories || []

        // 3. Keep only variants that are in this price link
        const selectedIds = new Set(Object.keys(priceLink.custom_prices))
        const selectedVariants = allVariants.filter(v => selectedIds.has(v.id))

        // 4. Keep only relevant categories
        const relevantCatIds = new Set(selectedVariants.map(v => v.category_id))
        const relevantCategories = allCategories.filter(c => relevantCatIds.has(c.id))

        setLink(priceLink)
        setVariants(selectedVariants)
        setCategories(relevantCategories)
      } catch {
        setError("Failed to load. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  const categoryMap = new Map(categories.map(c => [c.id, c]))

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 style={{ width: 36, height: 36, color: "#4f46e5", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ color: "#6b7280", fontSize: 14 }}>Loading your packages…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "Inter, system-ui, sans-serif" }}>
        <Header />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
          <div style={{ textAlign: "center", maxWidth: 360, padding: 24 }}>
            <AlertCircle style={{ width: 48, height: 48, color: "#f87171", margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Link Not Found</h2>
            <p style={{ color: "#6b7280", fontSize: 14 }}>{error}</p>
            <p style={{ color: "#6b7280", fontSize: 13, marginTop: 12 }}>
              Contact us: <a href={`tel:${CALL_NUMBER}`} style={{ color: "#4f46e5" }}>{CALL_NUMBER}</a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <Header />

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px 48px" }}>
        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", borderRadius: 20, padding: "28px 24px", color: "#fff", marginBottom: 28, textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", borderRadius: 999, padding: "4px 14px", fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
            <Package style={{ width: 13, height: 13 }} /> Custom Quote
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>
            {link?.label || "Your Packages"}
          </h1>
          <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>
            {variants.length} package{variants.length !== 1 ? "s" : ""} selected · Prices are exclusive to this quote
          </p>
        </div>

        {/* Package Cards */}
        {variants.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 32 }}>
            {variants.map(v => (
              <PackageCard
                key={v.id}
                variant={v}
                price={link!.custom_prices[v.id]}
                category={categoryMap.get(v.category_id)}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
            <Package style={{ width: 40, height: 40, margin: "0 auto 10px" }} />
            <p>No packages found in this quote.</p>
          </div>
        )}

        {/* Enquiry Form or Success */}
        {submitted ? (
          <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 20, padding: "28px 24px", textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
            <CheckCircle style={{ width: 48, height: 48, color: "#15803d", margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#15803d", marginBottom: 6 }}>Enquiry Sent!</h3>
            <p style={{ fontSize: 14, color: "#166534" }}>We'll contact you shortly to confirm your booking.</p>
            <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "center" }}>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer"
                style={{ background: "#22c55e", color: "#fff", fontWeight: 600, fontSize: 13, borderRadius: 10, padding: "9px 16px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <MessageCircle style={{ width: 14, height: 14 }} /> WhatsApp Us
              </a>
              <a href={`tel:${CALL_NUMBER}`}
                style={{ background: "#4f46e5", color: "#fff", fontWeight: 600, fontSize: 13, borderRadius: 10, padding: "9px 16px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <PhoneCall style={{ width: 14, height: 14 }} /> Call Us
              </a>
            </div>
          </div>
        ) : (
          <EnquiryForm
            linkId={link!.id}
            label={link!.label}
            onSuccess={() => setSubmitted(true)}
          />
        )}
      </main>
    </div>
  )
}
