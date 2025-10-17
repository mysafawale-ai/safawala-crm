import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

interface ReturnItem {
  product_id: string
  qty_delivered: number
  qty_returned: number // Used items that need laundry
  qty_not_used: number // Extra items that weren't used
  qty_damaged: number
  qty_lost: number
  damage_reason?: string
  damage_description?: string
  damage_severity?: string
  lost_reason?: string
  lost_description?: string
  notes?: string
}

interface ProcessReturnRequest {
  items: ReturnItem[]
  send_to_laundry: boolean
  notes?: string
  processing_notes?: string
}

/**
 * POST /api/returns/[id]/process
 * Process a return: update inventory, archive damaged/lost items, create laundry batch if needed
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const returnId = params.id
    const body: ProcessReturnRequest = await request.json()
    
    const { items, send_to_laundry, notes, processing_notes } = body
    
    // Validate request
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      )
    }
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    
    // 1. Fetch return record
    const { data: returnRecord, error: returnError } = await supabase
      .from("returns")
      .select("*")
      .eq("id", returnId)
      .single()
    
    if (returnError || !returnRecord) {
      return NextResponse.json(
        { error: "Return not found" },
        { status: 404 }
      )
    }
    
    // Check if already processed
    if (returnRecord.status === "completed") {
      return NextResponse.json(
        { error: "Return already processed" },
        { status: 400 }
      )
    }
    
    // 2. Validate quantities for each item
    for (const item of items) {
      const total = item.qty_returned + item.qty_not_used + item.qty_damaged + item.qty_lost
      if (total !== item.qty_delivered) {
        return NextResponse.json(
          { error: `Quantity mismatch for product ${item.product_id}. Delivered: ${item.qty_delivered}, Accounted: ${total}` },
          { status: 400 }
        )
      }
      
      // Validate damage reason if damaged
      if (item.qty_damaged > 0 && !item.damage_reason) {
        return NextResponse.json(
          { error: `Damage reason required for product ${item.product_id}` },
          { status: 400 }
        )
      }
      
      // Validate lost reason if lost
      if (item.qty_lost > 0 && !item.lost_reason) {
        return NextResponse.json(
          { error: `Lost reason required for product ${item.product_id}` },
          { status: 400 }
        )
      }
    }
    
    // 3. Process each item
    const results = {
      items_processed: 0,
      inventory_updated: 0,
      items_archived: 0,
      laundry_batch_id: null as string | null
    }
    
    for (const item of items) {
      // Get product details
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", item.product_id)
        .single()
      
      if (productError || !product) {
        console.error(`Product ${item.product_id} not found, skipping...`)
        continue
      }
      
      // 4. Insert return item record
      const { error: itemInsertError } = await supabase
        .from("return_items")
        .insert({
          return_id: returnId,
          product_id: item.product_id,
          product_name: product.name,
          product_code: product.product_code,
          product_category: product.category,
          qty_delivered: item.qty_delivered,
          qty_returned: item.qty_returned,
          qty_not_used: item.qty_not_used,
          qty_damaged: item.qty_damaged,
          qty_lost: item.qty_lost,
          damage_reason: item.damage_reason,
          damage_description: item.damage_description,
          damage_severity: item.damage_severity,
          lost_reason: item.lost_reason,
          lost_description: item.lost_description,
          notes: item.notes,
          archived: item.qty_damaged > 0 || item.qty_lost > 0,
          sent_to_laundry: send_to_laundry && item.qty_returned > 0
        })
      
      if (itemInsertError) {
        console.error("Error inserting return item:", itemInsertError)
        continue
      }
      
      results.items_processed++
      
      // 5. Update inventory
      // qty_not_used: Goes directly to available (never used, no laundry needed)
      // qty_returned: Goes to laundry if send_to_laundry is true, otherwise to available
      const directToAvailable = item.qty_not_used + (send_to_laundry ? 0 : item.qty_returned)
      const toLoadry = send_to_laundry ? item.qty_returned : 0
      
      const newInventory = {
        stock_available: product.stock_available + directToAvailable,
        stock_damaged: product.stock_damaged + item.qty_damaged,
        stock_total: product.stock_total - item.qty_lost,
        stock_in_laundry: (product.stock_in_laundry || 0) + toLoadry,
        stock_booked: Math.max(0, (product.stock_booked || 0) - item.qty_delivered)
      }
      
      const { error: inventoryError } = await supabase
        .from("products")
        .update(newInventory)
        .eq("id", item.product_id)
      
      if (inventoryError) {
        console.error("Error updating inventory:", inventoryError)
      } else {
        results.inventory_updated++
      }
      
      // 6. Archive damaged items
      if (item.qty_damaged > 0) {
        const { error: archiveError } = await supabase
          .from("product_archive")
          .insert({
            product_id: item.product_id,
            product_name: product.name,
            product_code: product.product_code,
            barcode: product.barcode,
            category: product.category,
            reason: "damaged",
            notes: item.damage_description || "Damaged during rental",
            damage_reason: item.damage_reason,
            severity: item.damage_severity,
            quantity: item.qty_damaged,
            return_id: returnId,
            delivery_id: returnRecord.delivery_id,
            original_rental_price: product.rental_price,
            original_sale_price: product.sale_price || product.price,
            image_url: product.image_url,
            archived_by: userId,
            franchise_id: returnRecord.franchise_id
          })
        
        if (!archiveError) {
          results.items_archived++
        }
      }
      
      // 7. Archive lost items
      if (item.qty_lost > 0) {
        const { error: archiveError } = await supabase
          .from("product_archive")
          .insert({
            product_id: item.product_id,
            product_name: product.name,
            product_code: product.product_code,
            barcode: product.barcode,
            category: product.category,
            reason: item.lost_reason === "stolen" ? "stolen" : "lost",
            notes: item.lost_description || "Lost during rental",
            lost_reason: item.lost_reason,
            quantity: item.qty_lost,
            return_id: returnId,
            delivery_id: returnRecord.delivery_id,
            original_rental_price: product.rental_price,
            original_sale_price: product.sale_price || product.price,
            image_url: product.image_url,
            archived_by: userId,
            franchise_id: returnRecord.franchise_id
          })
        
        if (!archiveError) {
          results.items_archived++
        }
      }
    }
    
    // 8. Create laundry batch if needed
    if (send_to_laundry) {
      const laundryItems = items
        .filter(item => item.qty_returned > 0)
        .map(item => ({
          product_id: item.product_id,
          quantity: item.qty_returned,
          condition_before: "dirty"
        }))
      
      if (laundryItems.length > 0) {
        // Generate batch number
        const batchNumber = `LB-RET-${Date.now().toString().slice(-6)}`
        
        const { data: batch, error: batchError } = await supabase
          .from("laundry_batches")
          .insert({
            batch_number: batchNumber,
            return_id: returnId,
            auto_created: true,
            status: "pending",
            total_items: laundryItems.reduce((sum, item) => sum + item.quantity, 0),
            notes: `Auto-created from return ${returnRecord.return_number}`,
            franchise_id: returnRecord.franchise_id,
            created_by: userId
          })
          .select()
          .single()
        
        if (!batchError && batch) {
          results.laundry_batch_id = batch.id
          
          // Insert batch items
          const batchItemsToInsert = await Promise.all(
            laundryItems.map(async (item) => {
              const { data: product } = await supabase
                .from("products")
                .select("name, category")
                .eq("id", item.product_id)
                .single()
              
              return {
                batch_id: batch.id,
                product_id: item.product_id,
                product_name: product?.name || "Unknown",
                product_category: product?.category || "Unknown",
                quantity: item.quantity,
                condition_before: item.condition_before
              }
            })
          )
          
          await supabase
            .from("laundry_batch_items")
            .insert(batchItemsToInsert)
        }
      }
    }
    
    // 9. Calculate totals for return record
    const totals = items.reduce(
      (acc, item) => ({
        total_items: acc.total_items + item.qty_delivered,
        total_returned: acc.total_returned + item.qty_returned,
        total_damaged: acc.total_damaged + item.qty_damaged,
        total_lost: acc.total_lost + item.qty_lost
      }),
      { total_items: 0, total_returned: 0, total_damaged: 0, total_lost: 0 }
    )
    
    // 10. Update return record
    const { error: updateError } = await supabase
      .from("returns")
      .update({
        status: "completed",
        processed_at: new Date().toISOString(),
        processed_by: userId,
        send_to_laundry,
        laundry_batch_id: results.laundry_batch_id,
        laundry_batch_created: send_to_laundry && results.laundry_batch_id !== null,
        notes: notes || returnRecord.notes,
        processing_notes: processing_notes,
        ...totals
      })
      .eq("id", returnId)
    
    if (updateError) {
      console.error("Error updating return record:", updateError)
    }
    
    return NextResponse.json({
      success: true,
      message: "Return processed successfully",
      return_id: returnId,
      results: {
        ...results,
        ...totals
      }
    })
    
  } catch (error: any) {
    console.error("Error in POST /api/returns/[id]/process:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
