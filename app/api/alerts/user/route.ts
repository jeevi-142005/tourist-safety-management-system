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
      // Fetch received alerts (automatic geofence/system triggers)
      const [alerts, count] = await Promise.all([
        db.emergencyAlert.findMany({
          where: {
            userId,
            type: { in: autoTypes }
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        db.emergencyAlert.count({
          where: {
            userId,
            type: { in: autoTypes }
          }
        })
      ])
      receivedAlerts = alerts
      receivedTotal = count
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

    const alert = await db.emergencyAlert.create({
      data: {
        userId,
        userName,
        type,
        message,
        severity: severity || "high",
        locationLat: location_lat ? parseFloat(String(location_lat)) : null,
        locationLng: location_lng ? parseFloat(String(location_lng)) : null,
        status: "active",
        deviceInfo: device_info || null,
        createdAt: new Date(),
        syncedAt: new Date(),
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
        created_at: alert.createdAt?.toISOString(),
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error("[POST /api/alerts/user] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH /api/alerts/user — mark alert(s) as read/resolved
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { alert_id, status } = body

    if (!alert_id) {
      return NextResponse.json({ error: "alert_id is required" }, { status: 400 })
    }

    await db.emergencyAlert.updateMany({
      where: { id: alert_id, userId },
      data: { status: status || "resolved" }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[PATCH /api/alerts/user] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
