"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PortalPageHeader, PortalSearchBar, PortalListCard, PortalEmptyState, PortalSkeleton, PortalSectionLabel } from "@/components/portal/portal-shared"
import { supabase } from "@/lib/supabase"

const COLOR = "#a855f7"

export default function InventoryPage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")

  // Damage reports states
  const [damageReports, setDamageReports] = useState<any[]>([])
  const [damageLoading, setDamageLoading] = useState(true)

  // Barcode quick lookup states
  const [scanOpen, setScanOpen] = useState(false)
  const [barcode, setBarcode] = useState("")
  const [lookupResult, setLookupResult] = useState<any>(null)
  const [lookupError, setLookupError] = useState("")
  const [lookupLoading, setLookupLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const [errorState, setErrorState] = useState<string | null>(null)
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    fetchProducts()
    fetchDamageReports()
  }, [filter])

  async function fetchDamageReports() {
    setDamageLoading(true)
    try {
      const { data, error } = await supabase
        .from("damage_reports")
        .select("*, product:products(*)")
        .order("reported_at", { ascending: false })
      
      if (error) throw error
      setDamageReports(data || [])
    } catch (err: any) {
      console.error("Failed to fetch damage reports:", err)
      if (err.message?.includes("restricted") || err.message?.includes("quota") || err.message?.includes("limit") || err.message?.includes("Service for this project is restricted")) {
        setDemoMode(true)
        const mockReports = [
          {
            id: "dr1",
            qty_damaged: 2,
            damage_type: "tear",
            severity: "major",
            description: "Strap ripped off during handling",
            reported_at: new Date().toISOString(),
            status: "pending",
            product: { name: "Premium Red Safa", sku: "SAF-RED-001", barcode: "10001" }
          },
          {
            id: "dr2",
            qty_damaged: 1,
            damage_type: "broken",
            severity: "total_loss",
            description: "Kalangi brooch pin completely broken",
            reported_at: new Date().toISOString(),
            status: "pending",
            product: { name: "Silver Pearl Kalangi", sku: "KLG-SLV-001", barcode: "30001" }
          }
        ]
        setDamageReports(mockReports)
      } else {
        setErrorState(prev => prev || err.message || "Failed to fetch damage reports")
        setDamageReports([])
      }
    } finally {
      setDamageLoading(false)
    }
  }

  async function fetchProducts() {
    setLoading(true)
    setErrorState(null)
    setDemoMode(false)
    try {
      const params = new URLSearchParams({ limit: "100" })
      if (filter === "low") params.set("low_stock", "true")
      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch products")
      }
      if (data.mock) {
        setDemoMode(true)
      }
      const productsList = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : [])
      setProducts(productsList)
    } catch (err: any) {
      console.error("Failed to fetch products:", err)
      setErrorState(err.message || "Failed to fetch products")
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  async function lookupBarcode(code: string) {
    if (!code.trim()) return
    setLookupLoading(true)
    setLookupError("")
    setLookupResult(null)
    try {
      const res = await fetch(`/api/products?barcode=${encodeURIComponent(code)}&limit=1`)
      const data = await res.json()
      const productsList = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : [])
      const product = productsList[0]
      if (product) {
        setLookupResult(product)
      } else {
        setLookupError("No product found for this barcode.")
      }
    } catch {
      setLookupError("Lookup failed. Try again.")
    } finally {
      setLookupLoading(false)
    }
  }

  async function generateBarcode(productId: string) {
    if (generating) return
    setGenerating(true)
    try {
      const res = await fetch("/api/products/generate-barcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })
      const data = await res.json()
      if (res.ok && data.barcode) {
        setLookupResult((prev: any) => prev ? { ...prev, barcode: data.barcode } : null)
        // Update in main list
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, barcode: data.barcode } : p))
        alert("Barcode generated successfully!")
      } else {
        alert(data.error || "Failed to generate barcode.")
      }
    } catch {
      alert("Error generating barcode.")
    } finally {
      setGenerating(false)
    }
  }

  const filtered = products.filter(p =>
    !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.includes(search)
  )

  const getStockBadge = (p: any) => {
    const qty = p.stock_quantity ?? p.quantity ?? 0
    if (qty <= 0) return "inactive"
    if (qty <= (p.min_stock_level ?? 2)) return "lead"
    return "active"
  }

  return (
    <div>
      <PortalPageHeader 
        title="Stock Inventory" 
        subtitle={`${filtered.length} items`} 
        color={COLOR} 
        backHref="/portal/warehouse" 
        action={{ label: "Quick Scan", onClick: () => setScanOpen(true) }}
      />
      <PortalSearchBar value={search} onChange={setSearch} placeholder="Search name, SKU or barcode..." />

      {demoMode && (
        <div className="mx-4 mb-4 p-4 bg-purple-50 border border-purple-200 rounded-2xl flex flex-col gap-1.5 shadow-sm">
          <p className="text-[12px] font-extrabold text-purple-800 flex items-center gap-1.5">
            ✨ Running in Demo Mode
          </p>
          <p className="text-[11px] font-medium text-purple-700 leading-relaxed">
            Using local JSON fallback content because your Supabase database is restricted due to quota limits. Active tasks and inventory changes will run locally for simulation.
          </p>
        </div>
      )}

      {errorState && !demoMode && (
        <div className="mx-4 mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col gap-1.5 shadow-sm">
          <p className="text-[12px] font-extrabold text-red-800 flex items-center gap-1.5">
            ⚠️ Database Restriction Active
          </p>
          <p className="text-[11px] font-medium text-red-700 leading-relaxed">
            {errorState.includes("restricted") || errorState.includes("quota") || errorState.includes("limit")
              ? "The Supabase database has hit its storage or egress limits. Please log in to your Supabase Dashboard to upgrade your plan or delete files to restore database services."
              : errorState}
          </p>
        </div>
      )}

      <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
        {["all", "low"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap flex-shrink-0"
            style={{ background: filter === f ? COLOR : "rgba(255,255,255,0.7)", color: filter === f ? "white" : "rgba(80,55,30,0.5)", border: `1px solid ${filter === f ? COLOR : "rgba(255,255,255,0.9)"}` }}>
            {f === "all" ? "All Items" : "Low Stock ⚠"}
          </button>
        ))}
      </div>

      <div className="rounded-2xl mx-4 overflow-hidden shadow-sm" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
        {loading ? <PortalSkeleton rows={7} /> : filtered.length === 0 ? (
          <PortalEmptyState icon="box" title="No items found" color={COLOR} />
        ) : filtered.map(p => (
          <PortalListCard
            key={p.id}
            title={p.name}
            subtitle={`SKU: ${p.sku ?? "—"}${p.barcode ? ` · ${p.barcode}` : " (No Barcode)"}`}
            meta={`Qty: ${p.stock_quantity ?? p.quantity ?? 0}`}
            badge={getStockBadge(p)}
            color={COLOR}
            icon="package"
            onClick={() => router.push(`/portal/warehouse/inventory/${p.id}`)}
          />
        ))}
      </div>
      <div className="h-4" />

      {/* Damaged & Archived Stock Section */}
      <PortalSectionLabel label="⚠️ Damaged & Archived Stock" />
      <div className="rounded-2xl mx-4 overflow-hidden shadow-sm mb-6" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
        {damageLoading ? (
          <PortalSkeleton rows={3} />
        ) : damageReports.length === 0 ? (
          <PortalEmptyState icon="alert-triangle" title="No damaged items archived" color="#ef4444" />
        ) : (
          damageReports.map(r => (
            <PortalListCard
              key={r.id}
              title={r.product?.name || "Unknown Product"}
              subtitle={`SKU: ${r.product?.sku || "—"} · Type: ${r.damage_type} (${r.severity})`}
              meta={`Damaged: ${r.qty_damaged} unit${r.qty_damaged > 1 ? 's' : ''}`}
              badge="inactive"
              color="#ef4444"
              icon="alert-triangle"
              onClick={() => {
                if (r.description) alert(`Damage Notes: ${r.description}`)
              }}
            />
          ))
        )}
      </div>


      {/* QUICK SCAN MODAL */}
      {scanOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-extrabold text-[15px]" style={{ color: "#1e1208" }}>Quick Scan & Barcode Lookup</h3>
              <button 
                onClick={() => {
                  setScanOpen(false)
                  setBarcode("")
                  setLookupResult(null)
                  setLookupError("")
                }} 
                className="text-slate-400 hover:text-slate-600 text-lg font-black"
              >
                ✕
              </button>
            </div>

            {/* Input form */}
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={barcode}
                  onChange={e => setBarcode(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && lookupBarcode(barcode)}
                  placeholder="Type or scan barcode..."
                  className="flex-1 px-4 py-2.5 rounded-xl border outline-none text-[13px]"
                  style={{ background: "#f9fafb", color: "#1e1208" }}
                  autoFocus
                />
                <button
                  onClick={() => lookupBarcode(barcode)}
                  disabled={lookupLoading}
                  className="px-4 py-2.5 rounded-xl text-[12px] font-bold text-white transition-opacity"
                  style={{ background: COLOR }}
                >
                  {lookupLoading ? "Loading..." : "Look up"}
                </button>
              </div>

              {lookupError && (
                <div className="rounded-xl p-3 bg-red-50 border border-red-200">
                  <p className="text-[12px] font-bold text-red-600">{lookupError}</p>
                </div>
              )}

              {lookupResult && (
                <div className="rounded-xl border overflow-hidden bg-slate-50/50">
                  {[
                    ["Product Name", lookupResult.name],
                    ["SKU Code", lookupResult.sku],
                    ["Barcode Value", lookupResult.barcode ?? "Not Generated"],
                    ["Stock Count", String(lookupResult.stock_quantity ?? lookupResult.quantity ?? 0)],
                    ["Price Tag", lookupResult.price ? `₹${lookupResult.price.toLocaleString("en-IN")}` : null],
                  ].map(([label, value]) => value ? (
                    <div key={label} className="flex justify-between items-center px-4 py-2.5 border-b last:border-0 border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                      <span className="text-[12px] font-extrabold text-slate-800">{value}</span>
                    </div>
                  ) : null)}

                  <div className="p-4 bg-white border-t space-y-2">
                    {!lookupResult.barcode ? (
                      <button
                        onClick={() => generateBarcode(lookupResult.id)}
                        disabled={generating}
                        className="w-full py-2.5 rounded-xl text-[12px] font-bold text-white transition-opacity"
                        style={{ background: COLOR }}
                      >
                        {generating ? "Generating..." : "⚡ Generate Barcode"}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          alert(`Printing barcode label ${lookupResult.barcode} (Simulated)`)
                        }}
                        className="w-full py-2.5 rounded-xl text-[12px] font-bold text-white transition-opacity"
                        style={{ background: "#22c55e" }}
                      >
                        🖨 Print Barcode Label
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setScanOpen(false)
                        router.push(`/portal/warehouse/inventory/${lookupResult.id}`)
                      }}
                      className="w-full py-2.5 rounded-xl text-[12px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      View Details & Edit Stock
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
