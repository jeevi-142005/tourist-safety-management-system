import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/db-client/server"

export async function GET(request: NextRequest) {
  try {
    const dbClient = await createServerClient()


    const {
      data: { user },
    } = await dbClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get active tourists count
    const { count: activeTourists } = await dbClient
      .from("profiles")
      .select("*", { count: "exact" })
      .eq("role", "tourist")

    // Get active alerts count
    const { count: activeAlerts } = await dbClient
      .from("user_alerts")
      .select("*", { count: "exact" })
      .eq("is_read", false)

    // Get critical alerts count
    const { count: criticalAlerts } = await dbClient
      .from("user_alerts")
      .select("*", { count: "exact" })
      .eq("severity", "critical")
      .eq("is_read", false)

    // Get resolved alerts today
    const today = new Date().toISOString().split("T")[0]
    const { count: resolvedToday } = await dbClient
      .from("user_alerts")
      .select("*", { count: "exact" })
      .eq("is_read", true)
      .gte("read_at", today)

    // Get system uptime (mock for now)
    const systemUptime = 98.7

    // Get average response time (mock calculation)
    const avgResponseTime = 1.8

    // Get geo zones count
    const { count: geoZones } = await dbClient.from("geo_zones").select("*", { count: "exact" }).eq("is_active", true)

    // Get recent blockchain transactions
    const { count: blockchainTransactions } = await dbClient
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
