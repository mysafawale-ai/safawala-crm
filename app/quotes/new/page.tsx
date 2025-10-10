import { Suspense } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { QuoteForm } from "@/components/quotes/quote-form"
import { customerService } from "@/lib/services/customer-service"
import { productService } from "@/lib/services/product-service"
import { categoryService } from "@/lib/services/category-service"

export const dynamic = "force-dynamic"

async function NewQuotePage() {
  const [customers, products, categories] = await Promise.all([
    customerService.getAll(),
    productService.getAvailable(),
    categoryService.getAll(),
  ])

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/quotes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generate Quote</h1>
          <p className="text-muted-foreground">Create a new quote for rental or direct sale</p>
        </div>
      </div>

      <QuoteForm customers={customers || []} products={products || []} categories={categories || []} />
    </div>
  )
}

export default function NewQuotePageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewQuotePage />
    </Suspense>
  )
}
