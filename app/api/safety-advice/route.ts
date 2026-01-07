import { type NextRequest, NextResponse } from "next/server"
import { generateSafetyAdvice } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const { location, situation } = await request.json()

    if (!location || !situation) {
      return NextResponse.json({ error: "Location and situation are required" }, { status: 400 })
    }

    const advice = await generateSafetyAdvice(location, situation)

    return NextResponse.json({ advice })
  } catch (error) {
    console.error("Error in safety advice API:", error)
    return NextResponse.json({ error: "Failed to generate safety advice" }, { status: 500 })
  }
}
