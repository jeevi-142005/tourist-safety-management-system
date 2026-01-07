import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

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

    const { data: zones, error } = await supabase
      .from("geo_zones")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Geo zones fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch geo zones" }, { status: 500 })
    }

    // Convert PostGIS geometry to GeoJSON coordinates
    const processedZones = zones.map((zone) => ({
      id: zone.id,
      name: zone.name,
      description: zone.description,
      type: zone.zone_type,
      riskLevel: zone.risk_level,
      coordinates: parseCoordinates(zone.coordinates),
      createdAt: zone.created_at,
    }))

    return NextResponse.json({ zones: processedZones })
  } catch (error) {
    console.error("Geo zones API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function parseCoordinates(geometryString: string): number[][] {
  // Parse PostGIS POLYGON format to coordinate array
  // This is a simplified parser - in production, use a proper geometry library
  try {
    const coordsMatch = geometryString.match(/POLYGON$$\(([^)]+)$$\)/)
    if (!coordsMatch) return []

    const coordPairs = coordsMatch[1].split(",")
    return coordPairs.map((pair) => {
      const [lng, lat] = pair.trim().split(" ").map(Number)
      return [lat, lng] // Leaflet expects [lat, lng]
    })
  } catch (error) {
    console.error("Coordinate parsing error:", error)
    return []
  }
}
