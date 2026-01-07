import { type NextRequest, NextResponse } from "next/server"
import { QRCodeGenerator, type QRCodeData } from "@/lib/qr-code/generator"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { qrCodeData } = await request.json()

    if (!qrCodeData) {
      return NextResponse.json({ error: "QR code data required" }, { status: 400 })
    }

    // Parse QR code data
    let parsedData: QRCodeData
    try {
      parsedData = typeof qrCodeData === "string" ? JSON.parse(qrCodeData) : qrCodeData
    } catch (error) {
      return NextResponse.json({ error: "Invalid QR code format" }, { status: 400 })
    }

    // Verify QR code
    const isValid = QRCodeGenerator.verifyQRCode(parsedData)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid or expired QR code" }, { status: 400 })
    }

    // Get additional tourist information from database
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const { data: profile } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        phone,
        emergency_contact,
        emergency_phone,
        created_at,
        location_tracks (
          latitude,
          longitude,
          timestamp
        ),
        safety_scores (
          score,
          risk_level,
          created_at
        )
      `)
      .eq("id", parsedData.tourist_id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Tourist not found" }, { status: 404 })
    }

    // Get latest location
    const latestLocation = profile.location_tracks?.[0]

    // Get latest safety score
    const latestSafetyScore = profile.safety_scores?.[0]

    return NextResponse.json({
      valid: true,
      tourist: {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        emergency_contact: profile.emergency_contact,
        emergency_phone: profile.emergency_phone,
        blockchain_id: parsedData.blockchain_id,
        registration_date: profile.created_at,
        current_location: latestLocation
          ? {
              latitude: latestLocation.latitude,
              longitude: latestLocation.longitude,
              timestamp: latestLocation.timestamp,
            }
          : null,
        safety_score: latestSafetyScore?.score || 0,
        risk_level: latestSafetyScore?.risk_level || "unknown",
        qr_generated_at: parsedData.generated_at,
        qr_expires_at: parsedData.expires_at,
      },
    })
  } catch (error) {
    console.error("Error verifying QR code:", error)
    return NextResponse.json({ error: "Failed to verify QR code" }, { status: 500 })
  }
}
