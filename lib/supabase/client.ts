import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js"

// Singleton instance to prevent multiple clients
let supabaseInstance: SupabaseClient | null = null

export function createClient() {
  // Return existing instance if available
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Create new instance with proper auth config
  supabaseInstance = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        storageKey: 'sb-xplnyaxkusvuajtmorss-auth-token', // Must match Supabase's default
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    }
  )

  return supabaseInstance
}
