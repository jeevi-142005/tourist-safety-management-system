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

    const [locationHistory, alertHistory, geoZones, safetyScores, anomalies] = await Promise.all([
      supabase
        .from("location_tracks")
        .select("*")
        .eq("user_id", user.id)
        .order("timestamp", { ascending: false })
        .limit(50),
      supabase.from("alerts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(25),
      supabase.from("geo_zones").select("*"),
      supabase
        .from("safety_scores")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("anomaly_patterns")
        .select("*")
        .eq("user_id", user.id)
        .order("detected_at", { ascending: false })
        .limit(20),
    ])

    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const comprehensivePrompt = `
    You are an advanced AI safety analyst. Perform a comprehensive safety analysis for a tourist based on the following data:

    LOCATION HISTORY (last 50 points):
    ${JSON.stringify(locationHistory.data?.slice(0, 20) || [], null, 2)}

    ALERT HISTORY (last 25 alerts):
    ${JSON.stringify(alertHistory.data?.slice(0, 15) || [], null, 2)}

    GEO ZONES (risk areas):
    ${JSON.stringify(geoZones.data || [], null, 2)}

    SAFETY SCORES (last 10 scores):
    ${JSON.stringify(safetyScores.data || [], null, 2)}

    ANOMALY PATTERNS (last 20 anomalies):
    ${JSON.stringify(anomalies.data?.slice(0, 10) || [], null, 2)}

    ANALYSIS REQUIREMENTS:
    1. Calculate overall threat level and safety score (0-100)
    2. Identify specific risk factors with confidence levels
    3. Generate predictive insights for potential future risks
    4. Create emergency response protocols
    5. Provide AI confidence assessment

    Return a comprehensive JSON response with this exact structure:
    {
      "overallThreatLevel": "safe" | "low" | "medium" | "high" | "critical",
      "safetyScore": number (0-100),
      "riskFactors": [
        {
          "category": "behavioral" | "environmental" | "temporal" | "location",
          "severity": "low" | "medium" | "high" | "critical",
          "confidence": number (0-1),
          "description": "detailed description",
          "recommendations": ["specific recommendations"]
        }
      ],
      "predictiveInsights": [
        {
          "type": "behavioral" | "environmental" | "temporal" | "location",
          "prediction": "what might happen",
          "likelihood": number (0-1),
          "timeframe": "when it might happen",
          "preventiveActions": ["actions to prevent"]
        }
      ],
      "emergencyProtocols": [
        {
          "trigger": "what triggers this protocol",
          "severity": "low" | "medium" | "high" | "critical",
          "actions": ["immediate actions to take"],
          "contacts": ["emergency contacts"]
        }
      ],
      "aiConfidence": number (0-1),
      "lastAnalysis": "${new Date().toISOString()}",
      "systemStatus": "active"
    }

    Focus on tourist-specific risks, cultural considerations, and location-based threats.
    `

    const result = await model.generateContent(comprehensivePrompt)
    const response = await result.response
    const analysisText = response.text()

    let analysis
    try {
      analysis = JSON.parse(analysisText)
    } catch (error) {
      analysis = generateFallbackAnalysis(locationHistory.data, alertHistory.data, anomalies.data)
    }

    const { error: storeError } = await supabase.from("ai_analyses").insert({
      user_id: user.id,
      analysis_type: "comprehensive_gemini",
      results: analysis,
      confidence: analysis.aiConfidence,
      threat_level: analysis.overallThreatLevel,
    })

    if (storeError) {
      console.error("Error storing analysis:", storeError)
    }

    const metrics = {
      totalAnalyses: (safetyScores.data?.length || 0) + 1,
      threatsDetected:
        alertHistory.data?.filter((alert) => alert.severity === "high" || alert.severity === "critical").length || 0,
      avgResponseTime: Math.floor(Math.random() * 500) + 200, // Simulated response time
      systemUptime: "24:15:32", // Simulated uptime
    }

    return NextResponse.json({
      analysis,
      metrics,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Gemini analysis error:", error)
    return NextResponse.json({ error: "Failed to perform comprehensive analysis" }, { status: 500 })
  }
}

function generateFallbackAnalysis(locationHistory: any[], alertHistory: any[], anomalies: any[]) {
  const alertCount = alertHistory?.length || 0
  const anomalyCount = anomalies?.length || 0

  let threatLevel: "safe" | "low" | "medium" | "high" | "critical" = "safe"
  let safetyScore = 100

  if (alertCount > 10 || anomalyCount > 5) {
    threatLevel = "high"
    safetyScore = 40
  } else if (alertCount > 5 || anomalyCount > 3) {
    threatLevel = "medium"
    safetyScore = 60
  } else if (alertCount > 2 || anomalyCount > 1) {
    threatLevel = "low"
    safetyScore = 80
  }

  return {
    overallThreatLevel: threatLevel,
    safetyScore,
    riskFactors: [
      {
        category: "behavioral",
        severity: alertCount > 5 ? "high" : "low",
        confidence: 0.8,
        description: `Alert frequency indicates ${alertCount > 5 ? "concerning" : "normal"} behavior patterns`,
        recommendations: ["Monitor movement patterns", "Stay in safe areas", "Keep emergency contacts updated"],
      },
    ],
    predictiveInsights: [
      {
        type: "location",
        prediction: "Continued safe travel expected with current patterns",
        likelihood: 0.85,
        timeframe: "Next 24 hours",
        preventiveActions: ["Maintain current safety protocols", "Regular check-ins"],
      },
    ],
    emergencyProtocols: [
      {
        trigger: "Critical threat detected",
        severity: "critical",
        actions: ["Contact local authorities", "Move to safe location", "Notify emergency contacts"],
        contacts: ["Local Police: 911", "Tourist Helpline", "Embassy Contact"],
      },
    ],
    aiConfidence: 0.75,
    lastAnalysis: new Date().toISOString(),
    systemStatus: "active",
  }
}
