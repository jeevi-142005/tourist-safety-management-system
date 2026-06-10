import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcrypt"

export async function POST(request: Request) {
  try {
    const { email, password, name, role } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required fields" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10)

    // Generate a blockchain ID for tourists
    const blockchainId = role === "tourist" 
      ? "BLK-" + Math.random().toString(36).substring(2, 11).toUpperCase() 
      : null

    // Create user in the database
    const user = await db.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: role || "tourist",
        blockchainId,
      }
    })

    // Return the created user without the password hash
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        blockchainId: user.blockchainId,
        createdAt: user.createdAt
      }
    })
  } catch (error: any) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred during registration" },
      { status: 500 }
    )
  }
}
