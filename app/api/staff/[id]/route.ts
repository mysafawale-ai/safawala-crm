import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"

// Ensure dynamic rendering for Vercel edge caching behavior
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Hash password using bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/**
 * Get user session from cookie and validate franchise access
 */
async function getUserFromSession(request: NextRequest) {
  try {
    const cookieHeader = request.cookies.get("safawala_session")
    if (!cookieHeader?.value) {
      throw new Error("No session found")
    }
    
    const sessionData = JSON.parse(cookieHeader.value)
    if (!sessionData.id) {
      throw new Error("Invalid session")
    }

    // Use service role to fetch user details
    const supabase = createClient()
    const { data: user, error } = await supabase
      .from("users")
      .select("id, franchise_id, role")
      .eq("id", sessionData.id)
      .eq("is_active", true)
      .single()

    if (error || !user) {
      throw new Error("User not found")
    }

    return {
      userId: user.id,
      franchiseId: user.franchise_id,
      role: user.role,
      isSuperAdmin: user.role === "super_admin"
    }
  } catch (error) {
    throw new Error("Authentication required")
  }
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
    
    const supabase = createClient()
    
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
    // 🔒 SECURITY: Authenticate user and get franchise context
    const { franchiseId, isSuperAdmin, userId } = await getUserFromSession(request)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const id = params.id
    
    if (!id) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 })
    }
    
    const body = await request.json()
    const { name, email, password, role, franchise_id, permissions, is_active } = body
    
    // 🔒 RBAC: Franchise admins cannot set role to super_admin
    if (!isSuperAdmin && role === 'super_admin') {
      return NextResponse.json(
        { error: "Unauthorized: Franchise admins cannot create or modify super admin accounts" }, 
        { status: 403 }
      )
    }
    
    // 🔒 RBAC: Franchise admins can only update staff in their own franchise
    if (!isSuperAdmin && franchise_id && franchise_id !== franchiseId) {
      return NextResponse.json(
        { error: "Unauthorized: Can only modify staff in your own franchise" }, 
        { status: 403 }
      )
    }
    
    // Prepare update data
    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = role
    if (franchise_id !== undefined) updateData.franchise_id = franchise_id
    if (permissions !== undefined) updateData.permissions = permissions
    if (is_active !== undefined) updateData.is_active = is_active
    
    // Hash password if provided (with validation)
    if (password && password.length > 0) {
      if (password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters long" }, 
          { status: 400 }
        )
      }
      updateData.password_hash = await hashPassword(password)
    }
    
    const supabase = createClient()
    
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
    // 🔒 SECURITY: Authenticate user and get franchise context
    const { userId, franchiseId, isSuperAdmin } = await getUserFromSession(request)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const id = params.id
    
    if (!id) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 })
    }
    
    // 🔒 PREVENT SELF-DELETION
    if (id === userId) {
      return NextResponse.json(
        { error: "Cannot delete your own account. Please ask another admin to remove your account." }, 
        { status: 403 }
      )
    }
    
    const supabase = createClient()
    
    // Check if user exists and get their details
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id, franchise_id, role, is_active")
      .eq("id", id)
      .single()
    
    if (fetchError || !existingUser) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }
    
    // 🔒 PREVENT DELETING LAST ACTIVE ADMIN IN FRANCHISE
    if (existingUser.role === 'franchise_admin' && existingUser.is_active) {
      const { data: adminCount } = await supabase
        .from("users")
        .select("id")
        .eq("franchise_id", existingUser.franchise_id)
        .eq("role", "franchise_admin")
        .eq("is_active", true)
      
      if (adminCount && adminCount.length <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the last active admin. Assign another admin first." }, 
          { status: 403 }
        )
      }
    }
    
    // 🔒 FRANCHISE ISOLATION: Non-super-admins can only delete staff in their franchise
    if (!isSuperAdmin && existingUser.franchise_id !== franchiseId) {
      return NextResponse.json(
        { error: "Unauthorized: Can only delete staff in your own franchise" }, 
        { status: 403 }
      )
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