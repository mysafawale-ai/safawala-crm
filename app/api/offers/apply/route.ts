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
  } catch (error) {
    console.error('[Auth] Authentication failed:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const userContext = await getUserFromSession(request);

    const body = await request.json();
    const { code, order_value, customer_id } = body;

    // Validation
    if (!code || order_value === undefined) {
      return NextResponse.json({
        valid: false,
        error: 'Code and order value are required'
      }, { status: 400 });
    }

    if (typeof order_value !== 'number' || order_value <= 0) {
      return NextResponse.json({
        valid: false,
        error: 'Order value must be a positive number'
      }, { status: 400 });
    }

    // Find the offer
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('franchise_id', userContext.franchiseId)
      .eq('is_active', true)
      .single();

    if (offerError || !offer) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid or inactive offer code'
      }, { status: 404 });
    }

    // Calculate discount
    let discount = 0;
    if (offer.discount_type === 'percent') {
      discount = (order_value * offer.discount_value) / 100;
    } else if (offer.discount_type === 'fixed') {
      discount = Math.min(offer.discount_value, order_value); // Don't exceed order value
    }

    // Round to 2 decimal places
    discount = Math.round(discount * 100) / 100;

    return NextResponse.json({
      valid: true,
      offer: {
        id: offer.id,
        code: offer.code,
        name: offer.name,
        discount_type: offer.discount_type,
        discount_value: offer.discount_value
      },
      discount,
      message: `Offer applied successfully! ${offer.discount_type === 'percent' ? `${offer.discount_value}% off` : `₹${offer.discount_value} off`}`
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      valid: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}