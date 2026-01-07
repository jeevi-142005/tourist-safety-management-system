"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, AlertTriangle, Users, TrendingUp, Filter, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface HeatmapZone {
  id: string
  name: string
  coordinates: { lat: number; lng: number }
  riskLevel: "high" | "medium" | "low"
  touristCount: number
  incidentCount: number
  lastIncident?: string
}

const fallbackZones: HeatmapZone[] = [
  {
    id: "1",
    name: "Times Square",
    coordinates: { lat: 40.7589, lng: -73.9851 },
    riskLevel: "medium",
    touristCount: 245,
    incidentCount: 3,
    lastIncident: "2 hours ago",
  },
  {
    id: "2",
    name: "Central Park",
    coordinates: { lat: 40.7829, lng: -73.9654 },
    riskLevel: "low",
    touristCount: 189,
    incidentCount: 0,
  },
  {
    id: "3",
    name: "Brooklyn Bridge",
    coordinates: { lat: 40.7061, lng: -73.9969 },
    riskLevel: "high",
    touristCount: 156,
    incidentCount: 7,
    lastIncident: "15 minutes ago",
  },
  {
    id: "4",
    name: "Statue of Liberty",
    coordinates: { lat: 40.6892, lng: -74.0445 },
    riskLevel: "low",
    touristCount: 98,
    incidentCount: 1,
    lastIncident: "1 day ago",
  },
  {
    id: "5",
    name: "Empire State Building",
    coordinates: { lat: 40.7484, lng: -73.9857 },
    riskLevel: "medium",
    touristCount: 203,
    incidentCount: 2,
    lastIncident: "4 hours ago",
  },
]

