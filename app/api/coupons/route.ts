import { supabaseServer as supabase } from '@/lib/supabase-server-simple';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function getUserFromSession(request: NextRequest) {
  try {
    const cookieHeader = request.cookies.get("safawala_session")
    if (!cookieHeader?.value) {
      throw new Error("No session found")
    }
    
    const sessionData = JSON.parse(cookieHeader.value)
    if (!sessionData.id) {
      throw new Error("Invalid session data")
    }

    // Use service role to fetch user details
    const { data: user, error } = await supabase
      .from("users")
      .select("id, franchise_id, role")
      .eq("id", sessionData.id)
      .eq("is_active", true)
      .single()

    if (error || !user) {
      throw new Error("User not found")
    }

    return {
      userId: user.id,
      franchiseId: user.franchise_id,
      isSuperAdmin: user.role === "super_admin"
    }
  } catch (error: any) {
    console.error('[Coupons Auth Error]:', error.message);
    throw new Error("Authentication required")
  }
}

// GET: List all coupons
export async function GET(request: NextRequest) {
  try {
    
    let franchiseId: string | null = null;
    let isSuperAdmin = false;
    
    // Try to get user from session for filtering
    try {
      const authData = await getUserFromSession(request);
      franchiseId = authData.franchiseId;
      isSuperAdmin = authData.isSuperAdmin;
      console.log('[Coupons API GET] User authenticated:', { franchiseId, isSuperAdmin });
    } catch (authError) {
      console.log('[Coupons API GET] No valid session, will still try to fetch coupons');
    }

    // Build query with franchise isolation
    let query = supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply franchise filter if user is not super admin
    if (!isSuperAdmin && franchiseId) {
      console.log('[Coupons API GET] Filtering by franchise:', franchiseId);
      query = query.eq('franchise_id', franchiseId);
    } else if (!isSuperAdmin && !franchiseId) {
      console.log('[Coupons API GET] No franchiseId found, returning empty list');
      return NextResponse.json({ coupons: [] });
    }

    const { data: coupons, error } = await query;

    if (error) {
      console.error('[Coupons API GET] Supabase error:', { 
        code: error.code, 
        message: error.message,
        hint: error.hint 
      });

      // Helpful message when DB schema is mismatched
      const details = error.message || '';
      if (details.toLowerCase().includes('franchise_id') || details.toLowerCase().includes("column \"franchise_id\" does not exist")) {
        return NextResponse.json(
          {
            error: 'Failed to fetch coupons',
            details: 'Missing required column franchise_id in coupons table. Run the SQL migration ADD_COUPON_COLUMNS.sql to add missing columns.'
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch coupons', details },
        { status: 500 }
      );
    }

    console.log('[Coupons API GET] Successfully fetched', coupons?.length || 0, 'coupons');
    return NextResponse.json({ coupons: coupons || [] });

  } catch (error: any) {
    console.error('[Coupons API GET] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Create new coupon
export async function POST(request: NextRequest) {
  try {
    console.log('[Coupons API POST] Request received');
    
    let userId: string | null = null;
    let franchiseId: string | null = null;
    
    try {
      const authData = await getUserFromSession(request);
      userId = authData.userId;
      franchiseId = authData.franchiseId;
      console.log('[Coupons API POST] User authenticated:', { userId, franchiseId });
    } catch (authError) {
      console.error('[Coupons API POST] Auth error:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('[Coupons API POST] Request body:', body);
    
    const {
      code,
      discount_type,
      discount_value,
    } = body;

    // Validation
    if (!code || !discount_type) {
      console.error('[Coupons API POST] Validation failed: missing required fields');
      return NextResponse.json(
        { error: 'Code and discount type are required' },
        { status: 400 }
      );
    }

    // Validate discount_value for non-free-shipping types
    if (discount_type !== 'free_shipping' && (discount_value === undefined || discount_value <= 0)) {
      console.error('[Coupons API POST] Validation failed: discount value required');
      return NextResponse.json(
        { error: 'Discount value is required for this discount type' },
        { status: 400 }
      );
    }

    // Validate percentage discount
    if (discount_type === 'percentage' && discount_value > 100) {
      console.error('[Coupons API POST] Validation failed: discount value exceeds 100%');
      return NextResponse.json(
        { error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      );
    }

    // Sanitized data - only the fields we're keeping
    // Note: Don't include created_by to avoid foreign key constraint issues
    const sanitizedData = {
      code: code.trim().toUpperCase(),
      discount_type,
      discount_value: discount_type === 'free_shipping' ? 0 : discount_value,
      franchise_id: franchiseId,
    };
    console.log('[Coupons API POST] Sanitized data:', sanitizedData);

    // Insert coupon
    const { data: coupon, error } = await supabase
      .from('coupons')
      .insert(sanitizedData)
      .select()
      .single();

    if (error) {
      console.error('[Coupons API POST] Supabase error:', { 
        code: error.code, 
        message: error.message, 
        hint: error.hint,
        details: error.details 
      });
      
      const message = error.message || '';
      
      // Handle RLS policy error
      if (message.includes('violates row level security') || message.includes('row level security policy')) {
        return NextResponse.json(
          { 
            error: 'Permission denied', 
            details: 'RLS policy is blocking the insert. Please contact support.' 
          },
          { status: 403 }
        );
      }
      
      if (message.toLowerCase().includes('franchise_id')) {
        return NextResponse.json(
          {
            error: 'Failed to create coupon',
            details: 'Franchise ID issue. Please check your franchise assignment.'
          },
          { status: 400 }
        );
      }

      // Handle duplicate code error
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Coupon code already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create coupon', details: message },
        { status: 500 }
      );
    }

    console.log('[Coupons API POST] Coupon created successfully:', coupon);
    return NextResponse.json({ coupon }, { status: 201 });

  } catch (error: any) {
    console.error('[Coupons API POST] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PUT: Update existing coupon
export async function PUT(request: NextRequest) {
  try {
    const { franchiseId } = await getUserFromSession(request);

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Coupon ID is required' },
        { status: 400 }
      );
    }

    // Sanitize updates - convert empty strings to null
    const sanitizedUpdates: any = {};
    
    Object.keys(updates).forEach(key => {
      const value = updates[key];
      
      // Handle code field - ensure uppercase
      if (key === 'code' && value) {
        sanitizedUpdates[key] = value.trim().toUpperCase();
      }
      // Handle description - convert empty to null
      else if (key === 'description') {
        sanitizedUpdates[key] = value?.trim() || null;
      }
      // Handle date fields - convert empty strings to null
      else if ((key === 'valid_until' || key === 'valid_from') && value === '') {
        sanitizedUpdates[key] = null;
      }
      // Handle numeric fields - convert empty/falsy to null or 0
      else if (key === 'max_discount' || key === 'usage_limit' || key === 'per_user_limit') {
        sanitizedUpdates[key] = value || null;
      }
      else if (key === 'min_order_value') {
        sanitizedUpdates[key] = value || 0;
      }
      // Keep other fields as is
      else {
        sanitizedUpdates[key] = value;
      }
    });

    // Validate percentage discount
    if (sanitizedUpdates.discount_type === 'percentage' && sanitizedUpdates.discount_value > 100) {
      return NextResponse.json(
        { error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      );
    }

    // Update coupon (only franchise coupons)
    const { data: coupon, error } = await supabase
      .from('coupons')
      .update(sanitizedUpdates)
      .eq('id', id)
      .eq('franchise_id', franchiseId)
      .select()
      .single();

    if (error) {
      console.error('Error updating coupon:', error);
      
      // Handle duplicate code error
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Coupon code already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to update coupon', details: error.message },
        { status: 500 }
      );
    }

    if (!coupon) {
      return NextResponse.json(
        { error: 'Coupon not found or you do not have permission to update it' },
        { status: 404 }
      );
    }

    return NextResponse.json({ coupon });

  } catch (error: any) {
    console.error('Error in PUT /api/coupons:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete coupon
export async function DELETE(request: NextRequest) {
  try {
    const { franchiseId } = await getUserFromSession(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Coupon ID is required' },
        { status: 400 }
      );
    }

    // Delete coupon (only franchise coupons)
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id)
      .eq('franchise_id', franchiseId);

    if (error) {
      console.error('Error deleting coupon:', error);
      return NextResponse.json(
        { error: 'Failed to delete coupon', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Coupon deleted successfully' });

  } catch (error: any) {
    console.error('Error in DELETE /api/coupons:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
