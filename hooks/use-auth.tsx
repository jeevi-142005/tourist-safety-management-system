"use client"

import type React from "react"
import { useEffect, useState, createContext, useContext } from "react"
import { 
  SessionProvider, 
  useSession, 
  signIn as nextAuthSignIn, 
  signOut as nextAuthSignOut 
} from "next-auth/react"

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

function AuthContextSubProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") {
      setLoading(true)
    } else {
      if (session?.user) {
        setUser({
          id: (session.user as any).id || "",
          email: session.user.email || "",
          role: (session.user as any).role || "tourist",
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    }
  }, [session, status])

  const signIn = async (email: string, password: string, role?: string) => {
    console.log("[NextAuth] Attempting sign in with:", { email, role })
    
    const res = await nextAuthSignIn("credentials", {
      redirect: false,
      email,
      password,
      role,
    })

    if (res?.error) {
      throw new Error(res.error || "Invalid login credentials")
    }

    console.log("[NextAuth] Sign in successful")
  }

  const register = async (email: string, password: string, name: string, role: "tourist" | "admin") => {
    console.log("[NextAuth] Attempting registration with:", { email, name, role })
    
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, role }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || "Registration failed")
    }

    console.log("[NextAuth] Registration successful, logging in...")
    
    // Automatically sign in the user after successful registration
    await signIn(email, password, role)
  }

  const signUp = async (email: string, password: string, role: "tourist" | "admin") => {
    return register(email, password, email.split("@")[0], role)
  }

  const login = async (email: string, password: string, role: "tourist" | "admin") => {
    return signIn(email, password, role)
  }

  const signOut = async () => {
    try {
      await nextAuthSignOut({ redirect: false })
      console.log("[NextAuth] Sign out successful")
    } catch (error) {
      console.error("[NextAuth] Sign out error:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, signIn, signUp, login, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextSubProvider>{children}</AuthContextSubProvider>
    </SessionProvider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
