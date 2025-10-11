import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"

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
 * GET /api/staff
 * Fetch all staff members with optional filtering (franchise-isolated)
 */
export async function GET(request: NextRequest) {
  try {
    // 🔒 SECURITY: Authenticate user and get franchise context
    const { franchiseId, isSuperAdmin, userId } = await getUserFromSession(request)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get("role")
    const search = searchParams.get("search")
    
    const supabase = createClient()
    
    // Start building the query
    let query = supabase
      .from("users")
      .select(`
        *,
        franchise:franchises(name, code)
      `)
      .order("created_at", { ascending: false })
    
    // 🔒 FRANCHISE ISOLATION: Super admin sees all, others see only their franchise
    if (!isSuperAdmin && franchiseId) {
      query = query.eq("franchise_id", franchiseId)
    }
    
    // Apply filters if they exist
    if (role && role !== "all") {
      query = query.eq("role", role)
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error("Error fetching staff:", error)
      return NextResponse.json({ error: "Failed to fetch staff members" }, { status: 500 })
    }
    
    return NextResponse.json({ staff: data })
  } catch (error) {
    console.error("Error in staff GET route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/staff
 * Create a new staff member (franchise-isolated)
 */
export async function POST(request: NextRequest) {
  try {
    // 🔒 SECURITY: Authenticate user and get franchise context
    const { franchiseId, isSuperAdmin, userId } = await getUserFromSession(request)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, password, role, permissions, is_active = true } = body
    
    // 🔒 RBAC: Franchise admins cannot create super admins
    if (!isSuperAdmin && role === 'super_admin') {
      return NextResponse.json(
        { error: "Unauthorized: Franchise admins cannot create super admin accounts" }, 
        { status: 403 }
      )
    }
    
    // 🔒 FRANCHISE ISOLATION: Auto-assign franchise_id from session (super admin can override)
    const staffFranchiseId = isSuperAdmin && body.franchise_id 
      ? body.franchise_id 
      : franchiseId
    
    // 🔒 RBAC: Franchise admins can only create staff in their own franchise
    if (!isSuperAdmin && body.franchise_id && body.franchise_id !== franchiseId) {
      return NextResponse.json(
        { error: "Unauthorized: Can only create staff in your own franchise" }, 
        { status: 403 }
      )
    }
    
    // Basic validation
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }
    
    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }
    
    // Hash the password using bcrypt
    const password_hash = await hashPassword(password)
    
    const supabase = createClient()
    
    // Check if email already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .single()
    
    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }
    
    // Insert new user
    const { data, error } = await supabase
      .from("users")
      .insert([{
        name,
        email,
        password_hash,
        role,
        franchise_id: staffFranchiseId,
        permissions,
        is_active
      }])
      .select(`
        *,
        franchise:franchises(name, code)
      `)
      .single()
    
    if (error) {
      console.error("Error creating staff member:", error)
      return NextResponse.json({ error: "Failed to create staff member" }, { status: 500 })
    }
    
    return NextResponse.json({ 
      message: "Staff member created successfully", 
      user: data 
    }, { status: 201 })
  } catch (error) {
    console.error("Error in staff POST route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * PUT /api/staff
 * Update multiple staff members (batch update)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { users } = body
    
    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: "Invalid user data" }, { status: 400 })
    }
    
    const supabase = createClient()
    const results = []
    
    // Process each user update
    for (const user of users) {
      const { id, ...updateData } = user
      
      if (!id) {
        results.push({ success: false, error: "Missing user ID", user })
        continue
      }
      
      // Remove password if empty
      if (updateData.password === '') {
        delete updateData.password
      }
      
      // Hash password if provided
      if (updateData.password) {
        if (updateData.password.length < 8) {
          results.push({ success: false, error: "Password must be at least 8 characters", id })
          continue
        }
        updateData.password_hash = await hashPassword(updateData.password)
        delete updateData.password
      }
      
      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", id)
        .select()
      
      if (error) {
        results.push({ success: false, error: error.message, id })
      } else {
        results.push({ success: true, user: data[0], id })
      }
    }
    
    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error in staff PUT route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}