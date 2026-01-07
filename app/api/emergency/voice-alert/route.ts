import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

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

    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const language = (formData.get("language") as string) || "en"
    const location = formData.get("location") as string

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    // Convert audio to text using Web Speech API or external service
    // For demo purposes, we'll simulate speech-to-text
    const transcribedText = await transcribeAudio(audioFile, language)

    // Analyze emergency content with AI
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

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

    // Create emergency alert
    const locationData = location ? JSON.parse(location) : null
    const { data: alert, error: alertError } = await supabase
      .from("alerts")
      .insert({
        user_id: user.id,
        alert_type: "panic",
        severity: analysis.severity,
        location: locationData ? `POINT(${locationData.lng} ${locationData.lat})` : null,
        message: analysis.summary,
        metadata: {
          emergency_type: analysis.emergencyType,
          voice_transcript: transcribedText,
          language: language,
          ai_analysis: analysis,
          alert_method: "voice",
        },
      })
      .select()
      .single()

    if (alertError) {
      console.error("Alert creation error:", alertError)
      return NextResponse.json({ error: "Failed to create alert" }, { status: 500 })
    }

    // Send notifications to emergency contacts and authorities
    await sendEmergencyNotifications(user.id, alert, analysis)

    return NextResponse.json({
      alertId: alert.id,
      transcript: transcribedText,
      analysis: analysis,
      message: "Voice emergency alert processed successfully",
    })
  } catch (error) {
    console.error("Voice emergency alert error:", error)
    return NextResponse.json({ error: "Failed to process voice alert" }, { status: 500 })
  }
}

async function transcribeAudio(audioFile: File, language: string): Promise<string> {
  // In a real implementation, you would use a speech-to-text service
  // like Google Speech-to-Text, Azure Speech Services, or AWS Transcribe
  // For demo purposes, we'll return a simulated transcription

  const simulatedTranscriptions: Record<string, string> = {
    en: "Help me, I'm lost in the forest and it's getting dark. I can't find my way back to the main trail.",
    hi: "मुझे मदद चाहिए, मैं जंगल में खो गया हूं और अंधेरा हो रहा है।",
    as: "মোক সহায় কৰক, মই হেৰাই গৈছো আৰু ভয় লাগিছে।",
  }

  return simulatedTranscriptions[language] || simulatedTranscriptions.en
}

async function sendEmergencyNotifications(userId: string, alert: any, analysis: any) {
  // Implementation for sending SMS, email, and push notifications
  // This would integrate with services like Twilio, SendGrid, etc.
  console.log("Sending emergency notifications for alert:", alert.id)
}
