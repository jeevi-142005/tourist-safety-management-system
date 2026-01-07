import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { blockchainClient } from "@/lib/blockchain/client"

export async function GET(request: NextRequest, { params }: { params: { tokenId: string } }) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const { tokenId } = params

    // Verify on blockchain
    const blockchainData = await blockchainClient.verifyDigitalID(tokenId)

    if (!blockchainData.isActive) {
      return NextResponse.json({
        valid: false,
        reason: "Digital ID has been deactivated",
      })
    }

    // Check if still valid
    const now = Math.floor(Date.now() / 1000)
    if (blockchainData.validUntil < now) {
      return NextResponse.json({
        valid: false,
        reason: "Digital ID has expired",
      })
    }

    // Get additional details from database
    const { data: digitalId } = await supabase
      .from("digital_tourist_ids")
      .select(`
        *,
        profiles:user_id (
          full_name,
          email,
          phone
        )
      `)
      .eq("blockchain_hash", tokenId)
      .single()

    return NextResponse.json({
      valid: true,
      digitalId: {
        tokenId,
        validUntil: new Date(blockchainData.validUntil * 1000),
        tourist: digitalId?.profiles,
        emergencyContact: {
          name: digitalId?.emergency_contact_name,
          phone: digitalId?.emergency_contact_phone,
        },
        tripPeriod: {
          start: digitalId?.trip_start_date,
          end: digitalId?.trip_end_date,
        },
      },
    })
  } catch (error) {
    console.error("Digital ID verification error:", error)
    return NextResponse.json(
      {
        valid: false,
        reason: "Verification failed",
      },
      { status: 500 },
    )
  }
}
