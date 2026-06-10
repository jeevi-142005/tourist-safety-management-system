import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { auditLogger, AUDIT_ACTIONS } from "@/lib/security/audit-logger"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUser = session.user as any
    const body = await request.json()
    const { dataType, userId, reason, legalBasis } = body

    // Validate request
    if (!dataType || !reason || !legalBasis) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Fetch user details
    const profile = await db.user.findUnique({
      where: { id: currentUser.id }
    })

    const canExportOwnData = userId === currentUser.id
    const canExportAnyData = profile?.role && ["admin", "police", "tourism_dept"].includes(profile.role)

    if (!canExportOwnData && !canExportAnyData) {
      await auditLogger.log({
        userId: currentUser.id,
        action: AUDIT_ACTIONS.PERMISSION_DENIED,
        resource: "data_export",
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
        success: false,
        riskLevel: "high",
        details: { requestedUserId: userId, dataType },
      })

      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Log data access request
    await db.dataAccessLog.create({
      data: {
        userId,
        accessedBy: currentUser.id,
        dataType,
        accessReason: reason,
        legalBasis,
        retentionPeriod: "7 days",
      }
    })

    // Export data based on type
    let exportData: any = {}

    switch (dataType) {
      case "profile": {
        const profileData = await db.user.findUnique({
          where: { id: userId }
        })
        if (profileData) {
          const { passwordHash, ...safeProfile } = profileData
          exportData.profile = safeProfile
        } else {
          exportData.profile = null
        }
        break
      }

      case "location_history": {
        const locationData = await db.locationTrack.findMany({
          where: { userId },
          orderBy: { timestamp: "desc" },
          take: 1000,
        })
        exportData.locationHistory = locationData
        break
      }

      case "alerts": {
        const alertsData = await db.adminNotification.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        })
        exportData.alerts = alertsData
        break
      }

      case "digital_ids": {
        const profileData = await db.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            blockchainId: true,
            qrCodeData: true,
            createdAt: true,
          }
        })
        exportData.digitalIds = profileData ? [profileData] : []
        break
      }

      case "all": {
        // Export all user data in parallel
        const [profileData, locationData, alertsData] = await Promise.all([
          db.user.findUnique({ where: { id: userId } }),
          db.locationTrack.findMany({
            where: { userId },
            orderBy: { timestamp: "desc" },
            take: 1000,
          }),
          db.adminNotification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
          }),
        ])

        const safeProfile = profileData ? {
          id: profileData.id,
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          emergencyContact: profileData.emergencyContact,
          emergencyPhone: profileData.emergencyPhone,
          role: profileData.role,
          blockchainId: profileData.blockchainId,
          qrCodeData: profileData.qrCodeData,
          createdAt: profileData.createdAt,
          updatedAt: profileData.updatedAt,
        } : null

        exportData = {
          profile: safeProfile,
          locationHistory: locationData,
          alerts: alertsData,
          digitalIds: profileData ? [{
            id: profileData.id,
            name: profileData.name,
            email: profileData.email,
            blockchainId: profileData.blockchainId,
            qrCodeData: profileData.qrCodeData,
            createdAt: profileData.createdAt,
          }] : [],
        }
        break
      }

      default:
        return NextResponse.json({ error: "Invalid data type" }, { status: 400 })
    }

    // Log successful data export
    await auditLogger.log({
      userId: currentUser.id,
      action: AUDIT_ACTIONS.DATA_EXPORT,
      resource: dataType,
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
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
  } catch (error: any) {
    console.error("Data export error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
