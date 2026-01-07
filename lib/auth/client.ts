"use client"

interface AuthResponse {
  access_token?: string
  refresh_token?: string
  user?: any
  error?: string
}

class SimpleSupabaseClient {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    this.apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  }

  async signUp(email: string, password: string, metadata?: any): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/v1/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: this.apiKey,
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          email,
          password,
          data: metadata,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.msg || data.error_description || "Registration failed" }
      }

      return data
    } catch (error) {
      console.error("Sign up error:", error)
      return { error: "Network error during registration" }
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: this.apiKey,
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.msg || data.error_description || "Login failed" }
      }

      // Store tokens in localStorage
      if (data.access_token) {
        localStorage.setItem("sb-access-token", data.access_token)
        localStorage.setItem("sb-refresh-token", data.refresh_token)

        // Also set cookies for server-side access
        document.cookie = `sb-access-token=${data.access_token}; path=/; max-age=3600; secure; samesite=lax`
        document.cookie = `sb-refresh-token=${data.refresh_token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=lax`
      }

      return data
    } catch (error) {
      console.error("Sign in error:", error)
      return { error: "Network error during login" }
    }
  }

  async signOut(): Promise<void> {
    try {
      const token = localStorage.getItem("sb-access-token")

      if (token) {
        await fetch(`${this.baseUrl}/auth/v1/logout`, {
          method: "POST",
          headers: {
            apikey: this.apiKey,
            Authorization: `Bearer ${token}`,
          },
        })
      }
    } catch (error) {
      console.error("Sign out error:", error)
    } finally {
      // Clear local storage and cookies
      localStorage.removeItem("sb-access-token")
      localStorage.removeItem("sb-refresh-token")
      document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
      document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
    }
  }

  async getUser(): Promise<any> {
    try {
      const token = localStorage.getItem("sb-access-token")

      if (!token) {
        return { user: null }
      }

      const response = await fetch(`${this.baseUrl}/auth/v1/user`, {
        headers: {
          apikey: this.apiKey,
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        return { user: null }
      }

      const data = await response.json()
      return { user: data }
    } catch (error) {
      console.error("Get user error:", error)
      return { user: null }
    }
  }
}

export const supabaseClient = new SimpleSupabaseClient()
