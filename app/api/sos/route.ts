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

    // Fetch user profile for contacts stored in qrCodeData (we repurpose it as JSON contacts store)
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { emergencyContact: true, emergencyPhone: true, qrCodeData: true },
    })

    // Parse contacts from qrCodeData field (used as JSON store for SOS contacts list)
    let contacts: any[] = []
    if (user?.qrCodeData) {
      try {
        const parsed = JSON.parse(user.qrCodeData)
        if (Array.isArray(parsed)) contacts = parsed
      } catch { /* invalid json, ignore */ }
    }

    // Add legacy single contact if exists and not already in contacts
    if (user?.emergencyContact && !contacts.find(c => c.phone === user.emergencyPhone)) {
      contacts.unshift({
        id: "legacy",
        name: user.emergencyContact,
        phone: user.emergencyPhone || "",
        relationship: "emergency",
        priority: 1,
      })
    }

    // Fetch recent SOS / panic / emergency alerts for this user
    const recentAlerts = await db.emergencyAlert.findMany({
      where: {
        userId,
        type: { in: ["panic", "sos", "emergency", "medical", "security", "assistance"] },
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

// POST /api/sos — trigger an SOS / emergency alert and save to DB
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

    const alert = await db.emergencyAlert.create({
      data: {
        userId,
        userName,
        type: type || "panic",
        message,
        severity: severity || "critical",
        locationLat: location_lat ? parseFloat(String(location_lat)) : null,
        locationLng: location_lng ? parseFloat(String(location_lng)) : null,
        status: "active",
        deviceInfo: device_info || null,
        syncedAt: new Date(),
      },
    })

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

    // Store contacts as JSON in qrCodeData field
    await db.user.update({
      where: { id: userId },
      data: {
        qrCodeData: JSON.stringify(contacts),
        // Also update the primary emergency contact fields from priority-1 contact
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
