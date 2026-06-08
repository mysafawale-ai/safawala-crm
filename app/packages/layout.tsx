import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Safawala — Wedding Packages",
  description: "Premium wedding accessories packages — safas, malas, kalgis and more.",
}

// Force this route to always render in light mode
export default function PackagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ colorScheme: "light" }}>
      <body className="bg-white text-gray-900" style={{ background: "#f9fafb", color: "#111827" }}>
        {children}
      </body>
    </html>
  )
}
