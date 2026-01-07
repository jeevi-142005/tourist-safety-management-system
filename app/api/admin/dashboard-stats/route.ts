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

    // Get active tourists count
    const { count: activeTourists } = await supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .eq("role", "tourist")

    // Get active alerts count
    const { count: activeAlerts } = await supabase
      .from("user_alerts")
      .select("*", { count: "exact" })
      .eq("is_read", false)

    // Get critical alerts count
    const { count: criticalAlerts } = await supabase
      .from("user_alerts")
      .select("*", { count: "exact" })
      .eq("severity", "critical")
      .eq("is_read", false)

    // Get resolved alerts today
    const today = new Date().toISOString().split("T")[0]
    const { count: resolvedToday } = await supabase
      .from("user_alerts")
      .select("*", { count: "exact" })
      .eq("is_read", true)
      .gte("read_at", today)

    // Get system uptime (mock for now)
    const systemUptime = 98.7

    // Get average response time (mock calculation)
    const avgResponseTime = 1.8

    // Get geo zones count
    const { count: geoZones } = await supabase.from("geo_zones").select("*", { count: "exact" }).eq("is_active", true)

    // Get recent blockchain transactions
    const { count: blockchainTransactions } = await supabase
      .from("blockchain_transactions")
      .select("*", { count: "exact" })
      .eq("status", "confirmed")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    return NextResponse.json({
      activeTourists: activeTourists || 0,
      activeAlerts: activeAlerts || 0,
      criticalAlerts: criticalAlerts || 0,
      resolvedToday: resolvedToday || 0,
      systemUptime,
      avgResponseTime,
      geoZones: geoZones || 0,
      blockchainTransactions: blockchainTransactions || 0,
      aiEfficiency: 98.7,
      threatDetectionAccuracy: 97.3,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
