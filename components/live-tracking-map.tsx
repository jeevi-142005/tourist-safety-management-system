"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { MapPin, Navigation, AlertTriangle, Shield, Eye, Loader2, Satellite, Route } from "lucide-react"
import { createBrowserClient } from "@/lib/db-client/client"

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
  const dbClient = createBrowserClient()

  const [isMapScriptLoaded, setIsMapScriptLoaded] = useState(false)
  const leafletMapRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)
  const polylineRef = useRef<any>(null)

  useEffect(() => {
    const loadLeaflet = () => {
      if (typeof window === "undefined") return
      if ((window as any).L) {
        setIsMapScriptLoaded(true)
        return
      }

      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link")
        link.id = "leaflet-css"
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      if (!document.getElementById("leaflet-js")) {
        const script = document.createElement("script")
        script.id = "leaflet-js"
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        document.body.appendChild(script)
        script.onload = () => {
          setIsMapScriptLoaded(true)
        }
      } else {
        const script = document.getElementById("leaflet-js") as HTMLScriptElement
        if (script) {
          script.addEventListener("load", () => {
            setIsMapScriptLoaded(true)
          })
        }
      }
    }

    loadLeaflet()

    return () => {
      // Cleanup map instance on unmount
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  }, [])

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

  const fetchLocationHistory = async () => {
    try {
      const res = await fetch("/api/location/track")
      if (res.ok) {
        const result = await res.json()
        if (result.locations && result.locations.length > 0) {
          const mapped = result.locations.map((loc: any) => ({
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.accuracy || 10,
            altitude: loc.altitude,
            speed: loc.speed,
            heading: loc.heading,
            timestamp: loc.timestamp,
            battery_level: loc.battery_level
          })).reverse()
          setLocationHistory(mapped)
          if (mapped.length > 0) {
            setCurrentLocation(mapped[mapped.length - 1])
          }
        }
      }
    } catch (err) {
      console.error("Error fetching location history:", err)
    }
  }

  const initializeTracking = async () => {
    await fetchGeoZones()
    await fetchLocationHistory()
    await requestPermissions()
    await getBatteryLevel()
    setIsLoading(false)
  }

  // Update map and marker on location update
  useEffect(() => {
    if (!currentLocation || typeof window === "undefined" || !(window as any).L || !isMapScriptLoaded) return

    const L = (window as any).L

    if (!leafletMapRef.current && mapRef.current) {
      // Initialize map
      const map = L.map(mapRef.current).setView([currentLocation.latitude, currentLocation.longitude], 14)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map)

      leafletMapRef.current = map

      // Draw active geozones
      geoZones.forEach((zone) => {
        const zoneColors = {
          safe: "#10b981", // green
          caution: "#f59e0b", // yellow
          high_risk: "#ef4444", // red
          restricted: "#8b5cf6", // purple
        }
        const color = zoneColors[zone.zone_type] || "#3b82f6"
        
        L.circle([zone.center_lat, zone.center_lng], {
          color: color,
          fillColor: color,
          fillOpacity: 0.15,
          radius: zone.radius || 500
        }).addTo(map).bindPopup(`<b>${zone.name}</b><br>${zone.description || ""}`)
      })
    }

    const map = leafletMapRef.current
    if (map) {
      // Pan/Zoom to new coordinates
      map.setView([currentLocation.latitude, currentLocation.longitude])

      // Manage User Marker
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([currentLocation.latitude, currentLocation.longitude])
      } else {
        const userIcon = L.divIcon({
          className: 'custom-user-marker',
          html: `<div class="relative flex h-5 w-5"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span class="relative inline-flex rounded-full h-5 w-5 bg-blue-600 border-2 border-white shadow-md"></span></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
        userMarkerRef.current = L.marker([currentLocation.latitude, currentLocation.longitude], { icon: userIcon })
          .addTo(map)
          .bindPopup("You are here")
          .openPopup()
      }
    }
  }, [currentLocation, geoZones, isMapScriptLoaded])

  useEffect(() => {
    const map = leafletMapRef.current
    const L = (window as any).L
    if (!map || !L || !isMapScriptLoaded || locationHistory.length === 0) return

    const latlngs = locationHistory.map(loc => [loc.latitude, loc.longitude])

    if (polylineRef.current) {
      polylineRef.current.setLatLngs(latlngs)
    } else {
      polylineRef.current = L.polyline(latlngs, { color: '#3b82f6', weight: 4, opacity: 0.6 }).addTo(map)
    }
  }, [locationHistory, isMapScriptLoaded])

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
      if ("getBattery" in navigator && typeof (navigator as any).getBattery === "function") {
        const battery = await (navigator as any).getBattery()
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
      const dbClient = createBrowserClient()
      const { data, error } = await dbClient
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
      } = await dbClient.auth.getUser()
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

      await dbClient.from("user_alerts").insert({
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
      } = await dbClient.auth.getUser()
      if (!user) return

      await dbClient.from("anomaly_patterns").insert({
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
      const res = await fetch("/api/location/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          altitude: location.altitude,
          speed: location.speed,
          heading: location.heading,
          battery_level: location.battery_level,
          timestamp: location.timestamp
        })
      })

      if (!res.ok) {
        console.error("[v0] Error saving location via API")
        return
      }

      const result = await res.json()
      console.log("[v0] Saved location via backend route:", result)
      
      if (result.violations && result.violations.length > 0) {
        result.violations.forEach((violation: any) => {
          console.warn(`[v0] Geofence violation detected by backend: ${violation.zone_name} (${violation.zone_type})`)
        })
      }
    } catch (error) {
      console.error("Error saving location to tracking API:", error)
    }
  }

  const saveDeviceMetrics = async (location: LocationData) => {
    try {
      const {
        data: { user },
      } = await dbClient.auth.getUser()
      if (!user) return

      const connectionType = (navigator as any).connection?.effectiveType || "unknown"
      const connectionStrength = (navigator as any).connection?.downlink || 0

      await dbClient.from("device_metrics").insert({
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
          <div className="w-full h-96 rounded-lg overflow-hidden relative border border-gray-200 bg-gray-50 flex items-center justify-center">
            {(!isMapScriptLoaded || !currentLocation) && (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-green-50/50 flex flex-col items-center justify-center p-4 text-center z-10">
                <div className="p-3 bg-white/90 rounded-full shadow-sm mb-3">
                  <MapPin className="h-6 w-6 text-blue-500 animate-bounce" />
                </div>
                <h4 className="font-semibold text-sm text-gray-800">
                  {!isMapScriptLoaded ? "Loading map engine..." : "Awaiting location GPS lock..."}
                </h4>
                <p className="text-xs text-gray-400 max-w-xs mt-1">
                  {!isMapScriptLoaded 
                    ? "Getting Leaflet GIS map renderer assets..." 
                    : "Please toggle 'Enable Live Tracking' above to acquire a live satellite signal."}
                </p>
              </div>
            )}
            
            <div
              ref={mapRef}
              className={`w-full h-full ${(!isMapScriptLoaded || !currentLocation) ? "hidden" : "block"}`}
            />
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
                      Risk: {(zone as any).risk_level || (zone.zone_type === 'high_risk' ? '8' : zone.zone_type === 'caution' ? '5' : '1')}/10
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
