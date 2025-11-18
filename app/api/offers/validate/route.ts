import { supabaseServer as supabase } from '@/lib/supabase-server-simple';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

class AuthError extends Error {}

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
    console.log('[Offers Validate] POST request started');
    const { franchiseId } = await getUserFromSession(request);
    console.log('[Offers Validate] User franchise:', franchiseId);
    
    const body: ValidateOfferRequest = await request.json();
    
    const { code, orderValue, customerId } = body;

    // Validation
    if (!code || orderValue === undefined) {
      console.log('[Offers Validate] Missing required fields');
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Offer code and order value are required' 
        },
        { status: 400 }
      );
    }

    if (orderValue <= 0) {
      console.log('[Offers Validate] Invalid order value:', orderValue);
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Order value must be greater than 0' 
        },
        { status: 400 }
      );
    }

    console.log('[Offers Validate] Looking for offer code:', code, 'in franchise:', franchiseId);

    // Fetch offer from NEW offers table (not old coupons table!)
    const { data: offer, error: offerError } = await supabase
      .from('offers')  // ✅ NOTE: Using NEW offers table!
      .select('id, code, name, discount_type, discount_value, is_active, franchise_id')
      .eq('code', code.trim().toUpperCase())
      .eq('franchise_id', franchiseId)
      .eq('is_active', true)  // Only active offers
      .single();

    if (offerError || !offer) {
      console.log('[Offers Validate] Offer not found:', offerError?.message || 'No matching offer');
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Invalid offer code',
          message: 'This offer code does not exist or is no longer active'
        },
        { status: 200 }  // Return 200 with valid: false for consistency
      );
    }

    console.log('[Offers Validate] Offer found:', offer.code);

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

    console.log('[Offers Validate] Discount calculated:', discountAmount);

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
      console.error('[Offers Validate] Auth failed:', error.message);
      return NextResponse.json({ error: 'Unauthorized', details: error.message }, { status: 401 });
    }
    console.error('[Offers Validate] Error:', error);
    return NextResponse.json(
      { error: 'Failed to validate offer', details: error.message },
      { status: 500 }
    );
  }
}
