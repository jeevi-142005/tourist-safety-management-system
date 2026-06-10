import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { executeDbQuery } from "@/lib/db-client/db-executor"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const params = await request.json()
    const { table, action } = params

    if (!table || !action) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const data = await executeDbQuery(params)
    return NextResponse.json({ data })
  } catch (error: any) {
    console.error("Database proxy route error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
