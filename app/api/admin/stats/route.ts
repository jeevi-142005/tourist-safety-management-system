import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [
      totalTourists,
      totalDigiIds,
      activeTourists,
      activeAlerts,
      sosAlerts,
      medicalAlerts,
      unreadNotifications,
      recentAlerts,
      expiredDigiIds,
      resolvedToday,
    ] = await Promise.all([
      db.user.count({ where: { role: "tourist" } }),
      db.touristId.count(),
      db.user.count({
        where: {
          role: "tourist",
          locationTracks: { some: { timestamp: { gte: yesterday } } },
        },
      }),
      db.emergencyAlert.count({ where: { status: { in: ["active", "acknowledged", "in_progress"] } } }),
      db.emergencyAlert.count({
        where: { type: { in: ["sos", "panic"] }, status: { in: ["active", "acknowledged", "in_progress"] } },
      }),
      db.emergencyAlert.count({
        where: { type: "medical", status: { in: ["active", "acknowledged", "in_progress"] } },
      }),
      db.adminNotification.count({ where: { isRead: false } }),
      db.emergencyAlert.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { name: true, email: true } } },
      }),
      db.touristId.count({ where: { validUntil: { lt: now }, isActive: true, suspendedAt: null } }),
      db.emergencyAlert.count({ where: { status: "resolved", syncedAt: { gte: yesterday } } }),
    ])

    return NextResponse.json({
      totalTourists,
      totalDigiIds,
      activeTourists,
      activeAlerts,
      sosAlerts,
      medicalAlerts,
      expiredDigiIds,
      unreadNotifications,
      resolvedToday,
      recentAlerts: recentAlerts.map((a) => ({
        id: a.id,
        type: a.type,
        message: a.message,
        severity: a.severity,
        status: a.status,
        userName: a.userName,
        locationLat: a.locationLat,
        locationLng: a.locationLng,
        createdAt: a.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("[GET /api/admin/stats]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
