import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch branding settings
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const franchiseId = searchParams.get('franchise_id')

    if (!franchiseId) {
      return NextResponse.json({ error: 'Franchise ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('branding_settings')
      .select('*')
      .eq('franchise_id', franchiseId)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || {} })
  } catch (error) {
    console.error('Error fetching branding settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST/PUT - Create or update branding settings
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const {
      franchise_id,
      primary_color,
      secondary_color,
      logo_url,
      signature_url
    } = body

    if (!franchise_id) {
      return NextResponse.json({ error: 'Franchise ID required' }, { status: 400 })
    }

    // Check if settings exist
    const { data: existing } = await supabase
      .from('branding_settings')
      .select('id')
      .eq('franchise_id', franchise_id)
      .single()

    const brandingData = {
      franchise_id,
      primary_color: primary_color || '#3B82F6',
      secondary_color: secondary_color || '#EF4444',
      logo_url: logo_url || null,
      signature_url: signature_url || null,
      updated_at: new Date().toISOString()
    }

    let result
    if (existing) {
      // Update existing
      result = await supabase
        .from('branding_settings')
        .update(brandingData)
        .eq('franchise_id', franchise_id)
        .select()
        .single()
    } else {
      // Create new
      result = await supabase
        .from('branding_settings')
        .insert(brandingData)
        .select()
        .single()
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ data: result.data, message: 'Branding settings saved successfully' })
  } catch (error) {
    console.error('Error saving branding settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}