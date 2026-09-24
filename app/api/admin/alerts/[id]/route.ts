import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const body = await request.json()
    const { status, resourceId, notes } = body

    const validStatuses = ["active", "acknowledged", "in_progress", "resolved"]
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const updated = await db.emergencyAlert.update({
      where: { id },
      data: { ...(status ? { status } : {}) },
    })

    // If a resource is being assigned, create an AlertAssignment
    if (resourceId) {
      await db.alertAssignment.create({
        data: { alertId: id, resourceId, notes: notes || null },
      })
    }

    // Create admin notification for status changes
    if (status === "acknowledged" || status === "resolved") {
      await db.adminNotification.create({
        data: {
          type: "alert_status_update",
          title: `Alert ${status}`,
          message: `Alert for ${updated.userName} has been ${status}`,
          severity: "info",
          userId: updated.userId,
        },
      })
    }

    return NextResponse.json({ success: true, alert: { id: updated.id, status: updated.status } })
  } catch (error) {
    console.error("[PATCH /api/admin/alerts/[id]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params

    const alert = await db.emergencyAlert.findUnique({
      where: { id },
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
            },
            locationTracks: {
              orderBy: { timestamp: "desc" },
              take: 1,
            },
          },
        },
      },
    })

    if (!alert) return NextResponse.json({ error: "Alert not found" }, { status: 404 })

    const assignments = await db.alertAssignment.findMany({
      where: { alertId: id },
      include: { resource: true },
      orderBy: { assignedAt: "desc" },
    })

    return NextResponse.json({
      alert: {
        id: alert.id,
        userId: alert.userId,
        userName: alert.userName,
        type: alert.type,
        message: alert.message,
        severity: alert.severity,
        status: alert.status,
        locationLat: alert.locationLat,
        locationLng: alert.locationLng,
        createdAt: alert.createdAt.toISOString(),
        user: alert.user,
        assignments,
      },
    })
  } catch (error) {
    console.error("[GET /api/admin/alerts/[id]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
