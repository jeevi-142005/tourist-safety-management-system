import { NextResponse } from "next/server"

export async function POST() {
  // The actual signout is handled client-side via next-auth/react's signOut()
  // This route just provides a fallback redirect endpoint
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
  return NextResponse.redirect(new URL("/", baseUrl))
}

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
  return NextResponse.redirect(new URL("/", baseUrl))
}
