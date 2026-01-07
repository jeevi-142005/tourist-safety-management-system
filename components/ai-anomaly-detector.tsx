"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Brain, AlertTriangle, TrendingUp, Activity, Shield, Eye, Wifi, Battery, MapPin, Zap } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useAlerts } from "@/hooks/use-alerts"
import { createClient } from "@/lib/supabase/client"

interface AnomalyPattern {
  id: string
  type: "behavioral" | "location" | "device" | "environmental" | "temporal"
  severity: "low" | "medium" | "high" | "critical"
  confidence: number
  description: string
  detected_at: string
  resolved: boolean
  risk_factors: string[]
  recommendations: string[]
}

interface DeviceMetrics {
  battery_level: number
  connection_strength: number
  location_accuracy: number
  movement_pattern: "stationary" | "walking" | "running" | "vehicle" | "irregular"
  heart_rate?: number
  ambient_light: number
  noise_level: number
}

export function AIAnomalyDetector() {
  const { user } = useAuth()
  const { createAlert } = useAlerts()
  const [isActive, setIsActive] = useState(false)
  const [anomalies, setAnomalies] = useState<AnomalyPattern[]>([])
  const [deviceMetrics, setDeviceMetrics] = useState<DeviceMetrics>({
    battery_level: 100,
    connection_strength: 100,
    location_accuracy: 95,
    movement_pattern: "stationary",
    ambient_light: 50,
    noise_level: 30,
  })
  const [threatLevel, setThreatLevel] = useState<"safe" | "low" | "medium" | "high" | "critical">("safe")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null)
  const [monitoringStats, setMonitoringStats] = useState({
    totalScans: 0,
    threatsBlocked: 0,
    avgResponseTime: 0,
    systemUptime: 0,
  })

  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const deviceMonitorRef = useRef<NodeJS.Timeout | null>(null)
  const uptimeStartRef = useRef<Date>(new Date())

  useEffect(() => {
    if (isActive) {
      startAnomalyDetection()
    } else {
      stopAnomalyDetection()
    }

    return () => {
      stopAnomalyDetection()
    }
  }, [isActive])

  useEffect(() => {
    const uptimeInterval = setInterval(() => {
      if (isActive) {
        const uptime = Math.floor((Date.now() - uptimeStartRef.current.getTime()) / 1000)
        setMonitoringStats((prev) => ({ ...prev, systemUptime: uptime }))
      }
    }, 1000)

    return () => clearInterval(uptimeInterval)
  }, [isActive])

  const startAnomalyDetection = () => {
    analysisIntervalRef.current = setInterval(performAnomalyAnalysis, 30000) // Every 30 seconds
    deviceMonitorRef.current = setInterval(updateDeviceMetrics, 5000) // Every 5 seconds

    uptimeStartRef.current = new Date()

    performAnomalyAnalysis()
    updateDeviceMetrics()
  }

  const stopAnomalyDetection = () => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current)
      analysisIntervalRef.current = null
    }
    if (deviceMonitorRef.current) {
      clearInterval(deviceMonitorRef.current)
      deviceMonitorRef.current = null
    }
  }

  const updateDeviceMetrics = async () => {
    try {
      // Real battery level
      if ("getBattery" in navigator) {
        const battery = await (navigator as any).getBattery()
        setDeviceMetrics((prev) => ({
          ...prev,
          battery_level: Math.round(battery.level * 100),
        }))
      }

      // Real connection strength
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      if (connection) {
        setDeviceMetrics((prev) => ({
          ...prev,
          connection_strength: Math.min(100, (connection.downlink || 10) * 10),
        }))
      }

      // Real GPS location with high accuracy
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const accuracy = position.coords.accuracy
            setDeviceMetrics((prev) => ({
              ...prev,
              location_accuracy: Math.max(0, Math.min(100, 100 - (accuracy / 50))),
              movement_pattern: detectRealMovementPattern(position.coords.speed || 0)
            }))
          },
          () => {
            setDeviceMetrics((prev) => ({
              ...prev,
              location_accuracy: 0,
              movement_pattern: "stationary"
            }))
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000
          }
        )
      }

      // Real ambient light (if supported)
      if ("AmbientLightSensor" in window) {
        try {
          const sensor = new (window as any).AmbientLightSensor()
          sensor.addEventListener("reading", () => {
            setDeviceMetrics((prev) => ({
              ...prev,
              ambient_light: Math.min(100, (sensor.illuminance / 1000) * 100),
            }))
          })
          sensor.start()
        } catch (error) {
          // Fallback to time-based estimation
          const hour = new Date().getHours()
          const lightLevel = hour >= 6 && hour <= 18 ? 70 + Math.random() * 30 : 10 + Math.random() * 20
          setDeviceMetrics((prev) => ({
            ...prev,
            ambient_light: lightLevel,
          }))
        }
      }

      // Estimate noise level based on time and location type
      const hour = new Date().getHours()
      const baseNoise = hour >= 7 && hour <= 22 ? 40 : 20 // Day vs night
      setDeviceMetrics((prev) => ({
        ...prev,
        noise_level: baseNoise + Math.random() * 30,
      }))

    } catch (error) {
      console.error("Error updating device metrics:", error)
    }
  }

  const detectRealMovementPattern = (speed: number): DeviceMetrics["movement_pattern"] => {
    if (speed === null || speed === undefined) return "stationary"
    
    // Speed is in m/s, convert to km/h for easier understanding
    const speedKmh = speed * 3.6
    
    if (speedKmh < 1) return "stationary"
    if (speedKmh < 6) return "walking"
    if (speedKmh < 15) return "running"
    if (speedKmh < 80) return "vehicle"
    return "irregular" // Very high speed might indicate GPS error
  }

  const performAnomalyAnalysis = async () => {
    if (!user || isAnalyzing) return

    setIsAnalyzing(true)
    setLastAnalysis(new Date())
    const analysisStart = Date.now()

    try {
      // Get real current location
      const currentLocation = await new Promise<{lat: number, lng: number}>((resolve, reject) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              })
            },
            () => {
              // Fallback to default location
              resolve({ lat: 40.7128, lng: -74.006 })
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 30000
            }
          )
        } else {
          resolve({ lat: 40.7128, lng: -74.006 })
        }
      })

      // For demo purposes, create realistic anomaly patterns
      const mockAnomalies: AnomalyPattern[] = []
      
      // Check for real anomalies based on device metrics
      if (deviceMetrics.battery_level < 20) {
        mockAnomalies.push({
          id: `battery-${Date.now()}`,
          type: "device",
          severity: "medium",
          confidence: 0.85,
          description: "Critical battery level detected - device may shut down unexpectedly",
          detected_at: new Date().toISOString(),
          resolved: false,
          risk_factors: ["Low battery", "Potential communication loss"],
          recommendations: ["Find charging station immediately", "Enable power saving mode", "Inform emergency contacts of location"]
        })
      }

      if (deviceMetrics.location_accuracy < 30) {
        mockAnomalies.push({
          id: `location-${Date.now()}`,
          type: "location",
          severity: "high",
          confidence: 0.92,
          description: "Poor GPS accuracy detected - location tracking compromised",
          detected_at: new Date().toISOString(),
          resolved: false,
          risk_factors: ["GPS signal weak", "Indoor location", "Weather interference"],
          recommendations: ["Move to open area", "Check GPS settings", "Use alternative navigation"]
        })
      }

      if (deviceMetrics.movement_pattern === "irregular") {
        mockAnomalies.push({
          id: `movement-${Date.now()}`,
          type: "behavioral",
          severity: "high",
          confidence: 0.78,
          description: "Irregular movement pattern detected - possible distress or emergency",
          detected_at: new Date().toISOString(),
          resolved: false,
          risk_factors: ["Erratic movement", "Possible emergency", "Unusual behavior"],
          recommendations: ["Check if assistance needed", "Contact emergency services if required", "Verify safety status"]
        })
      }

      const responseTime = Date.now() - analysisStart
      setMonitoringStats((prev) => ({
        ...prev,
        totalScans: prev.totalScans + 1,
        avgResponseTime: Math.round((prev.avgResponseTime + responseTime) / 2),
      }))

      if (mockAnomalies.length > 0) {
        setAnomalies((prev) => [...mockAnomalies, ...prev].slice(0, 10))

        const highestSeverity = mockAnomalies.reduce((max: string, anomaly: AnomalyPattern) => {
          const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 }
          return severityOrder[anomaly.severity as keyof typeof severityOrder] >
            severityOrder[max as keyof typeof severityOrder]
            ? anomaly.severity
            : max
        }, "low")

        setThreatLevel(highestSeverity as any)

        const criticalThreats = mockAnomalies.filter(
          (a: AnomalyPattern) => a.severity === "critical" || a.severity === "high",
        )
        if (criticalThreats.length > 0) {
          setMonitoringStats((prev) => ({ ...prev, threatsBlocked: prev.threatsBlocked + criticalThreats.length }))
        }

        // Create alerts for critical anomalies
        const criticalAnomalies = mockAnomalies.filter((a: AnomalyPattern) => a.severity === "critical")
        for (const anomaly of criticalAnomalies) {
          await createAlert({
            touristId: user.id,
            touristName: user.name || user.email,
            type: "security",
            message: `AI detected critical anomaly: ${anomaly.description}`,
            location: currentLocation,
            status: "active"
          })
        }
      } else {
        setThreatLevel("safe")
      }
    } catch (error) {
      console.error("Error performing anomaly analysis:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resolveAnomaly = async (anomalyId: string) => {
    try {
      const supabase = createClient()
      if (supabase) {
        await supabase.from("anomaly_patterns").update({ resolved: true }).eq("id", anomalyId)
      }
      setAnomalies((prev) => prev.map((a) => (a.id === anomalyId ? { ...a, resolved: true } : a)))
    } catch (error) {
      console.error("Error resolving anomaly:", error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "behavioral":
        return <Activity className="h-4 w-4" />
      case "location":
        return <MapPin className="h-4 w-4" />
      case "device":
        return <Wifi className="h-4 w-4" />
      case "environmental":
        return <Eye className="h-4 w-4" />
      case "temporal":
        return <TrendingUp className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Brain className="h-6 w-6 text-purple-500" />
                {isActive && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <div>
                <CardTitle className="text-xl">AI Anomaly Detection</CardTitle>
                <CardDescription className="text-sm">Real-time movement and device monitoring</CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-700">System Status</div>
                <div className={`text-sm font-bold ${isActive ? "text-green-600" : "text-gray-500"}`}>
                  {isActive ? "ACTIVE" : "STANDBY"}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="anomaly-detection" className="text-sm font-medium">
                  Enable
                </Label>
                <Switch
                  id="anomaly-detection"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 bg-white/70 backdrop-blur-sm rounded-lg border">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Shield className="h-6 w-6 text-gray-500" />
                  {threatLevel !== "safe" && (
                    <Zap className="absolute -top-1 -right-1 h-3 w-3 text-orange-500 animate-pulse" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Threat Assessment</p>
                  <p className="text-xs text-gray-600">
                    {lastAnalysis ? `Updated: ${lastAnalysis.toLocaleTimeString()}` : "Awaiting analysis"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge className={`${getSeverityColor(threatLevel)} text-lg px-4 py-2 font-bold`}>
                  {threatLevel.toUpperCase()}
                </Badge>
                {isAnalyzing && (
                  <div className="flex items-center space-x-1 mt-1">
                    <div className="h-1 w-1 bg-purple-500 rounded-full animate-pulse"></div>
                    <p className="text-xs text-purple-600">Analyzing...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-white/70 backdrop-blur-sm rounded-lg border">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <p className="font-semibold text-gray-900">Monitoring Stats</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Total Scans</p>
                  <p className="font-bold text-blue-600">{monitoringStats.totalScans}</p>
                </div>
                <div>
                  <p className="text-gray-600">Threats Blocked</p>
                  <p className="font-bold text-red-600">{monitoringStats.threatsBlocked}</p>
                </div>
                <div>
                  <p className="text-gray-600">Response Time</p>
                  <p className="font-bold text-green-600">{monitoringStats.avgResponseTime}ms</p>
                </div>
                <div>
                  <p className="text-gray-600">Uptime</p>
                  <p className="font-bold text-purple-600">{formatUptime(monitoringStats.systemUptime)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-3">
                <Battery className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">Battery</span>
              </div>
              <Progress value={deviceMetrics.battery_level} className="h-3 mb-2" />
              <div className="flex justify-between items-center">
                <p className="text-sm font-bold text-blue-600">{deviceMetrics.battery_level}%</p>
                <Badge variant="outline" className="text-xs">
                  {deviceMetrics.battery_level > 50 ? "Good" : deviceMetrics.battery_level > 20 ? "Low" : "Critical"}
                </Badge>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 mb-3">
                <Wifi className="h-5 w-5 text-green-600" />
                <span className="text-sm font-semibold text-green-800">Signal</span>
              </div>
              <Progress value={deviceMetrics.connection_strength} className="h-3 mb-2" />
              <div className="flex justify-between items-center">
                <p className="text-sm font-bold text-green-600">{deviceMetrics.connection_strength}%</p>
                <Badge variant="outline" className="text-xs">
                  {deviceMetrics.connection_strength > 70
                    ? "Strong"
                    : deviceMetrics.connection_strength > 30
                      ? "Weak"
                      : "Poor"}
                </Badge>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2 mb-3">
                <MapPin className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-semibold text-purple-800">Location</span>
              </div>
              <Progress value={deviceMetrics.location_accuracy} className="h-3 mb-2" />
              <div className="flex justify-between items-center">
                <p className="text-sm font-bold text-purple-600">{deviceMetrics.location_accuracy}%</p>
                <Badge variant="outline" className="text-xs">
                  GPS
                </Badge>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-2 mb-3">
                <Activity className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-semibold text-orange-800">Movement</span>
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm font-bold text-orange-600 capitalize">{deviceMetrics.movement_pattern}</p>
                <Badge variant="outline" className="text-xs">
                  {deviceMetrics.movement_pattern === "irregular" ? "Alert" : "Normal"}
                </Badge>
              </div>
            </div>
          </div>

          {isActive && (
            <Alert className="border-blue-200 bg-blue-50">
              <Brain className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>AI Guardian Active:</strong> Real-time monitoring of movement patterns, device metrics, and environmental conditions.
                {anomalies.filter((a) => !a.resolved).length > 0 && (
                  <span className="ml-2 font-semibold">
                    {anomalies.filter((a) => !a.resolved).length} active anomalies detected.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {anomalies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>Detected Anomalies</span>
            </CardTitle>
            <CardDescription>AI-identified patterns based on real device and movement data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {anomalies
                .filter((a) => !a.resolved)
                .map((anomaly) => (
                  <div key={anomaly.id} className={`p-4 rounded-lg border ${getSeverityColor(anomaly.severity)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getTypeIcon(anomaly.type)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getSeverityColor(anomaly.severity)}>
                              {anomaly.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(anomaly.confidence * 100)}% confidence
                            </Badge>
                            <span className="text-xs text-gray-500 capitalize">{anomaly.type}</span>
                          </div>
                          <p className="text-sm font-medium mb-2">{anomaly.description}</p>
                          <p className="text-xs text-gray-600 mb-3">
                            Detected: {new Date(anomaly.detected_at).toLocaleString()}
                          </p>

                          {anomaly.risk_factors.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-gray-700 mb-1">Risk Factors:</p>
                              <div className="flex flex-wrap gap-1">
                                {anomaly.risk_factors.map((factor, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {factor}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {anomaly.recommendations.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-700 mb-1">AI Recommendations:</p>
                              <ul className="space-y-1">
                                {anomaly.recommendations.map((rec, index) => (
                                  <li key={index} className="text-xs text-gray-600 flex items-start space-x-1">
                                    <span className="text-blue-500 mt-0.5">•</span>
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resolveAnomaly(anomaly.id)}
                        className="bg-transparent"
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
