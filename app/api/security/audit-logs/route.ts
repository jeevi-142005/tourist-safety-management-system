import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { auditLogger, AUDIT_ACTIONS } from "@/lib/security/audit-logger"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUser = session.user as any

    // Check if user has admin/authority role
    const profile = await db.user.findUnique({
      where: { id: currentUser.id }
    })

    if (!profile || !["admin", "police", "tourism_dept"].includes(profile.role)) {
      await auditLogger.log({
        userId: currentUser.id,
        action: AUDIT_ACTIONS.PERMISSION_DENIED,
        resource: "security_audit_logs",
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
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

    // Construct query parameters
    const where: any = {}
    if (riskLevel) {
      where.riskLevel = riskLevel
    }
    if (userId) {
      where.userId = userId
    }

    // Fetch audit logs
    const auditLogs = await db.securityAuditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Fetch referenced user profiles in a single query
    const userIds = Array.from(new Set(auditLogs.map((log) => log.userId).filter(Boolean))) as string[]
    
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true }
    })

    const userMap = new Map(users.map((u) => [u.id, u]))

    // Attach profile information to audit logs to match original API response format
    const mappedLogs = auditLogs.map((log) => ({
      id: log.id,
      user_id: log.userId,
      action: log.action,
      resource: log.resource,
      ip_address: log.ipAddress,
      user_agent: log.userAgent,
      success: log.success,
      details: log.details,
      risk_level: log.riskLevel,
      timestamp: log.timestamp.toISOString(),
      profiles: log.userId ? {
        full_name: userMap.get(log.userId)?.name || null,
        email: userMap.get(log.userId)?.email || null
      } : null
    }))

    // Log data access
    await auditLogger.log({
      userId: currentUser.id,
      action: AUDIT_ACTIONS.DATA_ACCESS,
      resource: "security_audit_logs",
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
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
      auditLogs: mappedLogs,
      pagination: {
        page,
        limit,
        hasMore: mappedLogs.length === limit,
      },
    })
  } catch (error: any) {
    console.error("Security audit logs API error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
