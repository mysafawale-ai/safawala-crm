import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"
import { authenticateRequest } from "@/lib/auth-middleware"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

// POST /api/staff/update  Body: { id, name?, email?, password?, role?, franchise_id?, permissions?, is_active? }
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, { minRole: 'franchise_admin', requirePermission: 'staff' })
    if (!auth.authorized) {
      return NextResponse.json(auth.error, { status: auth.statusCode || 401 })
    }
    const { user } = auth

    const body = await request.json()
    const { id, name, email, password, role, franchise_id, permissions, is_active } = body
    if (!id) return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })

    if (!user!.is_super_admin && role === 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized: Franchise admins cannot modify super admins' }, { status: 403 })
    }
    if (!user!.is_super_admin && franchise_id && franchise_id !== user!.franchise_id) {
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
