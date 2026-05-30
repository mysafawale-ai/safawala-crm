import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function getUserFromSession(request: NextRequest) {
  try {
    // Try to get the session cookie (newer format)
    let sessionCookie = request.cookies.get("safawala_session")
    
    // Fallback to safawala_user cookie if session not found (current format)
    if (!sessionCookie) {
      sessionCookie = request.cookies.get("safawala_user")
    }
    
    if (!sessionCookie?.value) throw new Error("No session")
    const sessionData = JSON.parse(sessionCookie.value)
    if (!sessionData.id) throw new Error("Invalid session")

    const supabase = createClient()
    const { data: user, error } = await supabase
      .from('users')
      .select('id, franchise_id, role')
      .eq('id', sessionData.id)
      .eq('is_active', true)
      .single()

    if (error || !user) throw new Error('User not found')
    
    return { 
      userId: user.id, 
      franchiseId: user.franchise_id, 
      isSuperAdmin: user.role === 'super_admin' 
    };
  } catch (error) {
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
    
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    
    const code = body.code;
    const orderValue = body.orderValue !== undefined ? body.orderValue : body.subtotal;
    const customerId = body.customerId;

    if (!code || orderValue === undefined) {
      return NextResponse.json(
        { error: 'Coupon code and order value are required' },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    // 1. Try to fetch from the NEW offers table first (from Manage Offers dialog)
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('id, code, name, discount_type, discount_value, is_active, franchise_id, description')
      .eq('code', cleanCode)
      .eq('franchise_id', franchiseId)
      .eq('is_active', true)
      .single();

    if (offer && !offerError) {
      // Calculate discount for new offer
      let discountAmount = 0;
      if (offer.discount_type === 'percent') {
        discountAmount = (orderValue * offer.discount_value) / 100;
      } else if (offer.discount_type === 'fixed') {
        discountAmount = offer.discount_value;
      }
      
      discountAmount = Math.min(discountAmount, orderValue);

      return NextResponse.json({
        valid: true,
        coupon: {
          id: offer.id,
          code: offer.code,
          description: offer.description || offer.name || null,
          discount_type: offer.discount_type === 'percent' ? 'percentage' : 'flat',
          discount_value: offer.discount_value,
        },
        discount: discountAmount,
        message: `Offer "${offer.name}" applied! You saved ₹${discountAmount.toFixed(2)}`,
      });
    }

    // 2. Fall back to the legacy coupons table
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('id, code, discount_type, discount_value, franchise_id, description')
      .eq('code', cleanCode)
      .eq('franchise_id', franchiseId)
      .single();

    if (coupon && !couponError) {
      // Calculate discount for legacy coupon
      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = (orderValue * coupon.discount_value) / 100;
      } else if (coupon.discount_type === 'flat') {
        discountAmount = coupon.discount_value;
      }
      
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
    }

    // 3. Not found in either
    return NextResponse.json(
      { 
        valid: false, 
        error: 'Invalid coupon code',
        message: 'This coupon/offer code does not exist or is no longer active'
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to validate coupon', details: error.message },
      { status: 500 }
    );
  }
}
