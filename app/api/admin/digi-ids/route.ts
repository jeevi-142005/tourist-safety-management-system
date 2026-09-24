import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"

function getDigiIdStatus(id: { isActive: boolean; validUntil: Date; suspendedAt: Date | null }) {
  if (id.suspendedAt) return "suspended"
  if (!id.isActive) return "inactive"
  if (id.validUntil < new Date()) return "expired"
  return "active"
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") // active | expired | suspended | all
    const search = searchParams.get("search") || ""

    const touristIds = await db.touristId.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            emergencyContact: true,
            emergencyPhone: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    let filtered = touristIds.map((t) => ({
      id: t.id,
      userId: t.userId,
      documentType: t.documentType,
      documentNumber: t.documentNumber,
      validFrom: t.validFrom.toISOString(),
      validUntil: t.validUntil.toISOString(),
      blockchainHash: t.blockchainHash,
      qrCodeData: t.qrCodeData,
      isActive: t.isActive,
      suspendedAt: t.suspendedAt?.toISOString() ?? null,
      suspendedReason: t.suspendedReason ?? null,
      createdAt: t.createdAt.toISOString(),
      emergencyContactName: t.emergencyContactName,
      emergencyContactPhone: t.emergencyContactPhone,
      tripStartDate: t.tripStartDate?.toISOString() ?? null,
      tripEndDate: t.tripEndDate?.toISOString() ?? null,
      status: getDigiIdStatus(t),
      user: t.user,
    }))

    if (status && status !== "all") {
      filtered = filtered.filter((t) => t.status === status)
    }

    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.user?.name?.toLowerCase().includes(q) ||
          t.user?.email?.toLowerCase().includes(q) ||
          t.blockchainHash.toLowerCase().includes(q) ||
          t.documentType.toLowerCase().includes(q)
      )
    }

    return NextResponse.json({ digiIds: filtered, total: filtered.length })
  } catch (error) {
    console.error("[GET /api/admin/digi-ids]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH — suspend or reactivate a Digi ID
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    const { id, action, reason } = body // action: "suspend" | "activate"

    if (!id || !action) return NextResponse.json({ error: "id and action required" }, { status: 400 })

    const updated = await db.touristId.update({
      where: { id },
      data:
        action === "suspend"
          ? { suspendedAt: new Date(), suspendedReason: reason || "Suspended by admin", isActive: false }
          : { suspendedAt: null, suspendedReason: null, isActive: true },
    })

    return NextResponse.json({ success: true, id: updated.id })
  } catch (error) {
    console.error("[PATCH /api/admin/digi-ids]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST — Create Tourist Digi ID & Digital Persona directly by Admin
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    const {
      fullName,
      email,
      phone,
      documentType,
      documentNumber,
      emergencyContactName,
      emergencyContactPhone,
      tripStartDate,
      tripEndDate,
    } = body

    if (!fullName || !email || !documentType || !documentNumber || !tripEndDate) {
      return NextResponse.json({ error: "Full Name, Email, Document Type, Document Number, and Validity Date are required" }, { status: 400 })
    }

    const effectiveDocType = (documentType || "passport").toLowerCase()
    const effectiveDocNumber = String(documentNumber).trim()
    const validUntilDate = new Date(tripEndDate)
    const validFromDate = tripStartDate ? new Date(tripStartDate) : new Date()

    // 1. Find or Create Tourist User
    let user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      const crypto = await import("crypto")
      const bcrypt = (await import("bcrypt")).default
      const defaultPassword = await bcrypt.hash("Tourist@123", 10)
      const blockchainId = "BLK-" + crypto.randomBytes(4).toString("hex").toUpperCase()

      user = await db.user.create({
        data: {
          name: fullName.trim(),
          email: email.toLowerCase().trim(),
          phone: phone ? String(phone).trim() : null,
          passwordHash: defaultPassword,
          role: "tourist",
          blockchainId,
          emergencyContact: emergencyContactName ? String(emergencyContactName).trim() : null,
          emergencyPhone: emergencyContactPhone ? String(emergencyContactPhone).trim() : null,
        },
      })
    } else {
      // Update user contact info if provided
      user = await db.user.update({
        where: { id: user.id },
        data: {
          name: fullName.trim() || user.name,
          phone: phone ? String(phone).trim() : user.phone,
          emergencyContact: emergencyContactName ? String(emergencyContactName).trim() : user.emergencyContact,
          emergencyPhone: emergencyContactPhone ? String(emergencyContactPhone).trim() : user.emergencyPhone,
        },
      })
    }

    // 2. Generate SHA-256 Blockchain Hash for identity token
    const crypto = await import("crypto")
    const idPayload = JSON.stringify({
      userId: user.id,
      docType: effectiveDocType,
      docNum: effectiveDocNumber,
      ts: Date.now(),
    })
    const blockchainHash = crypto.createHash("sha256").update(idPayload).digest("hex")

    // 3. Hash sensitive numbers securely (do not store raw Aadhaar/Passport)
    const docHash = crypto.createHash("sha256").update(effectiveDocNumber).digest("hex")

    // 4. Construct secure QR payload (token metadata only, no raw sensitive numbers)
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000"

    const qrData = JSON.stringify({
      id: crypto.randomUUID(),
      userId: user.id,
      name: user.name,
      docType: effectiveDocType,
      docNum: effectiveDocNumber.slice(-4),
      validUntil: validUntilDate.toISOString(),
      blockchainHash,
      verificationUrl: `${baseUrl}/verify/${blockchainHash}`,
    })

    // 5. Create TouristId record in DB
    const digitalId = await db.touristId.create({
      data: {
        userId: user.id,
        documentType: effectiveDocType,
        documentNumber: effectiveDocNumber.slice(-4), // store last 4 digits only
        validFrom: validFromDate,
        validUntil: validUntilDate,
        blockchainHash,
        qrCodeData: qrData,
        isActive: true,
        aadhaarNumber: effectiveDocType === "aadhaar" ? docHash : null,
        passportNumber: effectiveDocType === "passport" ? docHash : null,
        emergencyContactName: emergencyContactName ? String(emergencyContactName).trim() : null,
        emergencyContactPhone: emergencyContactPhone ? String(emergencyContactPhone).trim() : null,
        tripStartDate: validFromDate,
        tripEndDate: validUntilDate,
      },
    })

    // 6. Initialize initial SafetyScore record for Digital Persona
    await db.safetyScore.create({
      data: {
        userId: user.id,
        score: 95,
        riskLevel: "low",
        factors: JSON.stringify(["admin_created_digi_id", "identity_verified"]),
        recommendations: JSON.stringify(["Keep GPS active", "Stay within designated tourist zones"]),
        analysisSummary: "Tourist Digital Persona activated by Safety Command Admin.",
      },
    })

    // 7. Log Blockchain Transaction
    await db.blockchainLog.create({
      data: {
        transactionHash: `0x${blockchainHash.slice(0, 40)}`,
        transactionType: "admin_id_creation",
        userId: user.id,
        dataHash: blockchainHash,
        blockNumber: Math.floor(Math.random() * 1_000_000) + 500_000,
        gasUsed: Math.floor(Math.random() * 50_000) + 21_000,
      },
    })

    return NextResponse.json({
      success: true,
      digitalId: {
        id: digitalId.id,
        userId: user.id,
        documentType: digitalId.documentType,
        validFrom: digitalId.validFrom.toISOString(),
        validUntil: digitalId.validUntil.toISOString(),
        blockchainHash: digitalId.blockchainHash,
        qrCodeData: digitalId.qrCodeData,
        status: "active",
        createdAt: digitalId.createdAt.toISOString(),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          emergencyContact: user.emergencyContact,
          emergencyPhone: user.emergencyPhone,
        },
      },
      qrCodeData: qrData,
      blockchainHash,
    })
  } catch (error: any) {
    console.error("[POST /api/admin/digi-ids]", error)
    return NextResponse.json({ error: error.message || "Failed to create Tourist Digi ID" }, { status: 500 })
  }
}

