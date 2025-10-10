/**
 * Example API Route with Franchise Isolation
 * Shows how to implement franchise filtering in API routes
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  getFranchiseContext,
  applyFranchiseFilter,
  getFranchiseIdForCreate,
  canAccessFranchise,
} from "@/lib/middleware/franchise-isolation"

// ============================================================
// GET - Fetch customers with franchise isolation
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const context = await getFranchiseContext()

    if (!context) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Build base query
    let query = supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false })

    // Apply franchise filter
    // Super Admin: Sees all customers
    // Franchise Admin: Sees only their franchise customers
    query = applyFranchiseFilter(query, context)

    const { data, error } = await query

    if (error) {
      console.error("[Customers API] Error:", error)
      return NextResponse.json(
        { error: "Failed to fetch customers" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      franchise_id: context.franchiseId,
      can_access_all: context.canAccessAllFranchises,
    })
  } catch (error) {
    console.error("[Customers API] Exception:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// ============================================================
// POST - Create customer with franchise assignment
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const context = await getFranchiseContext()

    if (!context) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Automatically assign franchise_id
    // Super Admin: Uses their HQ franchise (for personal customers)
    // Franchise Admin: Uses their assigned franchise
    const franchiseId = getFranchiseIdForCreate(context)

    const customerData = {
      ...body,
      franchise_id: franchiseId, // Enforce franchise assignment
      created_by: context.userId,
    }

    const { data, error } = await supabase
      .from("customers")
      .insert(customerData)
      .select()
      .single()

    if (error) {
      console.error("[Customers API] Create error:", error)
      return NextResponse.json(
        { error: "Failed to create customer" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Customer created successfully",
    })
  } catch (error) {
    console.error("[Customers API] Exception:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// ============================================================
// PUT - Update customer with franchise access check
// ============================================================
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const context = await getFranchiseContext()

    if (!context) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      )
    }

    // First, fetch the customer to check franchise access
    const { data: existingCustomer, error: fetchError } = await supabase
      .from("customers")
      .select("franchise_id")
      .eq("id", id)
      .single()

    if (fetchError || !existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      )
    }

    // Check if user can access this customer's franchise
    if (!canAccessFranchise(context, existingCustomer.franchise_id)) {
      return NextResponse.json(
        { error: "Access denied: Cannot modify customers from other franchises" },
        { status: 403 }
      )
    }

    // Prevent changing franchise_id
    delete updates.franchise_id

    // Update customer
    const { data, error } = await supabase
      .from("customers")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[Customers API] Update error:", error)
      return NextResponse.json(
        { error: "Failed to update customer" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Customer updated successfully",
    })
  } catch (error) {
    console.error("[Customers API] Exception:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// ============================================================
// DELETE - Delete customer with franchise access check
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const context = await getFranchiseContext()

    if (!context) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      )
    }

    // First, fetch the customer to check franchise access
    const { data: existingCustomer, error: fetchError } = await supabase
      .from("customers")
      .select("franchise_id")
      .eq("id", id)
      .single()

    if (fetchError || !existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      )
    }

    // Check if user can access this customer's franchise
    if (!canAccessFranchise(context, existingCustomer.franchise_id)) {
      return NextResponse.json(
        { error: "Access denied: Cannot delete customers from other franchises" },
        { status: 403 }
      )
    }

    // Delete customer
    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("[Customers API] Delete error:", error)
      return NextResponse.json(
        { error: "Failed to delete customer" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Customer deleted successfully",
    })
  } catch (error) {
    console.error("[Customers API] Exception:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
