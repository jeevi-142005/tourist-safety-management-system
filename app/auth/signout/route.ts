import { createClient } from "@/lib/db-client/server"
import { NextResponse } from "next/server"

export async function POST() {
  const dbClient = await createClient()
  await dbClient.auth.signOut()
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"))
}
