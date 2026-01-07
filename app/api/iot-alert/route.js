import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { device_id, device_name, alert_type, message, location_lat, location_lng, battery_level, signal_strength } = await request.json()

    const { data, error } = await supabase
      .from('iot_device_alerts')
      .insert([{
        device_id,
        device_name,
        alert_type,
        message,
        location_lat: parseFloat(location_lat),
        location_lng: parseFloat(location_lng),
        battery_level: parseInt(battery_level),
        signal_strength: parseInt(signal_strength),
        status: 'active'
      }])

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
