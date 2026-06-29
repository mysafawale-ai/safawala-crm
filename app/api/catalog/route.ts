import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { authenticateRequest } from "@/lib/auth-middleware"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request, { minRole: "readonly" })
  if (!auth.authorized) return NextResponse.json(auth.error, { status: auth.statusCode || 401 })

  const { searchParams } = new URL(request.url)
  const categoryId = searchParams.get("category_id")
  const categoryName = searchParams.get("category_name") || "Product Catalog"

  const franchiseId = auth.user?.franchise_id
  const isSuperAdmin = auth.user?.is_super_admin

  const supabase = createClient()

  // Fetch franchise/company settings
  let companyName = "SAFAWALA"
  let companyPhone = ""
  let companyEmail = ""
  let logoUrl = ""
  try {
    const { data: settings } = await supabase
      .from("franchise_settings")
      .select("company_name, phone, email, logo_url, whatsapp, instagram, address, city")
      .eq("franchise_id", franchiseId)
      .single()
    if (settings) {
      companyName = settings.company_name || "SAFAWALA"
      companyPhone = settings.phone || settings.whatsapp || ""
      companyEmail = settings.email || ""
      logoUrl = settings.logo_url || ""
    }
  } catch {}

  // Fetch products
  let query = supabase
    .from("products")
    .select("id, name, barcode, rental_price, sale_price, security_deposit, stock_available, image_url, description, category")
    .eq("is_active", true)
    .order("name")

  if (!isSuperAdmin && franchiseId) query = query.eq("franchise_id", franchiseId)
  if (categoryId) query = query.eq("category_id", categoryId)

  const { data: products } = await query
  const items = products || []

  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })

  const productCards = items.map(p => {
    const rentalPrice = p.rental_price || 0
    const salePrice = p.sale_price || 0
    const hasOffer = salePrice > 0 && salePrice < rentalPrice

    return `
    <div class="product-card">
      <div class="product-img-wrap">
        ${p.image_url
          ? `<img src="${p.image_url}" alt="${p.name}" onerror="this.parentElement.innerHTML='<div class=\\'no-img\\'>📦</div>'" />`
          : `<div class="no-img">📦</div>`}
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        ${p.barcode ? `<div class="product-code">${p.barcode}</div>` : ""}
        <div class="product-price">
          ${hasOffer
            ? `<span class="price-old">₹${rentalPrice.toLocaleString("en-IN")}</span>
               <span class="price-offer">₹${salePrice.toLocaleString("en-IN")}</span>`
            : rentalPrice > 0
              ? `<span class="price-main">₹${rentalPrice.toLocaleString("en-IN")}</span>`
              : `<span class="price-main">On Request</span>`}
        </div>
        ${p.security_deposit > 0 ? `<div class="deposit">Security: ₹${p.security_deposit.toLocaleString("en-IN")}</div>` : ""}
      </div>
    </div>`
  }).join("")

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${companyName} — ${categoryName} Catalog</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a1a; }

  /* COVER PAGE */
  .cover {
    width: 210mm;
    min-height: 297mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #18181b 0%, #2d1b69 50%, #18181b 100%);
    color: white;
    page-break-after: always;
    text-align: center;
    padding: 40mm 20mm;
    position: relative;
    overflow: hidden;
  }
  .cover::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 60%);
  }
  .cover-logo {
    width: 80px;
    height: 80px;
    object-fit: contain;
    margin-bottom: 24px;
    border-radius: 50%;
    background: rgba(255,255,255,0.1);
    padding: 8px;
  }
  .cover-brand {
    font-size: 42px;
    font-weight: 900;
    letter-spacing: 8px;
    text-transform: uppercase;
    color: #fff;
    margin-bottom: 8px;
  }
  .cover-tagline {
    font-size: 13px;
    letter-spacing: 4px;
    color: rgba(255,255,255,0.6);
    text-transform: uppercase;
    margin-bottom: 48px;
  }
  .cover-divider {
    width: 80px;
    height: 2px;
    background: linear-gradient(to right, transparent, #a855f7, transparent);
    margin: 0 auto 32px;
  }
  .cover-category {
    font-size: 28px;
    font-weight: 700;
    color: #c084fc;
    text-transform: uppercase;
    letter-spacing: 3px;
    margin-bottom: 16px;
  }
  .cover-subtitle {
    font-size: 14px;
    color: rgba(255,255,255,0.5);
    letter-spacing: 2px;
  }
  .cover-count {
    margin-top: 48px;
    font-size: 48px;
    font-weight: 900;
    color: #a855f7;
  }
  .cover-count-label {
    font-size: 12px;
    letter-spacing: 3px;
    color: rgba(255,255,255,0.4);
    text-transform: uppercase;
    margin-top: 4px;
  }
  .cover-date {
    position: absolute;
    bottom: 20mm;
    font-size: 11px;
    color: rgba(255,255,255,0.3);
    letter-spacing: 2px;
  }

  /* PRODUCTS SECTION */
  .products-section {
    padding: 12mm 15mm;
    width: 210mm;
  }
  .section-header {
    text-align: center;
    margin-bottom: 8mm;
    padding-bottom: 4mm;
    border-bottom: 2px solid #a855f7;
  }
  .section-header h2 {
    font-size: 22px;
    font-weight: 800;
    color: #18181b;
    letter-spacing: 3px;
    text-transform: uppercase;
  }
  .section-header p {
    font-size: 11px;
    color: #6b7280;
    margin-top: 4px;
  }

  .product-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6mm;
  }
  .product-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    break-inside: avoid;
  }
  .product-img-wrap {
    width: 100%;
    height: 45mm;
    background: #f9fafb;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .product-img-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .no-img {
    font-size: 32px;
    opacity: 0.3;
  }
  .product-info {
    padding: 8px 10px;
  }
  .product-name {
    font-size: 10px;
    font-weight: 700;
    color: #111827;
    line-height: 1.3;
    margin-bottom: 2px;
  }
  .product-code {
    font-size: 8px;
    color: #9ca3af;
    margin-bottom: 4px;
  }
  .product-price {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 2px;
  }
  .price-main {
    font-size: 13px;
    font-weight: 800;
    color: #a855f7;
  }
  .price-old {
    font-size: 10px;
    color: #9ca3af;
    text-decoration: line-through;
  }
  .price-offer {
    font-size: 13px;
    font-weight: 800;
    color: #16a34a;
  }
  .deposit {
    font-size: 8px;
    color: #6b7280;
  }

  /* BACK PAGE */
  .back-page {
    width: 210mm;
    min-height: 297mm;
    background: linear-gradient(135deg, #18181b 0%, #2d1b69 60%, #18181b 100%);
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    page-break-before: always;
    text-align: center;
    padding: 30mm 20mm;
    position: relative;
  }
  .back-brand {
    font-size: 36px;
    font-weight: 900;
    letter-spacing: 8px;
    color: #fff;
    margin-bottom: 4px;
  }
  .back-tagline {
    font-size: 11px;
    letter-spacing: 4px;
    color: rgba(255,255,255,0.4);
    text-transform: uppercase;
    margin-bottom: 40px;
  }
  .back-divider {
    width: 60px;
    height: 2px;
    background: #a855f7;
    margin: 0 auto 40px;
  }
  .contact-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    width: 100%;
    max-width: 140mm;
    margin: 0 auto 40px;
  }
  .contact-item {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(168,85,247,0.3);
    border-radius: 12px;
    padding: 16px;
  }
  .contact-label {
    font-size: 9px;
    letter-spacing: 3px;
    color: #a855f7;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .contact-value {
    font-size: 13px;
    color: white;
    font-weight: 600;
  }
  .back-cta {
    font-size: 13px;
    color: rgba(255,255,255,0.5);
    letter-spacing: 2px;
    margin-top: 20px;
  }
  .back-note {
    position: absolute;
    bottom: 15mm;
    font-size: 9px;
    color: rgba(255,255,255,0.2);
    letter-spacing: 1px;
  }

  @media print {
    @page { margin: 0; size: A4; }
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .cover, .back-page { width: 100vw; min-height: 100vh; }
    .products-section { width: 100vw; }
  }
