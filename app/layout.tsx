import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster as SonnerToaster } from "sonner"

// Force dynamic rendering for all pages (CRM needs runtime data)
export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "Safawala CRM — Wedding Accessories Management",
  description: "CRM solution for premium wedding turban and accessories rental business",
  icons: {
    icon: '/safaicon.svg',
    apple: '/safaicon.svg',
    shortcut: '/safaicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <TooltipProvider>{children}</TooltipProvider>
        <div className="print:hidden">
          <Toaster />
          <SonnerToaster />
        </div>
      </body>
    </html>
  )
}
