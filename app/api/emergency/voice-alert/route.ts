import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { db } from "@/lib/db"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "mock-key")

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUser = session.user as any
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const language = (formData.get("language") as string) || "en"
    const location = formData.get("location") as string

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    // Convert audio to text using Web Speech API or external service (simulated)
    const transcribedText = await transcribeAudio(audioFile, language)

    // Analyze emergency content with AI
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const prompt = `
    Analyze the following emergency voice message and extract key information:
    
    Transcribed Text: "${transcribedText}"
    Language: ${language}
    
    Extract:
    1. Emergency type (medical, security, natural disaster, other)
    2. Severity level (low, medium, high, critical)
    3. Key details and context
    4. Immediate actions needed
    
    Return JSON:
    {
      "emergencyType": "medical|security|natural_disaster|other",
      "severity": "low|medium|high|critical",
      "summary": "brief summary",
      "details": "extracted details",
      "actions": ["immediate actions needed"]
    }
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const analysisText = response.text()

    let analysis
    try {
      analysis = JSON.parse(analysisText)
    } catch (error) {
      analysis = {
        emergencyType: "other",
        severity: "high",
        summary: "Voice emergency alert received",
        details: transcribedText,
        actions: ["Contact emergency services", "Verify tourist location"],
      }
    }

    // Create emergency alert in database (mapped to AdminNotification model)
    const locationData = location ? JSON.parse(location) : null
    
    const alert = await db.adminNotification.create({
      data: {
        userId: currentUser.id,
        type: "panic",
        severity: analysis.severity,
        title: "Emergency Panic Alert (Voice)",
        message: analysis.summary,
        metadata: {
          emergency_type: analysis.emergencyType,
          voice_transcript: transcribedText,
          language: language,
          ai_analysis: analysis,
          alert_method: "voice",
          location: locationData,
        },
      }
    })

    // Send notifications to emergency contacts and authorities
    await sendEmergencyNotifications(currentUser.id, alert, analysis)

    return NextResponse.json({
      alertId: alert.id,
      transcript: transcribedText,
      analysis: analysis,
      message: "Voice emergency alert processed successfully",
    })
  } catch (error: any) {
    console.error("Voice emergency alert error:", error)
    return NextResponse.json({ error: error.message || "Failed to process voice alert" }, { status: 500 })
  }
}

async function transcribeAudio(audioFile: File, language: string): Promise<string> {
  const simulatedTranscriptions: Record<string, string> = {
    en: "Help me, I'm lost in the forest and it's getting dark. I can't find my way back to the main trail.",
    hi: "मुझे मदद चाहिए, मैं जंगल में खो गया हूं और अंधेरा हो रहा है।",
    as: "মোক সহায় কৰক, মই হেৰাই গৈছো আৰু ভয় লাগিছে।",
  }

  return simulatedTranscriptions[language] || simulatedTranscriptions.en
}

async function sendEmergencyNotifications(userId: string, alert: any, analysis: any) {
  console.log("Sending emergency notifications for alert:", alert.id)
}
