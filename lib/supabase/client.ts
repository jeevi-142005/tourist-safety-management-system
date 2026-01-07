import { createClient } from "@supabase/supabase-js"

export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[v0] Missing Supabase environment variables, using demo mode")
    return null
  }

  try {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          "X-Client-Info": "tourist-safety-app",
        },
      },
    })
  } catch (error) {
    console.error("[v0] Failed to create Supabase client:", error)
    return null
  }
}

export { createBrowserClient as createClient }
