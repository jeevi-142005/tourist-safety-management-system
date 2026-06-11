import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { AIAutomationService } from "@/lib/ai-automation"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id as string

    // Fetch the user's recent alerts from the database
    const recentAlerts = await db.emergencyAlert.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    })

    // Get user details
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Map Prisma alerts to the type expected by AIAutomationService
    const mappedAlerts = recentAlerts.map(a => ({
      id: a.id,
      touristId: a.userId,
      touristName: a.userName,
      type: a.type as "emergency" | "medical" | "security" | "assistance",
      message: a.message,
      location: a.locationLat && a.locationLng ? { latitude: a.locationLat, longitude: a.locationLng, address: "" } : { latitude: 0, longitude: 0, address: "" },
      timestamp: a.createdAt.toISOString(),
      status: a.status as "active" | "resolved" | "investigating",
      priority: a.severity as "low" | "medium" | "high" | "critical"
    }))

    const mappedUser = {
      id: user.id,
      email: user.email,
      name: user.name || "Tourist",
      role: user.role as "tourist" | "admin",
      createdAt: user.createdAt.toISOString()
    }

    const aiAutomation = AIAutomationService.getInstance()
    
    const [predictionResult, recommendationResult] = await Promise.all([
      aiAutomation.predictSafetyRisks(mappedUser, mappedAlerts),
      aiAutomation.generateSafetyRecommendations({ lat: 40.7128, lng: -74.006 }, mappedAlerts) // Default or extracted location
    ])

    return NextResponse.json({
      predictions: predictionResult,
      recommendations: recommendationResult
    })

  } catch (error: any) {
    console.error("[GET /api/ai/safety-assistant] Error:", error)
    return NextResponse.json({ error: error.message || "Failed to generate AI insights" }, { status: 500 })
  }
}
