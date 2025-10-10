import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Server-side Supabase client
export function createServerSupabaseClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

export default createServerSupabaseClient
