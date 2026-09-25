import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"

/**
 * POST /api/admin/auto-triage
 * Fully automated: scans all active unassigned alerts and auto-dispatches
 * the best available emergency resource. Admin does ZERO manual work here.
 */
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    // Find all active/unresolved alerts
    const activeAlerts = await db.emergencyAlert.findMany({
      where: {
        status: { in: ["active", "acknowledged", "assistance_requested"] },
      },
      include: {
        user: { select: { name: true, email: true, phone: true } },
      },
      orderBy: [{ status: "asc" }, { severity: "asc" }, { createdAt: "asc" }],
    })

    if (activeAlerts.length === 0) {
      return NextResponse.json({ success: true, dispatched: 0, message: "No active alerts require dispatch." })
    }

    // Get all existing assignments for these alerts
    const alertIds = activeAlerts.map((a) => a.id)
    const existingAssignments = await db.alertAssignment.findMany({
      where: { alertId: { in: alertIds } },
      select: { alertId: true },
    })
    const assignedAlertIds = new Set(existingAssignments.map((a) => a.alertId))

    // Filter alerts that don't have an assignment yet
    const needsDispatch = activeAlerts.filter((a) => !assignedAlertIds.has(a.id))

    if (needsDispatch.length === 0) {
      return NextResponse.json({ success: true, dispatched: 0, message: "All active alerts are already assigned." })
    }

    const availableResources = await db.emergencyResource.findMany({
      where: { isAvailable: true },
      orderBy: { updatedAt: "asc" },
    })

    const dispatched: { alertId: string; resourceName: string; alertType: string; userName: string }[] = []
    const usedResourceIds = new Set<string>()

    for (const alert of needsDispatch) {
      let preferredType = "ambulance"
      const atype = alert.type.toLowerCase()
      if (["sos", "panic", "emergency", "abnormal_area", "disaster_alert"].includes(atype)) {
        preferredType = "police"
      } else if (["medical"].includes(atype)) {
        preferredType = "ambulance"
      } else if (["security"].includes(atype)) {
        preferredType = "security"
      } else if (["weather_hazard", "flash_flood", "landslide"].includes(atype)) {
        preferredType = "fire"
      }

      const resource =
        availableResources.find((r) => r.type === preferredType && !usedResourceIds.has(r.id)) ||
        availableResources.find((r) => !usedResourceIds.has(r.id))

      if (!resource) continue

      usedResourceIds.add(resource.id)

      const existingDeviceInfo = (typeof alert.deviceInfo === "object" && alert.deviceInfo !== null ? alert.deviceInfo : {}) as Record<string, unknown>

      await Promise.all([
        db.alertAssignment.create({
          data: {
            alertId: alert.id,
            resourceId: resource.id,
            notes: `Auto-triaged by AI Dispatch Engine. Alert type: ${alert.type.toUpperCase()}. Priority: ${alert.severity.toUpperCase()}.`,
            status: "assigned",
          },
        }),
        db.emergencyAlert.update({
          where: { id: alert.id },
          data: {
            status: "in_progress",
            deviceInfo: {
              ...existingDeviceInfo,
              autoTriaged: true,
              autoTriagedAt: new Date().toISOString(),
              assignedResourceId: resource.id,
              assignedResourceName: resource.name,
              assignedResourceType: resource.type,
              assignedResourcePhone: resource.phone,
            },
          },
        }),
        db.adminNotification.create({
          data: {
            type: "auto_triage_dispatch",
            title: `Auto-Dispatched: ${resource.name} to ${alert.userName}`,
            message: `AI Dispatch Engine auto-assigned ${resource.name} (${resource.phone || "Emergency Line"}) to ${alert.type.toUpperCase()} alert from ${alert.userName}. No manual intervention required.`,
            severity: alert.severity,
            userId: alert.userId,
            metadata: {
              alertId: alert.id,
              resourceId: resource.id,
              resourceName: resource.name,
              alertType: alert.type,
            },
          },
        }),
        db.emergencyResource.update({
          where: { id: resource.id },
          data: { isAvailable: false },
        }),
      ])

      dispatched.push({
        alertId: alert.id,
        resourceName: resource.name,
        alertType: alert.type,
        userName: alert.userName,
      })
    }

    return NextResponse.json({
      success: true,
      dispatched: dispatched.length,
      skipped: needsDispatch.length - dispatched.length,
      assignments: dispatched,
      message: `Auto-triage complete: ${dispatched.length} alert(s) dispatched, ${needsDispatch.length - dispatched.length} could not be assigned (no available resources).`,
    })
  } catch (error: any) {
    console.error("[POST /api/admin/auto-triage]", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

/**
 * GET /api/admin/auto-triage
 * Returns count of unassigned active alerts (used for admin dashboard indicator)
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const activeAlerts = await db.emergencyAlert.findMany({
      where: {
        status: { in: ["active", "acknowledged", "assistance_requested"] },
      },
      select: { id: true, status: true },
    })

    const alertIds = activeAlerts.map((a) => a.id)
    const existingAssignments = await db.alertAssignment.findMany({
      where: { alertId: { in: alertIds } },
      select: { alertId: true },
    })
    const assignedAlertIds = new Set(existingAssignments.map((a) => a.alertId))

    const unassignedCount = activeAlerts.filter((a) => !assignedAlertIds.has(a.id)).length
    const assistanceRequestedCount = activeAlerts.filter((a) => a.status === "assistance_requested").length
    const totalActiveCount = activeAlerts.length

    return NextResponse.json({
      unassignedAlerts: unassignedCount,
      assistanceRequested: assistanceRequestedCount,
      totalActive: totalActiveCount,
      needsAutoTriage: unassignedCount > 0 || assistanceRequestedCount > 0,
    })
  } catch (error: any) {
    console.error("[GET /api/admin/auto-triage]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
