import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await props.params

    // Look up the TouristId by blockchain_hash, including the owner user
    const digitalId = await db.touristId.findFirst({
      where: { blockchainHash: tokenId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    if (!digitalId) {
      return NextResponse.json({ valid: false, reason: "Digital ID not found" })
    }

    if (!digitalId.isActive) {
      return NextResponse.json({ valid: false, reason: "Digital ID has been deactivated" })
    }

    if (new Date(digitalId.validUntil) < new Date()) {
      return NextResponse.json({ valid: false, reason: "Digital ID has expired" })
    }

    return NextResponse.json({
      valid: true,
      digitalId: {
        tokenId,
        blockchainHash: digitalId.blockchainHash,
        documentType: digitalId.documentType,
        documentNumber: digitalId.documentNumber,
        validFrom: digitalId.validFrom,
        validUntil: digitalId.validUntil,
        isActive: digitalId.isActive,
        createdAt: digitalId.createdAt,
        qrCodeData: digitalId.qrCodeData,
        tourist: {
          name: digitalId.user?.name || null,
          email: digitalId.user?.email || null,
          phone: digitalId.user?.phone || null,
        },
        emergencyContact: {
          name: digitalId.emergencyContactName || null,
          phone: digitalId.emergencyContactPhone || null,
        },
        tripPeriod: {
          start: digitalId.tripStartDate || null,
          end: digitalId.tripEndDate || null,
        },
      },
    })
  } catch (error) {
    console.error("Digital ID verification error:", error)
    return NextResponse.json(
      { valid: false, reason: "Verification failed" },
      { status: 500 }
    )
  }
}
