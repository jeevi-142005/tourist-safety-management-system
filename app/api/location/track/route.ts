import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user as any
    const body = await request.json()
    const {
      latitude,
      longitude,
      accuracy,
      altitude,
      speed,
      heading,
      battery_level,
      timestamp,
      is_emergency = false,
    } = body

    console.log("[Prisma] Received location data:", { latitude, longitude, accuracy })

    const locationTrack = await db.locationTrack.create({
      data: {
        userId: user.id,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: accuracy ? parseFloat(accuracy) : null,
        altitude: altitude ? parseFloat(altitude) : null,
        speed: speed ? parseFloat(speed) : null,
        heading: heading ? parseFloat(heading) : null,
        batteryLevel: battery_level ? parseInt(battery_level) : null,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        isEmergency: is_emergency,
      }
    })

    const geoZones = await db.geoZone.findMany({
      where: { isActive: true }
    })

    const violations = []

    if (geoZones) {
      for (const zone of geoZones) {
        const distance = calculateDistance(latitude, longitude, zone.centerLat, zone.centerLng)

        if (zone.radius && distance <= zone.radius) {
          violations.push({
            zone_id: zone.id,
            zone_name: zone.name,
            zone_type: zone.zoneType,
            distance: Math.round(distance),
            description: zone.description,
          })

          // Create notification for zone entry if high risk/restricted
          if (zone.zoneType === "high_risk" || zone.zoneType === "restricted") {
            // User alert notification
            await db.adminNotification.create({
              data: {
                type: "geofence_entry",
                title: `Entered geofence: ${zone.name}`,
                message: `Alert: You have entered ${zone.name}. ${zone.description || ""}`,
                severity: zone.zoneType === "high_risk" ? "critical" : "warning",
                userId: user.id,
                metadata: {
                  zone_id: zone.id,
                  location: { latitude, longitude }
                }
              }
            })

            // User visible dynamic alert
            await db.emergencyAlert.create({
              data: {
                userId: user.id,
                userName: user.name || user.email.split("@")[0] || "Tourist",
                type: "geofence_entry",
                message: `Automatic Alert: You have automatically entered the zone: ${zone.name}. ${zone.description || ""}`,
                severity: zone.zoneType === "high_risk" ? "critical" : "high",
                locationLat: parseFloat(latitude),
                locationLng: parseFloat(longitude),
                status: 'active',
              }
            })

            // Admin notification
            await db.adminNotification.create({
              data: {
                type: "emergency_alert",
                title: `Tourist in ${zone.zoneType} zone`,
                message: `Tourist ${user.email} has entered ${zone.name}`,
                severity: "critical",
                userId: user.id,
                metadata: {
                  zone_id: zone.id,
                  zone_name: zone.name,
                  location: { latitude, longitude },
                  distance: Math.round(distance),
                }
              }
            })
          }
        }
      }
    }

    console.log("[Prisma] Zone violations detected:", violations.length)

    return NextResponse.json({
      success: true,
      locationId: locationTrack.id,
      violations,
      message: violations.length > 0 ? `Entered ${violations.length} zone(s)` : "Location tracked successfully",
    })
  } catch (error: any) {
    console.error("Location tracking error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user as any

    // Get recent location history
    const locations = await db.locationTrack.findMany({
      where: { userId: user.id },
      orderBy: { timestamp: "desc" },
      take: 50
    })

    // Map model properties to format expected by UI if different (e.g. database model batteryLevel vs battery_level)
    const mappedLocations = locations.map(loc => ({
      id: loc.id,
      user_id: loc.userId,
      latitude: loc.latitude,
      longitude: loc.longitude,
      accuracy: loc.accuracy,
      altitude: loc.altitude,
      speed: loc.speed,
      heading: loc.heading,
      timestamp: loc.timestamp.toISOString(),
      battery_level: loc.batteryLevel,
      is_emergency: loc.isEmergency
    }))

    return NextResponse.json({ locations: mappedLocations })
  } catch (error: any) {
    console.error("Error fetching location history:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
