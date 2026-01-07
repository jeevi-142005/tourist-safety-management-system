import { type NextRequest, NextResponse } from "next/server"
import { analyzeTravelRisk } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const { destination, travelDate } = await request.json()

    if (!destination || !travelDate) {
      return NextResponse.json({ error: "Destination and travel date are required" }, { status: 400 })
    }

    const riskAnalysis = await analyzeTravelRisk(destination, travelDate)

    return NextResponse.json({ riskAnalysis })
  } catch (error) {
    console.error("Error in travel risk API:", error)
    return NextResponse.json({ error: "Failed to analyze travel risk" }, { status: 500 })
  }
}
