import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

async function getUserFromSession(request: NextRequest) {
  try {
    const cookieHeader = request.cookies.get("safawala_session")
    if (!cookieHeader?.value) throw new Error("No session")
    const sessionData = JSON.parse(cookieHeader.value)
    if (!sessionData.id) throw new Error("Invalid session")
    const supabase = createClient()
    const { data: user } = await supabase
      .from("users")
      .select("id, franchise_id, role")
      .eq("id", sessionData.id)
      .eq("is_active", true)
      .single()
    if (!user) throw new Error("User not found")
    return { userId: user.id, franchiseId: user.franchise_id, isSuperAdmin: user.role === 'super_admin' }
  } catch {
    throw new Error("Authentication required")
  }
}

// POST /api/staff/update  Body: { id, name?, email?, password?, role?, franchise_id?, permissions?, is_active? }
export async function POST(request: NextRequest) {
  try {
    const { franchiseId, isSuperAdmin, userId } = await getUserFromSession(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, name, email, password, role, franchise_id, permissions, is_active } = body
    if (!id) return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })

    if (!isSuperAdmin && role === 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized: Franchise admins cannot modify super admins' }, { status: 403 })
    }
    if (!isSuperAdmin && franchise_id && franchise_id !== franchiseId) {
      return NextResponse.json({ error: 'Unauthorized: Can only modify staff in your own franchise' }, { status: 403 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = role
    if (franchise_id !== undefined) updateData.franchise_id = franchise_id
    if (permissions !== undefined) updateData.permissions = permissions
    if (is_active !== undefined) updateData.is_active = is_active

    if (password && password.length > 0) {
      if (password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 })
      }
      updateData.password_hash = await hashPassword(password)
    }

    const supabase = createClient()
    if (email) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', id)
        .single()
      if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select(`*, franchise:franchises(name, code)`) 
      .single()

    if (error) {
      console.error('[Staff Update Fallback] Update error:', error)
      return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Staff member updated successfully', user: data }, { headers: { 'x-route': 'fallback-update' } })
  } catch (error) {
    console.error('[Staff Update Fallback] Unhandled:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
