"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Shield,
  Users,
  AlertTriangle,
  MapPin,
  Clock,
  LogOut,
  CheckCircle,
  Brain,
  Zap,
  TrendingUp,
  Activity,
  WifiOff,
  Satellite,
  Bell,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useAlerts } from "@/hooks/use-alerts"
import { useLanguage } from "@/contexts/language-context"
import { AIAlertAnalysis } from "./ai-alert-analysis"
import { AIIncidentReport } from "./ai-incident-report"
import { useAIAutomation } from "@/hooks/use-ai-automation"
import { NotificationSystem } from "./notification-system"
import { AIChatAssistant } from "./ai-chat-assistant"
import { AuthorityHeatmap } from "./authority-heatmap"
import { createClient } from "@/lib/supabase/client"

interface Alert {
  id: string
  type: string
  message: string
  touristName: string
  status: string
  timestamp: string
  location: {
    lat: number
    lng: number
  }
  severity: string
  source?: 'online' | 'offline' | 'mesh'
  user_name?: string
  location_accuracy?: number
  received_at?: string
}

interface Tourist {
  id: string
  name: string
  email: string
  blockchain_id?: string
  entry_date: string
  location_lat?: number
  location_lng?: number
  status: string
  last_seen: string
  nationality: string
  visa_type: string
}

interface Activity {
  type: 'emergency' | 'warning' | 'info'
  message: string
  status: string
  time: string
}

