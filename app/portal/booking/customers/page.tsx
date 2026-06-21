"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PortalPageHeader, PortalSearchBar, PortalListCard, PortalEmptyState, PortalSkeleton, PortalFAB } from "@/components/portal/portal-shared"
import type { Customer } from "@/lib/types"

const COLOR = "#22c55e"

export default function CustomerListPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => { fetchCustomers() }, [])

  async function fetchCustomers() {
    try {
      const res = await fetch("/api/customers?limit=100")
      const data = await res.json()
      setCustomers(data.data ?? data ?? [])
    } catch { setCustomers([]) }
    finally { setLoading(false) }
  }

  const filtered = customers.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.customer_code?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PortalPageHeader title="Customers" subtitle={`${filtered.length} customers`} color={COLOR} backHref="/portal/booking" />
      <PortalSearchBar value={search} onChange={setSearch} placeholder="Search name, phone or code..." />

      <div className="rounded-2xl mx-4 overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
        {loading ? <PortalSkeleton rows={7} /> : filtered.length === 0 ? (
          <PortalEmptyState icon="users" title="No customers found" subtitle="Try a different search" color={COLOR} />
        ) : filtered.map(c => (
          <PortalListCard
            key={c.id}
            title={c.name}
            subtitle={`${c.phone}${c.city ? ` · ${c.city}` : ""}`}
            meta={c.customer_code}
            badge={c.status ?? "active"}
            color={COLOR}
            icon="user"
            onClick={() => router.push(`/portal/booking/customers/${c.id}`)}
          />
        ))}
      </div>
      <div className="h-4" />
      <PortalFAB label="Add Customer" color={COLOR} onClick={() => router.push("/portal/booking/customers/new")} icon="plus-circle" />
    </div>
  )
}
