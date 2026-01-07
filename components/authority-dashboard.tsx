"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  AlertTriangle,
  FileText,
  MapPin,
  Clock,
  Shield,
  TrendingUp,
  Activity,
  Phone,
  Eye,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface DashboardStats {
  activeTourists: number
  activeAlerts: number
  criticalAlerts: number
  recentEFIRs: number
  resolvedToday: number
  responseTime: number
}

interface Alert {
  id: string
  user_id: string
  alert_type: string
  severity: "low" | "medium" | "high" | "critical"
  description: string
  location_lat: number
  location_lng: number
  status: "active" | "investigating" | "resolved"
  created_at: string
  profiles: {
    full_name: string
    phone: string
  }
}

interface Tourist {
  id: string
  full_name: string
  phone: string
  current_location_lat: number
  current_location_lng: number
  last_seen: string
  risk_level: number
  status: "active" | "inactive" | "emergency"
}

export function AuthorityDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [tourists, setTourists] = useState<Tourist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      setError(null)
      const response = await fetch("/api/authority/dashboard-data")

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data")
      }

      const data = await response.json()
      setStats(data.stats)
      setAlerts(data.alerts)
      setTourists(data.tourists)
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
      setError(err instanceof Error ? err.message : "Failed to load dashboard data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResolveAlert = async (alertId: string) => {
    try {
      const supabase = createClient()
      await supabase
        .from("alerts")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("id", alertId)

      // Refresh data
      fetchDashboardData()
    } catch (error) {
      console.error("Error resolving alert:", error)
    }
  }

  const handleGenerateEFIR = async (alertId: string) => {
    try {
      const response = await fetch("/api/authority/generate-efir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId }),
      })

      if (response.ok) {
        const data = await response.json()
        // Handle EFIR generation success
        console.log("EFIR generated:", data.efirNumber)
        fetchDashboardData()
      }
    } catch (error) {
      console.error("Error generating EFIR:", error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "emergency":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading authority dashboard...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Authority Command Center</h1>
          <p className="text-gray-600">Real-time monitoring and incident management</p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.activeTourists}</p>
                  <p className="text-sm text-gray-600">Active Tourists</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold text-orange-600">{stats.activeAlerts}</p>
                  <p className="text-sm text-gray-600">Active Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.criticalAlerts}</p>
                  <p className="text-sm text-gray-600">Critical Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.recentEFIRs}</p>
                  <p className="text-sm text-gray-600">Recent E-FIRs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alerts">Alert Management</TabsTrigger>
          <TabsTrigger value="tourists">Tourist Monitoring</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>Real-time incident monitoring and response</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No active alerts</p>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge className={getSeverityColor(alert.severity)}>{alert.severity.toUpperCase()}</Badge>
                          <span className="font-medium">{alert.alert_type.replace("_", " ").toUpperCase()}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(alert.created_at).toLocaleString()}</span>
                        </div>
                      </div>

                      <p className="text-gray-700">{alert.description}</p>

                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>{alert.profiles?.full_name || "Unknown"}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{alert.profiles?.phone || "N/A"}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>
                            {alert.location_lat.toFixed(4)}, {alert.location_lng.toFixed(4)}
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleResolveAlert(alert.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Resolve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleGenerateEFIR(alert.id)}>
                          Generate E-FIR
                        </Button>
                        <Button size="sm" variant="outline">
                          Assign Officer
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tourists Tab */}
        <TabsContent value="tourists" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tourist Monitoring</CardTitle>
              <CardDescription>Real-time location and status of registered tourists</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tourists.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No active tourists</p>
                ) : (
                  tourists.map((tourist) => (
                    <div key={tourist.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{tourist.full_name}</p>
                            <p className="text-sm text-gray-500">{tourist.phone}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(tourist.status)}>{tourist.status.toUpperCase()}</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Current Location</p>
                          <p className="font-medium">
                            {tourist.current_location_lat?.toFixed(4)}, {tourist.current_location_lng?.toFixed(4)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Last Seen</p>
                          <p className="font-medium">{new Date(tourist.last_seen).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Risk Level</p>
                          <p className="font-medium">{tourist.risk_level}/10</p>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Track
                        </Button>
                        <Button size="sm" variant="outline">
                          <Phone className="h-4 w-4 mr-1" />
                          Contact
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Heatmap Tab */}
        <TabsContent value="heatmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tourist Activity Heatmap</CardTitle>
              <CardDescription>Visualization of tourist density and incident hotspots</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center space-y-2">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="text-gray-500 font-medium">Interactive Heatmap</p>
                  <p className="text-sm text-gray-400">Tourist density and incident visualization</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Response Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Average Response Time</p>
                    <p className="text-2xl font-bold text-blue-600">{stats?.responseTime || 0} min</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Resolved Today</p>
                    <p className="text-2xl font-bold text-green-600">{stats?.resolvedToday || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>System Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">GPS Tracking</span>
                    <Badge className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Alert System</span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">AI Analysis</span>
                    <Badge className="bg-green-100 text-green-800">Running</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
