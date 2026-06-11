import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const alertData = await request.json()

    // Insert the offline alert into the database using Prisma
    await db.emergencyAlert.create({
      data: {
        userId: alertData.user_id,
        userName: alertData.user_name,
        type: alertData.type,
        message: alertData.message,
        severity: alertData.severity,
        locationLat: alertData.location_lat ? parseFloat(alertData.location_lat) : null,
        locationLng: alertData.location_lng ? parseFloat(alertData.location_lng) : null,
        status: 'active',
        createdAt: alertData.created_at ? new Date(alertData.created_at) : new Date(),
        deviceInfo: alertData.device_info || null,
        offlineStoredAt: alertData.storedAt ? new Date(alertData.storedAt) : null,
        syncedAt: new Date()
      }
    })

    // Create admin notification for the synced offline alert using Prisma
    await db.adminNotification.create({
      data: {
        type: 'offline_alert_synced',
        title: `Offline ${alertData.type.toUpperCase()} Alert Synced`,
        message: `Offline alert from ${alertData.user_name} has been synced to the system`,
        severity: alertData.severity,
        userId: alertData.user_id,
        metadata: {
          original_alert_id: alertData.id,
          offline_duration: new Date().getTime() - new Date(alertData.storedAt).getTime(),
          alert_type: alertData.type
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Offline alert synced successfully' 
    })

  } catch (error: any) {
    console.error('Error in offline sync:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