export function AdminDashboard() {
  const { user, signOut } = useAuth()
  const { t, language, setLanguage } = useLanguage()
  const { alerts, activeAlerts, resolvedAlerts, loading, resolveAlert } = useAlerts()
  
  const [dashboardStats, setDashboardStats] = useState({
    activeTourists: 0,
    safeZones: 8,
    avgResponseTime: "1.8m",
    aiEfficiency: "98.7%"
  })
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [tourists, setTourists] = useState<Tourist[]>([])
  const [databaseAlerts, setDatabaseAlerts] = useState<Alert[]>([])
  const [isPolling, setIsPolling] = useState(false)
  const [offlineAlertQueue, setOfflineAlertQueue] = useState<Alert[]>([])
  const [pendingOfflineAlerts, setPendingOfflineAlerts] = useState(0)

  // New offline alert states
  const [meshAlerts, setMeshAlerts] = useState<Alert[]>([])
  const [offlineAlertsReceived, setOfflineAlertsReceived] = useState(0)

  const [activeTab, setActiveTab] = useState("overview")
  const [prioritizedAlerts, setPrioritizedAlerts] = useState<Alert[]>([])
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const { prioritizeAlerts, isAnalyzing } = useAIAutomation()

  const [selectedTourist, setSelectedTourist] = useState<Tourist | null>(null)
  const [showTouristDetails, setShowTouristDetails] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  // Add this state for tourist data with offline alerts
const [touristData, setTouristData] = useState([])

// Add this useEffect to load tourist data
useEffect(() => {
  const loadTouristData = () => {
    try {
      const data = JSON.parse(localStorage.getItem('adminTouristData') || '[]')
      setTouristData(data)
    } catch (error) {
      console.error("Failed to load tourist data:", error)
    }
  }
  
  loadTouristData()
  // Refresh every 3 seconds
  const interval = setInterval(loadTouristData, 3000)
  return () => clearInterval(interval)
}, [])


  // New offline alert functionality
  useEffect(() => {
    // Set up mesh network listener for offline alerts
    const emergencyChannel = new BroadcastChannel('emergency-mesh')
    
    emergencyChannel.onmessage = (event) => {
      if (event.data.type === 'EMERGENCY_ALERT') {
        const alertData = {
          ...event.data.data,
          id: `mesh-${Date.now()}`,
          source: 'mesh' as const,
          received_at: new Date().toISOString(),
          touristName: event.data.data.user_name || 'Unknown Tourist'
        }
        
        setMeshAlerts(prev => [alertData, ...prev.slice(0, 49)])
        setOfflineAlertsReceived(prev => prev + 1)
        
        // Show browser notification
        if (Notification.permission === 'granted') {
          new Notification('Emergency Alert Received (Offline)', {
            body: `${alertData.type}: ${alertData.message}`,
            icon: '/placeholder-logo.png',
            tag: 'emergency-alert'
          })
        }
        
        playAlertSound()
      }
    }

    // Set up service worker message listener
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'EMERGENCY_ALERT_RECEIVED') {
          const alertData = {
            ...event.data.data,
            id: `sw-${Date.now()}`,
            source: 'offline' as const,
            received_at: new Date().toISOString(),
            touristName: event.data.data.user_name || 'Unknown Tourist'
          }
          
          setMeshAlerts(prev => [alertData, ...prev.slice(0, 49)])
          setOfflineAlertsReceived(prev => prev + 1)
        }
      })
    }

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => {
      emergencyChannel.close()
    }
  }, [])

  const playAlertSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.type = "sine"
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.log("Audio notification not supported")
    }
  }

  const getAlertSourceIcon = (source?: string) => {
    switch (source) {
      case 'mesh':
        return <Satellite className="h-4 w-4 text-green-500" />
      case 'offline':
        return <WifiOff className="h-4 w-4 text-orange-500" />
      default:
        return <Zap className="h-4 w-4 text-blue-500" />
    }
  }

  const getAlertSourceBadge = (source?: string) => {
    switch (source) {
      case 'mesh':
        return <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">Mesh Network</Badge>
      case 'offline':
        return <Badge variant="outline" className="text-orange-700 border-orange-300 bg-orange-50">Offline Sync</Badge>
      default:
        return <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">Online</Badge>
    }
  }

  const simulateOfflineAlertReceived = useCallback((alert: Alert) => {
    setOfflineAlertQueue(prev => [...prev, alert])
    setPendingOfflineAlerts(prev => prev + 1)
  }, [])

  const processOfflineAlerts = useCallback(async () => {
    if (offlineAlertQueue.length === 0) return

    try {
      const supabase = createClient()
      if (!supabase) return

      const { error } = await supabase
        .from('emergency_alerts')
        .insert(offlineAlertQueue.map(alert => ({
          user_id: alert.id,
          type: alert.type,
          message: alert.message,
          severity: alert.severity,
          location_lat: alert.location.lat,
          location_lng: alert.location.lng,
          status: 'active',
          created_at: alert.timestamp
        })))

      if (error) throw error

      setOfflineAlertQueue([])
      setPendingOfflineAlerts(0)
      await fetchDatabaseAlerts()
      
      console.log(`Processed ${offlineAlertQueue.length} offline alerts`)
    } catch (error) {
      console.error('Error processing offline alerts:', error)
    }
  }, [offlineAlertQueue])

  const handleViewTouristDetails = (tourist: Tourist) => {
    setSelectedTourist(tourist)
    setShowTouristDetails(true)
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await signOut()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const fetchDatabaseAlerts = useCallback(async () => {
    if (isPolling) return
    
    try {
      setIsPolling(true)
      const supabase = createClient()
      if (!supabase) return

      const { data: alertsData, error } = await supabase
        .from('emergency_alerts')
        .select('*')
        .neq('type', 'admin_notification')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching alerts:', error)
        return
      }

      const formattedAlerts: Alert[] = alertsData?.map(alert => ({
        id: alert.id,
        type: alert.type || 'emergency',
        message: alert.message || 'Emergency alert',
        touristName: alert.user_name || 'Tourist User',
        status: alert.status || 'active',
        timestamp: alert.created_at,
        location: {
          lat: alert.location_lat || 40.7128,
          lng: alert.location_lng || -74.006
        },
        severity: alert.severity || 'high',
        source: 'online'
      })) || []

      setDatabaseAlerts(formattedAlerts)
    } catch (error) {
      console.error('Error in fetchDatabaseAlerts:', error)
    } finally {
      setIsPolling(false)
    }
  }, [isPolling])

  const handleSendAlert = async (tourist: Tourist) => {
    try {
      const supabase = createClient()
      if (!supabase) {
        alert('Database not available')
        return
      }

      const { error } = await supabase.from('emergency_alerts').insert({
        user_id: tourist.id,
        type: 'admin_notification',
        message: `Alert sent to ${tourist.name} by admin`,
        severity: 'medium',
        location_lat: tourist.location_lat,
        location_lng: tourist.location_lng,
        status: 'active',
        created_at: new Date().toISOString()
      })
      
      if (error) throw error
      
      await fetchRecentActivity()
      alert(`Alert sent to ${tourist.name}`)
    } catch (error) {
      console.error('Error sending alert:', error)
      alert('Failed to send alert')
    }
  }

  const handleResolveRealAlert = async (alertId: string) => {
    try {
      // Handle mesh alerts differently
      if (alertId.startsWith('mesh-') || alertId.startsWith('sw-')) {
        setMeshAlerts(prev => prev.filter(alert => alert.id !== alertId))
        return
      }

      const supabase = createClient()
      if (!supabase) return

      const { error } = await supabase
        .from('emergency_alerts')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id
        })
        .eq('id', alertId)
      
      if (error) throw error
      
      await fetchDatabaseAlerts()
      await fetchRecentActivity()
    } catch (error) {
      console.error('Error resolving alert:', error)
    }
  }

  const fetchDashboardStats = useCallback(async () => {
    try {
      setIsLoadingStats(true)
      const supabase = createClient()
      
      if (!supabase) {
        setDashboardStats({
          activeTourists: 1247,
          safeZones: 8,
          avgResponseTime: "1.8m",
          aiEfficiency: "98.7%"
        })
        return
      }

      const { count: touristCount } = await supabase
        .from('tourist_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
      
      const { data: resolvedAlertsData } = await supabase
        .from('emergency_alerts')
        .select('created_at, resolved_at')
        .eq('status', 'resolved')
        .not('resolved_at', 'is', null)
        .limit(50)
      
      let avgResponseTime = "1.8m"
      if (resolvedAlertsData && resolvedAlertsData.length > 0) {
        const totalTime = resolvedAlertsData.reduce((sum, alert) => {
          const created = new Date(alert.created_at)
          const resolved = new Date(alert.resolved_at)
          return sum + (resolved.getTime() - created.getTime())
        }, 0)
        const avgMinutes = Math.round(totalTime / resolvedAlertsData.length / 60000)
        avgResponseTime = `${avgMinutes}m`
      }
      
      setDashboardStats({
        activeTourists: touristCount || 0,
        safeZones: 8,
        avgResponseTime,
        aiEfficiency: "98.7%"
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      setDashboardStats({
        activeTourists: 1247,
        safeZones: 8,
        avgResponseTime: "1.8m",
        aiEfficiency: "98.7%"
      })
    } finally {
      setIsLoadingStats(false)
    }
  }, [])

  const fetchRecentActivity = useCallback(async () => {
    try {
      const supabase = createClient()
      if (!supabase) return
      
      const { data: recentAlerts } = await supabase
        .from('emergency_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (recentAlerts) {
        const activities: Activity[] = recentAlerts.map(alert => ({
          type: alert.severity === 'high' ? 'emergency' : alert.severity === 'medium' ? 'warning' : 'info',
          message: `${alert.type} alert: ${alert.message}`,
          status: alert.status,
          time: new Date(alert.created_at).toLocaleTimeString()
        }))
        setRecentActivity(activities)
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error)
    }
  }, [])

  const fetchTourists = useCallback(async () => {
    try {
      const supabase = createClient()
      if (!supabase) return

      const { data: touristsData, error } = await supabase
        .from('tourist_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) {
        console.error('Error fetching tourists:', error)
        return
      }

      const formattedTourists: Tourist[] = touristsData?.map(tourist => ({
        id: tourist.id,
        name: tourist.full_name || 'Unknown',
        email: tourist.email || '',
        blockchain_id: tourist.blockchain_id,
        entry_date: tourist.created_at,
        location_lat: tourist.location_lat,
        location_lng: tourist.location_lng,
        status: tourist.is_active ? 'active' : 'inactive',
        last_seen: tourist.last_seen || 'Never',
        nationality: tourist.nationality || 'Unknown',
        visa_type: tourist.visa_type || 'Tourist'
      })) || []

      setTourists(formattedTourists)
    } catch (error) {
      console.error('Error in fetchTourists:', error)
    }
  }, [])

  useEffect(() => {
    fetchDashboardStats()
    fetchDatabaseAlerts()
    fetchRecentActivity()
    fetchTourists()

    intervalRef.current = setInterval(() => {
      fetchDatabaseAlerts()
      fetchRecentActivity()
    }, 10000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchDashboardStats, fetchDatabaseAlerts, fetchRecentActivity, fetchTourists])

  useEffect(() => {
    const runPrioritization = async () => {
      if (activeAlerts.length > 0) {
        const prioritized = await prioritizeAlerts(activeAlerts)
        setPrioritizedAlerts(prioritized)
      }
    }
    runPrioritization()
  }, [activeAlerts, prioritizeAlerts])

  // Combine database alerts and mesh alerts
  const allActiveAlerts = [...databaseAlerts.filter(alert => alert.status === 'active'), ...meshAlerts].sort((a, b) => 
    new Date(b.timestamp || b.received_at).getTime() - new Date(a.timestamp || a.received_at).getTime()
  )

  const allResolvedAlerts = databaseAlerts.filter(alert => alert.status === 'resolved')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t("admin.title")}</h1>
            <p className="text-gray-600">{t("admin.subtitle")}</p>
          </div>
          <div className="flex items-center space-x-4">
            {offlineAlertsReceived > 0 && (
              <Badge variant="destructive" className="flex items-center space-x-1">
                <Satellite className="h-3 w-3" />
                <span>{offlineAlertsReceived} Offline Alerts</span>
              </Badge>
            )}
            <NotificationSystem />
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value as any)}
              className="px-3 py-1 border rounded text-sm bg-white cursor-pointer"
            >
              <option value="en">🇺🇸 English</option>
              <option value="ml">ML Malayalam</option>
              <option value="tl">Tl Telugu</option>
              <option value="es">🇪🇸 Español</option>
              <option value="fr">🇫🇷 Français</option>
              <option value="de">🇩🇪 Deutsch</option>
              <option value="zh">🇨🇳 中文</option>
            </select>
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              {user?.email?.split('@')[0]} - Admin
            </Badge>
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:border-destructive/50 transition-all duration-200 bg-transparent"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t("header.logout")}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
            <TabsTrigger value="alerts" className="relative">
              <Bell className="h-4 w-4 mr-2" />
              {t("tabs.alerts")}
              {allActiveAlerts.length > 0 && (
                <Badge className="ml-2 bg-red-500 text-white text-xs px-1 py-0 min-w-[16px] h-4">
                  {allActiveAlerts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tourists">
              <Users className="h-4 w-4 mr-2" />
              {t("tabs.tourists")}
            </TabsTrigger>
            <TabsTrigger value="ai-automation">
              <Brain className="h-4 w-4 mr-2" />
              {t("tabs.ai_automation")}
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <Shield className="h-4 w-4 mr-2" />
              {t("tabs.analytics")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-blue-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("cards.active_tourists")}</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {isLoadingStats ? "..." : dashboardStats.activeTourists.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">{t("cards.currently_tracked")}</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-green-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("cards.safe_zones")}</CardTitle>
                  <Shield className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{dashboardStats.safeZones}</div>
                  <p className="text-xs text-muted-foreground">{t("cards.monitored_areas")}</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-orange-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("cards.avg_response")}</CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{dashboardStats.avgResponseTime}</div>
                  <p className="text-xs text-muted-foreground">{t("cards.emergency_response")}</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-purple-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("cards.ai_efficiency")}</CardTitle>
                  <Brain className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{dashboardStats.aiEfficiency}</div>
                  <p className="text-xs text-muted-foreground">{t("cards.threat_detection")}</p>
                </CardContent>
              </Card>
            </div>
            {/* Add this card after the existing overview cards */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Users className="h-5 w-5" />
      Tourist Emergency Status
      {touristData.filter((t: any) => t.offline_alerts?.length > 0).length > 0 && (
        <Badge variant="destructive" className="animate-pulse">
          {touristData.filter((t: any) => t.offline_alerts?.length > 0).length} OFFLINE ALERTS
        </Badge>
      )}
    </CardTitle>
  </CardHeader>
  <CardContent>
    {touristData.length === 0 ? (
      <p className="text-gray-500 text-center py-4">No tourist data available</p>
    ) : (
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {touristData.map((tourist: any) => (
          <div key={tourist.user_id} className={`p-4 border rounded-lg ${
            tourist.status === 'emergency' ? 'border-red-300 bg-red-50' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{tourist.name}</h3>
              <div className="flex items-center gap-2">
                <Badge variant={tourist.status === 'emergency' ? 'destructive' : 'default'}>
                  {tourist.status.toUpperCase()}
                </Badge>
                {tourist.offline_alerts && tourist.offline_alerts.length > 0 && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    <WifiOff className="h-3 w-3 mr-1" />
                    {tourist.offline_alerts.length} OFFLINE
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Location: {tourist.location}
              </p>
              <p className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last Seen: {new Date(tourist.last_seen).toLocaleString()}
              </p>
              {tourist.offline_alerts && tourist.offline_alerts.length > 0 && (
                <div className="mt-3">
                  <p className="font-medium text-red-600 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Offline Emergency Alerts ({tourist.offline_alerts.length})
                  </p>
                  <div className="mt-2 space-y-2">
                    {tourist.offline_alerts.slice(0, 3).map((alert: any) => (
                      <div key={alert.id} className="p-3 bg-red-50 border border-red-200 rounded text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="destructive" className="text-xs">
                            {alert.type.toUpperCase()}
                          </Badge>
                          <span className="text-gray-500">
                            {new Date(alert.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="font-medium mb-1">{alert.message}</p>
                        <p className="text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {alert.location}
                        </p>
                        {!alert.acknowledged && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="mt-2 text-xs"
                            onClick={() => {
                              // Acknowledge alert
                              const updatedTourists = touristData.map((t: any) => 
                                t.user_id === tourist.user_id 
                                  ? {
                                      ...t,
                                      offline_alerts: t.offline_alerts.map((a: any) => 
                                        a.id === alert.id 
                                          ? { ...a, acknowledged: true, acknowledged_at: new Date().toISOString() }
                                          : a
                                      )
                                    }
                                  : t
                              )
                              localStorage.setItem('adminTouristData', JSON.stringify(updatedTourists))
                              setTouristData(updatedTourists)
                            }}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    ))}
                    {tourist.offline_alerts.length > 3 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{tourist.offline_alerts.length - 3} more alerts
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </CardContent>
</Card>


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    <span>{t("cards.recent_activity")}</span>
                  </CardTitle>
                  <CardDescription>{t("cards.latest_system_events")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">{t("cards.no_recent_activity")}</p>
                    ) : (
                      recentActivity.slice(0, 5).map((activity, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            activity.type === 'emergency' ? 'bg-red-500' :
                            activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                            <p className="text-xs text-gray-500">{activity.time}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span>{t("cards.system_performance")}</span>
                  </CardTitle>
                  <CardDescription>{t("cards.real_time_metrics")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t("cards.server_uptime")}</span>
                      <span className="text-sm text-green-600">99.9%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t("cards.database_health")}</span>
                      <span className="text-sm text-green-600">{t("cards.excellent")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t("cards.api_response")}</span>
                      <span className="text-sm text-green-600">145ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Offline Alerts</span>
                      <span className="text-sm text-purple-600">{offlineAlertsReceived} received</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <AuthorityHeatmap />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <span>{t("cards.active_alerts")} ({allActiveAlerts.length})</span>
                    {offlineAlertsReceived > 0 && (
                      <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                        {meshAlerts.length} from offline sources
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{t("cards.immediate_attention_required")}</CardDescription>
                </CardHeader>
                <CardContent>
                  {allActiveAlerts.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">{t("cards.no_active_alerts")}</p>
                  ) : (
                    <div className="space-y-4">
                      {allActiveAlerts.map((alert) => (
                        <div key={alert.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                {getAlertSourceIcon(alert.source)}
                                <Badge variant="destructive">{alert.type}</Badge>
                                <span className="text-sm font-medium">{alert.touristName}</span>
                                {getAlertSourceBadge(alert.source)}
                                <Badge className="bg-red-100 text-red-800">{alert.severity}</Badge>
                              </div>
                              <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{new Date(alert.timestamp || alert.received_at).toLocaleTimeString()}</span>
                                </div>
                                {alert.location && (
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{alert.location.lat.toFixed(4)}, {alert.location.lng.toFixed(4)}</span>
                                    {alert.location_accuracy && (
                                      <span>(±{Math.round(alert.location_accuracy)}m)</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedAlert(selectedAlert?.id === alert.id ? null : alert)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <Brain className="h-4 w-4 mr-1" />
                                {t("cards.ai_analysis")}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResolveRealAlert(alert.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {t("cards.resolve")}
                              </Button>
                            </div>
                          </div>
                          {selectedAlert?.id === alert.id && (
                            <AIAlertAnalysis
                              alert={alert}
                              onResponsePlanGenerated={(plan) => console.log("Response plan:", plan)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>{t("cards.resolved_alerts")} ({allResolvedAlerts.length})</span>
                  </CardTitle>
                  <CardDescription>{t("cards.recently_resolved_incidents")}</CardDescription>
                </CardHeader>
                <CardContent>
                  {allResolvedAlerts.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">{t("cards.no_resolved_alerts")}</p>
                  ) : (
                    <div className="space-y-4">
                      {allResolvedAlerts.slice(0, 5).map((alert) => (
                        <div key={alert.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge variant="outline" className="text-green-700 border-green-300">
                                  {alert.type}
                                </Badge>
                                <span className="text-sm font-medium">{alert.touristName}</span>
                                <Badge className="bg-green-100 text-green-800">{t("cards.resolved")}</Badge>
                              </div>
                              <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <AIIncidentReport alert={alert} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tourists" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span>{t("cards.registered_tourists")} ({tourists.length})</span>
                </CardTitle>
                <CardDescription>{t("cards.manage_tourist_profiles")}</CardDescription>
              </CardHeader>
              <CardContent>
                {tourists.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">{t("cards.no_tourists_registered")}</p>
                ) : (
                  <div className="space-y-4">
                    {tourists.slice(0, 10).map((tourist) => (
                      <div key={tourist.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-medium">{tourist.name}</h3>
                              <p className="text-sm text-gray-500">{tourist.email}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant={tourist.status === 'active' ? 'default' : 'secondary'}>
                                  {tourist.status}
                                </Badge>
                                <span className="text-xs text-gray-400">{tourist.nationality}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewTouristDetails(tourist)}
                            >
                              {t("cards.view_details")}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendAlert(tourist)}
                              className="bg-orange-500 hover:bg-orange-600 text-white"
                            >
                              {t("cards.send_alert")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-automation" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    <span>{t("tabs.ai_systems")}</span>
                  </CardTitle>
                  <CardDescription>{t("cards.monitor_and_control")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-3xl font-bold text-purple-600 mb-2">97.3%</div>
                      <div className="text-sm text-gray-600">{t("cards.threat_detection_accuracy")}</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600 mb-2">1.8s</div>
                      <div className="text-sm text-gray-600">{t("cards.ai_analysis_speed")}</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
                      <div className="text-sm text-gray-600">{t("cards.automated_monitoring")}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("tabs.analytics")}</CardTitle>
                  <CardDescription>{t("cards.performance_metrics")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">98.5%</div>
                      <p className="text-sm text-gray-600">{t("cards.system_uptime")}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">2.1s</div>
                      <p className="text-sm text-gray-600">{t("cards.avg_response_time")}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-500">{allActiveAlerts.length}</div>
                      <p className="text-sm text-gray-600">{t("cards.alerts_today")}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{offlineAlertsReceived}</div>
                      <p className="text-sm text-gray-600">Offline Alerts Received</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {showTouristDetails && selectedTourist && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Tourist Details - {selectedTourist.name}</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowTouristDetails(false)}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Personal Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-muted-foreground">Name:</span> {selectedTourist.name}</div>
                    <div><span className="text-muted-foreground">Email:</span> {selectedTourist.email}</div>
                    <div><span className="text-muted-foreground">Nationality:</span> {selectedTourist.nationality}</div>
                    <div><span className="text-muted-foreground">Visa Type:</span> {selectedTourist.visa_type}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Verification & Location</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-muted-foreground">Blockchain ID:</span> 
                      <div className="font-mono text-xs bg-slate-100 p-1 rounded mt-1">
                        {selectedTourist.blockchain_id || "Not verified"}
                      </div>
                    </div>
                    <div><span className="text-muted-foreground">Entry Date:</span> {new Date(selectedTourist.entry_date).toLocaleDateString()}</div>
                    <div><span className="text-muted-foreground">Current Location:</span> {selectedTourist.location_lat?.toFixed(4)}, {selectedTourist.location_lng?.toFixed(4)}</div>
                    <div><span className="text-muted-foreground">Last Seen:</span> {selectedTourist.last_seen}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <AIChatAssistant touristName={user?.name} location={t("cards.authority_command_center")} />
    </div>
  )
}
