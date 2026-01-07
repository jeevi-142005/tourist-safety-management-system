import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { qrData } = await request.json()

    if (!qrData) {
      return NextResponse.json({ error: "QR data is required" }, { status: 400 })
    }

    // Parse QR code data
    let parsedData
    try {
      parsedData = JSON.parse(qrData)
    } catch {
      return NextResponse.json({ error: "Invalid QR code format" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify the digital ID exists and is valid
    const { data: touristID, error } = await supabase
      .from("tourist_ids")
      .select(`
        *,
        profiles!tourist_ids_user_id_fkey (
          full_name,
          email
        )
      `)
      .eq("id", parsedData.id)
      .eq("blockchain_hash", parsedData.blockchainHash)
      .eq("is_active", true)
      .single()

    if (error || !touristID) {
      return NextResponse.json(
        {
          verified: false,
          error: "Digital ID not found or invalid",
        },
        { status: 404 },
      )
    }

    // Check if ID is expired
    const isExpired = new Date(touristID.valid_until) < new Date()
    if (isExpired) {
      return NextResponse.json(
        {
          verified: false,
          error: "Digital ID has expired",
        },
        { status: 400 },
      )
    }

    // Return verification result
    return NextResponse.json({
      verified: true,
      data: {
        id: touristID.id,
        fullName: touristID.profiles?.full_name,
        documentType: touristID.document_type,
        documentNumber: `***${touristID.document_number.slice(-4)}`,
        validFrom: touristID.valid_from,
        validUntil: touristID.valid_until,
        verifiedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Blockchain verification error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
