import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer as supabase } from '@/lib/supabase-server-simple'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    let franchiseId = searchParams.get('franchise_id')
    const userId = searchParams.get('user_id')

    // If no franchise_id provided, try to get user's franchise or default for super admin
    if (!franchiseId && userId) {
      console.log('[Profile API] No franchise_id, fetching from user record...')
      
      const { data: userData } = await supabase
        .from('users')
        .select('franchise_id, role')
        .eq('id', userId)
        .single()

      if (userData?.franchise_id) {
        franchiseId = userData.franchise_id
        console.log(`[Profile API] Found franchise_id from user: ${franchiseId}`)
      } else if (userData?.role === 'super_admin') {
        // Get first franchise as default for super admin
        const { data: franchises } = await supabase
          .from('franchises')
          .select('id')
          .eq('is_active', true)
          .order('created_at', { ascending: true })
          .limit(1)
        
        if (franchises && franchises.length > 0) {
          franchiseId = franchises[0].id
          console.log(`[Profile API] Using default franchise for super admin: ${franchiseId}`)
        }
      }
    }

    if (!franchiseId) {
      return NextResponse.json(
        { error: 'Franchise ID is required' },
        { status: 400 }
      )
    }

    // If user_id is provided, get specific user profile, otherwise get the first profile for franchise
    let query = supabase
      .from('user_profiles')
      .select('*')
      .eq('franchise_id', franchiseId)

    if (userId) {
      query = query.eq('user_id', userId)
      
      const { data, error } = await query.single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
        return NextResponse.json(
          { error: 'Failed to fetch profile' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: data || null
      })
    } else {
      // Get the most recent profile for this franchise
      query = query.order('created_at', { ascending: false }).limit(1)
      
      const { data, error } = await query

      if (error) {
        console.error('Error fetching profile:', error)
        return NextResponse.json(
          { error: 'Failed to fetch profile' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: data && data.length > 0 ? data[0] : null
      })
    }
  } catch (error) {
    console.error('Error in profile GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      franchise_id,
      user_id,
      first_name,
      last_name,
      email,
      phone,
      role,
      designation,
      department,
      employee_id,
      date_of_joining,
      address,
      city,
      state,
      postal_code,
      emergency_contact_name,
      emergency_contact_phone,
      bio,
      profile_photo_url,
      signature_url
    } = body

    if (!franchise_id || !first_name || !last_name || !email) {
      return NextResponse.json(
        { error: 'Franchise ID, first name, last name, and email are required' },
        { status: 400 }
      )
    }

    const profileData = {
      franchise_id,
      user_id: user_id || null,
      first_name,
      last_name,
      email,
      phone: phone || null,
      role: role || 'staff',
      designation: designation || null,
      department: department || null,
      employee_id: employee_id || null,
      date_of_joining: date_of_joining || null,
      address: address || null,
      city: city || null,
      state: state || null,
      postal_code: postal_code || null,
      emergency_contact_name: emergency_contact_name || null,
      emergency_contact_phone: emergency_contact_phone || null,
      bio: bio || null,
      profile_photo_url: profile_photo_url || null,
      signature_url: signature_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .insert([profileData])
      .select()
      .single()

    if (error) {
      console.error('Error creating profile:', error)
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Profile created successfully'
    })
  } catch (error) {
    console.error('Error in profile POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[Profile API PUT] Request body:', {
      hasId: !!body.id,
      hasFranchiseId: !!body.franchise_id,
      id: body.id,
      franchise_id: body.franchise_id,
      keys: Object.keys(body)
    })
    
    const {
      id,
      franchise_id,
      first_name,
      last_name,
      email,
      phone,
      role,
      designation,
      department,
      employee_id,
      date_of_joining,
      address,
      city,
      state,
      postal_code,
      emergency_contact_name,
      emergency_contact_phone,
      bio,
      profile_photo_url,
      signature_url
    } = body

    if (!id || !franchise_id) {
      console.error('[Profile API PUT] Missing required fields:', { id, franchise_id })
      return NextResponse.json(
        { error: 'Profile ID and franchise ID are required' },
        { status: 400 }
      )
    }

    const updateData = {
      first_name,
      last_name,
      email,
      phone,
      role,
      designation,
      department,
      employee_id,
      date_of_joining,
      address,
      city,
      state,
      postal_code,
      emergency_contact_name,
      emergency_contact_phone,
      bio,
      profile_photo_url,
      signature_url,
      updated_at: new Date().toISOString()
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData]
      }
    })

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', id)
      .eq('franchise_id', franchise_id)
      .select()
      .single()

    if (error) {
      console.error('[Profile API PUT] Database error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json(
        { error: `Failed to update profile: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('[Profile API PUT] Success:', { profileId: data.id })
    return NextResponse.json({
      success: true,
      data,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('Error in profile PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, franchise_id } = body

    if (!id || !franchise_id) {
      return NextResponse.json(
        { error: 'Profile ID and franchise ID are required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', id)
      .eq('franchise_id', franchise_id)

    if (error) {
      console.error('Error deleting profile:', error)
      return NextResponse.json(
        { error: 'Failed to delete profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profile deleted successfully'
    })
  } catch (error) {
    console.error('Error in profile DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}