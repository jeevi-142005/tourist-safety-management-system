import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"

const RESOURCE_TYPES = ["ambulance", "police", "fire", "hospital", "security", "guide"]

// Map resource role to alert types it specializes in
const ROLE_ALERT_TYPES: Record<string, string[]> = {
  guide: ["assistance", "guide", "general", "tourist_help", "emergency", "sos", "panic", "manual", "medical", "security", "hazard"],
  ambulance: ["medical", "emergency", "sos", "panic", "ambulance", "injury"],
  police: ["sos", "panic", "emergency", "security", "abnormal_area", "danger_zone", "police", "crime"],
  security: ["security", "sos", "emergency", "panic", "abnormal_area", "patrol"],
  fire: ["fire", "weather_hazard", "flood", "landslide", "emergency"],
  hospital: ["medical", "emergency", "sos"],
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user as any
    const userRole = user.role || "ambulance"
    const effectiveType = RESOURCE_TYPES.includes(userRole) ? userRole : "ambulance"

    // 1. Identify or create the UNIQUE EmergencyResource record for THIS specific user
    let resourceRecord = await db.emergencyResource.findFirst({
      where: {
        email: user.email,
      },
    })

    if (!resourceRecord && user.email) {
      resourceRecord = await db.emergencyResource.create({
        data: {
          name: user.name || `${effectiveType.toUpperCase()} Unit - ${user.email.split("@")[0]}`,
          type: effectiveType,
          email: user.email,
          phone: user.phone || "+91 94421 10800",
          isAvailable: true,
          notes: "Registered resource terminal",
        },
      })
    }

    if (!resourceRecord) {
      return NextResponse.json({ error: "Resource profile not found" }, { status: 404 })
    }

    // 2. Check if THIS resource already has an active (non-resolved) alert assigned
    const activeAssignments = await db.alertAssignment.findMany({
      where: {
        resourceId: resourceRecord.id,
        status: { in: ["assigned", "en_route", "on_scene"] },
      },
      select: { alertId: true, status: true },
    })

    const activeAlertIdsForThisResource = activeAssignments.map((a) => a.alertId)

    // Check if any of these assigned alerts are still unresolved in the database
    const activeOngoingAlerts = activeAlertIdsForThisResource.length > 0
      ? await db.emergencyAlert.findMany({
          where: {
            id: { in: activeAlertIdsForThisResource },
            status: { notIn: ["resolved", "closed", "cancelled"] },
          },
          select: { id: true },
        })
      : []

    const hasActiveMission = activeOngoingAlerts.length > 0

    // 3. 1-to-1 AUTO-QUEUE DISPATCH:
    // If THIS resource is currently FREE (has no active mission), find at most ONE unassigned pending alert
    // matching this resource specialty, and lock it to THIS resource!
    if (!hasActiveMission) {
      // Find all alert IDs that already have an active assignment to ANY resource
      const allActiveAssignments = await db.alertAssignment.findMany({
        where: {
          status: { in: ["assigned", "en_route", "on_scene"] },
        },
        select: { alertId: true },
      })
      const alreadyAssignedAlertIds = allActiveAssignments.map((a) => a.alertId)

      const relevantTypes = ROLE_ALERT_TYPES[effectiveType] || ["emergency", "sos"]

      // Find the earliest unassigned pending alert matching this specialty
      const nextUnassignedAlert = await db.emergencyAlert.findFirst({
        where: {
          id: { notIn: alreadyAssignedAlertIds },
          status: { in: ["active", "assistance_requested", "pending", "in_progress"] },
          type: { in: relevantTypes },
        },
        orderBy: [{ createdAt: "asc" }],
      })

      if (nextUnassignedAlert) {
        // Exclusively assign this ONE alert to this resource!
        await db.alertAssignment.create({
          data: {
            alertId: nextUnassignedAlert.id,
            resourceId: resourceRecord.id,
            status: "assigned",
            notes: `Auto-routed 1-to-1 dispatch to ${resourceRecord.name}`,
          },
        })

        const existingDeviceInfo = (typeof nextUnassignedAlert.deviceInfo === "object" && nextUnassignedAlert.deviceInfo !== null)
          ? (nextUnassignedAlert.deviceInfo as Record<string, any>)
          : {}

        await db.emergencyAlert.update({
          where: { id: nextUnassignedAlert.id },
          data: {
            deviceInfo: {
              ...existingDeviceInfo,
              assignedResourceId: resourceRecord.id,
              assignedResourceName: resourceRecord.name,
              assignedResourceType: resourceRecord.type,
              assignedResourcePhone: resourceRecord.phone,
              routedTo: resourceRecord.email,
            },
          },
        })

        // Mark this resource as busy
        await db.emergencyResource.update({
          where: { id: resourceRecord.id },
          data: { isAvailable: false },
        })
      }
    }

    // 4. Fetch EXCLUSIVELY the alerts assigned to THIS resource (active incoming, en_route, and completed)
    const myAssignments = await db.alertAssignment.findMany({
      where: { resourceId: resourceRecord.id },
      include: { resource: true },
      orderBy: { assignedAt: "desc" },
    })

    const myAlertIds = myAssignments.map((a) => a.alertId)

    const alerts = await db.emergencyAlert.findMany({
      where: {
        id: { in: myAlertIds },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            emergencyContact: true,
            emergencyPhone: true,
          },
        },
      },
    })

    const asgMap = new Map<string, any>()
    for (const asg of myAssignments) {
      if (!asgMap.has(asg.alertId)) {
        asgMap.set(asg.alertId, asg)
      }
    }

    const formattedAlerts = alerts.map((a) => {
      const asg = asgMap.get(a.id)
      return {
        id: a.id,
        userName: a.userName || a.user?.name || "Tourist in Distress",
        type: a.type,
        message: a.message,
        severity: a.severity || "high",
        status: a.status,
        locationLat: a.locationLat,
        locationLng: a.locationLng,
        deviceInfo: a.deviceInfo,
        createdAt: a.createdAt.toISOString(),
        user: a.user,
        assignment: asg
          ? {
              id: asg.id,
              status: asg.status,
              assignedAt: asg.assignedAt.toISOString(),
              resourceName: asg.resource?.name || resourceRecord.name,
              resourceType: asg.resource?.type || effectiveType,
              resourcePhone: asg.resource?.phone || resourceRecord.phone,
              notes: asg.notes,
            }
          : null,
      }
    })

    return NextResponse.json({
      success: true,
      resource: resourceRecord,
      hasActiveMission: hasActiveMission,
      alerts: formattedAlerts,
    })
  } catch (error: any) {
    console.error("[GET /api/resource/alerts] Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user as any
    const userRole = user.role || "ambulance"
    const body = await request.json()
    const { alertId, action, notes } = body // action: "accept" | "complete"

    if (!alertId || !action) {
      return NextResponse.json({ error: "alertId and action are required" }, { status: 400 })
    }

    const alert = await db.emergencyAlert.findUnique({
      where: { id: alertId },
      include: { user: true },
    })

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 })
    }

    // Find this specific resource record
    const resourceRecord = await db.emergencyResource.findFirst({
      where: { email: user.email },
    })

    const responderName = resourceRecord?.name || user.name || `${userRole.toUpperCase()} Responder`
    const currentDeviceInfo = (typeof alert.deviceInfo === "object" && alert.deviceInfo !== null)
      ? (alert.deviceInfo as Record<string, any>)
      : {}

    if (action === "accept") {
      // 1. Mark alert as in_progress
      const updatedAlert = await db.emergencyAlert.update({
        where: { id: alertId },
        data: {
          status: "in_progress",
          deviceInfo: {
            ...currentDeviceInfo,
            assignedResourceName: responderName,
            assignedResourceType: userRole,
            enRouteAt: new Date().toISOString(),
            enRouteBy: responderName,
            touristStatus: "assistance_en_route",
          },
        },
      })

      // 2. Update AlertAssignment
      if (resourceRecord) {
        await db.alertAssignment.updateMany({
          where: { alertId, resourceId: resourceRecord.id },
          data: {
            status: "en_route",
            notes: notes || `Unit ${responderName} accepted mission and is en route.`,
          },
        })

        // Mark resource as busy
        await db.emergencyResource.update({
          where: { id: resourceRecord.id },
          data: { isAvailable: false },
        })
      }

      // 3. Notify Admin Command Center
      try {
        await db.adminNotification.create({
          data: {
            type: "mission_accepted",
            title: `En Route: ${responderName} to ${alert.userName || "Tourist"}`,
            message: `${responderName} accepted distress call (${alert.type.toUpperCase()}) and is currently responding to coordinates [${alert.locationLat || 11.0159}, ${alert.locationLng || 76.9368}].`,
            severity: "info",
            userId: alert.userId,
            metadata: { alertId, responderName, action: "accept" },
          },
        })
      } catch (e) {
        console.warn("Notification create skipped:", e)
      }

      return NextResponse.json({ success: true, status: "in_progress", alert: updatedAlert })
    }

    if (action === "complete") {
      // 1. Mark alert as resolved
      const updatedAlert = await db.emergencyAlert.update({
        where: { id: alertId },
        data: {
          status: "resolved",
          deviceInfo: {
            ...currentDeviceInfo,
            resolvedAt: new Date().toISOString(),
            resolvedBy: responderName,
            touristStatus: "safe_confirmed",
          },
        },
      })

      // 2. Update AlertAssignment status to completed
      if (resourceRecord) {
        await db.alertAssignment.updateMany({
          where: { alertId, resourceId: resourceRecord.id },
          data: {
            status: "completed",
            notes: notes || `Mission completed on scene by ${responderName}. Tourist assisted and safe.`,
          },
        })

        // 3. CRUCIAL: Free this resource so they can be assigned the next tourist alert!
        await db.emergencyResource.update({
          where: { id: resourceRecord.id },
          data: { isAvailable: true },
        })
      }

      // 4. Notify Admin Command Center
      try {
        await db.adminNotification.create({
          data: {
            type: "mission_completed",
            title: `Mission Completed: ${alert.userName || "Tourist"} Resolved`,
            message: `${responderName} completed emergency response for ${alert.userName || "Tourist"}. Unit is now available for next assignment.`,
            severity: "info",
            userId: alert.userId,
            metadata: { alertId, responderName, action: "complete" },
          },
        })
      } catch (e) {
        console.warn("Notification create skipped:", e)
      }

      return NextResponse.json({ success: true, status: "resolved", alert: updatedAlert })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("[PATCH /api/resource/alerts] Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
