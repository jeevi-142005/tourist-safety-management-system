import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// GET /api/alerts/user?type=all|sent|received
// Returns the current user's alerts, split into sent (manual) and received (geofence/auto)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "all" // all | sent | received
    const limit = parseInt(searchParams.get("limit") || "50")
    const page = parseInt(searchParams.get("page") || "1")
    const skip = (page - 1) * limit

    // All manual/user-initiated alerts — any type that is NOT geofence/auto
    const manualTypes = ["emergency", "medical", "security", "assistance", "manual", "panic", "sos"]
    // Automatic/geofence types
    const autoTypes = ["geofence", "geofence_entry", "geofence_exit", "zone_violation", "unusual_location", "danger_zone", "risk_zone"]

    let sentAlerts: any[] = []
    let receivedAlerts: any[] = []
    let sentTotal = 0
    let receivedTotal = 0

    if (type === "all" || type === "sent") {
      // Fetch sent alerts (manually triggered by the user)
      const [alerts, count] = await Promise.all([
        db.emergencyAlert.findMany({
          where: {
            userId,
            type: { in: manualTypes }
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        db.emergencyAlert.count({
          where: {
            userId,
            type: { in: manualTypes }
          }
        })
      ])
      sentAlerts = alerts
      sentTotal = count
    }

    if (type === "all" || type === "received") {
      // Fetch received alerts (automatic hazard/disaster/geofence/system triggers)
      const [alerts, count] = await Promise.all([
        db.emergencyAlert.findMany({
          where: {
            userId,
            type: { notIn: manualTypes }
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        db.emergencyAlert.count({
          where: {
            userId,
            type: { notIn: manualTypes }
          }
        })
      ])
      receivedAlerts = alerts
      receivedTotal = count
    }

    // Fetch assignments for all user alerts to show dispatched resource info
    const allAlertIds = [...sentAlerts.map((a) => a.id), ...receivedAlerts.map((a) => a.id)]
    const assignments = allAlertIds.length > 0
      ? await db.alertAssignment.findMany({
          where: { alertId: { in: allAlertIds } },
          include: { resource: true },
          orderBy: { assignedAt: "desc" },
        })
      : []

    const asgMap = new Map<string, any[]>()
    for (const asg of assignments) {
      if (!asgMap.has(asg.alertId)) asgMap.set(asg.alertId, [])
      asgMap.get(asg.alertId)!.push({
        id: asg.id,
        status: asg.status,
        resourceName: asg.resource?.name || "Emergency Unit",
        resourceType: asg.resource?.type || "emergency",
        resourcePhone: asg.resource?.phone || null,
      })
    }

    // Serialize BigInt & Date fields to JSON-safe values
    const serialize = (alerts: any[]) =>
      alerts.map((alert) => ({
        id: alert.id,
        user_id: alert.userId,
        user_name: alert.userName,
        type: alert.type,
        message: alert.message,
        severity: alert.severity,
        location_lat: alert.locationLat,
        location_lng: alert.locationLng,
        status: alert.status,
        device_info: alert.deviceInfo,
        assignments: asgMap.get(alert.id) || [],
        created_at: alert.createdAt?.toISOString() ?? null,
        synced_at: alert.syncedAt?.toISOString() ?? null,
      }))

    return NextResponse.json({
      success: true,
      sent: {
        alerts: serialize(sentAlerts),
        total: sentTotal,
      },
      received: {
        alerts: serialize(receivedAlerts),
        total: receivedTotal,
      },
      page,
      limit,
    })
  } catch (error: any) {
    console.error("[GET /api/alerts/user] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/alerts/user — save a new manual alert from the tourist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const userName = session.user.name || session.user.email?.split("@")[0] || "Tourist"

    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 })
    }

    const body = await request.json()
    const {
      type,
      message,
      severity,
      location_lat,
      location_lng,
      device_info,
    } = body

    if (!type || !message) {
      return NextResponse.json(
        { error: "type and message are required" },
        { status: 400 }
      )
    }

    // Verify that the tourist has verified their Digital Tourist ID
    const verifiedToken = body.verified_token || request.headers.get("x-digital-id")
    let isIdVerified = false
    if (verifiedToken) {
      const idRecord = await db.touristId.findFirst({
        where: { blockchainHash: String(verifiedToken), isActive: true }
      })
      if (idRecord && new Date(idRecord.validUntil) >= new Date()) {
        isIdVerified = true
      }
    }
    if (!isIdVerified) {
      const userTouristId = await db.touristId.findFirst({
        where: { userId, isActive: true }
      })
      if (userTouristId && new Date(userTouristId.validUntil) >= new Date()) {
        isIdVerified = true
      }
    }

    if (!isIdVerified) {
      return NextResponse.json(
        { error: "Verification required: You must verify your admin-issued Digital Tourist ID before sending alerts." },
        { status: 403 }
      )
    }

    // AUTO-ASSIGN EMERGENCY RESOURCE (1-to-1 Load Balancing)
    let targetResourceType = "guide"
    const atype = String(type).toLowerCase()
    if (["medical", "hospital", "injury"].includes(atype)) {
      targetResourceType = "ambulance"
    } else if (["fire", "flood", "disaster", "landslide"].includes(atype)) {
      targetResourceType = "fire"
    } else if (["police", "robbery", "theft", "crime"].includes(atype)) {
      targetResourceType = "police"
    } else if (["security", "patrol"].includes(atype)) {
      targetResourceType = "security"
    } else {
      // Prioritize Guide for general emergency, SOS, panic, assistance, and guide requests
      targetResourceType = "guide"
    }

    // Find the next free resource of the requested specialty
    const matchedResource = await db.emergencyResource.findFirst({
      where: { type: targetResourceType, isAvailable: true },
      orderBy: { updatedAt: "asc" },
    }) || await db.emergencyResource.findFirst({
      where: { isAvailable: true },
      orderBy: { updatedAt: "asc" },
    })

    const initialStatus = matchedResource ? "in_progress" : "active"

    const alert = await db.emergencyAlert.create({
      data: {
        userId,
        userName,
        type,
        message,
        severity: severity || (["medical", "emergency", "sos", "panic"].includes(type) ? "critical" : "high"),
        locationLat: location_lat ? parseFloat(String(location_lat)) : null,
        locationLng: location_lng ? parseFloat(String(location_lng)) : null,
        status: initialStatus,
        deviceInfo: {
          ...(device_info || {}),
          autoAssigned: !!matchedResource,
          assignedResourceId: matchedResource?.id || null,
          assignedResourceName: matchedResource?.name || null,
          assignedResourceType: matchedResource?.type || null,
          assignedResourcePhone: matchedResource?.phone || null,
          autoDispatchedAt: new Date().toISOString(),
        },
        createdAt: new Date(),
        syncedAt: new Date(),
      }
    })

    // If resource is matched, record AlertAssignment and lock the resource (1-to-1)
    if (matchedResource) {
      await Promise.all([
        db.alertAssignment.create({
          data: {
            alertId: alert.id,
            resourceId: matchedResource.id,
            notes: `1-to-1 automated dispatch to ${matchedResource.name}`,
            status: "assigned",
          }
        }),
        db.emergencyResource.update({
          where: { id: matchedResource.id },
          data: { isAvailable: false },
        })
      ])
    }

    // Automatically alert admin command center with pre-dispatched unit
    await db.adminNotification.create({
      data: {
        type: `${type}_alert_auto_assigned`,
        title: `⚡ Auto-Dispatched: ${type.toUpperCase()} Alert — ${userName}`,
        message: matchedResource
          ? `Incoming ${type} alert. AI immediately auto-assigned ${matchedResource.name} (${matchedResource.phone || "Emergency Line"}) to coordinates [${location_lat || 11.0159}, ${location_lng || 76.9368}].`
          : `Incoming ${type} alert received from ${userName}.`,
        severity: severity || "critical",
        userId,
        metadata: {
          alertId: alert.id,
          resourceId: matchedResource?.id,
          resourceName: matchedResource?.name,
          autoDispatched: !!matchedResource,
        },
      }
    })

    return NextResponse.json({
      success: true,
      alert: {
        id: alert.id,
        user_id: alert.userId,
        user_name: alert.userName,
        type: alert.type,
        message: alert.message,
        severity: alert.severity,
        location_lat: alert.locationLat,
        location_lng: alert.locationLng,
        status: alert.status,
        device_info: alert.deviceInfo,
        created_at: alert.createdAt?.toISOString(),
      },
      auto_assigned_resource: matchedResource ? {
        id: matchedResource.id,
        name: matchedResource.name,
        type: matchedResource.type,
        phone: matchedResource.phone,
      } : null,
    }, { status: 201 })
  } catch (error: any) {
    console.error("[POST /api/alerts/user] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH /api/alerts/user — mark alert(s) as read/resolved or respond to assistance prompts
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const userName = session.user.name || session.user.email?.split("@")[0] || "Tourist"
    const body = await request.json()
    const { alert_id, status, action, location } = body

    if (!alert_id) {
      return NextResponse.json({ error: "alert_id is required" }, { status: 400 })
    }

    const existingAlert = await db.emergencyAlert.findFirst({
      where: { id: alert_id, userId },
    })

    if (!existingAlert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 })
    }

    const currentDeviceInfo = (existingAlert.deviceInfo as any) || {}

    if (action === "request_assistance") {
      // Tourist clicked "Request Emergency Assistance" button!
      const updatedAlert = await db.emergencyAlert.update({
        where: { id: alert_id },
        data: {
          status: "assistance_requested",
          severity: "critical",
          locationLat: location?.lat ?? existingAlert.locationLat,
          locationLng: location?.lng ?? existingAlert.locationLng,
          deviceInfo: {
            ...currentDeviceInfo,
            touristStatus: "assistance_requested",
            assistanceRequested: true,
            assistanceRequestedAt: new Date().toISOString(),
          },
        },
      })

      // Immediately alert admin command center
      await db.adminNotification.create({
        data: {
          type: "emergency_assistance_requested",
          title: `🚨 CRITICAL: Tourist Requested Assistance — ${userName}`,
          message: `Tourist triggered SOS assistance in response to hazard alert: "${existingAlert.message.slice(0, 120)}..."`,
          severity: "critical",
          userId: userId,
          metadata: {
            alertId: alert_id,
            location: location || { lat: existingAlert.locationLat, lng: existingAlert.locationLng },
            urgent: true,
          },
        },
      })

      return NextResponse.json({ success: true, status: "assistance_requested", alert: updatedAlert })
    } else if (action === "confirm_safe") {
      // Tourist clicked "I am Safe" button!
      const updatedAlert = await db.emergencyAlert.update({
        where: { id: alert_id },
        data: {
          status: "resolved",
          deviceInfo: {
            ...currentDeviceInfo,
            touristStatus: "safe_confirmed",
            touristConfirmedSafe: true,
            confirmedSafeAt: new Date().toISOString(),
          },
        },
      })

      // Notify admin that tourist is safe
      await db.adminNotification.create({
        data: {
          type: "tourist_safe_confirmed",
          title: `✅ Tourist Confirmed Safe — ${userName}`,
          message: `Tourist acknowledged hazard alert and confirmed they are safe and do not require emergency dispatch.`,
          severity: "info",
          userId: userId,
          metadata: {
            alertId: alert_id,
          },
        },
      })

      return NextResponse.json({ success: true, status: "resolved", alert: updatedAlert })
    } else {
      // Standard status update
      const updatedAlert = await db.emergencyAlert.update({
        where: { id: alert_id },
        data: { status: status || "resolved" },
      })
      return NextResponse.json({ success: true, alert: updatedAlert })
    }
  } catch (error: any) {
    console.error("[PATCH /api/alerts/user] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
