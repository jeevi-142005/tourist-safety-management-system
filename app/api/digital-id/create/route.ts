import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { blockchainClient } from "@/lib/blockchain/client"
import { encryptionService } from "@/lib/crypto/encryption"
import QRCode from "qrcode"
import { crypto } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { aadhaarNumber, passportNumber, emergencyContactName, emergencyContactPhone, tripStartDate, tripEndDate } =
      body

    // Encrypt sensitive data
    const encryptedAadhaar = aadhaarNumber ? await encryptionService.encrypt(aadhaarNumber) : null
    const encryptedPassport = passportNumber ? await encryptionService.encrypt(passportNumber) : null

    // Create blockchain entry
    const blockchainResult = await blockchainClient.createDigitalID({
      userId: user.id,
      aadhaarHash: aadhaarNumber ? await encryptionService.hashSensitiveData(aadhaarNumber) : "",
      passportHash: passportNumber ? await encryptionService.hashSensitiveData(passportNumber) : "",
      validUntil: new Date(tripEndDate),
    })

    // Generate QR code data
    const qrData = {
      id: crypto.randomUUID(),
      userId: user.id,
      tokenId: blockchainResult.tokenId,
      validUntil: tripEndDate,
      emergencyContact: emergencyContactPhone,
      verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${blockchainResult.tokenId}`,
    }

    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: "M",
      type: "image/png",
      quality: 0.92,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })

    // Store in database
    const { data: digitalId, error } = await supabase
      .from("digital_tourist_ids")
      .insert({
        user_id: user.id,
        blockchain_hash: blockchainResult.transactionHash,
        qr_code_data: JSON.stringify(qrData),
        aadhaar_number: encryptedAadhaar,
        passport_number: encryptedPassport,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
        trip_start_date: tripStartDate,
        trip_end_date: tripEndDate,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to create digital ID" }, { status: 500 })
    }

    // Log blockchain transaction
    await supabase.from("blockchain_logs").insert({
      transaction_hash: blockchainResult.transactionHash,
      transaction_type: "id_creation",
      user_id: user.id,
      data_hash: await encryptionService.hashSensitiveData(JSON.stringify(qrData)),
    })

    return NextResponse.json({
      digitalId,
      qrCode: qrCodeDataUrl,
      blockchainHash: blockchainResult.transactionHash,
      tokenId: blockchainResult.tokenId,
    })
  } catch (error) {
    console.error("Digital ID creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
