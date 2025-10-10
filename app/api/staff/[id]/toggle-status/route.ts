import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * POST /api/staff/[id]/toggle-status
 * Toggle a staff member's active status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    
    if (!id) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 })
    }
    
    // Get current status
    const { data: currentUser, error: fetchError } = await supabase
      .from("users")
      .select("is_active")
      .eq("id", id)
      .single()
    
    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
      }
      return NextResponse.json({ error: "Failed to fetch staff member" }, { status: 500 })
    }
    
    // Toggle status
    const newStatus = !currentUser.is_active
    
    const { data, error } = await supabase
      .from("users")
      .update({ is_active: newStatus })
      .eq("id", id)
      .select(`
        *,
        franchise:franchises(name, code)
      `)
      .single()
    
    if (error) {
      console.error("Error toggling staff status:", error)
      return NextResponse.json({ error: "Failed to update staff status" }, { status: 500 })
    }
    
    return NextResponse.json({ 
      message: `Staff member ${newStatus ? 'activated' : 'deactivated'} successfully`, 
      user: data 
    })
  } catch (error) {
    console.error("Error in staff toggle-status route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}