import { db, type User } from "@/lib/database"

// Generate blockchain ID
export function generateBlockchainId(): string {
  return "BLK-" + Math.random().toString(36).substr(2, 9).toUpperCase()
}

// Local storage utilities for session management
export const authStorage = {
  setUser: (user: User) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tourist-safety-user", JSON.stringify(user))
    }
  },

  getUser: (): User | null => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("tourist-safety-user")
      return user ? JSON.parse(user) : null
    }
    return null
  },

  removeUser: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("tourist-safety-user")
    }
  },

  logoutUser: () => {
    authStorage.removeUser()
  },
}

// Authentication functions using database service
export async function loginUser(email: string, password: string, role: "tourist" | "admin"): Promise<User | null> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Mock validation - in real app, this would be server-side
  if (password.length < 6) {
    throw new Error("Invalid credentials")
  }

  // Check if user exists in database
  let user = await db.getUserByEmail(email)

  if (!user) {
    // Create new user if doesn't exist (for demo purposes)
    user = await db.createUser({
      email,
      name: email.split("@")[0],
      role,
      blockchainId: role === "tourist" ? generateBlockchainId() : undefined,
    })
  }

  // Verify role matches
  if (user.role !== role) {
    throw new Error("Invalid role for this user")
  }

  authStorage.setUser(user)
  return user
}

export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: "tourist" | "admin",
): Promise<User> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Check if user already exists
  const existingUser = await db.getUserByEmail(email)
  if (existingUser) {
    throw new Error("User already exists")
  }

  // Create new user in database
  const user = await db.createUser({
    email,
    name,
    role,
    blockchainId: role === "tourist" ? generateBlockchainId() : undefined,
  })

  authStorage.setUser(user)
  return user
}

export function logoutUser() {
  authStorage.removeUser()
}

// Re-export types from database
export type { User, Alert } from "@/lib/database"
