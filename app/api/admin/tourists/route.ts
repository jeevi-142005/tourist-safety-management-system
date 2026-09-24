import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const tourists = await db.user.findMany({
      where: { role: "tourist" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        emergencyContact: true,
        emergencyPhone: true,
        blockchainId: true,
        createdAt: true,
        locationTracks: {
          orderBy: { timestamp: "desc" },
          take: 1,
          select: { latitude: true, longitude: true, timestamp: true, batteryLevel: true, isEmergency: true },
        },
        safetyScores: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { score: true, riskLevel: true },
        },
        emergencyAlerts: {
          where: { status: { in: ["active", "acknowledged", "in_progress"] } },
          select: { id: true, type: true, severity: true, status: true },
        },
        touristIds: {
          where: { isActive: true },
          take: 1,
          select: { id: true, blockchainHash: true, documentType: true, validUntil: true, qrCodeData: true },
        },
      },
    })

    const processed = tourists.map((t) => {
      const loc = t.locationTracks[0] ?? null
      const score = t.safetyScores[0] ?? null
      const activeAlerts = t.emergencyAlerts
      const hasSos = activeAlerts.some((a) => ["sos", "panic"].includes(a.type))
      const status = hasSos || loc?.isEmergency ? "emergency" : activeAlerts.length > 0 ? "alert" : "safe"

      return {
        id: t.id,
        name: t.name,
        email: t.email,
        phone: t.phone,
        emergencyContact: t.emergencyContact,
        emergencyPhone: t.emergencyPhone,
        blockchainId: t.blockchainId,
        createdAt: t.createdAt.toISOString(),
        currentLocation: loc
          ? {
              latitude: loc.latitude,
              longitude: loc.longitude,
              timestamp: loc.timestamp.toISOString(),
              batteryLevel: loc.batteryLevel,
              isEmergency: loc.isEmergency,
            }
          : null,
        safetyScore: score?.score ?? 0,
        riskLevel: score?.riskLevel ?? "unknown",
        activeAlertsCount: activeAlerts.length,
        activeAlerts,
        digiId: t.touristIds[0] ?? null,
        status,
      }
    })

    return NextResponse.json({
      tourists: processed,
      total: processed.length,
      stats: {
        total: processed.length,
        safe: processed.filter((t) => t.status === "safe").length,
        alert: processed.filter((t) => t.status === "alert").length,
        emergency: processed.filter((t) => t.status === "emergency").length,
      },
    })
  } catch (error) {
    console.error("[GET /api/admin/tourists]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
