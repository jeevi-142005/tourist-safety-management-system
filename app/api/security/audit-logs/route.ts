import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { auditLogger, AUDIT_ACTIONS } from "@/lib/security/audit-logger"

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

    // Check if user has admin/authority role
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || !["admin", "police", "tourism_dept"].includes(profile.role)) {
      await auditLogger.log({
        userId: user.id,
        action: AUDIT_ACTIONS.PERMISSION_DENIED,
        resource: "security_audit_logs",
        ipAddress: request.ip,
        userAgent: request.headers.get("user-agent") || undefined,
        success: false,
        riskLevel: "medium",
      })

      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50"), 100)
    const riskLevel = searchParams.get("riskLevel")
    const userId = searchParams.get("userId")

    let query = supabase
      .from("security_audit_logs")
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .order("timestamp", { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (riskLevel) {
      query = query.eq("risk_level", riskLevel)
    }

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data: auditLogs, error } = await query

    if (error) {
      console.error("Audit logs fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
    }

    // Log data access
    await auditLogger.log({
      userId: user.id,
      action: AUDIT_ACTIONS.DATA_ACCESS,
      resource: "security_audit_logs",
      ipAddress: request.ip,
      userAgent: request.headers.get("user-agent") || undefined,
      success: true,
      riskLevel: "low",
      details: {
        page,
        limit,
        filters: { riskLevel, userId },
      },
    })

    return NextResponse.json({
      auditLogs,
      pagination: {
        page,
        limit,
        hasMore: auditLogs.length === limit,
      },
    })
  } catch (error) {
    console.error("Security audit logs API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
