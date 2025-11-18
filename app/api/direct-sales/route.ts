import { createClient } from "@/lib/supabase/server"
import { supabaseServer } from "@/lib/supabase-server-simple"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET user from safawala_user or safawala_session cookie
 */
async function getUserFromCookie(request: NextRequest) {
  try {
    // Try to get the session cookie (newer format)
    let sessionCookie = request.cookies.get("safawala_session")
    
    // Fallback to safawala_user cookie if session not found (current format)
    if (!sessionCookie) {
      sessionCookie = request.cookies.get("safawala_user")
    }
    
    if (!sessionCookie?.value) {
      console.error('[Direct Sales] No session cookie found');
      throw new Error("No session found")
    }

    const sessionData = JSON.parse(sessionCookie.value)
    if (!sessionData.id) {
      console.error('[Direct Sales] Invalid session data: missing id');
      throw new Error("Invalid session data")
    }

    // Use service role to fetch user details
    const { data: user, error } = await supabaseServer
      .from("users")
      .select("id, franchise_id, role")
      .eq("id", sessionData.id)
      .eq("is_active", true)
      .single()

    if (error || !user) {
      console.error('[Direct Sales] User not found:', error?.message);
      throw new Error("User not found")
    }

    console.log('[Direct Sales] User authenticated:', { userId: user.id, franchiseId: user.franchise_id });
    return {
      userId: user.id,
      franchiseId: user.franchise_id,
      role: user.role
    };
  } catch (error) {
    console.error('[Direct Sales] Auth error:', error);
    throw error;
  }
}

/**
 * POST /api/direct-sales
 * 
 * Creates a new direct sale order with items
 * Handles inventory deduction server-side
 * Bypasses client-side RLS issues
 */
