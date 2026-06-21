"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { PortalPageHeader, PortalSectionLabel } from "@/components/portal/portal-shared"

const COLOR = "#22c55e"

function Field({ label, value, onChange, type = "text", placeholder, required }: any) {
  return (
    <div className="px-4 py-3 border-b border-[rgba(245,235,224,0.8)] last:border-0">
      <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "rgba(80,55,30,0.4)" }}>
        {label}{required && <span style={{ color: COLOR }}> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent outline-none text-[14px] font-medium"
        style={{ color: "#1e1208" }}
      />
    </div>
  )
}

export default function NewCustomerPortalPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", phone: "", whatsapp: "", email: "", city: "", area: "", address: "" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const set = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: val }))

  async function save() {
    if (!form.name.trim() || !form.phone.trim()) { setError("Name and phone are required"); return }
    setSaving(true)
    setError("")
    const { data, error: err } = await supabase.from("customers").insert([{
      name: form.name.trim(),
      phone: form.phone.trim(),
      whatsapp: form.whatsapp.trim() || form.phone.trim(),
      email: form.email.trim() || null,
      city: form.city.trim() || null,
      area: form.area.trim() || null,
      address: form.address.trim() || null,
      created_at: new Date().toISOString(),
    }]).select().single()
    if (err) { setError(err.message); setSaving(false); return }
    router.push(`/portal/booking/customers/${data.id}`)
  }

  return (
    <div className="pb-6">
      <PortalPageHeader title="Add Customer" subtitle="New customer profile" color={COLOR} backHref="/portal/booking/customers" />

      <PortalSectionLabel label="Basic Info" />
      <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
        <Field label="Full Name" value={form.name} onChange={set("name")} placeholder="e.g. Rahul Sharma" required />
        <Field label="Phone" value={form.phone} onChange={set("phone")} type="tel" placeholder="+91 98765 43210" required />
        <Field label="WhatsApp" value={form.whatsapp} onChange={set("whatsapp")} type="tel" placeholder="Same as phone if blank" />
        <Field label="Email" value={form.email} onChange={set("email")} type="email" placeholder="Optional" />
      </div>

      <PortalSectionLabel label="Address" />
      <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
        <Field label="City" value={form.city} onChange={set("city")} placeholder="e.g. Surat" />
        <Field label="Area / Locality" value={form.area} onChange={set("area")} placeholder="e.g. Adajan" />
        <Field label="Full Address" value={form.address} onChange={set("address")} placeholder="Optional" />
      </div>

      {error && (
        <p className="mx-4 mt-3 text-[12px] font-semibold text-center" style={{ color: "#dc2626" }}>{error}</p>
      )}

      <div className="mx-4 mt-4">
        <button
          onClick={save}
          disabled={saving}
          className="w-full py-4 rounded-2xl text-[14px] font-black text-white transition-opacity"
          style={{ background: COLOR, opacity: saving ? 0.7 : 1 }}
        >
          {saving ? "Saving..." : "Save Customer"}
        </button>
      </div>
    </div>
  )
}
