import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createClient as createServiceClient } from "@supabase/supabase-js"

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get company settings
    const { data: settings, error } = await supabaseService
      .from('company_settings')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching company settings:', error)
      return NextResponse.json(
        { error: "Failed to fetch company settings" },
        { status: 500 }
      )
    }

    // If no settings found, return default values
    if (!settings) {
      return NextResponse.json({
        company_name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        gst_number: "",
        logo_url: "",
        website: "",
        timezone: "Asia/Kolkata",
        currency: "INR",
        language: "en",
        date_format: "dd/MM/yyyy"
      })
    }

    return NextResponse.json(settings)

  } catch (error) {
    console.error('Company settings API error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      company_name,
      email,
      phone,
      address,
      city,
      state,
      gst_number,
      logo_url,
      website,
      timezone,
      currency,
      language,
      date_format
    } = body

    // Validate required fields
    if (!company_name || !email) {
      return NextResponse.json(
        { error: "Company name and email are required" },
        { status: 400 }
      )
    }

    // Check if company settings exist
    const { data: existingSettings } = await supabaseService
      .from('company_settings')
      .select('id')
      .single()

    const settingsData = {
      company_name,
      email,
      phone,
      address,
      city,
      state,
      gst_number,
      logo_url,
      website,
      timezone,
      currency,
      language,
      date_format,
      updated_at: new Date().toISOString()
    }

    let result

    if (existingSettings) {
      // Update existing settings
      result = await supabaseService
        .from('company_settings')
        .update(settingsData)
        .eq('id', existingSettings.id)
        .select()
        .single()
    } else {
      // Create new settings
      result = await supabaseService
        .from('company_settings')
        .insert({
          ...settingsData,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error saving company settings:', result.error)
      return NextResponse.json(
        { error: "Failed to save company settings" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Company settings API error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}