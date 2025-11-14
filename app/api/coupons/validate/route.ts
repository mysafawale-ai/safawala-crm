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

interface ValidateCouponRequest {
  code: string;
  orderValue: number;
  customerId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { franchiseId } = await getUserFromSession(request);
    const body: ValidateCouponRequest = await request.json();
    
    const { code, orderValue, customerId } = body;

    if (!code || orderValue === undefined) {
      return NextResponse.json(
        { error: 'Coupon code and order value are required' },
        { status: 400 }
      );
    }

    // Fetch coupon from database with franchise isolation
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('id, code, discount_type, discount_value, franchise_id, description')
      .eq('code', code.trim().toUpperCase())
      .eq('franchise_id', franchiseId)
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

    // Simplified flow: the coupon system only supports basic discounts now
    // so we do not check dates or usage/minimum values here.

    // Calculate discount
    let discountAmount = 0;
    
    if (coupon.discount_type === 'percentage') {
      discountAmount = (orderValue * coupon.discount_value) / 100;
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
        description: coupon.description || null,
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
