"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { PortalPageHeader, PortalSectionLabel, PortalInfoRow, PortalListCard, PortalSkeleton, PortalStatusBadge } from "@/components/portal/portal-shared"

const COLOR = "#22c55e"

export default function CustomerDetailPortalPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [customer, setCustomer] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (id) loadData() }, [id])

  async function loadData() {
    setLoading(true)
    const [custRes, bookRes] = await Promise.all([
      supabase.from("customers").select("*").eq("id", id).single(),
      supabase.from("bookings").select("id, booking_number, event_date, total_amount, status, type").eq("customer_id", id).order("created_at", { ascending: false }),
    ])
    if (!custRes.error) setCustomer(custRes.data)
    if (!bookRes.error) setBookings(bookRes.data ?? [])
    setLoading(false)
  }

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"
  const fmt = (n: number) => `₹${(n ?? 0).toLocaleString("en-IN")}`
  const totalSpend = bookings.reduce((s, b) => s + (b.total_amount ?? 0), 0)

  if (loading) return (
    <div>
      <PortalPageHeader title="Customer" color={COLOR} backHref="/portal/booking/customers" />
      <div className="mx-4 mt-4"><PortalSkeleton rows={8} /></div>
    </div>
  )

  if (!customer) return (
    <div>
      <PortalPageHeader title="Not Found" color={COLOR} backHref="/portal/booking/customers" />
      <div className="mx-4 mt-8 text-center"><p className="text-[14px]" style={{ color: "rgba(80,55,30,0.5)" }}>Customer not found</p></div>
    </div>
  )

  return (
    <div className="pb-6">
      <PortalPageHeader
        title={customer.name ?? "Customer"}
        subtitle={customer.customer_code ?? customer.phone}
        color={COLOR}
        backHref="/portal/booking/customers"
        action={{ label: "Edit", onClick: () => router.push(`/customers/${id}/edit`) }}
      />

      {/* Avatar + Stats */}
      <div className="mx-4 mt-4 p-4 rounded-2xl flex items-center gap-4" style={{ background: `linear-gradient(135deg, ${COLOR}18, ${COLOR}06)`, border: `1px solid ${COLOR}22` }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[20px] font-black" style={{ background: COLOR }}>
          {(customer.name ?? "?").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(80,55,30,0.4)" }}>Total Bookings</p>
            <p className="text-[20px] font-black" style={{ color: "#1e1208" }}>{bookings.length}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(80,55,30,0.4)" }}>Total Spend</p>
            <p className="text-[20px] font-black" style={{ color: "#1e1208" }}>{fmt(totalSpend)}</p>
          </div>
        </div>
      </div>

      {/* Contact Actions */}
      {customer.phone && (
        <div className="mx-4 mt-3 flex gap-2">
          <a href={`tel:${customer.phone}`} className="flex-1 py-2.5 rounded-xl text-center text-[12px] font-bold text-white" style={{ background: "#3b82f6" }}>Call</a>
          <a href={`https://wa.me/${(customer.whatsapp || customer.phone).replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex-1 py-2.5 rounded-xl text-center text-[12px] font-bold text-white" style={{ background: "#25d366" }}>WhatsApp</a>
          <button onClick={() => router.push(`/bookings/create?customerId=${id}`)} className="flex-1 py-2.5 rounded-xl text-center text-[12px] font-bold text-white" style={{ background: COLOR }}>New Booking</button>
        </div>
      )}

      {/* Customer Info */}
      <PortalSectionLabel label="Contact Info" />
      <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
        <PortalInfoRow label="Phone" value={customer.phone ?? "—"} />
        {customer.whatsapp && <PortalInfoRow label="WhatsApp" value={customer.whatsapp} />}
        {customer.email && <PortalInfoRow label="Email" value={customer.email} />}
        {customer.city && <PortalInfoRow label="City" value={customer.city} />}
        {customer.area && <PortalInfoRow label="Area" value={customer.area} />}
        {customer.address && <PortalInfoRow label="Address" value={customer.address} />}
        {customer.customer_code && <PortalInfoRow label="Code" value={customer.customer_code} />}
        <PortalInfoRow label="Added" value={fmtDate(customer.created_at)} />
      </div>

      {/* Bookings */}
      <PortalSectionLabel label={`Bookings (${bookings.length})`} />
      <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
        {bookings.length === 0 ? (
          <div className="p-6 text-center text-[12px]" style={{ color: "rgba(80,55,30,0.4)" }}>No bookings yet</div>
        ) : bookings.map(b => (
          <PortalListCard
            key={b.id}
            title={`#${b.booking_number}`}
            subtitle={b.event_date ? `Event: ${fmtDate(b.event_date)}` : "No event date"}
            meta={fmt(b.total_amount)}
            badge={b.status ?? "pending"}
            color={COLOR}
            icon="calendar"
            onClick={() => router.push(`/portal/booking/bookings/${b.id}`)}
          />
        ))}
      </div>
    </div>
  )
}
