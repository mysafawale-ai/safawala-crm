import { supabaseServer as supabase } from '@/lib/supabase-server-simple';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

class AuthError extends Error {}

async function getUserFromSession(request: NextRequest) {
  try {
    const cookieHeader = request.cookies.get("safawala_session")
    if (!cookieHeader?.value) throw new Error("No session")
    
    const sessionData = JSON.parse(cookieHeader.value)
    if (!sessionData.id) throw new Error("Invalid session")

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
      role: user.role 
    };
  } catch (error) {
    console.error('[Auth] Error:', error);
    throw new AuthError((error as Error).message || 'auth_failed');
  }
}

interface ValidateOfferRequest {
  code: string;
  orderValue: number;
  customerId?: string;
}

/**
 * Validate an offer code from the NEW offers system
 * 
 * This endpoint replaces the old /api/coupons/validate
 * It validates offers from the simplified offers table (not coupons)
 */
export async function POST(request: NextRequest) {
  try {
    const { franchiseId } = await getUserFromSession(request);
    const body: ValidateOfferRequest = await request.json();
    
    const { code, orderValue, customerId } = body;

    // Validation
    if (!code || orderValue === undefined) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Offer code and order value are required' 
        },
        { status: 400 }
      );
    }

    if (orderValue <= 0) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Order value must be greater than 0' 
        },
        { status: 400 }
      );
    }

    // Fetch offer from NEW offers table (not old coupons table!)
    const { data: offer, error: offerError } = await supabase
      .from('offers')  // ✅ NOTE: Using NEW offers table!
      .select('id, code, name, discount_type, discount_value, is_active, franchise_id')
      .eq('code', code.trim().toUpperCase())
      .eq('franchise_id', franchiseId)
      .eq('is_active', true)  // Only active offers
      .single();

    if (offerError || !offer) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Invalid offer code',
          message: 'This offer code does not exist or is no longer active'
        },
        { status: 200 }  // Return 200 with valid: false for consistency
      );
    }

    // Calculate discount based on type
    let discountAmount = 0;
    
    if (offer.discount_type === 'percent') {
      // Percentage discount
      discountAmount = (orderValue * offer.discount_value) / 100;
    } else if (offer.discount_type === 'fixed') {
      // Fixed amount discount
      discountAmount = offer.discount_value;
    }

    // Ensure discount doesn't exceed order value
    discountAmount = Math.min(discountAmount, orderValue);

    return NextResponse.json({
      valid: true,
      offer: {
        id: offer.id,
        code: offer.code,
        name: offer.name,
        discount_type: offer.discount_type,
        discount_value: offer.discount_value,
      },
      discount: discountAmount,
      message: `Offer "${offer.name}" applied! You saved ₹${discountAmount.toFixed(2)}`,
    });

  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Offers Validate] Error:', error);
    return NextResponse.json(
      { error: 'Failed to validate offer', details: error.message },
      { status: 500 }
    );
  }
}