export async function POST(request: NextRequest) {
  try {
    // Get user from cookie instead of Supabase Auth
    console.log('[Direct Sales] POST request started');
    let userAuth;
    try {
      userAuth = await getUserFromCookie(request);
    } catch (authError) {
      console.error('[Direct Sales] Authentication failed:', authError);
      return NextResponse.json(
        { error: 'Unauthorized', details: (authError as Error).message },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    
    // Get full user details using service role
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('id, franchise_id, role')
      .eq('id', userAuth.userId)
      .single()

    if (userError || !userData) {
      console.error('[Direct Sales API] User fetch error:', userError)
      return NextResponse.json(
        { error: 'User not found', details: userError?.message },
        { status: 404 }
      )
    }

    if (!userData.franchise_id) {
      return NextResponse.json(
        { error: 'User not assigned to a franchise' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { sale, items } = body

    if (!sale || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: sale and items' },
        { status: 400 }
      )
    }

    console.log('[Direct Sales API] Creating direct sale for user:', userAuth.userId)
    console.log('[Direct Sales API] Franchise:', userData.franchise_id)
    console.log('[Direct Sales API] Sale number:', sale.sale_number)

    // Insert direct sale order
    const { data: saleData, error: saleError } = await supabase
      .from('direct_sales_orders')
      .insert({
        sale_number: sale.sale_number,
        customer_id: sale.customer_id,
        franchise_id: userData.franchise_id, // Use user's franchise
        sale_date: sale.sale_date,
        delivery_date: sale.delivery_date || null,
        venue_address: sale.venue_address || null,
        groom_name: sale.groom_name || null,
        groom_whatsapp: sale.groom_whatsapp || null,
        groom_address: sale.groom_address || null,
        bride_name: sale.bride_name || null,
        bride_whatsapp: sale.bride_whatsapp || null,
        bride_address: sale.bride_address || null,
        payment_method: sale.payment_method || 'Cash / Offline Payment',
        payment_type: sale.payment_type || 'full',
        subtotal_amount: sale.subtotal_amount || 0,
        discount_amount: sale.discount_amount || 0,
        coupon_code: sale.coupon_code || null,
        coupon_discount: sale.coupon_discount || 0,
        tax_amount: sale.tax_amount || 0,
        total_amount: sale.total_amount,
        amount_paid: sale.amount_paid || 0,
        pending_amount: sale.pending_amount || 0,
        security_deposit: 0, // Always 0 for direct sales
        status: sale.status || 'confirmed',
        notes: sale.notes || null,
        sales_closed_by_id: sale.sales_closed_by_id || null,
      })
      .select()
      .single()

    if (saleError) {
      console.error('[Direct Sales API] Sale insert error:', saleError)
      return NextResponse.json(
        { error: 'Failed to create direct sale', details: saleError.message },
        { status: 500 }
      )
    }

    console.log('[Direct Sales API] ✅ Direct sale created:', saleData.id)

    // Insert direct sale items
    const itemsToInsert = items.map((item: any) => ({
      sale_id: saleData.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }))

    const { error: itemsError } = await supabase
      .from('direct_sales_items')
      .insert(itemsToInsert)

    if (itemsError) {
      console.error('[Direct Sales API] Items insert error:', itemsError)
      // Rollback: Delete the sale order
      await supabase.from('direct_sales_orders').delete().eq('id', saleData.id)
      return NextResponse.json(
        { error: 'Failed to create sale items', details: itemsError.message },
        { status: 500 }
      )
    }

    console.log('[Direct Sales API] ✅ Inserted', itemsToInsert.length, 'items')

    // Deduct inventory (server-side for reliability)
    const inventoryUpdates: any[] = []
    for (const item of items) {
      try {
        // Fetch current stock
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('stock_available, name')
          .eq('id', item.product_id)
          .single()

        if (fetchError || !product) {
          console.warn(`[Direct Sales API] Could not fetch product ${item.product_id}:`, fetchError)
          continue
        }

        const newStock = Math.max(0, (product.stock_available || 0) - item.quantity)
        
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock_available: newStock })
          .eq('id', item.product_id)

        if (updateError) {
          console.warn(`[Direct Sales API] Failed to deduct stock for ${product.name}:`, updateError)
        } else {
          inventoryUpdates.push({
            product_id: item.product_id,
            product_name: product.name,
            quantity_deducted: item.quantity,
            new_stock: newStock
          })
        }
      } catch (inventoryError) {
        console.error('[Direct Sales API] Inventory update error:', inventoryError)
      }
    }

    console.log('[Direct Sales API] ✅ Inventory updates:', inventoryUpdates.length)

    return NextResponse.json({
      success: true,
      data: {
        sale: saleData,
        items_count: itemsToInsert.length,
        inventory_updates: inventoryUpdates
      },
      message: 'Direct sale created successfully'
    })

  } catch (error) {
    console.error('[Direct Sales API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/direct-sales
 * 
 * Fetches direct sales orders for the authenticated user's franchise
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from cookie instead of Supabase Auth
    console.log('[Direct Sales GET] Request started');
    let userAuth;
    try {
      userAuth = await getUserFromCookie(request);
    } catch (authError) {
      console.error('[Direct Sales GET] Authentication failed:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's franchise
    const { data: userData } = await supabaseServer
      .from('users')
      .select('franchise_id, role')
      .eq('id', userAuth.userId)
      .single()

    if (!userData?.franchise_id) {
      return NextResponse.json(
        { error: 'User not assigned to franchise' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // Fetch direct sales for franchise
    const { data: sales, error: salesError } = await supabase
      .from('direct_sales_orders')
      .select(`
        *,
        customer:customers(id, name, phone, email)
      `)
      .eq('franchise_id', userData.franchise_id)
      .order('created_at', { ascending: false })

    if (salesError) {
      console.error('[Direct Sales API] Fetch error:', salesError)
      return NextResponse.json(
        { error: 'Failed to fetch sales', details: salesError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: sales,
      count: sales?.length || 0
    })

  } catch (error) {
    console.error('[Direct Sales API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
