import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function getUserFromSession(request: NextRequest) {
  try {
    const cookieHeader = request.cookies.get("safawala_session")
    if (!cookieHeader?.value) throw new Error("No session")
    const sessionData = JSON.parse(cookieHeader.value)
    const supabase = createClient()
    const { data: user, error } = await supabase
      .from('users')
      .select('id, franchise_id, role')
      .eq('id', sessionData.id)
      .eq('is_active', true)
      .single()
    if (error || !user) throw new Error('Auth failed')
    return { userId: user.id, franchiseId: user.franchise_id, isSuperAdmin: user.role === 'super_admin' }
  } catch {
    throw new Error('Authentication required')
  }
}

// GET: List all coupons
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    let franchiseId: string | null = null;
    let isSuperAdmin = false;
    
    // Try to get user from session, but don't fail if not authenticated
    try {
      const authData = await getUserFromSession(request);
      franchiseId = authData.franchiseId;
      isSuperAdmin = authData.isSuperAdmin;
    } catch (authError) {
      console.log('No valid session, returning empty coupons list');
      return NextResponse.json({ coupons: [] });
    }

    // Build query with franchise isolation
    let query = supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    // Super admins see all coupons, others only their franchise
    if (!isSuperAdmin && franchiseId) {
      query = query.eq('franchise_id', franchiseId);
    }

    const { data: coupons, error } = await query;

    if (error) {
      console.error('Error fetching coupons:', error);
      return NextResponse.json(
        { error: 'Failed to fetch coupons', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ coupons });

  } catch (error: any) {
    console.error('Error in GET /api/coupons:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Create new coupon
export async function POST(request: NextRequest) {
  try {
    console.log('[Coupons API] POST request received');
    const supabase = createClient();
    const { userId, franchiseId } = await getUserFromSession(request);
    console.log('[Coupons API] User authenticated:', { userId, franchiseId });

    const body = await request.json();
    console.log('[Coupons API] Request body:', body);
    
    const {
      code,
      discount_type,
      discount_value,
    } = body;

    // Validation
    if (!code || !discount_type) {
      console.error('[Coupons API] Validation failed: missing required fields');
      return NextResponse.json(
        { error: 'Code and discount type are required' },
        { status: 400 }
      );
    }

    // Validate discount_value for non-free-shipping types
    if (discount_type !== 'free_shipping' && (discount_value === undefined || discount_value <= 0)) {
      console.error('[Coupons API] Validation failed: discount value required');
      return NextResponse.json(
        { error: 'Discount value is required for this discount type' },
        { status: 400 }
      );
    }

    // Validate percentage discount
    if (discount_type === 'percentage' && discount_value > 100) {
      console.error('[Coupons API] Validation failed: discount value exceeds 100%');
      return NextResponse.json(
        { error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      );
    }

    // Sanitized data - only the fields we're keeping
    const sanitizedData = {
      code: code.trim().toUpperCase(),
      discount_type,
      discount_value: discount_type === 'free_shipping' ? 0 : discount_value,
      franchise_id: franchiseId,
    };
    console.log('[Coupons API] Sanitized data:', sanitizedData);

    // Insert coupon
    const { data: coupon, error } = await supabase
      .from('coupons')
      .insert(sanitizedData)
      .select()
      .single();

    if (error) {
      console.error('[Coupons API] Supabase error:', { code: error.code, message: error.message, hint: error.hint });
      
      // Handle duplicate code error
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Coupon code already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create coupon', details: error.message },
        { status: 500 }
      );
    }

    console.log('[Coupons API] Coupon created successfully:', coupon);
    return NextResponse.json({ coupon }, { status: 201 });

  } catch (error: any) {
    console.error('[Coupons API] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PUT: Update existing coupon
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
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
    const supabase = createClient();
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
