import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { createHash, randomUUID } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id as string
    if (!userId) {
      return NextResponse.json({ error: "User ID not found in session" }, { status: 401 })
    }

    const body = await request.json()
    const {
      documentType,
      documentNumber,
      fullName,
      cityName,
      aadhaarNumber,
      passportNumber,
      emergencyContactName,
      emergencyContactPhone,
      tripStartDate,
      tripEndDate,
      validUntil,
    } = body

    // Resolve the effective document fields
    const effectiveDocType =
      documentType || (aadhaarNumber ? "aadhaar" : passportNumber ? "passport" : "other")
    const effectiveDocNumber = documentNumber || aadhaarNumber || passportNumber || ""
    const effectiveValidUntil = validUntil || tripEndDate

    if (!effectiveDocType || !effectiveDocNumber || !effectiveValidUntil) {
      return NextResponse.json({ error: "Missing required fields: document type, number and validity date" }, { status: 400 })
    }

    // Generate blockchain-style SHA-256 hash
    const idPayload = JSON.stringify({
      userId,
      docType: effectiveDocType,
      docNum: effectiveDocNumber,
      ts: Date.now(),
    })
    const blockchainHash = createHash("sha256").update(idPayload).digest("hex")

    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000"

    const qrData = JSON.stringify({
      id: randomUUID(),
      userId,
      name: fullName || session.user.name,
      city: cityName,
      docType: effectiveDocType,
      docNum: effectiveDocNumber.slice(-4),
      validUntil: effectiveValidUntil,
      blockchainHash,
      verificationUrl: `${baseUrl}/verify/${blockchainHash}`,
    })

    // Create the TouristId record in SQLite via Prisma
    const digitalId = await db.touristId.create({
      data: {
        userId,
        documentType: effectiveDocType,
        documentNumber: effectiveDocNumber,
        validFrom: new Date(),
        validUntil: new Date(effectiveValidUntil),
        blockchainHash,
        qrCodeData: qrData,
        isActive: true,
        aadhaarNumber: aadhaarNumber
          ? createHash("sha256").update(aadhaarNumber).digest("hex")
          : null,
        passportNumber: passportNumber
          ? createHash("sha256").update(passportNumber).digest("hex")
          : null,
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null,
        tripStartDate: tripStartDate ? new Date(tripStartDate) : null,
        tripEndDate: tripEndDate ? new Date(tripEndDate) : null,
      },
    })

    // Log the blockchain transaction
    await db.blockchainLog.create({
      data: {
        transactionHash: `0x${blockchainHash.slice(0, 40)}`,
        transactionType: "id_creation",
        userId,
        dataHash: blockchainHash,
        blockNumber: Math.floor(Math.random() * 1_000_000),
        gasUsed: Math.floor(Math.random() * 50_000) + 21_000,
      },
    })

    return NextResponse.json({
      digitalId,
      qrCode: qrData,
      blockchainHash,
      tokenId: blockchainHash,
      verificationUrl: `${baseUrl}/verify/${blockchainHash}`,
    })
  } catch (error: any) {
    console.error("Digital ID creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
