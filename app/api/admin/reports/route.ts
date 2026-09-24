import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") // "json" | "csv"
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const dateFilter: any = {}
    if (from) dateFilter.gte = new Date(from)
    if (to) dateFilter.lte = new Date(to)
    const alertWhere = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}

    const [
      totalTourists,
      totalDigiIds,
      activeDigiIds,
      expiredDigiIds,
      totalAlerts,
      sosAlerts,
      medicalAlerts,
      resolvedAlerts,
      unresolvedAlerts,
      alertsByType,
      alertsBySeverity,
    ] = await Promise.all([
      db.user.count({ where: { role: "tourist" } }),
      db.touristId.count(),
      db.touristId.count({ where: { isActive: true, validUntil: { gte: new Date() }, suspendedAt: null } }),
      db.touristId.count({ where: { validUntil: { lt: new Date() } } }),
      db.emergencyAlert.count({ where: alertWhere }),
      db.emergencyAlert.count({ where: { ...alertWhere, type: { in: ["sos", "panic"] } } }),
      db.emergencyAlert.count({ where: { ...alertWhere, type: "medical" } }),
      db.emergencyAlert.count({ where: { ...alertWhere, status: "resolved" } }),
      db.emergencyAlert.count({ where: { ...alertWhere, status: { in: ["active", "acknowledged", "in_progress"] } } }),
      db.emergencyAlert.groupBy({ by: ["type"], _count: { id: true }, where: alertWhere }),
      db.emergencyAlert.groupBy({ by: ["severity"], _count: { id: true }, where: alertWhere }),
    ])

    const reportData = {
      generatedAt: new Date().toISOString(),
      period: { from: from || "all time", to: to || "now" },
      tourists: { total: totalTourists },
      digiIds: { total: totalDigiIds, active: activeDigiIds, expired: expiredDigiIds },
      alerts: {
        total: totalAlerts,
        sos: sosAlerts,
        medical: medicalAlerts,
        resolved: resolvedAlerts,
        unresolved: unresolvedAlerts,
        byType: alertsByType.map((r) => ({ type: r.type, count: r._count.id })),
        bySeverity: alertsBySeverity.map((r) => ({ severity: r.severity, count: r._count.id })),
      },
    }

    if (format === "csv") {
      const rows = [
        ["Metric", "Value"],
        ["Total Tourists", totalTourists],
        ["Total Digi IDs", totalDigiIds],
        ["Active Digi IDs", activeDigiIds],
        ["Expired Digi IDs", expiredDigiIds],
        ["Total Alerts", totalAlerts],
        ["SOS Alerts", sosAlerts],
        ["Medical Alerts", medicalAlerts],
        ["Resolved Alerts", resolvedAlerts],
        ["Unresolved Alerts", unresolvedAlerts],
        ...alertsByType.map((r) => [`Alert Type: ${r.type}`, r._count.id]),
        ...alertsBySeverity.map((r) => [`Severity: ${r.severity}`, r._count.id]),
      ]
      const csv = rows.map((r) => r.join(",")).join("\n")
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="safety-report-${Date.now()}.csv"`,
        },
      })
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error("[GET /api/admin/reports]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
