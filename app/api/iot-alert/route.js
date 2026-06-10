import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { device_id, device_name, alert_type, message, location_lat, location_lng, battery_level, signal_strength } = await request.json()

    const data = await db.iotDeviceAlert.create({
      data: {
        deviceId: device_id,
        deviceName: device_name,
        alertType: alert_type,
        message,
        locationLat: parseFloat(location_lat),
        locationLng: parseFloat(location_lng),
        batteryLevel: parseInt(battery_level),
        signalStrength: parseInt(signal_strength),
        status: 'active'
      }
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
