import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") // active | acknowledged | in_progress | resolved | all
    const type = searchParams.get("type") // sos | medical | emergency | all
    const severity = searchParams.get("severity")
    const userId = searchParams.get("userId")
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const limit = parseInt(searchParams.get("limit") || "50")
    const page = parseInt(searchParams.get("page") || "1")

    const where: any = {}
    if (status && status !== "all") where.status = status
    if (severity && severity !== "all") where.severity = severity
    if (userId) where.userId = userId
    if (type && type !== "all") {
      if (type === "sos") where.type = { in: ["sos", "panic"] }
      else if (type === "medical") where.type = "medical"
      else where.type = type
    }
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    const [alerts, total] = await Promise.all([
      db.emergencyAlert.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
              emergencyContact: true,
              emergencyPhone: true,
              touristIds: {
                where: { isActive: true },
                take: 1,
                select: { id: true, blockchainHash: true, documentType: true },
              },
            },
          },
        },
      }),
      db.emergencyAlert.count({ where }),
    ])

    return NextResponse.json({
      alerts: alerts.map((a) => ({
        id: a.id,
        userId: a.userId,
        userName: a.userName,
        type: a.type,
        message: a.message,
        severity: a.severity,
        status: a.status,
        locationLat: a.locationLat,
        locationLng: a.locationLng,
        createdAt: a.createdAt.toISOString(),
        syncedAt: a.syncedAt.toISOString(),
        user: a.user,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("[GET /api/admin/alerts]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH — update alert status and/or assign an emergency resource
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    const { id, status, resourceId, notes } = body

    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    const ops: Promise<any>[] = []

    if (status) {
      ops.push(db.emergencyAlert.update({ where: { id }, data: { status } }))
    }

    if (resourceId) {
      ops.push(
        db.alertAssignment.create({
          data: { alertId: id, resourceId, notes: notes || null, status: "assigned" },
        })
      )
    }

    if (ops.length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 })

    await Promise.all(ops)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PATCH /api/admin/alerts]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
