import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userRole = (session.user as any).role
    const allowedRoles = ["admin", "ambulance", "police", "fire", "hospital", "security", "guide"]
    if (!allowedRoles.includes(userRole)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") // active | acknowledged | in_progress | resolved | all
    const type = searchParams.get("type") // sos | medical | emergency | all
    const severity = searchParams.get("severity")
    const userId = searchParams.get("userId")
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const limit = parseInt(searchParams.get("limit") || "50")
    const page = parseInt(searchParams.get("page") || "1")

    const excludeAnomalies = searchParams.get("includeAnomalies") !== "true"
    const touristAlertTypes = [
      "emergency",
      "medical",
      "security",
      "assistance",
      "manual",
      "panic",
      "sos",
      "guide",
      "tourist_help",
      "general",
      "hazard"
    ]

    const where: any = {}
    if (status && status !== "all") where.status = status
    if (severity && severity !== "all") where.severity = severity
    if (userId) where.userId = userId

    if (type && type !== "all") {
      if (type === "sos") where.type = { in: ["sos", "panic"] }
      else if (type === "medical") where.type = "medical"
      else where.type = type
    } else if (excludeAnomalies) {
      // By default: ONLY show alerts received from tourists (exclude anomaly/automated hazards)
      where.type = { in: touristAlertTypes }
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

    // Query assignments for these alerts to get dispatched resources
    const alertIds = alerts.map((a) => a.id)
    const assignments = await db.alertAssignment.findMany({
      where: { alertId: { in: alertIds } },
      include: {
        resource: true,
      },
      orderBy: { assignedAt: "desc" },
    })

    const assignmentMap: Record<string, any[]> = {}
    for (const asg of assignments) {
      if (!assignmentMap[asg.alertId]) assignmentMap[asg.alertId] = []
      assignmentMap[asg.alertId].push({
        id: asg.id,
        resourceId: asg.resourceId,
        resourceName: asg.resource?.name || "Emergency Unit",
        resourceType: asg.resource?.type || "emergency",
        resourcePhone: asg.resource?.phone || null,
        assignedAt: asg.assignedAt.toISOString(),
        status: asg.status,
        notes: asg.notes,
      })
    }

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
        deviceInfo: a.deviceInfo,
        createdAt: a.createdAt.toISOString(),
        syncedAt: a.syncedAt.toISOString(),
        user: a.user,
        assignments: assignmentMap[a.id] || [],
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

// PATCH — update alert status, auto-dispatch emergency resource, or auto-resolve safe
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userRole = (session.user as any).role
    const allowedRoles = ["admin", "ambulance", "police", "fire", "hospital", "security", "guide"]
    if (!allowedRoles.includes(userRole)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    const { id, status, resourceId, notes, autoResolveSafe, autoDispatch } = body

    // Bulk auto-resolve all incidents where tourist confirmed safe
    if (autoResolveSafe) {
      const activeAlerts = await db.emergencyAlert.findMany({
        where: { status: { in: ["active", "acknowledged"] } },
        select: { id: true, deviceInfo: true },
      })
      const toResolveIds = activeAlerts
        .filter((a) => (a.deviceInfo as any)?.touristStatus === "safe_confirmed")
        .map((a) => a.id)

      if (toResolveIds.length > 0) {
        await db.emergencyAlert.updateMany({
          where: { id: { in: toResolveIds } },
          data: { status: "resolved" },
        })
        await db.alertAssignment.updateMany({
          where: { alertId: { in: toResolveIds } },
          data: { status: "completed" },
        })
      }
      return NextResponse.json({ success: true, count: toResolveIds.length })
    }

    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    const ops: Promise<any>[] = []

    const newStatus = autoDispatch ? "in_progress" : status

    if (newStatus) {
      ops.push(db.emergencyAlert.update({ where: { id }, data: { status: newStatus } }))
      if (newStatus === "resolved") {
        ops.push(db.alertAssignment.updateMany({ where: { alertId: id }, data: { status: "completed" } }))
      } else if (newStatus === "in_progress") {
        ops.push(db.alertAssignment.updateMany({ where: { alertId: id }, data: { status: "en_route" } }))
      }
    }

    if (resourceId) {
      ops.push(
        db.alertAssignment.create({
          data: { alertId: id, resourceId, notes: notes || (autoDispatch ? "Auto-dispatched via AI Hazard Engine" : null), status: "assigned" },
        })
      )
    }

    if (ops.length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 })

    await Promise.all(ops)
    return NextResponse.json({ success: true, status: newStatus })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
