import { NextResponse } from "next/server"
import { supabaseServer as supabase } from "@/lib/supabase-server-simple"

export async function GET() {
  try {
    // Fetch all settings tables
    const [companyResult, brandingResult, documentResult] = await Promise.all([
      supabase.from('company_settings').select('*').single(),
      supabase.from('branding_settings').select('*').single(),
      supabase.from('document_settings').select('*').single()
    ])

    // Default values
    const defaultCompany = {
      company_name: 'SAFAWALA',
      email: 'info@safawala.com',
      phone: '+91-XXXXXXXXXX',
      address: 'Your Address Here',
      city: '',
      state: '',
      gst_number: '',
      logo_url: null,
      signature_url: null,
      website: null,
      timezone: 'Asia/Kolkata',
      currency: 'INR'
    }

    const defaultBranding = {
      primary_color: '#3B82F6',
      secondary_color: '#EF4444',
      accent_color: '#10B981',
      background_color: '#FFFFFF',
      font_family: 'Inter',
      logo_url: null
    }

    const defaultDocument = {
      invoice_number_format: 'INV-{YYYY}-{0001}',
      quote_number_format: 'QTE-{YYYY}-{0001}',
      default_payment_terms: 'Net 30',
      default_tax_rate: 18.00,
      show_gst_breakdown: true,
      default_terms_conditions: 'This is a digital invoice. Please keep this for your records. For any queries, contact our support team.'
    }

    // Merge results with defaults
    const companySettings = companyResult.data || defaultCompany
    const brandingSettings = brandingResult.data || defaultBranding
    const documentSettings = documentResult.data || defaultDocument

    // Return combined settings
    return NextResponse.json({
      company: companySettings,
      branding: brandingSettings,
      document: documentSettings,
      // Merged for easy access
      merged: {
        ...companySettings,
        ...brandingSettings,
        ...documentSettings
      }
    })
  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}