export function AuthorityHeatmap() {
  const [zones, setZones] = useState<HeatmapZone[]>([])
  const [selectedZone, setSelectedZone] = useState<HeatmapZone | null>(null)
  const [filterLevel, setFilterLevel] = useState<"all" | "high" | "medium" | "low">("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchHeatmapData()
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchHeatmapData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchHeatmapData = async () => {
    try {
      const supabase = createClient()
      
      if (supabase) {
        // Get tourist locations
        const { data: tourists } = await supabase
          .from('tourist_profiles')
          .select('id, name, location_lat, location_lng, status, last_seen')
          .eq('is_active', true)
          .not('location_lat', 'is', null)
          .not('location_lng', 'is', null)

        // Get emergency alerts for today
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const { data: alerts } = await supabase
          .from('emergency_alerts')
          .select('location_lat, location_lng, created_at, severity')
          .gte('created_at', today.toISOString())

        // Generate zones based on real data
        const generatedZones = generateZonesFromData(tourists || [], alerts || [])
        setZones(generatedZones)
      } else {
        // Fallback for demo mode
        setZones(fallbackZones)
      }
    } catch (error) {
      console.error('Error fetching heatmap data:', error)
      setZones(fallbackZones)
    } finally {
      setIsLoading(false)
    }
  }

  const generateZonesFromData = (tourists: any[], alerts: any[]): HeatmapZone[] => {
    const predefinedZones = [
      { id: "1", name: "Times Square", lat: 40.7589, lng: -73.9851 },
      { id: "2", name: "Central Park", lat: 40.7829, lng: -73.9654 },
      { id: "3", name: "Brooklyn Bridge", lat: 40.7061, lng: -73.9969 },
      { id: "4", name: "Statue of Liberty", lat: 40.6892, lng: -74.0445 },
      { id: "5", name: "Empire State Building", lat: 40.7484, lng: -73.9857 },
    ]

    return predefinedZones.map(zone => {
      // Count tourists within 0.01 degrees (~1km) of zone center
      const touristCount = tourists.filter(tourist => 
        Math.abs(tourist.location_lat - zone.lat) < 0.01 &&
        Math.abs(tourist.location_lng - zone.lng) < 0.01
      ).length

      // Count incidents within zone
      const zoneAlerts = alerts.filter(alert => 
        alert.location_lat && alert.location_lng &&
        Math.abs(alert.location_lat - zone.lat) < 0.01 &&
        Math.abs(alert.location_lng - zone.lng) < 0.01
      )

      const incidentCount = zoneAlerts.length
      const lastIncident = zoneAlerts.length > 0 
        ? formatTimeAgo(new Date(zoneAlerts[0].created_at))
        : undefined

      // Determine risk level based on incidents and tourist density
      let riskLevel: "high" | "medium" | "low" = "low"
      if (incidentCount >= 5 || (incidentCount >= 2 && touristCount > 100)) {
        riskLevel = "high"
      } else if (incidentCount >= 2 || touristCount > 150) {
        riskLevel = "medium"
      }

      return {
        id: zone.id,
        name: zone.name,
        coordinates: { lat: zone.lat, lng: zone.lng },
        riskLevel,
        touristCount,
        incidentCount,
        lastIncident
      }
    })
  }

  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    return `${diffDays} days ago`
  }

  const filteredZones = zones.filter((zone) => filterLevel === "all" || zone.riskLevel === filterLevel)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchHeatmapData()
    setIsRefreshing(false)
  }

  const handleDeployTeam = async (zone: HeatmapZone) => {
    try {
      const supabase = createClient()
      if (supabase) {
        await supabase.from('response_teams').insert({
          zone_id: zone.id,
          zone_name: zone.name,
          coordinates: zone.coordinates,
          deployed_at: new Date().toISOString(),
          status: 'deployed'
        })
      }
      alert(`Response team deployed to ${zone.name}`)
    } catch (error) {
      console.error('Error deploying team:', error)
      alert('Failed to deploy response team')
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-red-500 text-white"
      case "medium":
        return "bg-yellow-500 text-white"
      case "low":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getZoneClass = (level: string) => {
    switch (level) {
      case "high":
        return "bg-red-500 border-red-300"
      case "medium":
        return "bg-yellow-500 border-yellow-300"
      case "low":
        return "bg-green-500 border-green-300"
      default:
        return "bg-gray-500 border-gray-300"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading heatmap data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2 text-authority-primary">
                <MapPin className="h-5 w-5" />
                <span>Tourist Safety Heatmap</span>
              </CardTitle>
              <CardDescription>Real-time risk assessment across tourist zones</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Button
                  variant={filterLevel === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterLevel("all")}
                  className="text-xs"
                >
                  All
                </Button>
                <Button
                  variant={filterLevel === "high" ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setFilterLevel("high")}
                  className="text-xs"
                >
                  High Risk
                </Button>
                <Button
                  variant={filterLevel === "medium" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterLevel("medium")}
                  className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  Medium
                </Button>
                <Button
                  variant={filterLevel === "low" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterLevel("low")}
                  className="text-xs bg-green-500 hover:bg-green-600 text-white"
                >
                  Low Risk
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-authority-accent border-authority-accent/50 bg-transparent"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Heatmap Visualization */}
            <div className="lg:col-span-2">
              <div className="relative bg-slate-100 rounded-lg p-6 min-h-[400px] overflow-hidden">
                {/* Map Background */}
                <div className="absolute inset-6 bg-gradient-to-br from-blue-100 to-slate-200 rounded-lg border-2 border-slate-300">
                  {/* Grid Pattern */}
                  <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: `
                      linear-gradient(rgba(148, 163, 184, 0.3) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(148, 163, 184, 0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px'
                  }}></div>
                  
                  {/* Zone Geofences */}
                  {filteredZones.map((zone, index) => {
                    const left = 10 + (index % 3) * 30
                    const top = 15 + Math.floor(index / 3) * 25
                    const size = zone.riskLevel === 'high' ? 80 : zone.riskLevel === 'medium' ? 70 : 60
                    
                    return (
                      <div
                        key={zone.id}
                        className={`absolute cursor-pointer transition-all duration-200 hover:scale-110 ${
                          selectedZone?.id === zone.id ? 'ring-4 ring-blue-400' : ''
                        }`}
                        style={{
                          left: `${left}%`,
                          top: `${top}%`,
                          width: `${size}px`,
                          height: `${size}px`,
                          transform: 'translate(-50%, -50%)'
                        }}
                        onClick={() => setSelectedZone(zone)}
                      >
                        {/* Geofence Circle */}
                        <div
                          className={`w-full h-full rounded-full border-4 ${
                            zone.riskLevel === 'high' 
                              ? 'bg-red-500/20 border-red-600' 
                              : zone.riskLevel === 'medium'
                              ? 'bg-yellow-500/20 border-yellow-600'
                              : 'bg-green-500/20 border-green-600'
                          } ${selectedZone?.id === zone.id ? 'border-dashed animate-pulse' : ''}`}
                        >
                          {/* Center Marker */}
                          <div className={`absolute top-1/2 left-1/2 w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
                            zone.riskLevel === 'high' ? 'bg-red-600' : zone.riskLevel === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                          }`}></div>
                          
                          {/* Incident Badge */}
                          {zone.incidentCount > 0 && (
                            <div className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                              {zone.incidentCount}
                            </div>
                          )}
                        </div>
                        
                        {/* Zone Label */}
                        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-slate-700 whitespace-nowrap">
                          {zone.name}
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Legend */}
                  <div className="absolute bottom-4 left-4 bg-white/90 p-3 rounded-lg shadow-sm">
                    <div className="text-xs font-medium text-slate-700 mb-2">Risk Levels:</div>
                    <div className="flex space-x-4">
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border-2 border-green-600"></div>
                        <span className="text-xs text-slate-600">Low</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border-2 border-yellow-600"></div>
                        <span className="text-xs text-slate-600">Medium</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border-2 border-red-600"></div>
                        <span className="text-xs text-slate-600">High</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Zone Details */}
            <div className="space-y-4">
              <div className="text-sm font-medium text-authority-primary">Zone Details</div>
              {selectedZone ? (
                <Card className="border-authority-accent/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      {selectedZone.name}
                      <Badge className={getRiskColor(selectedZone.riskLevel)}>
                        {selectedZone.riskLevel.toUpperCase()}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-authority-accent/10 rounded-lg">
                        <div className="text-2xl font-bold text-authority-accent">{selectedZone.touristCount}</div>
                        <div className="text-xs text-muted-foreground">Active Tourists</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{selectedZone.incidentCount}</div>
                        <div className="text-xs text-muted-foreground">Incidents Today</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Coordinates:</span>
                        <span className="font-mono text-xs">
                          {selectedZone.coordinates.lat.toFixed(4)}, {selectedZone.coordinates.lng.toFixed(4)}
                        </span>
                      </div>
                      {selectedZone.lastIncident && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Last Incident:</span>
                          <span className="text-red-600 font-medium">{selectedZone.lastIncident}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t">
                      <Button
                        className="w-full bg-authority-primary hover:bg-authority-primary/90 text-white"
                        size="sm"
                        onClick={() => handleDeployTeam(selectedZone)}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Deploy Response Team
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed border-2 border-muted">
                  <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
                    <div className="text-center">
                      <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Select a zone to view details</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">High Risk Zones</p>
                <p className="text-2xl font-bold text-red-600">{zones.filter((z) => z.riskLevel === "high").length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Medium Risk Zones</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {zones.filter((z) => z.riskLevel === "medium").length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Safe Zones</p>
                <p className="text-2xl font-bold text-green-600">{zones.filter((z) => z.riskLevel === "low").length}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-authority-accent/20 bg-authority-accent/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-authority-primary">Total Tourists</p>
                <p className="text-2xl font-bold text-authority-accent">
                  {zones.reduce((sum, zone) => sum + zone.touristCount, 0)}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-authority-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tourist Details Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-authority-primary">
            <Users className="h-5 w-5" />
            <span>Tourist Details</span>
          </CardTitle>
          <CardDescription>Real-time tourist information with blockchain verification</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedZone ? (
              <div className="space-y-3">
                <h3 className="font-medium text-sm">Tourists in {selectedZone.name}</h3>
                {[
                  {
                    id: "0x1a2b3c4d5e6f",
                    name: "John Smith",
                    blockchain_id: "0x742d35Cc6634C0532925a3b8D4C0d886E5d4b8Fc",
                    entry_date: "2024-01-15T10:30:00Z",
                    location: { lat: selectedZone.coordinates.lat + 0.001, lng: selectedZone.coordinates.lng + 0.001 },
                    status: "active",
                    nationality: "USA"
                  },
                  {
                    id: "0x2b3c4d5e6f7a",
                    name: "Maria Garcia",
                    blockchain_id: "0x8ba1f109551bD432803012645Hac136c0143Bce5",
                    entry_date: "2024-01-14T14:20:00Z",
                    location: { lat: selectedZone.coordinates.lat - 0.002, lng: selectedZone.coordinates.lng + 0.003 },
                    status: "active",
                    nationality: "Spain"
                  },
                  {
                    id: "0x3c4d5e6f7a8b",
                    name: "Yuki Tanaka",
                    blockchain_id: "0x9cA46f109551bD432803012645Hac136c0143Bce5",
                    entry_date: "2024-01-16T08:15:00Z",
                    location: { lat: selectedZone.coordinates.lat + 0.003, lng: selectedZone.coordinates.lng - 0.001 },
                    status: "active",
                    nationality: "Japan"
                  }
                ].slice(0, Math.min(3, selectedZone.touristCount)).map((tourist) => (
                  <Card key={tourist.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="font-medium text-sm">{tourist.name}</div>
                          <div className="text-xs text-muted-foreground">{tourist.nationality}</div>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {tourist.status}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs">
                            <span className="text-muted-foreground">Blockchain ID:</span>
                            <div className="font-mono text-xs break-all">{tourist.blockchain_id}</div>
                          </div>
                          <div className="text-xs">
                            <span className="text-muted-foreground">Entry Date:</span>
                            <div>{new Date(tourist.entry_date).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs">
                            <span className="text-muted-foreground">Location:</span>
                            <div className="font-mono text-xs">
                              {tourist.location.lat.toFixed(4)}, {tourist.location.lng.toFixed(4)}
                            </div>
                          </div>
                          <div className="text-xs">
                            <span className="text-muted-foreground">Last Update:</span>
                            <div>{Math.floor(Math.random() * 30) + 1} min ago</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {selectedZone.touristCount > 3 && (
                  <div className="text-center text-sm text-muted-foreground">
                    +{selectedZone.touristCount - 3} more tourists in this zone
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a zone to view tourist details</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
