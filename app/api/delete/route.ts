import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering and Node runtime
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type SupportedEntity = "vendor" | "vendors" | "customer" | "customers"

const ENTITY_TABLE_MAP: Record<SupportedEntity, string> = {
  vendor: "vendors",
  vendors: "vendors",
  customer: "customers",
  customers: "customers",
}

function normalizeEntity(entity: string): SupportedEntity | null {
  const key = entity?.toLowerCase() as SupportedEntity
  return ENTITY_TABLE_MAP[key] ? key : null
}

async function getUserFromSession(request: NextRequest) {
  const cookieHeader = request.cookies.get("safawala_session")
  if (!cookieHeader?.value) throw new Error("Authentication required")

  let sessionData: any
  try {
    sessionData = JSON.parse(cookieHeader.value)
  } catch {
    throw new Error("Authentication required")
  }
  if (!sessionData?.id) throw new Error("Authentication required")

  const supabase = createClient()
  const { data: user, error } = await supabase
    .from("users")
    .select("id, franchise_id, role, is_active")
    .eq("id", sessionData.id)
    .single()

  if (error || !user || user.is_active === false) throw new Error("Authentication required")

  return {
    userId: user.id as string,
    franchiseId: user.franchise_id as string | null,
    role: user.role as string,
    isSuperAdmin: user.role === "super_admin",
  }
}

export async function POST(request: NextRequest) {
  try {
    const { franchiseId, isSuperAdmin, role } = await getUserFromSession(request)
    // Only allow staff and above
    if (!["super_admin", "franchise_admin", "staff"].includes(role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { entity, id, hard } = body || {}

    const normalized = normalizeEntity(entity)
    if (!normalized) {
      return NextResponse.json({ error: "Unsupported entity type" }, { status: 400 })
    }

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Valid id is required" }, { status: 400 })
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: "Invalid id format" }, { status: 400 })
    }

    const table = ENTITY_TABLE_MAP[normalized]
    const supabase = createClient()

    // 1) Fetch existing record first
    const { data: record, error: fetchError } = await supabase
      .from(table)
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError) {
      if ((fetchError as any).code === "PGRST116") {
        return NextResponse.json({ error: `${table.slice(0, -1)} not found` }, { status: 404 })
      }
      throw fetchError
    }

    // 2) Franchise authorization if column exists
    if (!isSuperAdmin && Object.prototype.hasOwnProperty.call(record, "franchise_id")) {
      if (record.franchise_id && record.franchise_id !== franchiseId) {
        return NextResponse.json({ error: "Access denied for this franchise" }, { status: 403 })
      }
    }

    // 3) Optional sanity checks by entity
    if (table === "vendors") {
      // Prevent deletion if active purchases exist
      const { data: activePurchases } = await supabase
        .from("purchases")
        .select("id")
        .eq("vendor_id", id)
        .in("status", ["pending", "partial"])
        .limit(1)
      if (activePurchases && activePurchases.length > 0) {
        return NextResponse.json(
          { error: "Cannot delete vendor with active purchases. Complete or cancel purchases first." },
          { status: 409 }
        )
      }
    }

    // 4) Perform deletion
    const doHardDelete = Boolean(hard)

    if (doHardDelete) {
      const { error: delError } = await supabase.from(table).delete().eq("id", id)
      if (delError) throw delError
      return NextResponse.json({ message: `${table.slice(0, -1)} deleted successfully`, hard: true })
    }

    // Soft delete preferred if is_active exists
    try {
      const { data: updated, error: updError } = await supabase
        .from(table)
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (updError) {
        const msg = String((updError as any).message || "")
        if (/is_active|column .* does not exist/i.test(msg)) {
          // Fallback to hard delete
          const { error: delError } = await supabase.from(table).delete().eq("id", id)
          if (delError) throw delError
          return NextResponse.json({
            message: `${table.slice(0, -1)} deleted successfully (hard delete)`,
            warning: "Soft delete not available; consider running migration to add is_active.",
          })
        }
        throw updError
      }

      return NextResponse.json({ message: `${table.slice(0, -1)} deleted successfully`, record: updated })
    } catch (error) {
      // Last resort hard delete
      const { error: delError } = await supabase.from(table).delete().eq("id", id)
      if (delError) throw delError
      return NextResponse.json({ message: `${table.slice(0, -1)} deleted successfully` })
    }
  } catch (error: any) {
    console.error("[Delete API] Error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to delete" },
      { status: error?.message === "Authentication required" ? 401 : 500 }
    )
  }
}
