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

    const body = await request.json()
    const { userId, checkType = "all" } = body

    // Get recent location data
    const { data: recentLocations } = await supabase
      .from("location_tracks")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .limit(50)

    // Get planned routes
    const { data: plannedRoutes } = await supabase
      .from("planned_routes")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)

    if (!recentLocations || recentLocations.length === 0) {
      return NextResponse.json({ anomalies: [], message: "No location data available" })
    }

    // Analyze with Gemini AI
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const prompt = `
    Analyze the following tourist location data for anomalies and safety concerns:

    Recent Locations (last 50 points):
    ${JSON.stringify(recentLocations.slice(0, 20), null, 2)}

    Planned Routes:
    ${JSON.stringify(plannedRoutes, null, 2)}

    Current Time: ${new Date().toISOString()}

    Detect the following anomalies:
    1. Sudden location drop-offs (no updates for >2 hours during day)
    2. Prolonged inactivity in one location (>4 hours without movement)
    3. Deviation from planned routes (>5km off planned path)
    4. Unusual travel patterns (very fast movement, erratic paths)
    5. Location in restricted/dangerous areas at unusual times

    Return JSON response:
    {
      "anomalies": [
        {
          "type": "drop_off" | "inactivity" | "route_deviation" | "unusual_pattern" | "restricted_area",
          "severity": "low" | "medium" | "high" | "critical",
          "description": "detailed description",
          "location": {"lat": number, "lng": number},
          "timestamp": "ISO string",
          "recommendation": "action to take"
        }
      ],
      "overallRisk": "low" | "medium" | "high" | "critical",
      "summary": "overall assessment"
    }
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const analysisText = response.text()

    let aiAnalysis
    try {
      aiAnalysis = JSON.parse(analysisText)
    } catch (error) {
      // Fallback analysis
      aiAnalysis = performFallbackAnomalyDetection(recentLocations, plannedRoutes)
    }

    // Create alerts for high-severity anomalies
    for (const anomaly of aiAnalysis.anomalies) {
      if (anomaly.severity === "high" || anomaly.severity === "critical") {
        await supabase.from("alerts").insert({
          user_id: userId,
          alert_type: "anomaly",
          severity: anomaly.severity,
          location: anomaly.location ? `POINT(${anomaly.location.lng} ${anomaly.location.lat})` : null,
          message: anomaly.description,
          metadata: {
            anomaly_type: anomaly.type,
            recommendation: anomaly.recommendation,
            detected_at: new Date().toISOString(),
          },
        })
      }
    }

    return NextResponse.json({
      anomalies: aiAnalysis.anomalies,
      overallRisk: aiAnalysis.overallRisk,
      summary: aiAnalysis.summary,
      detectedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Anomaly detection error:", error)
    return NextResponse.json({ error: "Failed to detect anomalies" }, { status: 500 })
  }
}

function performFallbackAnomalyDetection(locations: any[], routes: any[]) {
  const anomalies = []
  const now = new Date()

  // Check for location drop-offs
  if (locations.length > 0) {
    const lastLocation = locations[0]
    const timeSinceLastUpdate = now.getTime() - new Date(lastLocation.timestamp).getTime()
    const hoursSinceUpdate = timeSinceLastUpdate / (1000 * 60 * 60)

    if (hoursSinceUpdate > 2) {
      anomalies.push({
        type: "drop_off",
        severity: hoursSinceUpdate > 6 ? "critical" : "high",
        description: `No location updates for ${hoursSinceUpdate.toFixed(1)} hours`,
        location: null,
        timestamp: lastLocation.timestamp,
        recommendation: "Contact tourist immediately and dispatch emergency response",
      })
    }
  }

  // Check for prolonged inactivity
  if (locations.length >= 10) {
    const recentLocations = locations.slice(0, 10)
    const locationVariance = calculateLocationVariance(recentLocations)

    if (locationVariance < 0.001) {
      // Very small movement
      anomalies.push({
        type: "inactivity",
        severity: "medium",
        description: "Prolonged inactivity detected - no significant movement in recent locations",
        location: recentLocations[0] ? parseLocation(recentLocations[0].location) : null,
        timestamp: recentLocations[0]?.timestamp,
        recommendation: "Check on tourist welfare and verify if assistance is needed",
      })
    }
  }

  return {
    anomalies,
    overallRisk: anomalies.length > 0 ? "medium" : "low",
    summary: `Detected ${anomalies.length} potential anomalies using fallback analysis`,
  }
}

function calculateLocationVariance(locations: any[]): number {
  if (locations.length < 2) return 0

  const coords = locations.map((loc) => parseLocation(loc.location)).filter(Boolean)
  if (coords.length < 2) return 0

  const avgLat = coords.reduce((sum, coord) => sum + coord.lat, 0) / coords.length
  const avgLng = coords.reduce((sum, coord) => sum + coord.lng, 0) / coords.length

  const variance =
    coords.reduce((sum, coord) => {
      const latDiff = coord.lat - avgLat
      const lngDiff = coord.lng - avgLng
      return sum + (latDiff * latDiff + lngDiff * lngDiff)
    }, 0) / coords.length

  return variance
}

function parseLocation(locationString: string): { lat: number; lng: number } | null {
  try {
    const match = locationString.match(/POINT$$([^)]+)$$/)
    if (!match) return null

    const [lng, lat] = match[1].split(" ").map(Number)
    return { lat, lng }
  } catch (error) {
    return null
  }
}