</style>
</head>
<body>

<!-- FRONT COVER -->
<div class="cover">
  ${logoUrl ? `<img src="${logoUrl}" class="cover-logo" alt="Logo" />` : ""}
  <div class="cover-brand">${companyName}</div>
  <div class="cover-tagline">Wedding Accessories</div>
  <div class="cover-divider"></div>
  <div class="cover-category">${categoryName}</div>
  <div class="cover-subtitle">Product Catalog ${new Date().getFullYear()}</div>
  <div class="cover-count">${items.length}</div>
  <div class="cover-count-label">Products</div>
  <div class="cover-date">${today}</div>
</div>

<!-- PRODUCTS -->
<div class="products-section">
  <div class="section-header">
    <h2>${categoryName}</h2>
    <p>${items.length} products • ${companyName} Collection ${new Date().getFullYear()}</p>
  </div>
  <div class="product-grid">
    ${productCards}
  </div>
</div>

<!-- BACK COVER -->
<div class="back-page">
  <div class="back-brand">${companyName}</div>
  <div class="back-tagline">Wedding Accessories</div>
  <div class="back-divider"></div>

  <div class="contact-grid">
    ${companyPhone ? `<div class="contact-item"><div class="contact-label">Call / WhatsApp</div><div class="contact-value">${companyPhone}</div></div>` : ""}
    ${companyEmail ? `<div class="contact-item"><div class="contact-label">Email</div><div class="contact-value">${companyEmail}</div></div>` : ""}
  </div>

  <div class="back-cta">Book your wedding accessories today</div>
  <div class="back-note">All prices are for rental unless marked otherwise. Terms & conditions apply.</div>
</div>

<script>
  window.onload = () => window.print()
</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
