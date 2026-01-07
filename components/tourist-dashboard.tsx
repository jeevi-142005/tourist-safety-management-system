"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Shield,
  AlertTriangle,
  MapPin,
  LogOut,
  Phone,
  Heart,
  HelpCircle,
  CheckCircle,
  User,
  Wifi,
  WifiOff,
  Battery,
  Brain,
  Navigation,
  Zap,
  Bell,
  Clock,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSelector } from "@/components/language-selector"
import { LoadingSpinner } from "@/components/loading-spinner"
import { EmergencyAlert } from "./emergency-alert"
import { AISafetyAssistant } from "./ai-safety-assistant"
import { AIChatAssistant } from "./ai-chat-assistant"
import { DigitalIDGenerator } from "./digital-id-generator"
import { DigitalIDDisplay } from "./digital-id-display"
import { LiveTrackingMap } from "./live-tracking-map"
import { EnhancedEmergencySystem } from "./enhanced-emergency-system"
import { AIAnomalyDetector } from "./ai-anomaly-detector"
import { AISafetyAdvisor } from "./ai-safety-advisor"
import { createClient } from "@/lib/supabase/client"

export function TouristDashboard() {
  const { user, signOut } = useAuth()
  const { t, language, setLanguage } = useLanguage()

  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "prompt">("prompt")
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [adminAlerts, setAdminAlerts] = useState([])
  const [unreadAlerts, setUnreadAlerts] = useState(0)
  const [batteryLevel, setBatteryLevel] = useState<string>("N/A")
  const [batteryCharging, setBatteryCharging] = useState<boolean>(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [offlineAlertsCount, setOfflineAlertsCount] = useState(0)

  // Danger zone detection
  const [dangerZones] = useState([
    { lat: 11.030, lng: 76.992, radius: 0.002, name: "High Crime Area" },
    { lat: 11.028, lng: 76.990, radius: 0.001, name: "Construction Zone" },
    { lat: 11.032, lng: 76.994, radius: 0.0015, name: "Restricted Area" }
  ])
  const [lastAlertTime, setLastAlertTime] = useState<number>(0)

  const checkOfflineAlerts = () => {
    const offlineAlerts = JSON.parse(localStorage.getItem('offlineAlerts') || '[]')
    setOfflineAlertsCount(offlineAlerts.length)
  }

  const syncOfflineAlerts = async () => {
    const offlineAlerts = JSON.parse(localStorage.getItem('offlineAlerts') || '[]')
    if (offlineAlerts.length === 0) return

    const supabase = createClient()
    if (!supabase) return

    try {
      for (const alert of offlineAlerts) {
        const { id, ...alertData } = alert
        await supabase.from('emergency_alerts').insert(alertData)
      }
      localStorage.removeItem('offlineAlerts')
      setOfflineAlertsCount(0)
      console.log(`Synced ${offlineAlerts.length} offline alerts`)
    } catch (error) {
      console.error('Failed to sync offline alerts:', error)
    }
  }

  const checkDangerZone = async (location: { lat: number; lng: number }) => {
    const now = Date.now()
    if (now - lastAlertTime < 60000) return // Prevent spam alerts (1 minute cooldown)

    for (const zone of dangerZones) {
      const distance = Math.sqrt(
        Math.pow(location.lat - zone.lat, 2) + Math.pow(location.lng - zone.lng, 2)
      )
      
      if (distance <= zone.radius) {
        setLastAlertTime(now)
        await sendDangerZoneAlert(zone.name, location)
        break
      }
    }
  }

  const sendDangerZoneAlert = async (zoneName: string, location: { lat: number; lng: number }) => {
    try {
      const alertData = {
        user_id: user?.id,
        type: 'danger_zone',
        message: `Tourist entered ${zoneName}. Immediate attention required.`,
        severity: 'high',
        location_lat: location.lat,
        location_lng: location.lng,
        status: 'active',
        created_at: new Date().toISOString()
      }

      if (!isOnline) {
        const offlineAlerts = JSON.parse(localStorage.getItem('offlineAlerts') || '[]')
        offlineAlerts.push({ ...alertData, id: Date.now() })
        localStorage.setItem('offlineAlerts', JSON.stringify(offlineAlerts))
        setOfflineAlertsCount(offlineAlerts.length)
        return
      }

      const supabase = createClient()
      if (supabase && user?.id) {
        await supabase.from('emergency_alerts').insert(alertData)
      }
    } catch (error) {
      console.error('Error sending danger zone alert:', error)
    }
  }

  const fetchAdminAlerts = async () => {
    if (!isOnline) return
    
    try {
      const supabase = createClient()
      if (supabase && user?.id) {
        const { data: alerts } = await supabase
          .from('emergency_alerts')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'admin_notification')
          .order('created_at', { ascending: false })
          .limit(10)
        
        if (alerts) {
          setAdminAlerts(alerts)
          setUnreadAlerts(alerts.filter(alert => alert.status === 'active').length)
        }
      }
    } catch (error) {
      console.error('Error fetching admin alerts:', error)
    }
  }

  const getBatteryInfo = async () => {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery()
        setBatteryLevel(Math.round(battery.level * 100) + "%")
        setBatteryCharging(battery.charging)
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100) + "%")
        })
        
        battery.addEventListener('chargingchange', () => {
          setBatteryCharging(battery.charging)
        })
      }
    } catch (error) {
      console.error('Battery API not supported:', error)
    }
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

  const simulateMovement = () => {
    setIsSimulating(true)
    let lat = 11.029709
    let lng = 76.991693
    
    const interval = setInterval(() => {
      lat += (Math.random() - 0.5) * 0.001
      lng += (Math.random() - 0.5) * 0.001
      const newLocation = { lat, lng }
      setCurrentLocation(newLocation)
      checkDangerZone(newLocation)
    }, 2000)
    
    setTimeout(() => {
      clearInterval(interval)
      setIsSimulating(false)
    }, 30000)
  }

  useEffect(() => {
    getBatteryInfo()
    checkOfflineAlerts()
  }, [])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncOfflineAlerts()
    }
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setCurrentLocation(newLocation)
          setLocationPermission("granted")
          checkDangerZone(newLocation)
        },
        (error) => {
          setLocationPermission("denied")
          setCurrentLocation(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )

      return () => navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  useEffect(() => {
    fetchAdminAlerts()
    const interval = setInterval(fetchAdminAlerts, 10000)
    return () => clearInterval(interval)
  }, [user?.id, isOnline])

  const safetyTips = [t("safety.tip_1"), t("safety.tip_2"), t("safety.tip_3"), t("safety.tip_4"), t("safety.tip_5")]

  const nearbyServices = [
    { name: "Emergency Services", type: t("services.emergency_services"), distance: "Available 24/7", phone: "911" },
    { name: "Police Department", type: t("emergency.emergency"), distance: "Available 24/7", phone: "911" },
    { name: "Fire Department", type: "Fire Emergency", distance: "Available 24/7", phone: "911" },
    { name: "Medical Emergency", type: "Medical Services", distance: "Available 24/7", phone: "911" },
    { name: "Tourist Police", type: t("emergency.assistance"), distance: "Available 24/7", phone: "+1-800-TOURIST" },
    { name: t("services.embassy"), type: "Consular Services", distance: "Business Hours", phone: "+1-202-501-4444" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <header className="bg-white/80 backdrop-blur-sm border-b border-border px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t("header.title")}</h1>
              <p className="text-muted-foreground">{t("header.subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-secondary rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">{t("header.protected")}</span>
            </div>
            {!isOnline && (
              <Badge variant="destructive" className="flex items-center space-x-1">
                <WifiOff className="h-3 w-3" />
                <span>Offline</span>
                {offlineAlertsCount > 0 && <span>({offlineAlertsCount} queued)</span>}
              </Badge>
            )}
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
            <Button 
              onClick={simulateMovement} 
              disabled={isSimulating}
              variant="outline"
              size="sm"
            >
              {isSimulating ? "Simulating..." : "Test Movement"}
            </Button>
            <Badge variant="outline" className="text-primary border-primary/50 bg-primary/5">
              {user?.email?.split('@')[0]}
            </Badge>
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:border-destructive/50 transition-all duration-200 bg-transparent"
            >
              {isLoggingOut ? <LoadingSpinner size="sm" /> : <LogOut className="h-4 w-4 mr-2" />}
              {t("header.logout")}
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-11 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {t("tabs.dashboard")}
            </TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative">
              <Bell className="h-4 w-4 mr-1" />
              Alerts
              {(unreadAlerts > 0 || offlineAlertsCount > 0) && (
                <Badge className="ml-2 bg-red-500 text-white text-xs px-1 py-0 min-w-[16px] h-4">
                  {unreadAlerts + offlineAlertsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="digital-id" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="h-4 w-4 mr-1" />
              {t("tabs.digital_id")}
            </TabsTrigger>
            <TabsTrigger value="tracking" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Navigation className="h-4 w-4 mr-1" />
              {t("tabs.tracking")}
            </TabsTrigger>
            <TabsTrigger value="emergency" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Zap className="h-4 w-4 mr-1" />
              {t("tabs.emergency")}
            </TabsTrigger>
            <TabsTrigger value="basic-emergency" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {t("tabs.basic_emergency")}
            </TabsTrigger>
            <TabsTrigger value="ai-assistant" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Brain className="h-4 w-4 mr-1" />
              {t("tabs.ai_assistant")}
            </TabsTrigger>
            <TabsTrigger value="gemini-ai" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Brain className="h-4 w-4 mr-1" />
              Gemini AI
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {t("tabs.profile")}
            </TabsTrigger>
            <TabsTrigger value="safety" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {t("tabs.safety")}
            </TabsTrigger>
            <TabsTrigger value="ai-anomaly" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Brain className="h-4 w-4 mr-1" />
              {t("tabs.ai_anomaly")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-secondary/20 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("cards.safety_status")}</CardTitle>
                  <CheckCircle className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">{t("status.safe")}</div>
                  <p className="text-xs text-muted-foreground">{t("status.all_systems_operational")}</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-primary/20 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("cards.location")}</CardTitle>
                  <MapPin className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {locationPermission === "granted" ? t("status.tracked") : t("status.unknown")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currentLocation
                      ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
                      : t("status.enable_location")}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-secondary/20 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("cards.connection")}</CardTitle>
                  {isOnline ? <Wifi className="h-4 w-4 text-secondary" /> : <WifiOff className="h-4 w-4 text-orange-500" />}
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${isOnline ? 'text-secondary' : 'text-orange-500'}`}>
                    {isOnline ? t("status.online") : "Offline"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isOnline ? t("status.strong_signal") : `${offlineAlertsCount} alerts queued`}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-secondary/20 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("cards.battery")}</CardTitle>
                  <Battery className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">{batteryLevel}</div>
                  <p className="text-xs text-muted-foreground">
                    {batteryCharging ? "Charging" : t("status.good_level")}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-primary">{t("actions.quick_actions")}</CardTitle>
                <CardDescription>{t("actions.emergency_assistance")}</CardDescription>
              </CardHeader>
              <CardContent>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                  <EmergencyAlert
                    type="emergency"
                    icon={<AlertTriangle className="h-6 w-6" />}
                    label={t("emergency.emergency")}
                    description={t("emergency.emergency_desc")}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-all duration-200"
                  />
                  <EmergencyAlert
                    type="medical"
                    icon={<Heart className="h-6 w-6" />}
                    label={t("emergency.medical")}
                    description={t("emergency.medical_desc")}
                    className="bg-orange-500 hover:bg-orange-600 text-white transition-all duration-200"
                  />
                  <EmergencyAlert
                    type="security"
                    icon={<Shield className="h-6 w-6" />}
                    label={t("emergency.security")}
                    description={t("emergency.security_desc")}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white transition-all duration-200"
                  />
                  <EmergencyAlert
                    type="assistance"
                    icon={<HelpCircle className="h-6 w-6" />}
                    label={t("emergency.assistance")}
                    description={t("emergency.assistance_desc")}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle>{t("services.nearby_emergency")}</CardTitle>
                <CardDescription>{t("services.important_contacts")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {nearbyServices.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-gray-500">
                            {service.type} • {service.distance}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4 mr-1" />
                        {service.phone}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <AISafetyAssistant />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6 fade-in">
            {offlineAlertsCount > 0 && (
              <Alert className="border-orange-200 bg-orange-50">
                <WifiOff className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  {offlineAlertsCount} alert{offlineAlertsCount > 1 ? 's' : ''} queued for sending when connection is restored.
                </AlertDescription>
              </Alert>
            )}
            
            <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-blue-500" />
                  <span>Admin Alerts</span>
                </CardTitle>
                <CardDescription>Messages and notifications from authorities</CardDescription>
              </CardHeader>
              <CardContent>
                {adminAlerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No alerts from authorities</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {adminAlerts.map((alert) => (
                      <div key={alert.id} className={`border rounded-lg p-4 ${
                        alert.status === 'active' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant={alert.status === 'active' ? 'default' : 'secondary'}>
                                {alert.severity}
                              </Badge>
                              <span className="text-sm font-medium">Authority Alert</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(alert.created_at).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rest of the TabsContent components remain the same... */}
          <TabsContent value="digital-id" className="space-y-6 fade-in">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("digital_id.title")}</h2>
                <p className="text-gray-600">{t("digital_id.desc")}</p>
              </div>
              <DigitalIDDisplay />
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">{t("digital_id.generate_new")}</h3>
                <DigitalIDGenerator />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-6 fade-in">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("tabs.tracking")}</h2>
                <p className="text-gray-600">Real-time GPS tracking with geo-fencing alerts for enhanced safety</p>
              </div>
              <LiveTrackingMap currentLocation={currentLocation} />
            </div>
          </TabsContent>

          <TabsContent value="emergency" className="space-y-6 fade-in">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("tabs.emergency")}</h2>
                <p className="text-gray-600">
                  Advanced emergency detection with real-time location sharing and automatic alerts
                </p>
              </div>
              <EnhancedEmergencySystem />
            </div>
          </TabsContent>

          <TabsContent value="basic-emergency" className="space-y-6 fade-in">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Use these emergency options only when you need immediate assistance. Your location will be shared with
                emergency services.
              </AlertDescription>
            </Alert>

            <div className="grid gap-6">
              <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-red-600">{t("emergency.title")}</CardTitle>
                  <CardDescription>Send immediate alerts to emergency services and administrators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <EmergencyAlert
                      type="emergency"
                      icon={<AlertTriangle className="h-8 w-8" />}
                      label={t("emergency.emergency").toUpperCase()}
                      description="Life-threatening situation requiring immediate response"
                      className="bg-red-600 hover:bg-red-700 text-white p-6 text-lg font-semibold"
                      size="lg"
                    />

                    <div className="grid md:grid-cols-3 gap-4">
                      <EmergencyAlert
                        type="medical"
                        icon={<Heart className="h-6 w-6" />}
                        label={t("emergency.medical") + " Emergency"}
                        description={t("emergency.medical_desc")}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      />
                      <EmergencyAlert
                        type="security"
                        icon={<Shield className="h-6 w-6" />}
                        label={t("emergency.security") + " Issue"}
                        description={t("emergency.security_desc")}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                      />
                      <EmergencyAlert
                        type="assistance"
                        icon={<HelpCircle className="h-6 w-6" />}
                        label={"Need " + t("emergency.assistance")}
                        description={t("emergency.assistance_desc")}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle>{t("services.emergency_contacts")}</CardTitle>
                  <CardDescription>{t("services.immediate_assistance")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <span className="font-medium">{t("services.emergency_services")}</span>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-300 bg-transparent">
                          <Phone className="h-4 w-4 mr-1" />
                          911
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium">{t("services.tourist_police")}</span>
                        <Button variant="outline" size="sm" className="text-blue-600 border-blue-300 bg-transparent">
                          <Phone className="h-4 w-4 mr-1" />
                          +1-800-TOURIST
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="font-medium">{t("services.embassy")}</span>
                        <Button variant="outline" size="sm" className="text-green-600 border-green-300 bg-transparent">
                          <Phone className="h-4 w-4 mr-1" />
                          +1-202-501-4444
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <span className="font-medium">{t("services.medical_hotline")}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-orange-600 border-orange-300 bg-transparent"
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          +1-800-MEDICAL
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6 fade-in">
            <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle>{t("profile.title")}</CardTitle>
                <CardDescription>{t("profile.desc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 bg-safety-blue/10 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-safety-blue" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{user?.name}</h3>
                      <p className="text-gray-600">{user?.email}</p>
                      <Badge className="mt-1 bg-safety-blue text-white">{t("digital_id.verified_tourist")}</Badge>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg border">
                          <code className="text-sm font-mono">{user?.blockchainId}</code>
                        </div>
                      </div>
                      <div>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg border">
                          <span className="text-sm">{new Date(user?.createdAt || "").toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="mt-1 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-800">{t("profile.active_safe")}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg border">
                          <span className="text-sm">{t("profile.just_now")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="safety" className="space-y-6 fade-in">
            <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle>{t("safety.tips_title")}</CardTitle>
                <CardDescription>{t("safety.tips_desc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {safetyTips.map((tip, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800">{tip}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle>{t("safety.local_emergency")}</CardTitle>
                <CardDescription>{t("safety.local_emergency_desc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">{t("safety.emergency_numbers")}</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Emergency Services: 911</p>
                      <p>Fire Department: 911</p>
                      <p>Medical Emergency: 911</p>
                      <p>Police: 911</p>
                      <p>Tourist Police: +1-800-TOURIST</p>
                      <p>US Embassy: +1-202-501-4444</p>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">{t("safety.what_to_do")}</h4>
                    <ol className="space-y-1 text-sm text-gray-600 list-decimal list-inside">
                      <li>{t("safety.step_1")}</li>
                      <li>{t("safety.step_2")}</li>
                      <li>{t("safety.step_3")}</li>
                      <li>{t("safety.step_4")}</li>
                      <li>{t("safety.step_5")}</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-assistant" className="space-y-6 fade-in">
            <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  <span>{t("ai.title")}</span>
                </CardTitle>
                <CardDescription>{t("ai.desc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <AISafetyAssistant />

                  <Card className="border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-lg">{t("ai.how_keeps_safe")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-start space-x-3">
                            <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                            <div>
                              <h4 className="font-medium text-sm">{t("ai.predictive_analysis")}</h4>
                              <p className="text-xs text-gray-600">{t("ai.predictive_desc")}</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                            <div>
                              <h4 className="font-medium text-sm">{t("ai.realtime_monitoring")}</h4>
                              <p className="text-xs text-gray-600">{t("ai.realtime_desc")}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-start space-x-3">
                            <div className="h-2 w-2 bg-purple-500 rounded-full mt-2"></div>
                            <div>
                              <h4 className="font-medium text-sm">{t("ai.personalized_recommendations")}</h4>
                              <p className="text-xs text-gray-600">{t("ai.personalized_desc")}</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="h-2 w-2 bg-orange-500 rounded-full mt-2"></div>
                            <div>
                              <h4 className="font-medium text-sm">{t("ai.automated_alerts")}</h4>
                              <p className="text-xs text-gray-600">{t("ai.automated_desc")}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gemini-ai" className="space-y-6 fade-in">
            <AISafetyAdvisor />
          </TabsContent>

          <TabsContent value="ai-anomaly" className="space-y-6 fade-in">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Anomaly Detection</h2>
                <p className="text-gray-600">
                  Advanced AI system monitoring for unusual patterns and potential safety threats
                </p>
              </div>
              <AIAnomalyDetector />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AIChatAssistant
        touristName={user?.name}
        location={currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : undefined}
      />
    </div>
  )
}
