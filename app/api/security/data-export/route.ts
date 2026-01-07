import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { auditLogger, AUDIT_ACTIONS } from "@/lib/security/audit-logger"

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
    const { dataType, userId, reason, legalBasis } = body

    // Validate request
    if (!dataType || !reason || !legalBasis) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check permissions
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    const canExportOwnData = userId === user.id
    const canExportAnyData = profile?.role && ["admin", "police", "tourism_dept"].includes(profile.role)

    if (!canExportOwnData && !canExportAnyData) {
      await auditLogger.log({
        userId: user.id,
        action: AUDIT_ACTIONS.PERMISSION_DENIED,
        resource: "data_export",
        ipAddress: request.ip,
        userAgent: request.headers.get("user-agent") || undefined,
        success: false,
        riskLevel: "high",
        details: { requestedUserId: userId, dataType },
      })

      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Log data access request
    await supabase.from("data_access_logs").insert({
      user_id: userId,
      accessed_by: user.id,
      data_type: dataType,
      access_reason: reason,
      legal_basis: legalBasis,
      retention_period: "7 days",
    })

    // Export data based on type
    let exportData: any = {}

    switch (dataType) {
      case "profile":
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", userId).single()
        exportData.profile = profileData
        break

      case "location_history":
        const { data: locationData } = await supabase
          .from("location_tracks")
          .select("*")
          .eq("user_id", userId)
          .order("timestamp", { ascending: false })
          .limit(1000)
        exportData.locationHistory = locationData
        break

      case "alerts":
        const { data: alertsData } = await supabase
          .from("alerts")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
        exportData.alerts = alertsData
        break

      case "digital_ids":
        const { data: digitalIdsData } = await supabase.from("digital_tourist_ids").select("*").eq("user_id", userId)
        exportData.digitalIds = digitalIdsData
        break

      case "all":
        // Export all user data
        const [profileRes, locationRes, alertsRes, digitalIdsRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", userId).single(),
          supabase
            .from("location_tracks")
            .select("*")
            .eq("user_id", userId)
            .order("timestamp", { ascending: false })
            .limit(1000),
          supabase.from("alerts").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
          supabase.from("digital_tourist_ids").select("*").eq("user_id", userId),
        ])

        exportData = {
          profile: profileRes.data,
          locationHistory: locationRes.data,
          alerts: alertsRes.data,
          digitalIds: digitalIdsRes.data,
        }
        break

      default:
        return NextResponse.json({ error: "Invalid data type" }, { status: 400 })
    }

    // Log successful data export
    await auditLogger.log({
      userId: user.id,
      action: AUDIT_ACTIONS.DATA_EXPORT,
      resource: dataType,
      ipAddress: request.ip,
      userAgent: request.headers.get("user-agent") || undefined,
      success: true,
      riskLevel: "medium",
      details: {
        exportedUserId: userId,
        dataType,
        reason,
        legalBasis,
        recordCount: Object.keys(exportData).length,
      },
    })

    return NextResponse.json({
      data: exportData,
      exportedAt: new Date().toISOString(),
      legalBasis,
      retentionPeriod: "7 days",
    })
  } catch (error) {
    console.error("Data export error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
