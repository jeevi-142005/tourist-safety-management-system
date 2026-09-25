import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        emergencyContact: true,
        emergencyPhone: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error: any) {
    console.error("[GET /api/admin/profile]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { name, phone, emergencyContact, emergencyPhone } = body

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(emergencyContact !== undefined && { emergencyContact }),
        ...(emergencyPhone !== undefined && { emergencyPhone }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        emergencyContact: true,
        emergencyPhone: true,
        role: true,
      },
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error: any) {
    console.error("[PATCH /api/admin/profile]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
