import { createClient } from "@/lib/supabase/server"

/**
 * Get the franchise ID for the current user
 * - For regular users: returns their assigned franchise_id
 * - For super_admin: returns the first franchise as default (if no franchise_id set)
 */
export async function getCurrentFranchiseId(): Promise<string | null> {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error("[getCurrentFranchiseId] No authenticated user")
    return null
  }

  // Get user details from users table
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role, franchise_id")
    .eq("id", user.id)
    .single()

  if (userError) {
    console.error("[getCurrentFranchiseId] Error fetching user:", userError)
    return null
  }

  // If user has franchise_id, return it
  if (userData.franchise_id) {
    console.log(`[getCurrentFranchiseId] User has franchise_id: ${userData.franchise_id}`)
    return userData.franchise_id
  }

  // If super_admin without franchise_id, get first franchise as default
  if (userData.role === "super_admin") {
    console.log("[getCurrentFranchiseId] Super admin without franchise_id, fetching default franchise...")
    
    const { data: franchises, error: franchiseError } = await supabase
      .from("franchises")
      .select("id")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)

    if (franchiseError) {
      console.error("[getCurrentFranchiseId] Error fetching default franchise:", franchiseError)
      return null
    }

    if (franchises && franchises.length > 0) {
      const defaultFranchiseId = franchises[0].id
      console.log(`[getCurrentFranchiseId] ✅ Using default franchise for super admin: ${defaultFranchiseId}`)
      return defaultFranchiseId
    }

    console.warn("[getCurrentFranchiseId] ⚠️ No franchises found in database")
    return null
  }

  console.warn("[getCurrentFranchiseId] ⚠️ User has no franchise_id and is not super_admin")
  return null
}

/**
 * Get user with franchise information
 */
export async function getCurrentUserWithFranchise() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userData } = await supabase
    .from("users")
    .select(`
      *,
      franchise:franchises(*)
    `)
    .eq("id", user.id)
    .single()

  return userData
}
