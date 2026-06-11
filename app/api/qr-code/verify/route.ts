import { type NextRequest, NextResponse } from "next/server"
import { QRCodeGenerator, type QRCodeData } from "@/lib/qr-code/generator"
import { db } from "@/lib/db"

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

    // Get additional tourist information from database using Prisma
    const profile = await db.user.findUnique({
      where: { id: parsedData.tourist_id },
      include: {
        locationTracks: {
          orderBy: { timestamp: "desc" },
          take: 1
        },
        safetyScores: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    })

    if (!profile) {
      return NextResponse.json({ error: "Tourist not found" }, { status: 404 })
    }

    // Get latest location
    const latestLocation = profile.locationTracks?.[0]

    // Get latest safety score
    const latestSafetyScore = profile.safetyScores?.[0]

    return NextResponse.json({
      valid: true,
      tourist: {
        id: profile.id,
        full_name: profile.name,
        email: profile.email,
        phone: profile.phone,
        emergency_contact: profile.emergencyContact,
        emergency_phone: profile.emergencyPhone,
        blockchain_id: parsedData.blockchain_id,
        registration_date: profile.createdAt.toISOString(),
        current_location: latestLocation
          ? {
              latitude: latestLocation.latitude,
              longitude: latestLocation.longitude,
              timestamp: latestLocation.timestamp.toISOString(),
            }
          : null,
        safety_score: latestSafetyScore?.score || 0,
        risk_level: latestSafetyScore?.riskLevel || "unknown",
        qr_generated_at: parsedData.generated_at,
        qr_expires_at: parsedData.expires_at,
      },
    })
  } catch (error: any) {
    console.error("Error verifying QR code:", error)
    return NextResponse.json({ error: error.message || "Failed to verify QR code" }, { status: 500 })
  }
}
