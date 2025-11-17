import { supabaseServer as supabase } from '@/lib/supabase-server-simple';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Service-role auth helper
 * Validates session and returns user context
 * No RLS checks - auth is enforced at API layer only
 */
async function getUserFromSession(request: NextRequest) {
  try {
    const cookieHeader = request.cookies.get("safawala_session")
    if (!cookieHeader?.value) {
      console.error('[Auth] No session cookie found');
      throw new Error("No session found")
    }
    
    const sessionData = JSON.parse(cookieHeader.value)
    if (!sessionData.id) {
      console.error('[Auth] Invalid session data: missing id');
      throw new Error("Invalid session data")
    }

    // Use service role to fetch user details (bypasses RLS)
    const { data: user, error } = await supabase
      .from("users")
      .select("id, franchise_id, role")
      .eq("id", sessionData.id)
      .eq("is_active", true)
      .single()

    if (error) {
      console.error('[Auth] User query error:', error.message);
      throw new Error("User not found")
    }

    if (!user) {
      console.error('[Auth] User not found in database');
      throw new Error("User not found")
    }

    const result = {
      userId: user.id,
      franchiseId: user.franchise_id,
      role: user.role,
      isSuperAdmin: user.role === "super_admin"
    };

    console.log('[Auth] User authenticated:', { userId: result.userId, franchiseId: result.franchiseId, role: result.role });
    return result;
  } catch (error: any) {
    console.error('[Auth] Authentication error:', error.message);
    throw error;
  }
}

// GET: List all coupons
export async function GET(request: NextRequest) {
  try {
    console.log('[Coupons GET] Request received');
    
    let franchiseId: string | null = null;
    let isSuperAdmin = false;
    
    // Authenticate user
    try {
      const authData = await getUserFromSession(request);
      franchiseId = authData.franchiseId;
      isSuperAdmin = authData.isSuperAdmin;
    } catch (authError) {
      console.log('[Coupons GET] Auth failed, returning 401');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Build query - service role client doesn't have RLS restrictions
    let query = supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply franchise isolation (not RLS, but API logic)
    if (!isSuperAdmin && franchiseId) {
      console.log('[Coupons GET] Filtering by franchise:', franchiseId);
      query = query.eq('franchise_id', franchiseId);
    } else if (!isSuperAdmin && !franchiseId) {
      console.log('[Coupons GET] Non-admin user with no franchise, returning empty');
      return NextResponse.json({ coupons: [] });
    }

    const { data: coupons, error } = await query;

    if (error) {
      console.error('[Coupons GET] Query error:', error.message);
      return NextResponse.json(
        { error: 'Failed to fetch coupons', details: error.message },
        { status: 500 }
      );
    }

    console.log('[Coupons GET] Successfully fetched', coupons?.length || 0, 'coupons');
    return NextResponse.json({ coupons: coupons || [] });

  } catch (error: any) {
    console.error('[Coupons GET] Unexpected error:', error.message);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Create new coupon
export async function POST(request: NextRequest) {
  try {
    console.log('[Coupons POST] Request received');
    
    // Authenticate user first
    let userId: string | null = null;
    let franchiseId: string | null = null;
    let isSuperAdmin = false;
    
    let role = '';
    try {
      const authData = await getUserFromSession(request);
      userId = authData.userId;
      franchiseId = authData.franchiseId;
      isSuperAdmin = authData.isSuperAdmin;
      role = authData.role;
    } catch (authError) {
      console.error('[Coupons POST] Auth failed');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only franchise_admin and super_admin can create coupons
    if (!isSuperAdmin && role !== 'franchise_admin') {
      console.error('[Coupons POST] User lacks admin role for franchise:', role);
      return NextResponse.json(
        { error: 'Only franchise admins can create coupons' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('[Coupons POST] Request body:', { code: body.code, discount_type: body.discount_type });
    
    const { code, discount_type, discount_value } = body;

    // Validation: required fields
    if (!code || !discount_type) {
      console.error('[Coupons POST] Validation failed: missing code or discount_type');
      return NextResponse.json(
        { error: 'Code and discount type are required' },
        { status: 400 }
      );
    }

    // Validation: discount value
    if (discount_type !== 'free_shipping' && (discount_value === undefined || discount_value <= 0)) {
      console.error('[Coupons POST] Validation failed: invalid discount_value for', discount_type);
      return NextResponse.json(
        { error: 'Discount value is required and must be > 0' },
        { status: 400 }
      );
    }

    // Validation: percentage cap
    if (discount_type === 'percentage' && discount_value > 100) {
      console.error('[Coupons POST] Validation failed: percentage > 100');
      return NextResponse.json(
        { error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      );
    }

    // Sanitize and prepare data
    const sanitizedData = {
      code: code.trim().toUpperCase(),
      discount_type,
      discount_value: discount_type === 'free_shipping' ? 0 : Number(discount_value),
      franchise_id: franchiseId,
      created_by: userId,
      is_active: true,
    };

    console.log('[Coupons POST] Inserting coupon:', { code: sanitizedData.code, franchise_id: sanitizedData.franchise_id });

    // Insert coupon using service role (no RLS)
    const { data: coupon, error } = await supabase
      .from('coupons')
      .insert([sanitizedData])
      .select()
      .single();

    if (error) {
      console.error('[Coupons POST] Insert error:', { code: error.code, message: error.message });
      
      // Duplicate code
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Coupon code already exists' },
          { status: 409 }
        );
      }

      // Foreign key error
      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'Invalid franchise reference' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create coupon', details: error.message },
        { status: 500 }
      );
    }

    console.log('[Coupons POST] Coupon created successfully:', coupon.id);
    return NextResponse.json({ coupon }, { status: 201 });

  } catch (error: any) {
    console.error('[Coupons POST] Unexpected error:', error.message);
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
