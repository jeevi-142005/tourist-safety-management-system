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

    const body = await request.json()
    const {
      zone_id,
      zone_name,
      zone_type,
      event_type, // 'entry' or 'exit'
      latitude,
      longitude,
      accuracy,
      timestamp,
    } = body

    console.log("[v0] Processing geofence alert:", { zone_name, event_type, zone_type })

    // Get user profile for context
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    // Determine alert severity based on zone type and event
    const severity = getSeverityLevel(zone_type, event_type)
    const alertType = getAlertType(zone_type)

    // Create user alert
    const alertMessage =
      event_type === "entry"
        ? `You have entered ${zone_name}. Please exercise caution and follow safety guidelines.`
        : `You have exited ${zone_name}. Stay alert and maintain safety protocols.`

    const { data: userAlert, error: userAlertError } = await supabase
      .from("user_alerts")
      .insert({
        user_id: user.id,
        message: alertMessage,
        alert_type: "geofence",
        severity,
        location_lat: latitude,
        location_lng: longitude,
        is_read: false,
      })
      .select()
      .single()

    if (userAlertError) {
      console.error("Error creating user alert:", userAlertError)
    }

    // Create admin notification for high-risk zones
    if (zone_type === "high_risk" || zone_type === "restricted") {
      const adminMessage = `Tourist ${profile?.full_name || user.email} has ${event_type === "entry" ? "entered" : "exited"} ${zone_type} zone: ${zone_name}`

      await supabase.from("admin_notifications").insert({
        type: "emergency_alert",
        title: `Geofence Alert: ${zone_type} zone ${event_type}`,
        message: adminMessage,
        severity: severity === "critical" ? "critical" : "warning",
        user_id: user.id,
        metadata: {
          zone_id,
          zone_name,
          zone_type,
          event_type,
          location: { latitude, longitude },
          accuracy,
          tourist_name: profile?.full_name,
          tourist_email: user.email,
        },
      })
    }

    // Use AI to analyze the geofence event for additional insights
    if (zone_type === "high_risk" || zone_type === "restricted") {
      await analyzeGeofenceEvent(user.id, zone_name, zone_type, event_type, latitude, longitude)
    }

    // Send real-time notification
    await supabase.channel("geofence_alerts").send({
      type: "broadcast",
      event: "geofence_alert",
      payload: {
        user_id: user.id,
        zone_name,
        zone_type,
        event_type,
        severity,
        timestamp: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      alert_id: userAlert?.id,
      severity,
      message: alertMessage,
    })
  } catch (error) {
    console.error("Geofence alert error:", error)
    return NextResponse.json({ error: "Failed to process geofence alert" }, { status: 500 })
  }
}

function getSeverityLevel(zoneType: string, eventType: string): string {
  if (zoneType === "high_risk") {
    return eventType === "entry" ? "critical" : "high"
  }
  if (zoneType === "restricted") {
    return eventType === "entry" ? "critical" : "medium"
  }
  if (zoneType === "caution") {
    return eventType === "entry" ? "medium" : "low"
  }
  return "low"
}

function getAlertType(zoneType: string): string {
  switch (zoneType) {
    case "high_risk":
      return "security"
    case "restricted":
      return "security"
    case "caution":
      return "general"
    default:
      return "general"
  }
}

async function analyzeGeofenceEvent(
  userId: string,
  zoneName: string,
  zoneType: string,
  eventType: string,
  latitude: number,
  longitude: number,
) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const prompt = `
    Analyze this geofence security event:
    
    Zone: ${zoneName}
    Zone Type: ${zoneType}
    Event: Tourist ${eventType === "entry" ? "entered" : "exited"} the zone
    Location: ${latitude}, ${longitude}
    
    Provide risk assessment and recommendations:
    1. Risk level (low, medium, high, critical)
    2. Immediate safety recommendations
    3. Potential threats or concerns
    4. Recommended actions for authorities
    
    Return JSON format:
    {
      "riskLevel": "low|medium|high|critical",
      "recommendations": ["recommendation1", "recommendation2"],
      "threats": ["threat1", "threat2"],
      "authorityActions": ["action1", "action2"]
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
        riskLevel: zoneType === "high_risk" ? "high" : "medium",
        recommendations: ["Stay alert", "Follow safety protocols", "Contact authorities if needed"],
        threats: ["Potential security risk", "Unsafe area"],
        authorityActions: ["Monitor tourist location", "Prepare emergency response"],
      }
    }

    // Store AI analysis
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get() {
          return undefined
        },
      },
    })

    await supabase.from("anomaly_patterns").insert({
      user_id: userId,
      type: "geofence_violation",
      severity: analysis.riskLevel,
      description: `${eventType === "entry" ? "Entered" : "Exited"} ${zoneType} zone: ${zoneName}`,
      location_lat: latitude,
      location_lng: longitude,
      confidence: 0.9,
      risk_factors: [zoneType, eventType, "geofence_alert"],
      recommendations: analysis.recommendations,
    })

    console.log("[v0] AI geofence analysis completed:", analysis.riskLevel)
  } catch (error) {
    console.error("Error analyzing geofence event:", error)
  }
}

export async function GET(request: NextRequest) {
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

    // Get recent geofence alerts for the user
    const { data: alerts, error } = await supabase
      .from("user_alerts")
      .select("*")
      .eq("user_id", user.id)
      .eq("alert_type", "geofence")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 })
    }

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error("Error fetching geofence alerts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
