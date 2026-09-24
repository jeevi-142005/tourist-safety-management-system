import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const resources = await db.emergencyResource.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ resources })
  } catch (error) {
    console.error("[GET /api/admin/resources]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    const { name, type, phone, email, address, latitude, longitude, notes } = body

    if (!name || !type) return NextResponse.json({ error: "name and type are required" }, { status: 400 })

    const resource = await db.emergencyResource.create({
      data: {
        name,
        type,
        phone: phone || null,
        email: email || null,
        address: address || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        notes: notes || null,
      },
    })

    return NextResponse.json({ resource }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/resources]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    const { id, ...data } = body

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const resource = await db.emergencyResource.update({ where: { id }, data })
    return NextResponse.json({ resource })
  } catch (error) {
    console.error("[PATCH /api/admin/resources]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    await db.emergencyResource.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/admin/resources]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
