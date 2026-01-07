"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { MapPin, Navigation, AlertTriangle, Shield, Eye, Loader2, Satellite, Route } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"

interface GeoZone {
  id: string
  name: string
  zone_type: "safe" | "caution" | "high_risk" | "restricted"
  coordinates: any
  center_lat: number
  center_lng: number
  radius: number
  description: string
  is_active: boolean
}

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  altitude?: number
  speed?: number
  heading?: number
  timestamp: string
  battery_level?: number
}

export function LiveTrackingMap() {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [geoZones, setGeoZones] = useState<GeoZone[]>([])
  const [currentZone, setCurrentZone] = useState<GeoZone | null>(null)
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    initializeTracking()
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isTracking) {
      startTracking()
    } else {
      stopTracking()
    }
  }, [isTracking])

  const initializeTracking = async () => {
    await fetchGeoZones()
    await requestPermissions()
    await getBatteryLevel()
    setIsLoading(false)
  }

  const requestPermissions = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission()
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("[v0] Location permission granted")
        },
        (error) => {
          console.log("[v0] Location permission denied:", error.message)
          setError(`Location access denied: ${error.message}`)
        },
      )
    }
  }

  const getBatteryLevel = async () => {
    try {
      if ("getBattery" in navigator) {
        const battery = await navigator.getBattery()
        setBatteryLevel(Math.round(battery.level * 100))

        battery.addEventListener("levelchange", () => {
          setBatteryLevel(Math.round(battery.level * 100))
        })
      }
    } catch (error) {
      console.log("[v0] Battery API not available")
    }
  }

  const fetchGeoZones = async () => {
    try {
      const { data, error } = await supabase
        .from("geo_zones")
        .select("*")
        .eq("is_active", true)
        .order("zone_type", { ascending: false })

      if (error) throw error
      setGeoZones(data || [])
      console.log("[v0] Loaded geo zones:", data?.length || 0)
    } catch (err) {
      console.error("Error fetching geo zones:", err)
      setError("Failed to load geo-fenced zones")
    }
  }

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser")
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000,
    }

    console.log("[v0] Starting location tracking with high accuracy")

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          speed: position.coords.speed || undefined,
          heading: position.coords.heading || undefined,
          timestamp: new Date().toISOString(),
          battery_level: batteryLevel || undefined,
        }

        console.log(
          "[v0] New location:",
          locationData.latitude,
          locationData.longitude,
          "accuracy:",
          locationData.accuracy,
        )

        setCurrentLocation(locationData)
        setLocationHistory((prev) => [...prev.slice(-49), locationData])

        await checkGeoFencing(locationData)
        await saveLocationToDatabase(locationData)
        await saveDeviceMetrics(locationData)

        setError(null)
      },
      (error) => {
        console.error("[v0] Geolocation error:", error)
        let errorMessage = "Location tracking error"

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user"
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable"
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out"
            break
        }

        setError(errorMessage)
      },
      options,
    )
  }

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
      console.log("[v0] Stopped location tracking")
    }
  }

  const checkGeoFencing = async (location: LocationData) => {
    for (const zone of geoZones) {
      const distance = calculateDistance(location.latitude, location.longitude, zone.center_lat, zone.center_lng)

      const isInZone = distance <= zone.radius

      if (isInZone && currentZone?.id !== zone.id) {
        setCurrentZone(zone)
        await handleZoneEntry(zone, location)
        console.log("[v0] Entered zone:", zone.name, "distance:", distance)
      } else if (!isInZone && currentZone?.id === zone.id) {
        await handleZoneExit(currentZone)
        setCurrentZone(null)
        console.log("[v0] Exited zone:", zone.name)
      }
    }
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  const handleZoneEntry = async (zone: GeoZone, location: LocationData) => {
    console.log(`[v0] Entered ${zone.zone_type} zone: ${zone.name}`)

    await createUserAlert(zone, location, "zone_entry")

    if (zone.zone_type === "high_risk" || zone.zone_type === "restricted") {
      await createAnomalyDetection("zone_violation", zone, location)
    }

    if ("Notification" in window && Notification.permission === "granted") {
      const severity = zone.zone_type === "high_risk" ? "🚨" : zone.zone_type === "restricted" ? "⛔" : "⚠️"
      new Notification(`${severity} Zone Alert: ${zone.name}`, {
        body: zone.description,
        icon: "/favicon.ico",
        tag: `zone-${zone.id}`,
      })
    }
  }

  const handleZoneExit = async (zone: GeoZone) => {
    console.log(`[v0] Exited ${zone.zone_type} zone: ${zone.name}`)
    await createUserAlert(zone, currentLocation!, "zone_exit")
  }

  const createUserAlert = async (zone: GeoZone, location: LocationData, alertType: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const severity =
        zone.zone_type === "high_risk"
          ? "critical"
          : zone.zone_type === "restricted"
            ? "high"
            : zone.zone_type === "caution"
              ? "medium"
              : "low"

      const message =
        alertType === "zone_entry"
          ? `You have entered ${zone.name}. ${zone.description}`
          : `You have exited ${zone.name}`

      await supabase.from("user_alerts").insert({
        user_id: user.id,
        message,
        alert_type: "geofence",
        severity,
        location_lat: location.latitude,
        location_lng: location.longitude,
        is_read: false,
      })

      console.log("[v0] Created user alert for zone:", zone.name)
    } catch (error) {
      console.error("Error creating user alert:", error)
    }
  }

  const createAnomalyDetection = async (type: string, zone: GeoZone, location: LocationData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from("anomaly_patterns").insert({
        user_id: user.id,
        type: "unusual_location",
        severity: zone.zone_type === "high_risk" ? "critical" : "high",
        description: `Entered ${zone.zone_type} zone: ${zone.name}`,
        location_lat: location.latitude,
        location_lng: location.longitude,
        confidence: 0.9,
        risk_factors: [zone.zone_type, "geofence_violation"],
        recommendations: [
          "Consider leaving the area immediately",
          "Contact emergency services if needed",
          "Inform your emergency contacts",
        ],
      })

      console.log("[v0] Created anomaly detection for zone violation")
    } catch (error) {
      console.error("Error creating anomaly detection:", error)
    }
  }

  const saveLocationToDatabase = async (location: LocationData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from("location_tracks").insert({
        user_id: user.id,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        altitude: location.altitude,
        speed: location.speed,
        heading: location.heading,
        timestamp: location.timestamp,
        battery_level: location.battery_level,
        zone_id: currentZone?.id || null,
      })

      if (error) {
        console.error("[v0] Error saving location:", error)
      }
    } catch (error) {
      console.error("Error saving location to database:", error)
    }
  }

  const saveDeviceMetrics = async (location: LocationData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const connectionType = (navigator as any).connection?.effectiveType || "unknown"
      const connectionStrength = (navigator as any).connection?.downlink || 0

      await supabase.from("device_metrics").insert({
        user_id: user.id,
        battery_level: location.battery_level,
        connection_strength: Math.min(connectionStrength * 10, 100),
        location_accuracy: Math.round(location.accuracy),
        location_lat: location.latitude,
        location_lng: location.longitude,
        movement_pattern: location.speed ? (location.speed > 1 ? "moving" : "stationary") : "unknown",
      })
    } catch (error) {
      console.error("Error saving device metrics:", error)
    }
  }

  const getZoneColor = (zoneType: string) => {
    switch (zoneType) {
      case "safe":
        return "bg-green-100 text-green-800 border-green-200"
      case "caution":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "high_risk":
        return "bg-red-100 text-red-800 border-red-200"
      case "restricted":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getZoneIcon = (zoneType: string) => {
    switch (zoneType) {
      case "safe":
        return <Shield className="h-4 w-4" />
      case "caution":
        return <AlertTriangle className="h-4 w-4" />
      case "high_risk":
        return <AlertTriangle className="h-4 w-4" />
      case "restricted":
        return <Eye className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Initializing tracking system...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tracking Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Navigation className="h-5 w-5" />
            <span>Live Location Tracking</span>
          </CardTitle>
          <CardDescription>Real-time GPS tracking with geo-fencing alerts for your safety</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch id="tracking" checked={isTracking} onCheckedChange={setIsTracking} />
              <Label htmlFor="tracking">Enable Live Tracking</Label>
            </div>
            <div className="flex items-center space-x-2">
              {batteryLevel && (
                <Badge variant="outline" className="text-xs">
                  Battery: {batteryLevel}%
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={requestPermissions}>
                <Satellite className="h-4 w-4 mr-1" />
                Permissions
              </Button>
            </div>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {currentLocation && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-800">Current Location</p>
                <p className="text-xs text-blue-600 font-mono">
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-green-800">Accuracy</p>
                <p className="text-xs text-green-600">±{Math.round(currentLocation.accuracy)}m</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-purple-800">Speed</p>
                <p className="text-xs text-purple-600">
                  {currentLocation.speed ? `${(currentLocation.speed * 3.6).toFixed(1)} km/h` : "N/A"}
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-orange-800">Last Update</p>
                <p className="text-xs text-orange-600">{new Date(currentLocation.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Zone Status */}
      {currentZone && (
        <Card className={`border-2 ${getZoneColor(currentZone.zone_type)}`}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {getZoneIcon(currentZone.zone_type)}
              <span>Current Zone: {currentZone.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge className={getZoneColor(currentZone.zone_type)}>{currentZone.zone_type.toUpperCase()}</Badge>
                <span className="text-sm">Radius: {currentZone.radius}m</span>
              </div>
              <p className="text-sm text-gray-600">{currentZone.description}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Map Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Interactive Map</span>
          </CardTitle>
          <CardDescription>Your location and nearby geo-fenced zones</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            ref={mapRef}
            className="w-full h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300 relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-10">
              <div className="grid grid-cols-8 grid-rows-6 h-full w-full">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="border border-gray-400"></div>
                ))}
              </div>
            </div>

            <div className="text-center space-y-3 z-10">
              <div className="p-3 bg-white/80 rounded-full">
                <MapPin className="h-8 w-8 text-blue-600 mx-auto" />
              </div>
              <div className="bg-white/90 p-4 rounded-lg shadow-sm">
                <p className="font-medium text-gray-800">Live Location Display</p>
                {currentLocation ? (
                  <div className="space-y-1 mt-2">
                    <p className="text-sm font-mono text-gray-600">
                      {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                    </p>
                    <p className="text-xs text-gray-500">Accuracy: ±{Math.round(currentLocation.accuracy)}m</p>
                    {currentZone && (
                      <Badge className={`text-xs ${getZoneColor(currentZone.zone_type)}`}>In {currentZone.name}</Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">Enable tracking to see your location</p>
                )}
              </div>
            </div>

            {geoZones.slice(0, 3).map((zone, index) => (
              <div
                key={zone.id}
                className={`absolute w-8 h-8 rounded-full ${getZoneColor(zone.zone_type)} flex items-center justify-center text-xs font-bold opacity-60`}
                style={{
                  top: `${20 + index * 25}%`,
                  right: `${10 + index * 15}%`,
                }}
              >
                {zone.name.charAt(0)}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Route className="h-4 w-4" />
              <span>Tracking: {locationHistory.length} points recorded</span>
            </div>
            <div className="flex items-center space-x-2">
              <Satellite className="h-4 w-4" />
              <span>Zones: {geoZones.length} active</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Geo-Zones List */}
      <Card>
        <CardHeader>
          <CardTitle>Geo-Fenced Zones</CardTitle>
          <CardDescription>Safety zones in your area with automatic alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {geoZones.map((zone) => (
              <div
                key={zone.id}
                className={`p-3 rounded-lg border ${getZoneColor(zone.zone_type)} ${
                  currentZone?.id === zone.id ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getZoneIcon(zone.zone_type)}
                    <div>
                      <p className="font-medium">{zone.name}</p>
                      <p className="text-xs opacity-75">{zone.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      Risk: {zone.risk_level}/10
                    </Badge>
                    {currentZone?.id === zone.id && <p className="text-xs mt-1 font-medium">CURRENT</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Location History */}
      {locationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Locations</CardTitle>
            <CardDescription>Your location history from this session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {locationHistory
                .slice(-10)
                .reverse()
                .map((location, index) => (
                  <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                    <span className="font-mono text-xs">
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </span>
                    <span className="text-gray-500">{new Date(location.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
