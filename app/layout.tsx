import type React from "react"
import type { Metadata } from "next"
import { Inter, Outfit, Playfair_Display, Crimson_Text, Dancing_Script, Cinzel } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster as SonnerToaster } from "sonner"

// Force dynamic rendering for all pages (CRM needs runtime data)
export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })
const crimsonText = Crimson_Text({
  subsets: ["latin"],
  variable: "--font-crimson",
  weight: ["400", "600"],
})
const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing",
  weight: ["600"],
})
const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "600", "700"],
})

export const metadata: Metadata = {
  title: "Safawala.com - Premium Wedding Turban & Accessories CRM",
  description:
    "Heritage meets modern SaaS - Luxury CRM solution for premium wedding turban and accessories rental business",
  generator: 'v0.app',
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
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${playfair.variable} ${crimsonText.variable} ${dancingScript.variable} ${cinzel.variable}`}
    >
      <body className={`${inter.className} antialiased heritage-body`}>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
        <SonnerToaster />
      </body>
    </html>
  )
}
