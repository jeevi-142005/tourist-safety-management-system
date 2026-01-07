"use client"

import type React from "react"
import { useEffect, useState, createContext, useContext } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

interface AuthUser {
  id: string
  email: string
  role?: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, role: "tourist" | "admin") => Promise<void>
  login: (email: string, password: string, role: "tourist" | "admin") => Promise<void>
  register: (email: string, password: string, name: string, role: "tourist" | "admin") => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEMO_USERS = {
  "tourist@demo.com": { id: "demo-tourist", email: "tourist@demo.com", role: "tourist", password: "password123" },
  "admin@demo.com": { id: "demo-admin", email: "admin@demo.com", role: "admin", password: "password123" },
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createBrowserClient())

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for stored demo user
        const storedUser = localStorage.getItem("demo-user")
        if (storedUser) {
          setUser(JSON.parse(storedUser))
          setLoading(false)
          return
        }

        if (supabase) {
          console.log("[v0] Checking Supabase session...")
          const {
            data: { user: supabaseUser },
          } = await supabase.auth.getUser()

          if (supabaseUser) {
            setUser({
              id: supabaseUser.id,
              email: supabaseUser.email || "",
              role: supabaseUser.user_metadata?.role || "tourist",
            })
          }
        }
      } catch (error) {
        console.log("[v0] Auth initialization error, using demo mode:", error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    let subscription: any
    if (supabase) {
      try {
        const {
          data: { subscription: authSubscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log("[v0] Auth state change:", { event, hasSession: !!session })

          if (session?.user) {
            const authUser = {
              id: session.user.id,
              email: session.user.email || "",
              role: session.user.user_metadata?.role || "tourist",
            }
            setUser(authUser)
            localStorage.removeItem("demo-user") // Clear demo user if real auth works
          } else {
            setUser(null)
            localStorage.removeItem("demo-user")
          }
          setLoading(false)
        })
        subscription = authSubscription
      } catch (error) {
        console.log("[v0] Auth subscription error:", error)
      }
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    console.log("[v0] Attempting sign in with:", { email })

    const demoUser = DEMO_USERS[email as keyof typeof DEMO_USERS]
    if (demoUser && demoUser.password === password) {
      const authUser = { id: demoUser.id, email: demoUser.email, role: demoUser.role }
      setUser(authUser)
      localStorage.setItem("demo-user", JSON.stringify(authUser))
      console.log("[v0] Demo sign in successful")
      return
    }

    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          throw new Error(error.message)
        }

        if (data?.user) {
          const authUser = {
            id: data.user.id,
            email: data.user.email || "",
            role: data.user.user_metadata?.role || "tourist",
          }
          setUser(authUser)
          localStorage.removeItem("demo-user")
          console.log("[v0] Supabase sign in successful")
          return
        }
      } catch (error) {
        console.log("[v0] Supabase sign in failed:", error)
      }
    }

    throw new Error("Invalid login credentials")
  }

  const signUp = async (email: string, password: string, role: "tourist" | "admin") => {
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role,
              full_name: email.split("@")[0],
            },
          },
        })

        if (error) {
          throw new Error(error.message)
        }

        console.log("[v0] Signup successful")
        return
      } catch (error) {
        console.log("[v0] Supabase signup failed:", error)
      }
    }

    console.log("[v0] Demo signup successful")
    alert("Demo signup successful! Use demo credentials to login.")
  }

  const login = async (email: string, password: string, role: "tourist" | "admin") => {
    return signIn(email, password)
  }

  const register = async (email: string, password: string, name: string, role: "tourist" | "admin") => {
    return signUp(email, password, role)
  }

  const signOut = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut()
      }
      localStorage.removeItem("demo-user")
      setUser(null)
      console.log("[v0] Sign out successful")
    } catch (error) {
      console.error("[v0] Sign out error:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, signIn, signUp, login, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
