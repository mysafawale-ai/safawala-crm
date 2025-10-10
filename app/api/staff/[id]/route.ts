import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Simple password encoding function (not for production use)
function encodePassword(password: string): string {
  return `encoded_${password}_${Date.now()}`
}

/**
 * GET /api/staff/[id]
 * Fetch a specific staff member by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    
    if (!id) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from("users")
      .select(`
        *,
        franchise:franchises(name, code)
      `)
      .eq("id", id)
      .single()
    
    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
      }
      return NextResponse.json({ error: "Failed to fetch staff member" }, { status: 500 })
    }
    
    // Remove sensitive data
    if (data) {
      delete data.password_hash
    }
    
    return NextResponse.json({ user: data })
  } catch (error) {
    console.error("Error in staff GET[id] route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * PATCH /api/staff/[id]
 * Update a specific staff member
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    
    if (!id) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 })
    }
    
    const body = await request.json()
    const { name, email, password, role, franchise_id, permissions, is_active } = body
    
    // Prepare update data
    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = role
    if (franchise_id !== undefined) updateData.franchise_id = franchise_id
    if (permissions !== undefined) updateData.permissions = permissions
    if (is_active !== undefined) updateData.is_active = is_active
    
    // Encode password if provided
    if (password && password.length >= 6) {
      updateData.password_hash = encodePassword(password)
    }
    
    // Check if email is unique if it's being changed
    if (email) {
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .neq("id", id)
        .single()
      
      if (existingUser) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 })
      }
    }
    
    // Update user
    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        franchise:franchises(name, code)
      `)
      .single()
    
    if (error) {
      console.error("Error updating staff member:", error)
      return NextResponse.json({ error: "Failed to update staff member" }, { status: 500 })
    }
    
    return NextResponse.json({ 
      message: "Staff member updated successfully", 
      user: data 
    })
  } catch (error) {
    console.error("Error in staff PATCH[id] route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/staff/[id]
 * Delete a specific staff member
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    
    if (!id) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 })
    }
    
    // Check if user exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .single()
    
    if (!existingUser) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }
    
    // Delete user
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", id)
    
    if (error) {
      console.error("Error deleting staff member:", error)
      return NextResponse.json({ error: "Failed to delete staff member" }, { status: 500 })
    }
    
    return NextResponse.json({ 
      message: "Staff member deleted successfully" 
    })
  } catch (error) {
    console.error("Error in staff DELETE[id] route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}