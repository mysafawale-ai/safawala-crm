"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { signOut } from "@/lib/auth"

const ACCENT = "#a855f7"
const SIDEBAR_BG = "#18181b"
const DASHBOARD_ROLES = ["franchise_admin", "franchise_owner", "manager", "super_admin"]

const NAV = [
  { href: "/dashboard",          label: "Overview",   icon: "home"       },
  { href: "/dashboard/bookings", label: "Bookings",   icon: "calendar"   },
  { href: "/dashboard/revenue",  label: "Revenue",    icon: "rupee"      },
  { href: "/dashboard/inventory",label: "Inventory",  icon: "package"    },
  { href: "/dashboard/hr",       label: "HR & Staff", icon: "users"      },
  { href: "/dashboard/travels",  label: "Travels",    icon: "map-pin"    },
  { href: "/dashboard/profile",  label: "Profile",    icon: "user"       },
]

function NavIcon({ name }: { name: string }) {
  const icons: Record<string, JSX.Element> = {
    home: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
    calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    rupee: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="18" y2="3"/><line x1="6" y1="8" x2="18" y2="8"/><line x1="6" y1="13" x2="12" y2="21"/><path d="M6 8a6 6 0 0 0 0 0h6a3 3 0 0 0 0-6"/></svg>,
    package: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    "map-pin": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    user: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    crown: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  }
  return icons[name] ?? icons.home
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem("safawala_user")
    if (!raw) { router.replace("/login/franchise"); return }
    try {
      const u = JSON.parse(raw)
      if (!DASHBOARD_ROLES.includes(u.role)) {
        router.replace(`/portal/${u.department || "booking"}`)
        return
      }
      setUser(u)
      setReady(true)
    } catch {
      router.replace("/login/franchise")
    }
  }, [router])

  async function handleLogout() {
    try { await signOut() } catch {}
    localStorage.removeItem("safawala_user")
    router.push("/login/franchise")
  }

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?"

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#fafafa" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: ACCENT, borderTopColor: "transparent" }} />
          <p className="text-xs font-semibold" style={{ color: "#a1a1aa" }}>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#fafafa", fontFamily: "system-ui,-apple-system,sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, minHeight: "100vh", position: "fixed", top: 0, left: 0, bottom: 0,
        background: SIDEBAR_BG, borderRight: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "4px 0 32px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", zIndex: 50,
      }}>
        {/* Brand */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ height: 3, borderRadius: 2, background: ACCENT, marginBottom: 16 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${ACCENT}, #7c3aed)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "white" }}>
              <NavIcon name="crown" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#ffffff", lineHeight: 1.2 }}>Franchise HQ</p>
              {user?.franchise_name && <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>{user.franchise_name}</p>}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 12px", overflowY: "auto" }}>
          <p style={{ margin: "0 0 8px 8px", fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Navigation</p>
          {NAV.map((tab) => {
            const isActive = tab.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(tab.href)
            return (
              <Link key={tab.href} href={tab.href} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                borderRadius: 12, marginBottom: 2,
                background: isActive ? `${ACCENT}20` : "transparent",
                color: isActive ? ACCENT : "rgba(255,255,255,0.5)",
                fontWeight: isActive ? 700 : 500, fontSize: 13,
                textDecoration: "none", transition: "all 0.15s",
              }}>
                {isActive && <div style={{ width: 3, height: 18, borderRadius: 2, background: ACCENT, flexShrink: 0 }} />}
                <span style={{ color: isActive ? ACCENT : "rgba(255,255,255,0.35)", flexShrink: 0, display: "flex" }}>
                  <NavIcon name={tab.icon} />
                </span>
                <span>{tab.label}</span>
              </Link>
            )
          })}

          {/* Divider + Dept Portals */}
          <div style={{ margin: "16px 8px 8px", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12 }}>
            <p style={{ margin: "0 0 8px 0", fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Staff Portals</p>
            {[
              { href: "/portal/booking", label: "Booking", color: "#22c55e" },
              { href: "/portal/warehouse", label: "Warehouse", color: "#a855f7" },
              { href: "/portal/qc", label: "QC", color: "#eab308" },
              { href: "/portal/delivery", label: "Delivery", color: "#14b8a6" },
              { href: "/portal/accounts", label: "Accounts", color: "#ef4444" },
              { href: "/portal/styling", label: "Styling", color: "#ec4899" },
            ].map(p => (
              <Link key={p.href} href={p.href} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "7px 12px",
                borderRadius: 10, marginBottom: 1, textDecoration: "none", fontSize: 12,
                color: "rgba(255,255,255,0.4)", fontWeight: 500, transition: "color 0.15s",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                {p.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* User footer */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: `linear-gradient(135deg, ${ACCENT}, #7c3aed)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 800 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name}</p>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.role?.replace(/_/g, " ")}</p>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: "100%", height: 36, borderRadius: 10,
            background: "rgba(239,68,68,0.12)", color: "#f87171",
            border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer",
            fontSize: 12, fontWeight: 700, fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, marginLeft: 240, minHeight: "100vh", overflowY: "auto" }}>
        {children}
      </main>
    </div>
  )
}
