import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const zones = await db.geoZone.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" }
    })

    const processedZones = zones.map((zone) => {
      let coordinatesList = []
      
      if (zone.coordinates) {
        if (typeof zone.coordinates === "string") {
          try {
            coordinatesList = JSON.parse(zone.coordinates)
          } catch (e) {
            coordinatesList = []
          }
        } else if (Array.isArray(zone.coordinates)) {
          coordinatesList = zone.coordinates as any
        } else if (typeof zone.coordinates === "object") {
          // If it is a geojson polygon object
          const geoJson = zone.coordinates as any
          if (geoJson.coordinates) {
            coordinatesList = geoJson.coordinates
          } else {
            coordinatesList = geoJson
          }
        }
      }

      return {
        id: zone.id,
        name: zone.name,
        description: zone.description,
        type: zone.zoneType,
        riskLevel: zone.zoneType, // "safe", "caution", "high_risk", "restricted"
        coordinates: coordinatesList,
        centerLat: zone.centerLat,
        centerLng: zone.centerLng,
        radius: zone.radius,
        createdAt: zone.createdAt.toISOString(),
      }
    })

    return NextResponse.json({ zones: processedZones })
  } catch (error: any) {
    console.error("Geo zones API error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
