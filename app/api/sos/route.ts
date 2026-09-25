import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"

// GET /api/sos — fetch user's SOS contacts + recent SOS alerts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = (session.user as any).id as string

    // Fetch user profile for contacts stored in qrCodeData
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { emergencyContact: true, emergencyPhone: true, qrCodeData: true },
    })

    let contacts: any[] = []
    if (user?.qrCodeData) {
      try {
        const parsed = JSON.parse(user.qrCodeData)
        if (Array.isArray(parsed)) contacts = parsed
      } catch { /* ignore */ }
    }

    if (user?.emergencyContact && !contacts.find(c => c.phone === user.emergencyPhone)) {
      contacts.unshift({
        id: "legacy",
        name: user.emergencyContact,
        phone: user.emergencyPhone || "",
        relationship: "emergency",
        priority: 1,
      })
    }

    // Fetch recent alerts for this user
    const recentAlerts = await db.emergencyAlert.findMany({
      where: {
        userId,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    return NextResponse.json({
      contacts,
      alerts: recentAlerts.map((a) => ({
        id: a.id,
        type: a.type,
        message: a.message,
        severity: a.severity,
        location_lat: a.locationLat,
        location_lng: a.locationLng,
        status: a.status,
        created_at: a.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("[GET /api/sos]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/sos — trigger an SOS / emergency alert and auto-dispatch to available Guide / Resource
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = (session.user as any).id as string
    const userName = session.user.name || session.user.email?.split("@")[0] || "Tourist"

    const body = await request.json()
    const { type, severity, message, location_lat, location_lng, device_info } = body

    if (!type || !message) {
      return NextResponse.json({ error: "type and message are required" }, { status: 400 })
    }

    // 1-to-1 Auto-Assign to an available Guide or Emergency Unit
    let targetResourceType = "guide"
    const atype = String(type).toLowerCase()
    if (["medical", "hospital", "injury"].includes(atype)) {
      targetResourceType = "ambulance"
    } else if (["fire", "flood", "disaster"].includes(atype)) {
      targetResourceType = "fire"
    } else if (["security", "patrol"].includes(atype)) {
      targetResourceType = "security"
    } else {
      // For general SOS, emergency, panic, assistance, guide requests -> prioritize Guide
      targetResourceType = "guide"
    }

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
        type: type || "emergency",
        message,
        severity: severity || "critical",
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
        syncedAt: new Date(),
      },
    })

    // If resource is matched, create AlertAssignment and lock resource
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

    // Notify Admin
    try {
      await db.adminNotification.create({
        data: {
          type: "emergency_alert",
          title: `🚨 Emergency Alert: ${userName}`,
          message: matchedResource
            ? `Distress signal from ${userName} (${type.toUpperCase()}). Auto-assigned to ${matchedResource.name}.`
            : `Distress signal from ${userName} (${type.toUpperCase()}). Pending resource assignment.`,
          severity: severity || "critical",
          userId,
          metadata: {
            alertId: alert.id,
            resourceId: matchedResource?.id,
            resourceName: matchedResource?.name,
          },
        },
      })
    } catch (e) {
      console.warn("Notification skipped:", e)
    }

    return NextResponse.json({
      success: true,
      alert: {
        id: alert.id,
        type: alert.type,
        message: alert.message,
        severity: alert.severity,
        status: alert.status,
        created_at: alert.createdAt.toISOString(),
      },
      assignedResource: matchedResource ? {
        id: matchedResource.id,
        name: matchedResource.name,
        type: matchedResource.type,
        phone: matchedResource.phone,
      } : null,
    }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/sos]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/sos — save/update emergency contacts list for the user
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = (session.user as any).id as string
    const body = await request.json()
    const { contacts } = body

    if (!Array.isArray(contacts)) {
      return NextResponse.json({ error: "contacts must be an array" }, { status: 400 })
    }

    await db.user.update({
      where: { id: userId },
      data: {
        qrCodeData: JSON.stringify(contacts),
        emergencyContact: contacts.find(c => c.priority === 1)?.name || contacts[0]?.name || null,
        emergencyPhone: contacts.find(c => c.priority === 1)?.phone || contacts[0]?.phone || null,
      },
    })

    return NextResponse.json({ success: true, contacts })
  } catch (error) {
    console.error("[PUT /api/sos]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/sos — mark an alert as resolved
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = (session.user as any).id as string
    const body = await request.json()
    const { alert_id, status } = body

    if (!alert_id) return NextResponse.json({ error: "alert_id is required" }, { status: 400 })

    await db.emergencyAlert.updateMany({
      where: { id: alert_id, userId },
      data: { status: status || "resolved" },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PATCH /api/sos]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
