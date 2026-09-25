import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"

/**
 * GET /api/admin/reports
 * Returns resolved alerts, resolution metrics, and data for report generation
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const type = searchParams.get("type")

    const touristAlertTypes = ["emergency", "medical", "security", "assistance", "manual", "panic", "sos"]

    const where: any = {
      status: "resolved",
      type: type && type !== "all" ? type : { in: touristAlertTypes },
    }

    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    const resolvedAlerts = await db.emergencyAlert.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            emergencyContact: true,
            emergencyPhone: true,
          },
        },
      },
    })

    const alertIds = resolvedAlerts.map((a) => a.id)
    const assignments = await db.alertAssignment.findMany({
      where: { alertId: { in: alertIds } },
      include: { resource: true },
      orderBy: { assignedAt: "desc" },
    })

    const assignmentMap: Record<string, any[]> = {}
    for (const asg of assignments) {
      if (!assignmentMap[asg.alertId]) assignmentMap[asg.alertId] = []
      assignmentMap[asg.alertId].push({
        id: asg.id,
        resourceName: asg.resource?.name || "Emergency Unit",
        resourceType: asg.resource?.type || "emergency",
        resourcePhone: asg.resource?.phone || null,
        assignedAt: asg.assignedAt.toISOString(),
        status: asg.status,
        notes: asg.notes,
      })
    }

    // Calculate metrics
    const totalResolved = resolvedAlerts.length
    const byType: Record<string, number> = {}
    const bySeverity: Record<string, number> = {}

    for (const alert of resolvedAlerts) {
      byType[alert.type] = (byType[alert.type] || 0) + 1
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalResolved,
        byType,
        bySeverity,
        generatedAt: new Date().toISOString(),
        generatedBy: (session.user as any).name || (session.user as any).email,
      },
      alerts: resolvedAlerts.map((a) => ({
        id: a.id,
        userId: a.userId,
        userName: a.userName || a.user?.name || "Tourist",
        userEmail: a.user?.email,
        userPhone: a.user?.phone || a.user?.emergencyPhone,
        type: a.type,
        message: a.message,
        severity: a.severity,
        status: a.status,
        locationLat: a.locationLat,
        locationLng: a.locationLng,
        createdAt: a.createdAt.toISOString(),
        deviceInfo: a.deviceInfo,
        assignments: assignmentMap[a.id] || [],
      })),
    })
  } catch (error: any) {
    console.error("[GET /api/admin/reports]", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
