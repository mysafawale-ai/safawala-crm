"use client"

import { useState, useEffect } from "react"
import { PortalPageHeader, PortalSearchBar, PortalListCard, PortalEmptyState, PortalSkeleton } from "@/components/portal/portal-shared"

const COLOR = "#8b5cf6"

export default function FranchiseInventoryPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetch("/api/products?limit=100")
      .then(r => r.json())
      .then(d => setProducts(d.data ?? d ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === "all" || (filter === "low" && (p.available_quantity ?? p.quantity ?? 0) < 5)
    return matchSearch && matchFilter
  })

  return (
    <div>
      <PortalPageHeader title="My Inventory" subtitle={`${filtered.length} products`} color={COLOR} backHref="/portal/franchise" />
      <PortalSearchBar value={search} onChange={setSearch} placeholder="Search product or SKU..." />

      <div className="flex gap-2 px-4 pb-3">
        {["all", "low"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap"
            style={{ background: filter === f ? COLOR : "rgba(255,255,255,0.7)", color: filter === f ? "white" : "rgba(80,55,30,0.5)", border: `1px solid ${filter === f ? COLOR : "rgba(255,255,255,0.9)"}` }}>
            {f === "all" ? "All Stock" : "Low Stock"}
          </button>
        ))}
      </div>

      <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
        {loading ? <PortalSkeleton rows={6} /> : filtered.length === 0 ? (
          <PortalEmptyState icon="package" title="No products found" subtitle="Your franchise inventory appears here" color={COLOR} />
        ) : filtered.map(p => {
          const qty = p.available_quantity ?? p.quantity ?? 0
          const isLow = qty < 5
          return (
            <PortalListCard
              key={p.id}
              title={p.name ?? "Product"}
              subtitle={p.category ?? p.sku ?? "—"}
              meta={`Qty: ${qty}`}
              badge={isLow ? "low_stock" : "in_stock"}
              color={isLow ? "#f59e0b" : COLOR}
              icon="package"
            />
          )
        })}
      </div>
      <div className="h-4" />
    </div>
  )
}
