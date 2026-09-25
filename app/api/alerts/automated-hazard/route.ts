import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const {
      userId: requestedUserId,
      lat = 11.0159,
      lng = 76.9368,
      hazardType = "heavy_rain", // "heavy_rain" | "flash_flood" | "landslide" | "abnormal_area" | "cyclone"
      locationName = "Coimbatore District, Tamil Nadu",
    } = body

    // Determine target user
    let targetUserId = requestedUserId
    if (!targetUserId && session?.user) {
      targetUserId = (session.user as any).id
    }

    if (!targetUserId) {
      // Find the first tourist user if not provided
      const firstTourist = await db.user.findFirst({
        where: { role: "tourist" },
        select: { id: true, name: true, email: true },
      })
      if (!firstTourist) {
        return NextResponse.json({ error: "No tourist user found" }, { status: 404 })
      }
      targetUserId = firstTourist.id
    }

    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, email: true, phone: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "Target tourist not found" }, { status: 404 })
    }

    // Hazard profiles and anomaly definitions
    const hazardProfiles: Record<string, {
      title: string
      type: string
      severity: string
      situation: string
      anomaly: string
      recommendation: string
      recommendedResourceType: string
    }> = {
      heavy_rain: {
        title: "Severe Weather & Heavy Torrential Rain Alert",
        type: "weather_hazard",
        severity: "critical",
        situation: `Torrential downpour (78mm/hr) and sudden cloudburst conditions detected in ${locationName}. Severe urban waterlogging and submerged pathways reported.`,
        anomaly: "Severe meteorological spike and abnormal ambient noise & barometer drop detected by AI sensors.",
        recommendation: "Move to higher ground, avoid open culverts and underpasses. Stay in shelter until clearance.",
        recommendedResourceType: "ambulance",
      },
      flash_flood: {
        title: "Flash Flood Surge Anomaly Detected",
        type: "disaster_alert",
        severity: "critical",
        situation: `Rapid water surge and reservoir release warning issued for your current sector in ${locationName}. Water levels rising rapidly along low-lying routes.`,
        anomaly: "Route impassability and sudden pedestrian trajectory stoppage detected by live location sensors.",
        recommendation: "Do not attempt to cross flooded roadways. Evacuate immediately towards designated high-ground assembly zones.",
        recommendedResourceType: "fire",
      },
      landslide: {
        title: "Geological Anomaly & Landslide Hazard",
        type: "disaster_alert",
        severity: "high",
        situation: `Saturated soil conditions and localized mudslide detected along the primary access route near ${locationName}.`,
        anomaly: "Significant deviation from planned itinerary and prolonged stationary interval detected.",
        recommendation: "Stay away from steep embankments and rockfall hazard areas. Prepare for emergency evacuation.",
        recommendedResourceType: "fire",
      },
      abnormal_area: {
        title: "High-Risk Restricted Perimeter Anomaly",
        type: "abnormal_area",
        severity: "high",
        situation: `You have entered a flagged high-risk caution zone (${locationName}) with elevated night-time security incidents.`,
        anomaly: "Geofence boundary breach into restricted perimeter during non-permissible hours.",
        recommendation: "Please return to the primary illuminated pedestrian thoroughfare and verify your digital tourist credentials.",
        recommendedResourceType: "police",
      },
      cyclone: {
        title: "Cyclonic Wind & Gale Storm Warning",
        type: "weather_hazard",
        severity: "critical",
        situation: `High-velocity wind gusts exceeding 85 km/h with localized power outage risk detected in ${locationName}.`,
        anomaly: "Severe atmospheric pressure anomaly and sudden GPS signal degradation.",
        recommendation: "Take immediate refuge inside a concrete structure away from glass windows and loose tin roofs.",
        recommendedResourceType: "security",
      },
    }

    const selectedProfile = hazardProfiles[hazardType] || hazardProfiles.heavy_rain

    // Find best matching emergency resource for auto-triage (reducing manual admin work)
    const matchingResource = await db.emergencyResource.findFirst({
      where: {
        type: selectedProfile.recommendedResourceType,
        isAvailable: true,
      },
    }) || await db.emergencyResource.findFirst({
      where: { isAvailable: true },
    })

    const message = `⚠️ ${selectedProfile.title.toUpperCase()}: ${selectedProfile.situation} [ANOMALY DETECTED: ${selectedProfile.anomaly}]. ${selectedProfile.recommendation}`

    // 1. Create the EmergencyAlert in Prisma database
    const alert = await db.emergencyAlert.create({
      data: {
        userId: targetUser.id,
        userName: targetUser.name || "Tourist",
        type: selectedProfile.type,
        message: message,
        severity: selectedProfile.severity,
        locationLat: lat,
        locationLng: lng,
        status: "active",
        deviceInfo: {
          isAutomated: true,
          title: selectedProfile.title,
          hazardType: hazardType,
          situation: selectedProfile.situation,
          anomalyDetected: selectedProfile.anomaly,
          recommendation: selectedProfile.recommendation,
          assistancePrompt: "Are you stranded or in immediate danger? Please confirm if you need emergency assistance.",
          requiresAssistanceConfirmation: true,
          touristStatus: "awaiting_response",
          autoTriaged: true,
          suggestedResourceId: matchingResource?.id || null,
          suggestedResourceName: matchingResource?.name || "Emergency Medical Response",
          suggestedResourceType: matchingResource?.type || selectedProfile.recommendedResourceType,
          suggestedResourcePhone: matchingResource?.phone || "112",
          detectedAt: new Date().toISOString(),
        },
      },
    })

    // 2. Create the AdminNotification for instant notification on Admin Dashboard
    await db.adminNotification.create({
      data: {
        type: "hazard_anomaly_alert",
        title: `⚠️ Auto-Hazard: ${selectedProfile.title} — ${targetUser.name || "Tourist"}`,
        message: `${selectedProfile.situation} Anomaly: ${selectedProfile.anomaly}. Auto-assigned unit: ${matchingResource?.name || "Pending Dispatch"}.`,
        severity: selectedProfile.severity,
        userId: targetUser.id,
        metadata: {
          alertId: alert.id,
          hazardType,
          suggestedResourceId: matchingResource?.id,
          suggestedResourceName: matchingResource?.name,
          location: { lat, lng },
        },
      },
    })

    return NextResponse.json({
      success: true,
      alert: {
        id: alert.id,
        user_id: alert.userId,
        user_name: alert.userName,
        type: alert.type,
        message: alert.message,
        severity: alert.severity,
        status: alert.status,
        location_lat: alert.locationLat,
        location_lng: alert.locationLng,
        device_info: alert.deviceInfo,
        created_at: alert.createdAt.toISOString(),
      },
      autoTriage: {
        suggestedResource: matchingResource,
        urgency: selectedProfile.severity,
      },
    })
  } catch (error: any) {
    console.error("[POST /api/alerts/automated-hazard]", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
