"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Users,
  AlertTriangle,
  Shield,
  Activity,
  MapPin,
  Phone,
  Mail,
  Clock,
  Battery,
  QrCode,
  Search,
  RefreshCw,
  Eye,
  MessageSquare,
  Brain,
} from "lucide-react"

interface Tourist {
  id: string
  full_name: string
  email: string
  phone: string
  emergency_contact: string
  emergency_phone: string
  blockchain_id: string
  qr_code_data: string
  created_at: string
  current_location: {
    latitude: number
    longitude: number
    timestamp: string
    battery_level: number
    is_emergency: boolean
  } | null
  safety_score: number
  risk_level: string
  active_alerts_count: number
  status: "safe" | "alert" | "emergency"
}

interface DashboardStats {
  activeTourists: number
  activeAlerts: number
  criticalAlerts: number
  resolvedToday: number
  systemUptime: number
  avgResponseTime: number
  geoZones: number
  blockchainTransactions: number
  aiEfficiency: number
  threatDetectionAccuracy: number
}

export default function AdminDashboard() {
  const [tourists, setTourists] = useState<Tourist[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    fetchDashboardData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [touristsResponse, statsResponse] = await Promise.all([
        fetch("/api/admin/tourists"),
        fetch("/api/admin/dashboard-stats"),
      ])

      if (touristsResponse.ok) {
        const touristsData = await touristsResponse.json()
        setTourists(touristsData.tourists)
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTourists = tourists.filter((tourist) => {
    const matchesSearch =
      tourist.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tourist.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tourist.blockchain_id?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || tourist.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "safe":
        return "bg-green-100 text-green-800"
      case "alert":
        return "bg-yellow-100 text-yellow-800"
      case "emergency":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "text-green-600"
      case "medium":
        return "text-yellow-600"
      case "high":
        return "text-orange-600"
      case "critical":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
                <p className="text-muted-foreground">Tourist Safety Management System</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 rounded-full">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-700 font-medium">System Operational</span>
            </div>
            <Button onClick={fetchDashboardData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
                  <Brain className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{stats.aiEfficiency}%</p>
                    <p className="text-sm text-gray-600">AI Efficiency</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Activity className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-600">{stats.systemUptime}%</p>
                    <p className="text-sm text-gray-600">System Uptime</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Dashboard */}
        <Tabs defaultValue="tourists" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tourists">Tourist Management</TabsTrigger>
            <TabsTrigger value="alerts">Alert Center</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="ai-systems">AI Systems</TabsTrigger>
          </TabsList>

          {/* Tourist Management Tab */}
          <TabsContent value="tourists" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tourist Management</CardTitle>
                    <CardDescription>Real-time monitoring of all registered tourists</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search tourists..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="safe">Safe</option>
                      <option value="alert">Alert</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredTourists.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No tourists found</p>
                  ) : (
                    filteredTourists.map((tourist) => (
                      <div key={tourist.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-lg">{tourist.full_name}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Mail className="h-4 w-4" />
                                  <span>{tourist.email}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Phone className="h-4 w-4" />
                                  <span>{tourist.phone}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(tourist.status)}>{tourist.status.toUpperCase()}</Badge>
                            {tourist.active_alerts_count > 0 && (
                              <Badge variant="destructive">
                                {tourist.active_alerts_count} Alert{tourist.active_alerts_count > 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 font-medium">Blockchain ID</p>
                            <div className="flex items-center space-x-2">
                              <QrCode className="h-4 w-4 text-gray-400" />
                              <span className="font-mono text-xs">{tourist.blockchain_id || "Not assigned"}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-500 font-medium">Current Location</p>
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span>
                                {tourist.current_location
                                  ? `${tourist.current_location.latitude.toFixed(4)}, ${tourist.current_location.longitude.toFixed(4)}`
                                  : "Unknown"}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-500 font-medium">Safety Score</p>
                            <div className="flex items-center space-x-2">
                              <div className={`text-lg font-bold ${getRiskLevelColor(tourist.risk_level)}`}>
                                {tourist.safety_score}/100
                              </div>
                              <Badge variant="outline" className={getRiskLevelColor(tourist.risk_level)}>
                                {tourist.risk_level}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-500 font-medium">Last Update</p>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span>
                                {tourist.current_location
                                  ? new Date(tourist.current_location.timestamp).toLocaleString()
                                  : "Never"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {tourist.current_location && (
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Battery className="h-4 w-4" />
                              <span>Battery: {tourist.current_location.battery_level}%</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span>Emergency Contact: {tourist.emergency_contact}</span>
                            </div>
                          </div>
                        )}

                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            Track Live
                          </Button>
                          <Button size="sm" variant="outline">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Send Alert
                          </Button>
                          <Button size="sm" variant="outline">
                            <QrCode className="h-4 w-4 mr-1" />
                            View QR Code
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs would be implemented similarly */}
          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>Alert Management Center</CardTitle>
                <CardDescription>Monitor and respond to tourist alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-500 py-8">Alert management interface coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>System Analytics</CardTitle>
                <CardDescription>Performance metrics and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-500 py-8">Analytics dashboard coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-systems">
            <Card>
              <CardHeader>
                <CardTitle>AI Systems Control</CardTitle>
                <CardDescription>Monitor and control AI-powered features</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-500 py-8">AI systems control panel coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
