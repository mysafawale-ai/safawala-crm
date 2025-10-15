import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ValidateCouponRequest {
  code: string;
  orderValue: number;
  customerId?: string;
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const body: ValidateCouponRequest = await request.json();
    
    const { code, orderValue, customerId } = body;

    if (!code || orderValue === undefined) {
      return NextResponse.json(
        { error: 'Coupon code and order value are required' },
        { status: 400 }
      );
    }

    // Get current user for franchise isolation
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch coupon from database
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .eq('is_active', true)
      .single();

    if (couponError || !coupon) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Invalid coupon code',
          message: 'This coupon code does not exist or is no longer active'
        },
        { status: 200 }
      );
    }

    // Check franchise isolation
    if (coupon.franchise_id && coupon.franchise_id !== user.id) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Invalid coupon',
          message: 'This coupon is not valid for your franchise'
        },
        { status: 200 }
      );
    }

    // Check if coupon has expired
    const now = new Date();
    const validFrom = new Date(coupon.valid_from);
    const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

    if (now < validFrom) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Coupon not yet active',
          message: `This coupon will be active from ${validFrom.toLocaleDateString()}`
        },
        { status: 200 }
      );
    }

    if (validUntil && now > validUntil) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Coupon expired',
          message: `This coupon expired on ${validUntil.toLocaleDateString()}`
        },
        { status: 200 }
      );
    }

    // Check minimum order value
    if (orderValue < coupon.min_order_value) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Minimum order value not met',
          message: `Minimum order value of ₹${coupon.min_order_value.toFixed(2)} required`
        },
        { status: 200 }
      );
    }

    // Check usage limit
    if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Coupon usage limit reached',
          message: 'This coupon has reached its maximum usage limit'
        },
        { status: 200 }
      );
    }

    // Check per-user limit
    if (customerId && coupon.per_user_limit !== null) {
      const { count, error: usageError } = await supabase
        .from('coupon_usage')
        .select('*', { count: 'exact', head: true })
        .eq('coupon_id', coupon.id)
        .eq('customer_id', customerId);

      if (usageError) {
        console.error('Error checking coupon usage:', usageError);
      } else if (count !== null && count >= coupon.per_user_limit) {
        return NextResponse.json(
          { 
            valid: false, 
            error: 'Customer usage limit reached',
            message: `You have already used this coupon ${count} time(s)`
          },
          { status: 200 }
        );
      }
    }

    // Calculate discount
    let discountAmount = 0;
    
    if (coupon.discount_type === 'percentage') {
      discountAmount = (orderValue * coupon.discount_value) / 100;
      // Apply max discount cap if set
      if (coupon.max_discount && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount;
      }
    } else if (coupon.discount_type === 'flat') {
      discountAmount = coupon.discount_value;
    } else if (coupon.discount_type === 'free_shipping') {
      // For now, free shipping just returns 0 discount
      // You can customize this based on your shipping calculation
      discountAmount = 0;
    }

    // Ensure discount doesn't exceed order value
    discountAmount = Math.min(discountAmount, orderValue);

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
      },
      discount: discountAmount,
      message: `Coupon applied! You saved ₹${discountAmount.toFixed(2)}`,
    });

  } catch (error: any) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to validate coupon', details: error.message },
      { status: 500 }
    );
  }
}
