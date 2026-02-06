import { createClient } from "@supabase/supabase-js"

export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock.supabase.co"
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "mock-key"

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn("Missing Supabase environment variables, using mock client")
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
