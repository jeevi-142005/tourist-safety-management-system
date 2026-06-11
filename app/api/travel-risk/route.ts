import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { analyzeTravelRisk } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const { destination, travelDate } = await request.json()

    if (!destination || !travelDate) {
      return NextResponse.json({ error: "Destination and travel date are required" }, { status: 400 })
    }

    const riskAnalysis = await analyzeTravelRisk(destination, travelDate)

    // Try to log the AI analysis to the database if the user is authenticated
    try {
      const session = await getServerSession(authOptions)
      if (session?.user && (session.user as any).id) {
        await db.aiAnalysis.create({
          data: {
            userId: (session.user as any).id,
            analysisType: "travel_risk",
            results: { input: { destination, travelDate }, riskAnalysis },
            confidence: 0.9,
          }
        })
      }
    } catch (dbError) {
      console.error("Failed to log travel risk to database:", dbError)
      // Continue anyway, we have the analysis
    }

    return NextResponse.json({ riskAnalysis })
  } catch (error: any) {
    console.error("Error in travel risk API:", error)
    return NextResponse.json({ error: error.message || "Failed to analyze travel risk" }, { status: 500 })
  }
}
