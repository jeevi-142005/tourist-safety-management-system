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

    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin" && profile?.role !== "authority") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get admin notifications
    const { data: notifications, error: notificationsError } = await supabase
      .from("admin_notifications")
      .select(`
        *,
        profiles!admin_notifications_user_id_fkey (
          full_name,
          email,
          blockchain_id
        )
      `)
      .order("created_at", { ascending: false })
      .limit(100)

    if (notificationsError) {
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
    }

    // Get recent user alerts for context
    const { data: userAlerts, error: alertsError } = await supabase
      .from("user_alerts")
      .select(`
        *,
        profiles!user_alerts_user_id_fkey (
          full_name,
          email,
          blockchain_id
        )
      `)
      .in("severity", ["high", "critical"])
      .order("created_at", { ascending: false })
      .limit(50)

    if (alertsError) {
      return NextResponse.json({ error: "Failed to fetch user alerts" }, { status: 500 })
    }

    // Get anomaly patterns for analysis
    const { data: anomalies, error: anomaliesError } = await supabase
      .from("anomaly_patterns")
      .select(`
        *,
        profiles!anomaly_patterns_user_id_fkey (
          full_name,
          email,
          blockchain_id
        )
      `)
      .eq("resolved", false)
      .order("created_at", { ascending: false })
      .limit(30)

    if (anomaliesError) {
      return NextResponse.json({ error: "Failed to fetch anomalies" }, { status: 500 })
    }

    return NextResponse.json({
      notifications,
      userAlerts,
      anomalies,
      summary: {
        totalNotifications: notifications.length,
        criticalAlerts: userAlerts.filter((alert) => alert.severity === "critical").length,
        highAlerts: userAlerts.filter((alert) => alert.severity === "high").length,
        unresolvedAnomalies: anomalies.length,
      },
    })
  } catch (error) {
    console.error("Error fetching admin alerts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin" && profile?.role !== "authority") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { action, notification_id, alert_id, anomaly_id } = body

    switch (action) {
      case "mark_notification_read":
        await supabase
          .from("admin_notifications")
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq("id", notification_id)
        break

      case "acknowledge_alert":
        await supabase
          .from("user_alerts")
          .update({ is_acknowledged: true, acknowledged_at: new Date().toISOString() })
          .eq("id", alert_id)
        break

      case "resolve_anomaly":
        await supabase
          .from("anomaly_patterns")
          .update({ resolved: true, resolved_at: new Date().toISOString() })
          .eq("id", anomaly_id)
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing admin action:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
