import { supabaseServer as supabase } from '@/lib/supabase-server-simple';
import { NextRequest, NextResponse } from 'next/server';

// Helper to map Postgres error codes for clearer responses
function mapDbError(e: any, context: string) {
  if (!e) return { status: 500, error: `${context} failed` };
  const code = e.code || e.details || '';
  // Undefined table
  if (code === '42P01' || /relation .* does not exist/i.test(e.message || '')) {
    return { status: 500, error: 'Offers tables missing. Run OFFERS_SYSTEM_MIGRATION.sql on the database.' };
  }
  return { status: 500, error: `${context} failed` };
}

class AuthError extends Error {}

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
    throw new AuthError((error as Error).message || 'auth_failed');
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    // Get user from session
    const userContext = await getUserFromSession(request);

    let query = supabase
      .from('offers')
      .select('*')
      .eq('franchise_id', userContext.franchiseId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // If code is provided, filter by code
    if (code) {
      query = query.ilike('code', `%${code}%`);
    }

    const { data: offers, error } = await query;

    if (error) {
      console.error('[Offers][GET] Query error:', error);
      const mapped = mapDbError(error, 'Fetch offers');
      return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    }

    return NextResponse.json({ offers: offers || [] });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Offers][GET] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userContext = await getUserFromSession(request);

    const body = await request.json();
    const { code, name, discount_type, discount_value, is_active = true } = body;

    // Validation
    if (!code || !name || !discount_type || discount_value === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (code.length < 3 || code.length > 20) {
      return NextResponse.json({ error: 'Code must be 3-20 characters' }, { status: 400 });
    }

    if (!['percent', 'fixed'].includes(discount_type)) {
      return NextResponse.json({ error: 'Invalid discount type' }, { status: 400 });
    }

    if (discount_value <= 0) {
      return NextResponse.json({ error: 'Discount value must be greater than 0' }, { status: 400 });
    }

    if (discount_type === 'percent' && discount_value > 100) {
      return NextResponse.json({ error: 'Percentage discount cannot exceed 100%' }, { status: 400 });
    }

    // Check if code already exists for this franchise
    const { data: existingOffer, error: checkError } = await supabase
      .from('offers')
      .select('id')
      .eq('code', code.toUpperCase())
      .eq('franchise_id', userContext.franchiseId)
      .single();
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = No rows found (PostgREST)
      console.error('[Offers][POST] Existence check error:', checkError);
      const mapped = mapDbError(checkError, 'Offer existence check');
      return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    }
    if (existingOffer) return NextResponse.json({ error: 'Offer code already exists' }, { status: 409 });

    // Create offer
    const { data: offer, error: insertError } = await supabase
      .from('offers')
      .insert({
        code: code.toUpperCase(),
        name: name.trim(),
        discount_type,
        discount_value,
        is_active,
        franchise_id: userContext.franchiseId
      })
      .select()
      .single();
    if (insertError) {
      console.error('[Offers][POST] Insert error:', insertError);
      const mapped = mapDbError(insertError, 'Create offer');
      return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    }

    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Offers][POST] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userContext = await getUserFromSession(request);

    const body = await request.json();
    const { id, name, discount_value, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Offer ID is required' }, { status: 400 });
    }

    // Check if offer exists and belongs to user's franchise
    const { data: existingOffer, error: checkError } = await supabase
      .from('offers')
      .select('id')
      .eq('id', id)
      .eq('franchise_id', userContext.franchiseId)
      .single();
    if (checkError) {
      if (checkError.code === 'PGRST116') return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
      console.error('[Offers][PUT] Existence check error:', checkError);
      const mapped = mapDbError(checkError, 'Fetch offer');
      return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    }
    if (!existingOffer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (discount_value !== undefined) {
      if (discount_value <= 0) {
        return NextResponse.json({ error: 'Discount value must be greater than 0' }, { status: 400 });
      }
      updateData.discount_value = discount_value;
    }
    if (is_active !== undefined) updateData.is_active = is_active;

    // Update offer
    const { data: offer, error: updateError } = await supabase
      .from('offers')
      .update(updateData)
      .eq('id', id)
      .eq('franchise_id', userContext.franchiseId)
      .select()
      .single();
    if (updateError) {
      console.error('[Offers][PUT] Update error:', updateError);
      const mapped = mapDbError(updateError, 'Update offer');
      return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    }

    return NextResponse.json({ offer });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Offers][PUT] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Offer ID is required' }, { status: 400 });
    }

    // Get user from session
    const userContext = await getUserFromSession(request);

    // Check if offer has redemptions
    const { data: redemptions, error: redemptionCheckError } = await supabase
      .from('offer_redemptions')
      .select('id')
      .eq('offer_id', id)
      .limit(1);
    if (redemptionCheckError) {
      console.error('[Offers][DELETE] Redemption check error:', redemptionCheckError);
      const mapped = mapDbError(redemptionCheckError, 'Redemption check');
      return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    }

    if (redemptions && redemptions.length > 0) {
      return NextResponse.json({ error: 'Cannot delete offer that has been used' }, { status: 409 });
    }

    // Delete offer
    const { error: deleteError } = await supabase
      .from('offers')
      .delete()
      .eq('id', id)
      .eq('franchise_id', userContext.franchiseId);
    if (deleteError) {
      console.error('[Offers][DELETE] Delete error:', deleteError);
      const mapped = mapDbError(deleteError, 'Delete offer');
      return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Offers][DELETE] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}