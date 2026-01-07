import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function createServerClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables. Please check your environment configuration.")
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  })

  // Get session from cookies if available
  const accessToken = cookieStore.get("sb-access-token")?.value
  const refreshToken = cookieStore.get("sb-refresh-token")?.value

  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
  }

  return supabase
}

// For backward compatibility
export { createServerClient as createClient }
