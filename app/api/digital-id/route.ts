import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"

// GET /api/digital-id — fetch the current user's digital tourist IDs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id as string
    if (!userId) {
      return NextResponse.json({ error: "User ID not found in session" }, { status: 401 })
    }

    const touristIds = await db.touristId.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    // Serialize to snake_case for the existing frontend interface
    const data = touristIds.map((t) => ({
      id: t.id,
      user_id: t.userId,
      document_type: t.documentType,
      document_number: t.documentNumber,
      valid_from: t.validFrom.toISOString(),
      valid_until: t.validUntil.toISOString(),
      blockchain_hash: t.blockchainHash,
      qr_code_data: t.qrCodeData || "",
      is_active: t.isActive,
      created_at: t.createdAt.toISOString(),
      emergency_contact_name: t.emergencyContactName,
      emergency_contact_phone: t.emergencyContactPhone,
      trip_start_date: t.tripStartDate?.toISOString() ?? null,
      trip_end_date: t.tripEndDate?.toISOString() ?? null,
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Digital ID fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/digital-id?id=<id> — deactivate a digital tourist ID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing ID parameter" }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id as string

    // Verify ownership before deactivating
    const existing = await db.touristId.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: "Digital ID not found" }, { status: 404 })
    }

    await db.touristId.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Digital ID deactivation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
