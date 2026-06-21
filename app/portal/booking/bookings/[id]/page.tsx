"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { PortalPageHeader, PortalSectionLabel, PortalInfoRow, PortalStatusBadge, PortalSkeleton } from "@/components/portal/portal-shared"

const COLOR = "#22c55e"

const STATUSES = [
  { value: "pending_payment", label: "Pending Payment" },
  { value: "pending_selection", label: "Pending Selection" },
  { value: "confirmed", label: "Confirmed" },
  { value: "delivered", label: "Delivered" },
  { value: "returned", label: "Returned" },
  { value: "order_complete", label: "Order Complete" },
  { value: "cancelled", label: "Cancelled" },
]

export default function BookingDetailPortalPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => { if (id) loadBooking() }, [id])
  useEffect(() => { if (toast) setTimeout(() => setToast(null), 3000) }, [toast])

  async function loadBooking() {
    setLoading(true)
    const { data, error } = await supabase
      .from("bookings")
      .select(`*, customer:customers(name, phone, email, whatsapp, address, city), booking_items(id, quantity, unit_price, total_price, product:products(name, category, barcode))`)
      .eq("id", id)
      .single()
    if (!error) setBooking(data)
    setLoading(false)
  }

  async function updateStatus(newStatus: string) {
    if (!booking || updating) return
    setUpdating(true)
    const { error } = await supabase.from("bookings").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", id)
    if (!error) {
      setBooking({ ...booking, status: newStatus })
      setToast(`Status updated to ${newStatus.replace(/_/g, " ")}`)
      // WhatsApp notify
      try {
        await fetch("/api/whatsapp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: booking.customer?.whatsapp || booking.customer?.phone, message: { type: "text", text: { body: `Hi ${booking.customer?.name || "Customer"}, your booking #${booking.booking_number} is now ${newStatus.replace(/_/g, " ").toUpperCase()}. Total: ₹${booking.total_amount?.toLocaleString("en-IN")}. - Safawala` } } })
        })
      } catch {}
    }
    setUpdating(false)
  }

  async function downloadInvoice() {
    try {
      const res = await fetch("/api/generate-invoice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId: id, template: "modern" }) })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = url; a.download = `invoice-${booking.booking_number}.pdf`; a.click()
      window.URL.revokeObjectURL(url)
      setToast("Invoice downloaded!")
    } catch { setToast("Failed to download invoice") }
  }

  const fmt = (n: number) => `₹${(n ?? 0).toLocaleString("en-IN")}`
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"
  const paid = booking?.paid_amount ?? booking?.advance_amount ?? 0
  const balance = (booking?.total_amount ?? 0) - paid

  if (loading) return (
    <div>
      <PortalPageHeader title="Booking Details" color={COLOR} backHref="/portal/booking/bookings" />
      <div className="mx-4 mt-4"><PortalSkeleton rows={8} /></div>
    </div>
  )

  if (!booking) return (
    <div>
      <PortalPageHeader title="Not Found" color={COLOR} backHref="/portal/booking/bookings" />
      <div className="mx-4 mt-8 text-center">
        <p className="text-[14px]" style={{ color: "rgba(80,55,30,0.5)" }}>Booking not found</p>
        <button onClick={() => router.push("/portal/booking/bookings")} className="mt-4 px-4 py-2 rounded-xl text-white text-[13px] font-bold" style={{ background: COLOR }}>Go Back</button>
      </div>
    </div>
  )

  return (
    <div className="pb-6">
      <PortalPageHeader
        title={`#${booking.booking_number}`}
        subtitle={booking.customer?.name ?? "Booking"}
        color={COLOR}
        backHref="/portal/booking/bookings"
        action={{ label: "Edit", onClick: () => router.push(`/bookings/${id}/edit`) }}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-white text-[12px] font-bold shadow-lg" style={{ background: COLOR }}>
          {toast}
        </div>
      )}

      {/* Status + Type Pills */}
      <div className="flex gap-2 px-4 mt-4">
        <PortalStatusBadge status={booking.status ?? "pending"} />
        {booking.type && (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold capitalize" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.95)", color: "rgba(80,55,30,0.5)" }}>
            {booking.type.replace(/_/g, " ")}
          </span>
        )}
      </div>

      {/* Amount Banner */}
      <div className="mx-4 mt-3 p-4 rounded-2xl" style={{ background: `linear-gradient(135deg, ${COLOR}18, ${COLOR}06)`, border: `1px solid ${COLOR}22` }}>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "rgba(80,55,30,0.4)" }}>Total</p>
            <p className="text-[16px] font-black" style={{ color: "#1e1208" }}>{fmt(booking.total_amount)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "rgba(80,55,30,0.4)" }}>Paid</p>
            <p className="text-[16px] font-black" style={{ color: "#16a34a" }}>{fmt(paid)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "rgba(80,55,30,0.4)" }}>Balance</p>
            <p className="text-[16px] font-black" style={{ color: balance > 0 ? "#dc2626" : "#16a34a" }}>{fmt(balance)}</p>
          </div>
        </div>
      </div>

      {/* Change Status */}
      <PortalSectionLabel label="Update Status" />
      <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
        <div className="p-3 flex flex-wrap gap-2">
          {STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => updateStatus(s.value)}
              disabled={updating || booking.status === s.value}
              className="px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all"
              style={{
                background: booking.status === s.value ? COLOR : "rgba(245,235,224,0.6)",
                color: booking.status === s.value ? "white" : "rgba(80,55,30,0.6)",
                border: `1px solid ${booking.status === s.value ? COLOR : "rgba(245,235,224,0.9)"}`,
                opacity: updating ? 0.6 : 1
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Booking Info */}
      <PortalSectionLabel label="Booking Details" />
      <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
        <PortalInfoRow label="Booking #" value={booking.booking_number ?? "—"} />
        <PortalInfoRow label="Event Date" value={fmtDate(booking.event_date)} />
        <PortalInfoRow label="Event Venue" value={booking.event_venue ?? "—"} />
        <PortalInfoRow label="Delivery Date" value={fmtDate(booking.delivery_date)} />
        <PortalInfoRow label="Return Date" value={fmtDate(booking.return_date)} />
        <PortalInfoRow label="Created" value={fmtDate(booking.created_at)} />
        {booking.notes && <PortalInfoRow label="Notes" value={booking.notes} />}
      </div>

      {/* Customer Info */}
      <PortalSectionLabel label="Customer" />
      <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
        {booking.customer ? (
          <>
            <PortalInfoRow label="Name" value={booking.customer.name ?? "—"} />
            <PortalInfoRow label="Phone" value={booking.customer.phone ?? "—"} />
            {booking.customer.email && <PortalInfoRow label="Email" value={booking.customer.email} />}
            {booking.customer.city && <PortalInfoRow label="City" value={booking.customer.city} />}
            {booking.customer.address && <PortalInfoRow label="Address" value={booking.customer.address} />}
          </>
        ) : (
          <div className="p-4 text-center text-[12px]" style={{ color: "rgba(80,55,30,0.4)" }}>No customer info</div>
        )}
        {booking.customer?.phone && (
          <div className="p-3 border-t border-[rgba(245,235,224,0.8)] flex gap-2">
            <a href={`tel:${booking.customer.phone}`} className="flex-1 py-2 rounded-xl text-center text-[12px] font-bold text-white" style={{ background: "#3b82f6" }}>Call</a>
            <a href={`https://wa.me/${(booking.customer.whatsapp || booking.customer.phone).replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex-1 py-2 rounded-xl text-center text-[12px] font-bold text-white" style={{ background: "#25d366" }}>WhatsApp</a>
          </div>
        )}
      </div>

      {/* Items */}
      {booking.booking_items?.length > 0 && (
        <>
          <PortalSectionLabel label={`Items (${booking.booking_items.length})`} />
          <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
            {booking.booking_items.map((item: any, i: number) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: i < booking.booking_items.length - 1 ? "1px solid rgba(245,235,224,0.8)" : "none" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${COLOR}18` }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLOR} strokeWidth="2.5" strokeLinecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold truncate" style={{ color: "#1e1208" }}>{item.product?.name ?? "Product"}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "rgba(80,55,30,0.45)" }}>{item.product?.category ?? "—"} {item.product?.barcode ? `· ${item.product.barcode}` : ""}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[12px] font-bold" style={{ color: "#1e1208" }}>×{item.quantity}</p>
                  <p className="text-[10px]" style={{ color: "rgba(80,55,30,0.45)" }}>{fmt(item.total_price)}</p>
                </div>
              </div>
            ))}
            <div className="flex justify-between px-4 py-3 border-t border-[rgba(245,235,224,0.8)]">
              <span className="text-[11px] font-bold" style={{ color: "rgba(80,55,30,0.5)" }}>Total</span>
              <span className="text-[13px] font-black" style={{ color: "#1e1208" }}>{fmt(booking.total_amount)}</span>
            </div>
          </div>
        </>
      )}

      {/* Actions */}
      <PortalSectionLabel label="Actions" />
      <div className="mx-4 flex flex-col gap-2">
        <button onClick={downloadInvoice} className="w-full py-3 rounded-2xl text-[13px] font-bold text-white" style={{ background: "#3b82f6" }}>
          Download Invoice PDF
        </button>
        <button onClick={() => router.push(`/bookings/${id}/edit`)} className="w-full py-3 rounded-2xl text-[13px] font-bold" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.9)", color: "#1e1208" }}>
          Edit Booking
        </button>
        <button onClick={() => router.push(`/bookings/${id}/select-products`)} className="w-full py-3 rounded-2xl text-[13px] font-bold" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.9)", color: "#1e1208" }}>
          Select / Change Products
        </button>
        <button onClick={() => router.push(`/create-invoice?bookingId=${id}`)} className="w-full py-3 rounded-2xl text-[13px] font-bold" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.9)", color: "#1e1208" }}>
          Create Invoice
        </button>
      </div>
    </div>
  )
}
