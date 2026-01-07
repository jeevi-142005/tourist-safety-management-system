import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const alertData = await request.json()

    // Insert the offline alert into the database
    const { error: insertError } = await supabase
      .from('emergency_alerts')
      .insert({
        user_id: alertData.user_id,
        user_name: alertData.user_name,
        type: alertData.type,
        message: alertData.message,
        severity: alertData.severity,
        location_lat: alertData.location_lat,
        location_lng: alertData.location_lng,
        status: 'active',
        created_at: alertData.created_at,
        device_info: alertData.device_info,
        offline_stored_at: alertData.storedAt,
        synced_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error syncing offline alert:', insertError)
      return NextResponse.json({ error: 'Failed to sync alert' }, { status: 500 })
    }

    // Create admin notification for the synced offline alert
    const { error: notificationError } = await supabase
      .from('admin_notifications')
      .insert({
        type: 'offline_alert_synced',
        title: `Offline ${alertData.type.toUpperCase()} Alert Synced`,
        message: `Offline alert from ${alertData.user_name} has been synced to the system`,
        severity: alertData.severity,
        user_id: alertData.user_id,
        metadata: {
          original_alert_id: alertData.id,
          offline_duration: new Date().getTime() - new Date(alertData.storedAt).getTime(),
          alert_type: alertData.type
        }
      })

    if (notificationError) {
      console.warn('Failed to create admin notification:', notificationError)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Offline alert synced successfully' 
    })

  } catch (error) {
    console.error('Error in offline sync:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
