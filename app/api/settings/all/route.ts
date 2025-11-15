import { NextResponse } from "next/server"
import { supabaseServer as supabase } from "@/lib/supabase-server-simple"

export async function GET(request: Request) {
  try {
    // Get franchise_id from query parameters
    const { searchParams } = new URL(request.url)
    const franchiseId = searchParams.get('franchise_id')

    console.log('🔍 [Settings API] Request received')
    console.log('📋 [Settings API] Franchise ID:', franchiseId)

    // Fetch all settings tables with optional franchise_id filter
    const [companyResult, brandingResult, documentResult] = await Promise.all([
      franchiseId
        ? supabase.from('company_settings').select('*').eq('franchise_id', franchiseId).single()
        : supabase.from('company_settings').select('*').single(),
      franchiseId
        ? supabase.from('branding_settings').select('*').eq('franchise_id', franchiseId).single()
        : supabase.from('branding_settings').select('*').single(),
      franchiseId
        ? supabase.from('document_settings').select('*').eq('franchise_id', franchiseId).single()
        : supabase.from('document_settings').select('*').single()
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

    console.log('🔍 DEBUG API: Settings Merge')
    console.log('Company Settings:', companySettings)
    console.log('Branding Settings:', brandingSettings)
    console.log('Document Settings:', documentSettings)
    console.log('📋 Terms from document_settings:', documentSettings.default_terms_conditions)
    console.log('Company logo_url:', companySettings.logo_url)
    console.log('Branding logo_url:', brandingSettings.logo_url)

    // Return combined settings with proper logo_url priority
    const merged = {
      ...companySettings,
      ...brandingSettings,
      ...documentSettings,
      // Ensure logo_url from branding takes priority if available
      logo_url: brandingSettings.logo_url || companySettings.logo_url
    }

    console.log('Merged logo_url:', merged.logo_url)
    console.log('✅ Merged Terms & Conditions:', merged.default_terms_conditions)

    return NextResponse.json({
      company: companySettings,
      branding: brandingSettings,
      document: documentSettings,
      merged
    })
  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}
