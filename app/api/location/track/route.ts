import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    console.log("[v0] Received location data:", { latitude, longitude, accuracy })

    const { data: locationTrack, error: locationError } = await supabase
      .from("location_tracks")
      .insert({
        user_id: user.id,
        latitude,
        longitude,
        accuracy,
        altitude,
        speed,
        heading,
        battery_level,
        timestamp: timestamp || new Date().toISOString(),
        is_emergency,
      })
      .select()
      .single()

    if (locationError) {
      console.error("Location tracking error:", locationError)
      return NextResponse.json({ error: "Failed to track location" }, { status: 500 })
    }

    const { data: geoZones } = await supabase.from("geo_zones").select("*").eq("is_active", true)

    const violations = []

    if (geoZones) {
      for (const zone of geoZones) {
        const distance = calculateDistance(latitude, longitude, zone.center_lat, zone.center_lng)

        if (distance <= zone.radius) {
          violations.push({
            zone_id: zone.id,
            zone_name: zone.name,
            zone_type: zone.zone_type,
            distance: Math.round(distance),
            description: zone.description,
          })

          // Create user alert for zone entry
          if (zone.zone_type === "high_risk" || zone.zone_type === "restricted") {
            await supabase.from("user_alerts").insert({
              user_id: user.id,
              message: `Alert: You have entered ${zone.name}. ${zone.description}`,
              alert_type: "geofence",
              severity: zone.zone_type === "high_risk" ? "critical" : "high",
              location_lat: latitude,
              location_lng: longitude,
            })

            // Create admin notification
            await supabase.from("admin_notifications").insert({
              type: "emergency_alert",
              title: `Tourist in ${zone.zone_type} zone`,
              message: `Tourist ${user.email} has entered ${zone.name}`,
              severity: "critical",
              user_id: user.id,
              metadata: {
                zone_id: zone.id,
                zone_name: zone.name,
                location: { latitude, longitude },
                distance: Math.round(distance),
              },
            })
          }
        }
      }
    }

    console.log("[v0] Zone violations detected:", violations.length)

    return NextResponse.json({
      success: true,
      locationId: locationTrack.id,
      violations,
      message: violations.length > 0 ? `Entered ${violations.length} zone(s)` : "Location tracked successfully",
    })
  } catch (error) {
    console.error("Location tracking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get recent location history
    const { data: locations, error } = await supabase
      .from("location_tracks")
      .select("*")
      .eq("user_id", user.id)
      .order("timestamp", { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: "Failed to fetch location history" }, { status: 500 })
    }

    return NextResponse.json({ locations })
  } catch (error) {
    console.error("Error fetching location history:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
