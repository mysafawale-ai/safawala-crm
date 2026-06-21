"use client"

import type { PortalConfig } from "@/lib/portal-config"
import { PortalBottomNav } from "./portal-bottom-nav"

interface PortalMobileLayoutProps {
  config: PortalConfig
  children: React.ReactNode
}

export function PortalMobileLayout({ config, children }: PortalMobileLayoutProps) {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "#f5ebe0",
        maxWidth: "480px",
        margin: "0 auto",
        position: "relative",
      }}
    >
      {/* Subtle top color bar */}
      <div className="h-1" style={{ background: config.color }} />

      {/* Scrollable content area with padding for bottom nav */}
      <div
        className="overflow-y-auto"
        style={{ paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}
      >
        {children}
      </div>

      <PortalBottomNav tabs={config.tabs} color={config.color} />
    </div>
  )
}
