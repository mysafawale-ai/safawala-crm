import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch document settings
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const franchiseId = searchParams.get('franchise_id')

    if (!franchiseId) {
      return NextResponse.json({ error: 'Franchise ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('document_settings')
      .select(`
        *,
        invoice_template:invoice_templates!invoice_template_id(*),
        quote_template:invoice_templates!quote_template_id(*)
      `)
      .eq('franchise_id', franchiseId)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || {} })
  } catch (error) {
    console.error('Error fetching document settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST/PUT - Create or update document settings
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const {
      franchise_id,
      invoice_number_format,
      quote_number_format,
      invoice_template_id,
      quote_template_id,
      default_payment_terms,
      default_tax_rate,
      show_gst_breakdown,
      default_terms_conditions
    } = body

    if (!franchise_id) {
      return NextResponse.json({ error: 'Franchise ID required' }, { status: 400 })
    }

    // Check if settings exist
    const { data: existing } = await supabase
      .from('document_settings')
      .select('id')
      .eq('franchise_id', franchise_id)
      .single()

    const documentData = {
      franchise_id,
      invoice_number_format,
      quote_number_format,
      invoice_template_id,
      quote_template_id,
      default_payment_terms,
      default_tax_rate,
      show_gst_breakdown,
      default_terms_conditions,
      updated_at: new Date().toISOString()
    }

    let result
    if (existing) {
      // Update existing
      result = await supabase
        .from('document_settings')
        .update(documentData)
        .eq('franchise_id', franchise_id)
        .select(`
          *,
          invoice_template:invoice_templates!invoice_template_id(*),
          quote_template:invoice_templates!quote_template_id(*)
        `)
        .single()
    } else {
      // Create new
      result = await supabase
        .from('document_settings')
        .insert(documentData)
        .select(`
          *,
          invoice_template:invoice_templates!invoice_template_id(*),
          quote_template:invoice_templates!quote_template_id(*)
        `)
        .single()
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ data: result.data, message: 'Document settings saved successfully' })
  } catch (error) {
    console.error('Error saving document settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}