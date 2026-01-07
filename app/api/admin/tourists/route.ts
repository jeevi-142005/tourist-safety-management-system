import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

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

    // Check admin role
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || !["admin", "authority"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Get all tourists with their latest location and blockchain data
    const { data: tourists } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        phone,
        emergency_contact,
        emergency_phone,
        blockchain_id,
        qr_code_data,
        created_at,
        location_tracks!inner (
          latitude,
          longitude,
          timestamp,
          battery_level,
          is_emergency
        ),
        safety_scores (
          score,
          risk_level,
          created_at
        ),
        user_alerts (
          id,
          alert_type,
          severity,
          is_read,
          created_at
        )
      `)
      .eq("role", "tourist")
      .order("created_at", { ascending: false })

    // Process tourist data to get latest location and stats
    const processedTourists =
      tourists?.map((tourist) => {
        const latestLocation = tourist.location_tracks?.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )[0]

        const latestSafetyScore = tourist.safety_scores?.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0]

        const activeAlerts = tourist.user_alerts?.filter((alert) => !alert.is_read) || []

        return {
          id: tourist.id,
          full_name: tourist.full_name,
          email: tourist.email,
          phone: tourist.phone,
          emergency_contact: tourist.emergency_contact,
          emergency_phone: tourist.emergency_phone,
          blockchain_id: tourist.blockchain_id,
          qr_code_data: tourist.qr_code_data,
          created_at: tourist.created_at,
          current_location: latestLocation
            ? {
                latitude: latestLocation.latitude,
                longitude: latestLocation.longitude,
                timestamp: latestLocation.timestamp,
                battery_level: latestLocation.battery_level,
                is_emergency: latestLocation.is_emergency,
              }
            : null,
          safety_score: latestSafetyScore?.score || 0,
          risk_level: latestSafetyScore?.risk_level || "unknown",
          active_alerts_count: activeAlerts.length,
          status: latestLocation?.is_emergency ? "emergency" : activeAlerts.length > 0 ? "alert" : "safe",
        }
      }) || []

    return NextResponse.json({
      tourists: processedTourists,
      total: processedTourists.length,
      stats: {
        total: processedTourists.length,
        safe: processedTourists.filter((t) => t.status === "safe").length,
        alert: processedTourists.filter((t) => t.status === "alert").length,
        emergency: processedTourists.filter((t) => t.status === "emergency").length,
        averageSafetyScore:
          processedTourists.reduce((acc, t) => acc + t.safety_score, 0) / processedTourists.length || 0,
      },
    })
  } catch (error) {
    console.error("Error fetching tourists:", error)
    return NextResponse.json({ error: "Failed to fetch tourists" }, { status: 500 })
  }
}
