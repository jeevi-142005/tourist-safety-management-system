import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { TouristIDBlockchain } from "@/lib/blockchain/tourist-id"
import { QRCodeGenerator } from "@/lib/qr-code/generator"

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

    // Get user profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Check if user already has a blockchain ID
    if (profile.blockchain_id) {
      return NextResponse.json({ error: "Tourist ID already exists" }, { status: 400 })
    }

    // Initialize blockchain service
    const blockchain = new TouristIDBlockchain()

    // Create wallet address for user (in production, user would provide their own)
    const userWalletAddress = user.id // Simplified - in production, use actual wallet

    // Mint tourist ID NFT
    const { tokenId, transactionHash, metadata } = await blockchain.mintTouristID(userWalletAddress, {
      full_name: profile.full_name || "",
      email: profile.email,
      phone: profile.phone || "",
      emergency_contact: profile.emergency_contact || "",
      emergency_phone: profile.emergency_phone || "",
      registration_date: profile.created_at,
      safety_level: "Standard",
    })

    // Generate QR code
    const { qrCodeData, qrCodeImage } = await QRCodeGenerator.generateTouristQR(user.id, tokenId, {
      full_name: profile.full_name || "",
      emergency_contact: profile.emergency_contact || "",
      emergency_phone: profile.emergency_phone || "",
    })

    // Store blockchain transaction
    const { error: transactionError } = await supabase.from("blockchain_transactions").insert({
      user_id: user.id,
      transaction_hash: transactionHash,
      contract_address: process.env.TOURIST_ID_CONTRACT_ADDRESS!,
      token_id: tokenId,
      blockchain_network: "polygon",
      status: "confirmed",
      metadata: metadata,
    })

    if (transactionError) {
      console.error("Error storing transaction:", transactionError)
    }

    // Update user profile with blockchain ID and QR code
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        blockchain_id: tokenId,
        qr_code_data: JSON.stringify(qrCodeData),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Error updating profile:", updateError)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      tokenId,
      transactionHash,
      qrCodeImage,
      qrCodeData,
      metadata,
    })
  } catch (error) {
    console.error("Error minting tourist ID:", error)
    return NextResponse.json({ error: "Failed to mint tourist ID" }, { status: 500 })
  }
}
