import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const rawParams = await Promise.resolve(context.params)
    const id = rawParams.id
    const body = await request.json()
    const { status, notes } = body

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    const updaterName = session?.user?.name || (session?.user as any)?.role || "Emergency Unit"

    const existingAlert = await db.emergencyAlert.findUnique({ where: { id } })
    if (!existingAlert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 })
    }

    const currentDeviceInfo = (typeof existingAlert.deviceInfo === "object" && existingAlert.deviceInfo !== null)
      ? (existingAlert.deviceInfo as Record<string, any>)
      : {}

    const updatedDeviceInfo = {
      ...currentDeviceInfo,
      ...(status === "resolved" ? {
        resolvedAt: new Date().toISOString(),
        resolvedBy: updaterName,
      } : {}),
      ...(status === "in_progress" ? {
        enRouteAt: new Date().toISOString(),
        enRouteBy: updaterName,
      } : {}),
    }

    const alert = await db.emergencyAlert.update({
      where: { id },
      data: {
        status,
        deviceInfo: updatedDeviceInfo,
      },
    })

    // Synchronize assignments
    if (status === "resolved") {
      await db.alertAssignment.updateMany({
        where: { alertId: id },
        data: { status: "completed", notes: notes || "Mission successfully completed by responder." },
      })

      // Notify admin
      await db.adminNotification.create({
        data: {
          type: "alert_resolved",
          title: `✅ Mission Completed: ${alert.userName}`,
          message: `Distress signal from ${alert.userName} (${alert.type.toUpperCase()}) was marked as RESOLVED by ${updaterName}.`,
          severity: "info",
          userId: alert.userId,
          metadata: { alertId: id, resolvedBy: updaterName },
        },
      })
    } else if (status === "in_progress") {
      await db.alertAssignment.updateMany({
        where: { alertId: id },
        data: { status: "en_route" },
      })
    }

    return NextResponse.json({ success: true, alert })
  } catch (error: any) {
    console.error("Error updating alert:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update alert" },
      { status: 500 }
    )
  }
}
