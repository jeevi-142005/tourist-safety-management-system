import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from "@/lib/supabase/server"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

interface DeviceMetrics {
  battery_level: number
  connection_strength: number
  location_accuracy: number
  movement_pattern: string
  ambient_light: number
  noise_level: number
}

interface AnomalyDetectionRequest {
  user_id: string
  device_metrics: DeviceMetrics
  location: { lat: number; lng: number }
  timestamp: string
}

export async function POST(request: NextRequest) {
  try {
    const body: AnomalyDetectionRequest = await request.json()
    const { user_id, device_metrics, location, timestamp } = body

    const supabase = createClient()

    // Get user's historical data for pattern analysis
    const { data: historicalAlerts } = await supabase
      .from("alerts")
      .select("*")
      .eq("tourist_id", user_id)
      .order("created_at", { ascending: false })
      .limit(50)

    const { data: historicalMetrics } = await supabase
      .from("device_metrics")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(100)

    // Store current metrics
    await supabase.from("device_metrics").insert({
      user_id,
      battery_level: device_metrics.battery_level,
      connection_strength: device_metrics.connection_strength,
      location_accuracy: device_metrics.location_accuracy,
      movement_pattern: device_metrics.movement_pattern,
      ambient_light: device_metrics.ambient_light,
      noise_level: device_metrics.noise_level,
      location_lat: location.lat,
      location_lng: location.lng,
    })

    // Prepare AI analysis prompt
    const analysisPrompt = `
You are an advanced AI anomaly detection system for tourist safety. Analyze the following data and identify potential anomalies or safety concerns.

Current Device Metrics:
- Battery Level: ${device_metrics.battery_level}%
- Connection Strength: ${device_metrics.connection_strength}%
- Location Accuracy: ${device_metrics.location_accuracy}%
- Movement Pattern: ${device_metrics.movement_pattern}
- Ambient Light: ${device_metrics.ambient_light}%
- Noise Level: ${device_metrics.noise_level}%
- Location: ${location.lat}, ${location.lng}
- Timestamp: ${timestamp}

Historical Context:
- Recent Alerts: ${historicalAlerts?.length || 0} in the past period
- Historical Metrics Available: ${historicalMetrics?.length || 0} data points

Analyze for these anomaly types:
1. BEHAVIORAL: Unusual movement patterns, activity changes
2. LOCATION: Dangerous areas, unexpected location changes
3. DEVICE: Battery drain, connectivity issues, sensor anomalies
4. ENVIRONMENTAL: Unusual ambient conditions
5. TEMPORAL: Time-based pattern deviations

For each detected anomaly, provide:
- Type (behavioral/location/device/environmental/temporal)
- Severity (low/medium/high/critical)
- Confidence (0.0-1.0)
- Description (brief explanation)
- Risk factors (array of specific concerns)
- Recommendations (array of actionable advice)

Return ONLY a JSON object with this structure:
{
  "anomalies": [
    {
      "type": "behavioral",
      "severity": "medium",
      "confidence": 0.85,
      "description": "Unusual movement pattern detected",
      "risk_factors": ["irregular_movement", "location_change"],
      "recommendations": ["Stay in well-lit areas", "Contact emergency services if needed"]
    }
  ],
  "overall_threat_level": "medium",
  "analysis_confidence": 0.92
}

If no significant anomalies are detected, return:
{
  "anomalies": [],
  "overall_threat_level": "safe",
  "analysis_confidence": 0.95
}
`

    const model = genAI.getGenerativeModel({ model: "gemini-pro" })
    const result = await model.generateContent(analysisPrompt)
    const response = await result.response
    const analysisText = response.text()

    let analysisResult
    try {
      analysisResult = JSON.parse(analysisText)
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError)
      // Fallback response
      analysisResult = {
        anomalies: [],
        overall_threat_level: "safe",
        analysis_confidence: 0.5,
      }
    }

    // Store detected anomalies in database
    if (analysisResult.anomalies && analysisResult.anomalies.length > 0) {
      const anomaliesToStore = analysisResult.anomalies.map((anomaly: any) => ({
        user_id,
        type: anomaly.type,
        severity: anomaly.severity,
        confidence: anomaly.confidence,
        description: anomaly.description,
        risk_factors: anomaly.risk_factors,
        recommendations: anomaly.recommendations,
        location_lat: location.lat,
        location_lng: location.lng,
        resolved: false,
      }))

      const { data: storedAnomalies } = await supabase.from("anomaly_patterns").insert(anomaliesToStore).select()

      // Add IDs to the response
      if (storedAnomalies) {
        analysisResult.anomalies = analysisResult.anomalies.map((anomaly: any, index: number) => ({
          ...anomaly,
          id: storedAnomalies[index]?.id || `temp_${Date.now()}_${index}`,
          detected_at: timestamp,
          resolved: false,
        }))
      }
    }

    return NextResponse.json(analysisResult)
  } catch (error) {
    console.error("AI anomaly detection error:", error)
    return NextResponse.json(
      {
        error: "Failed to perform anomaly detection",
        anomalies: [],
        overall_threat_level: "safe",
        analysis_confidence: 0.0,
      },
      { status: 500 },
    )
  }
}
