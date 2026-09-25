import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if ((session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const {
      targetUserId,
      type = "admin_broadcast",
      title = "Safety Alert from Admin Command",
      message,
      severity = "high",
      hazardDetails,
      requiresAssistancePrompt = false,
    } = body

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Identify target tourists: either specific tourist or all tourists
    let targetUsers: { id: string; name: string | null }[] = []

    if (targetUserId) {
      const user = await db.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, name: true },
      })
      if (user) targetUsers = [user]
    } else {
      targetUsers = await db.user.findMany({
        where: { role: "tourist" },
        select: { id: true, name: true },
      })
    }

    if (targetUsers.length === 0) {
      return NextResponse.json({ error: "No target tourists found" }, { status: 404 })
    }

    const alertsCreated = []

    for (const tourist of targetUsers) {
      const alert = await db.emergencyAlert.create({
        data: {
          userId: tourist.id,
          userName: tourist.name || "Tourist",
          type: type,
          message: message,
          severity: severity,
          status: "active",
          deviceInfo: {
            title,
            hazardDetails: hazardDetails || null,
            requiresAssistancePrompt,
            sentByAdmin: session.user.name || "Admin Command Center",
            sentAt: new Date().toISOString(),
          },
        },
      })
      alertsCreated.push(alert)
    }

    // Also create admin notification to track this broadcast
    await db.adminNotification.create({
      data: {
        type: "admin_broadcast",
        title: `📢 Broadcast Sent: ${title}`,
        message: `Dispatched to ${targetUsers.length} tourist(s): "${message.slice(0, 100)}..."`,
        severity: severity === "critical" ? "critical" : "info",
        metadata: {
          recipientsCount: targetUsers.length,
          type,
        },
      },
    })

    return NextResponse.json({
      success: true,
      sentCount: targetUsers.length,
      alerts: alertsCreated,
    })
  } catch (error: any) {
    console.error("[POST /api/admin/broadcast]", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
