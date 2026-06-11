import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { generateSafetyAdvice } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const { location, situation } = await request.json()

    if (!location || !situation) {
      return NextResponse.json({ error: "Location and situation are required" }, { status: 400 })
    }

    const advice = await generateSafetyAdvice(location, situation)

    // Try to log the AI analysis to the database if the user is authenticated
    try {
      const session = await getServerSession(authOptions)
      if (session?.user && (session.user as any).id) {
        await db.aiAnalysis.create({
          data: {
            userId: (session.user as any).id,
            analysisType: "safety_advice",
            results: { input: { location, situation }, advice },
            confidence: 0.9,
          }
        })
      }
    } catch (dbError) {
      console.error("Failed to log safety advice to database:", dbError)
      // Continue anyway, we have the advice
    }

    return NextResponse.json({ advice })
  } catch (error: any) {
    console.error("Error in safety advice API:", error)
    return NextResponse.json({ error: error.message || "Failed to generate safety advice" }, { status: 500 })
  }
}
