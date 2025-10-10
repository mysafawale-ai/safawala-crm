import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseBuilder, validateRequiredFields, validateEmail } from '@/lib/api-response'

// GET - Fetch company settings
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Database error fetching company settings:', error)
      return NextResponse.json(
        ApiResponseBuilder.databaseError(error, 'fetch company settings'),
        { status: 500 }
      )
    }

    return NextResponse.json(
      ApiResponseBuilder.success(data || {}, 'Company settings retrieved successfully')
    )
  } catch (error) {
    console.error('Unexpected error fetching company settings:', error)
    return NextResponse.json(
      ApiResponseBuilder.serverError('Failed to fetch company settings'),
      { status: 500 }
    )
  }
}

// POST/PUT - Create or update company settings
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['company_name', 'email']
    const validation = validateRequiredFields(body, requiredFields)
    if (validation) {
      return NextResponse.json(
        ApiResponseBuilder.multiFieldValidationError(validation),
        { status: 422 }
      )
    }

    // Validate email format
    if (!validateEmail(body.email)) {
      return NextResponse.json(
        ApiResponseBuilder.validationError('Please enter a valid email address', 'email'),
        { status: 422 }
      )
    }

    const {
      company_name,
      email,
      phone,
      gst_number,
      address,
      city,
      state,
      pincode,
      pan_number,
      website,
      logo_url,
      terms_conditions
    } = body

    // Check if settings exist
    const { data: existing, error: fetchError } = await supabase
      .from('company_settings')
      .select('id')
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Database error checking existing settings:', fetchError)
      return NextResponse.json(
        ApiResponseBuilder.databaseError(fetchError, 'check existing settings'),
        { status: 500 }
      )
    }

    const settingsData = {
      company_name: company_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      gst_number: gst_number?.trim() || null,
      address: address?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || null,
      pincode: pincode?.trim() || null,
      pan_number: pan_number ? pan_number.trim().toUpperCase() : null,
      website: website?.trim() || null,
      logo_url: logo_url?.trim() || null,
      terms_conditions: terms_conditions?.trim() || null,
      updated_at: new Date().toISOString()
    }

    let result
    if (existing) {
      // Update existing
      result = await supabase
        .from('company_settings')
        .update(settingsData)
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      // Create new
      result = await supabase
        .from('company_settings')
        .insert(settingsData)
        .select()
        .single()
    }

    if (result.error) {
      console.error('Database error saving company settings:', result.error)
      return NextResponse.json(
        ApiResponseBuilder.databaseError(result.error, 'save company settings'),
        { status: 500 }
      )
    }

    return NextResponse.json(
      ApiResponseBuilder.success(result.data, 'Company settings saved successfully')
    )
  } catch (error) {
    console.error('Unexpected error saving company settings:', error)
    return NextResponse.json(
      ApiResponseBuilder.serverError('Failed to save company settings'),
      { status: 500 }
    )
  }
}