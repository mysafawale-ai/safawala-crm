"use client"

import { PortalIcon } from "./portal-icons"

interface PortalHomeCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: string
  color: string
  onClick?: () => void
  variant?: "stat" | "action"
}

export function PortalHomeCard({
  title,
  value,
  subtitle,
  icon,
  color,
  onClick,
  variant = "stat",
}: PortalHomeCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 cursor-pointer active:scale-95 transition-transform duration-150"
      style={{
        background: "rgba(255,255,255,0.65)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1px solid rgba(255,255,255,0.9)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
      }}
      onClick={onClick}
    >
      {/* Soft glow */}
      <div
        className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 -translate-y-4 translate-x-4"
        style={{ background: color }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "rgba(80,55,30,0.4)" }}
          >
            {title}
          </p>
          <p
            className="text-2xl font-black mt-1 leading-none"
            style={{ color: "#1e1208" }}
          >
            {value}
          </p>
          {subtitle && (
            <p
              className="text-[11px] mt-1.5 leading-snug"
              style={{ color: "rgba(80,55,30,0.5)" }}
            >
              {subtitle}
            </p>
          )}
        </div>

        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18`, color }}
        >
          <PortalIcon name={icon} size={20} />
        </div>
      </div>

      {variant === "action" && (
        <div
          className="mt-3 text-[11px] font-bold flex items-center gap-1"
          style={{ color }}
        >
          Tap to open
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </div>
      )}
    </div>
  )
}
