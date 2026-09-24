import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"

// POST /api/offline-alert — sync queued offline alerts when back online
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { alerts, userId } = body

    const uid = (session?.user as any)?.id || userId
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const created = []
    for (const alert of alerts) {
      const record = await db.alert.create({
        data: {
          userId: uid,
          type: alert.type || "emergency",
          message: alert.message || "Offline SOS alert",
          severity: alert.severity || "high",
          status: "active",
          metadata: {
            offline: true,
            queuedAt: alert.queuedAt,
            syncedAt: new Date().toISOString(),
            location: alert.location || null,
          },
        },
      })
      created.push(record)
    }

    return NextResponse.json({ synced: created.length, alerts: created })
  } catch (error: any) {
    console.error("Offline alert sync error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
