import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: List all coupons
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch coupons for this franchise
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('*')
      .or(`franchise_id.is.null,franchise_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

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
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_value,
      max_discount,
      usage_limit,
      per_user_limit,
      valid_from,
      valid_until,
      is_active,
    } = body;

    // Validation
    if (!code || !discount_type || discount_value === undefined) {
      return NextResponse.json(
        { error: 'Code, discount type, and discount value are required' },
        { status: 400 }
      );
    }

    // Validate percentage discount
    if (discount_type === 'percentage' && discount_value > 100) {
      return NextResponse.json(
        { error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      );
    }

    // Insert coupon
    const { data: coupon, error } = await supabase
      .from('coupons')
      .insert({
        code: code.trim().toUpperCase(),
        description,
        discount_type,
        discount_value,
        min_order_value: min_order_value || 0,
        max_discount,
        usage_limit,
        per_user_limit,
        valid_from: valid_from || new Date().toISOString(),
        valid_until,
        is_active: is_active !== undefined ? is_active : true,
        franchise_id: user.id,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating coupon:', error);
      
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

    return NextResponse.json({ coupon }, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/coupons:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PUT: Update existing coupon
export async function PUT(request: Request) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Coupon ID is required' },
        { status: 400 }
      );
    }

    // If code is being updated, ensure it's uppercase
    if (updates.code) {
      updates.code = updates.code.trim().toUpperCase();
    }

    // Validate percentage discount
    if (updates.discount_type === 'percentage' && updates.discount_value > 100) {
      return NextResponse.json(
        { error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      );
    }

    // Update coupon (RLS will ensure user can only update their own)
    const { data: coupon, error } = await supabase
      .from('coupons')
      .update(updates)
      .eq('id', id)
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
export async function DELETE(request: Request) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Coupon ID is required' },
        { status: 400 }
      );
    }

    // Delete coupon (RLS will ensure user can only delete their own)
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

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
