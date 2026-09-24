"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { EditProfileModal } from "@/components/edit-profile-modal"
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
  Search,
  ChevronRight,
  Globe,
  Settings,
  AlertCircle
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSelector } from "@/components/language-selector"
import { LoadingSpinner } from "@/components/loading-spinner"
import { EmergencyAlert } from "./emergency-alert"
import { AISafetyAssistant } from "./ai-safety-assistant"
import { AIChatAssistant } from "./ai-chat-assistant"
import { DigitalIDTab } from "./digital-id-tab"
import { LiveTrackingMap } from "./live-tracking-map"
import { EnhancedEmergencySystem } from "./enhanced-emergency-system"
import { AIAnomalyDetector } from "./ai-anomaly-detector"
import { AISafetyAdvisor } from "./ai-safety-advisor"
import { OfflineSafetyPanel } from "./offline-safety-panel"
import { createBrowserClient } from "@/lib/db-client/client"

export function TouristDashboard() {
  const { user, signOut } = useAuth()
  const { t, language, setLanguage } = useLanguage()

  const dbClient = createBrowserClient()
  const [profile, setProfile] = useState<any>(null)
  const [profileName, setProfileName] = useState("")
  const [profilePhone, setProfilePhone] = useState("")
  const [emergencyContact, setEmergencyContact] = useState("")
  const [emergencyPhone, setEmergencyPhone] = useState("")
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [digitalIdInfo, setDigitalIdInfo] = useState<any>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [verifiedIdData, setVerifiedIdData] = useState<any>(null)
  const [verifyIdInput, setVerifyIdInput] = useState("")
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const handleVerifyId = async (idToVerify?: string) => {
    const id = (idToVerify || verifyIdInput).trim()
    if (!id) {
      setVerifyError("Please enter an ID")
      return
    }
    setIsVerifying(true)
    setVerifyError(null)
    try {
      const res = await fetch(`/api/digital-id/verify/${id}`)
      const data = await res.json()
      if (data.valid) {
        setIsVerified(true)
        setVerifiedIdData(data.digitalId)
        if (typeof window !== "undefined") {
          localStorage.setItem("tourist_verified_id", id)
        }
      } else {
        setIsVerified(false)
        setVerifiedIdData(null)
        setVerifyError(data.reason || "Invalid ID")
      }
    } catch (err) {
      setIsVerified(false)
      setVerifiedIdData(null)
      setVerifyError("Verification failed. Try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  // Hydrate verification state from localStorage on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("tourist_verified_id")
      if (saved) {
        setVerifyIdInput(saved)
        handleVerifyId(saved)
      }
    }
  }, [])

  useEffect(() => {
    if (!user) return

    // Fetch user profile via the DB proxy
    const fetchProfile = async () => {
      try {
        const { data } = await dbClient
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        if (data) {
          setProfile(data)
          setProfileName(data.full_name || "")
          setProfilePhone(data.phone || "")
          setEmergencyContact(data.emergency_contact || "")
          setEmergencyPhone(data.emergency_phone || "")
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err)
      }
    }

    // Fetch the user's active Digital Tourist ID for the profile section
    const fetchDigitalId = async () => {
      try {
        const res = await fetch("/api/digital-id")
        if (res.ok) {
          const result = await res.json()
          const ids = result.data || []
          const active = ids.find((t: any) => t.is_active) ?? ids[0] ?? null
          setDigitalIdInfo(active)
        }
      } catch (err) {
        console.error("Failed to fetch digital ID for profile:", err)
      }
    }

    fetchProfile()
    fetchDigitalId()
  }, [user])

  const handleSaveProfile = async (e: any) => {
    e.preventDefault()
    if (!user) return
    setIsSavingProfile(true)
    setSaveSuccess(false)
    setProfileError(null)

    try {
      const { data, error } = await dbClient
        .from("profiles")
        .update({
          full_name: profileName,
          phone: profilePhone,
          emergency_contact: emergencyContact,
          emergency_phone: emergencyPhone
        })
        .eq("id", user.id)

      if (error) throw error

      setSaveSuccess(true)
      setProfile((prev: any) => ({
        ...prev,
        full_name: profileName,
        phone: profilePhone,
        emergency_contact: emergencyContact,
        emergency_phone: emergencyPhone
      }))
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile")
    } finally {
      setIsSavingProfile(false)
    }
  }

  const [alerts, setAlerts] = useState<any[]>([])
  const [sentAlerts, setSentAlerts] = useState<any[]>([])
  const [receivedAlerts, setReceivedAlerts] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("dashboard")
  const [unreadAlerts, setUnreadAlerts] = useState(0)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>({
    lat: 11.0159,
    lng: 76.9368
  })
  const [locationName, setLocationName] = useState("Coimbatore, India")
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "prompt">("granted")
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [adminAlerts, setAdminAlerts] = useState([])
  const [batteryLevel, setBatteryLevel] = useState<string>("99%")
  const [batteryCharging, setBatteryCharging] = useState<boolean>(true)
  const [isOnline, setIsOnline] = useState(true)
  const [offlineAlertsCount, setOfflineAlertsCount] = useState(0)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)

  const fetchAlerts = async () => {
    if (!user) return
    try {
      const res = await fetch("/api/alerts/user?type=all&limit=100")
      if (res.ok) {
        const data = await res.json()
        const sent = data.sent?.alerts || []
        const received = data.received?.alerts || []
        setSentAlerts(sent)
        setReceivedAlerts(received)
        // Combined for sidebar preview
        const all = [...sent, ...received].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        setAlerts(all)
        const lastViewed = typeof window !== "undefined" ? Number(localStorage.getItem("tourist_last_viewed_alerts") || 0) : 0
        if (activeTab === "alerts") {
          setUnreadAlerts(0)
        } else {
          const unreadCount = all.filter((a: any) => {
            const alertTime = new Date(a.created_at).getTime()
            return a.status === "active" && alertTime > lastViewed
          }).length
          setUnreadAlerts(unreadCount)
        }
      }
    } catch (err) {
      console.error("Failed to fetch alerts:", err)
    }
  }

  useEffect(() => {
    if (!user) return
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 5000)
    return () => clearInterval(interval)
  }, [user, activeTab])

  // Clear notification badge when viewing alerts tab
  useEffect(() => {
    if (activeTab === "alerts") {
      setUnreadAlerts(0)
      if (typeof window !== "undefined") {
        localStorage.setItem("tourist_last_viewed_alerts", String(Date.now()))
      }
    }
  }, [activeTab])

  // AI assistant local chat states
  const [aiMessages, setAiMessages] = useState<Array<{ sender: "user" | "bot"; text: string }>>([
    { sender: "bot", text: "Hi! I'm your AI safety assistant. How can I help you today?" }
  ])
  const [aiInputValue, setAiInputValue] = useState("")

  // Danger zone detection
  const [dangerZones] = useState([
    { lat: 11.030, lng: 76.992, radius: 0.002, name: "High Crime Area" },
    { lat: 11.028, lng: 76.990, radius: 0.001, name: "Construction Zone" },
    { lat: 11.032, lng: 76.994, radius: 0.0015, name: "Restricted Area" }
  ])
  const [lastAlertTime, setLastAlertTime] = useState<number>(0)

  const checkOfflineAlerts = () => {
    if (typeof window !== "undefined") {
      const offlineAlerts = JSON.parse(localStorage.getItem('offlineAlerts') || '[]')
      setOfflineAlertsCount(offlineAlerts.length)
    }
  }

  const syncOfflineAlerts = async () => {
    if (typeof window !== "undefined") {
      const offlineAlerts = JSON.parse(localStorage.getItem('offlineAlerts') || '[]')
      if (offlineAlerts.length === 0) return

      try {
        for (const alert of offlineAlerts) {
          await fetch("/api/emergency/sync-offline", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(alert)
          })
        }
        localStorage.removeItem('offlineAlerts')
        setOfflineAlertsCount(0)
        console.log(`Synced ${offlineAlerts.length} offline alerts`)
      } catch (error) {
        console.error('Failed to sync offline alerts:', error)
      }
    }
  }

  const checkDangerZone = async (location: { lat: number; lng: number }) => {
    if (!isVerified) return
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
    if (!isVerified) return
    try {
      const alertData = {
        type: 'geofence',
        message: `You have entered ${zoneName}. Please exercise caution and follow safety guidelines.`,
        severity: 'high',
        location_lat: location.lat,
        location_lng: location.lng,
      }

      if (!isOnline) {
        // Queue for later
        if (typeof window !== "undefined") {
          const offlineAlerts = JSON.parse(localStorage.getItem('offlineAlerts') || '[]')
          offlineAlerts.push({ ...alertData, id: Date.now(), user_id: user?.id, user_name: (user as any)?.name || "Tourist", created_at: new Date().toISOString() })
          localStorage.setItem('offlineAlerts', JSON.stringify(offlineAlerts))
        }
        return
      }

      // POST to the new user alerts API — will be categorized as "received" (geofence)
      await fetch("/api/alerts/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alertData)
      })
    } catch (error) {
      console.error('Error sending danger zone alert:', error)
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
    let lat = 11.0159
    let lng = 76.9368
    let count = 0
    
    const interval = setInterval(() => {
      lat += (Math.random() - 0.5) * 0.003
      lng += (Math.random() - 0.5) * 0.003
      const newLocation = { lat, lng }
      setCurrentLocation(newLocation)
      checkDangerZone(newLocation)
      count++
      if (count > 5) {
        clearInterval(interval)
        setIsSimulating(false)
      }
    }, 2000)
  }

  useEffect(() => {
    getBatteryInfo()
    if (typeof window !== "undefined") {
      localStorage.removeItem('offlineAlerts')
      setOfflineAlertsCount(0)
    }
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
          console.warn("Geolocation watch error:", error)
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
    if (!currentLocation) return
    
    const fetchLocationName = async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${currentLocation.lat}&lon=${currentLocation.lng}`)
        if (res.ok) {
          const data = await res.json()
          const name = data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.county || data.display_name
          const country = data.address.country || ""
          if (name) {
            setLocationName(country ? `${name}, ${country}` : name)
          }
        }
      } catch (err) {
        console.warn("Reverse geocode failed:", err)
      }
    }

    fetchLocationName()
  }, [currentLocation?.lat, currentLocation?.lng])


  const safetyTips = [
    "Always keep a copy of your verified digital ID scanned from the QR code.",
    "Avoid unlit pathways after midnight near VOC Park and Race Course.",
    "Verify nearby medical stations and police hubs on the map panel.",
    "Ensure your device is fully charged; enable low power if battery falls below 20%.",
    "Keep emergency numbers (911) mapped in your speed-dial contacts."
  ]

  const nearbyServices = [
    { name: "Police Station", distance: "0.8 km away", phone: "100" },
    { name: "City Hospital", distance: "1.2 km away", phone: "108" },
    { name: "Tourist Help Center", distance: "0.5 km away", phone: "1800-425-4747" },
    { name: "Fire Station", distance: "1.5 km away", phone: "101" },
    { name: "Ambulance Service", distance: "0.7 km away", phone: "102" }
  ]

  const resolvedCity = locationName.split(',')[0]
  const recentAlerts = [
    { id: 1, type: "Emergency SOS", time: "2 min ago", loc: `MG Road, ${resolvedCity}`, severity: "high" },
    { id: 2, type: "Crowd Alert", time: "15 min ago", loc: "Race Course Area", severity: "medium" },
    { id: 3, type: "Weather Warning", time: "1 hr ago", loc: `${resolvedCity} District`, severity: "low" },
    { id: 4, type: "All Clear", time: "2 hr ago", loc: "Your current location", severity: "safe" }
  ]

  const liveTrackUsers = [
    { name: "You", location: locationName, status: "Live", avatar: "JE" },
    { name: "Rahul Sharma", location: "Ooty, Tamil Nadu", status: "Live", avatar: "RS" },
    { name: "Ananya Patel", location: "Mysore, Karnataka", status: "5 min ago", avatar: "AP" },
    { name: "Vikram Singh", location: "Wayanad, Kerala", status: "15 min ago", avatar: "VS" }
  ]

  const systemHealthItems = [
    { name: "GPS Tracking", status: "Operational" },
    { name: "Communication", status: "Operational" },
    { name: "AI Monitoring", status: "Operational" },
    { name: "Database", status: "Operational" }
  ]

  const handleSendAiMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!aiInputValue.trim()) return

    const userMsg = aiInputValue
    setAiMessages(prev => [...prev, { sender: "user", text: userMsg }])
    setAiInputValue("")

    // Simulated response
    setTimeout(() => {
      let botResponse = "I have checked your status. All systems are operational in your location."
      if (userMsg.toLowerCase().includes("tip")) {
        botResponse = "For safety, ensure you stay in populated zones and keep your digital tourist ID verified at checkpoints."
      } else if (userMsg.toLowerCase().includes("hospital")) {
        botResponse = "The nearest hospital is City Hospital (1.2 km away). You can dial 108 or use the quick action button."
      } else if (userMsg.toLowerCase().includes("weather")) {
        botResponse = "The weather is currently clear in Coimbatore, with temperature around 29°C. Safe for outdoor travel."
      }
      setAiMessages(prev => [...prev, { sender: "bot", text: botResponse }])
    }, 1000)
  }

  const renderVerifyPrompt = () => (
    <div className="flex flex-col items-center justify-center py-20 h-full animate-in fade-in duration-200">
      <Card className="w-full max-w-md shadow-xl border-blue-100">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-blue-100 text-blue-600 p-4 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-blue-950">Verify Digital ID</CardTitle>
          <CardDescription className="text-sm">Please enter the ID or scan the QR code to access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {verifyError && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{verifyError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-3">
            <input 
              type="text" 
              placeholder="Enter Blockchain ID" 
              value={verifyIdInput} 
              onChange={e => setVerifyIdInput(e.target.value)} 
              className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" 
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyId()}
            />
            <Button 
              onClick={() => handleVerifyId()} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-lg text-sm font-semibold transition-colors shadow-md shadow-blue-500/20"
              disabled={isVerifying}
            >
              {isVerifying ? "Verifying..." : "Verify ID"}
            </Button>
          </div>
          <div className="text-center pt-6">
            <div className="inline-block bg-gray-50 rounded-lg px-4 py-2 border border-gray-100 text-xs text-gray-500">
              <span className="font-semibold text-gray-700 mr-2">Example ID:</span>
              <span className="font-mono bg-white px-2 py-1 rounded border shadow-sm">BCH-TOURIST-ADMIN-999</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#f8fafc] text-gray-800 overflow-hidden font-sans">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-[#0a0f1d] text-gray-400 flex flex-col justify-between p-4 border-r border-gray-800 shrink-0">
        <div className="space-y-6">
          {/* Logo / Header */}
          <div className="flex items-center space-x-3 px-2 py-2">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base leading-tight">Safaris</h2>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{t("header.system.operational")}</span>
            </div>
          </div>

          {/* Sidebar Menu items */}
          <nav className="space-y-1">
            {[
              { id: "dashboard", label: t("tabs.dashboard"), icon: <Navigation className="h-4 w-4" /> },
              ...(isVerified ? [
                { id: "alerts", label: t("tabs.alerts"), icon: <Bell className="h-4 w-4" />, badge: unreadAlerts > 0 ? unreadAlerts : undefined },
                { id: "tracking", label: t("tabs.tracking"), icon: <MapPin className="h-4 w-4" /> },
              ] : []),
              { id: "digital-id", label: t("tabs.digital_id"), icon: <User className="h-4 w-4" /> },
              ...(isVerified ? [
                { id: "emergency", label: t("tabs.emergency"), icon: <Zap className="h-4 w-4" /> },
              ] : []),
              { id: "safety", label: t("tabs.safety"), icon: <Shield className="h-4 w-4" /> },
              { id: "ai-assistant", label: t("tabs.ai_assistant"), icon: <Brain className="h-4 w-4" /> },
              ...(isVerified ? [
                { id: "ai-anomaly", label: t("tabs.ai_anomaly"), icon: <Clock className="h-4 w-4" /> },
              ] : []),
              { id: "offline", label: t("tabs.offline") || "Offline Safety", icon: <WifiOff className="h-4 w-4" /> },
              { id: "profile", label: t("navigation.settings") || "Navigation Settings", icon: <Settings className="h-4 w-4" /> },
            ].map((item) => {
              const isActive = activeTab === item.id

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id)
                    if (item.id === "alerts") {
                      setUnreadAlerts(0)
                      if (typeof window !== "undefined") {
                        localStorage.setItem("tourist_last_viewed_alerts", String(Date.now()))
                      }
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive 
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20" 
                      : "hover:bg-gray-800/60 hover:text-white"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? "bg-white text-blue-600" : "bg-red-500 text-white"
                    }`}>
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </nav>
        </div>

        {/* SOS Alert and bottom Profile */}
        <div className="space-y-4">
          {/* Glowing SOS Alert Authority Panel */}
          <div className="bg-gradient-to-br from-red-950/60 to-red-900/40 border border-red-500/30 rounded-xl p-4 text-center space-y-3 shadow-lg shadow-red-950/30">
            <div className="text-white font-bold text-sm tracking-wide">{t("emergency.title")}</div>
            <p className="text-[10px] text-red-300 leading-normal">
              {isVerified ? t("emergency.send_alert") : "Verify ID to activate emergency SOS"}
            </p>
            
            <div className="flex justify-center">
              <button 
                onClick={() => {
                  if (!isVerified) {
                    setActiveTab("digital-id")
                  } else {
                    setActiveTab("emergency")
                  }
                }}
                className="h-14 w-14 bg-gradient-to-tr from-red-600 to-rose-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/30 hover:scale-105 active:scale-95 transition-all duration-150 animate-pulse"
              >
                <Phone className="h-6 w-6 text-white" />
              </button>
            </div>
            <span className="text-[9px] text-gray-500 block">
              {isVerified ? t("emergency.location_sharing") : "Requires Admin Blockchain ID"}
            </span>
          </div>

          {/* Profile Badge */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-gray-900/50 border border-gray-850">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center font-bold text-blue-450 text-sm">
                {user?.name ? user.name.substring(0, 2).toUpperCase() : "JE"}
              </div>
              <div className="leading-tight">
                <div className="text-xs font-semibold text-white truncate max-w-[110px]">{user?.name || "Jeevika 2005"}</div>
                <span className="text-[9px] text-emerald-450 font-medium">Premium Member</span>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-400 p-1 rounded-md hover:bg-gray-800 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#f8fafc]">
        
        {/* HEADER */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t("header.title")} 👋</h1>
            <p className="text-xs text-gray-500 mt-0.5">{t("header.subtitle")}</p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Language Selector */}
            <LanguageSelector variant="dropdown" />

            {/* Protected Pill */}
            <Badge className="bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-50 flex items-center space-x-1.5 py-1 px-2.5 rounded-full font-medium text-xs">
              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span>{t("header.protected")}</span>
            </Badge>


            {/* Notifications Alert Bell */}
            <button 
              onClick={() => {
                setActiveTab("alerts")
                setUnreadAlerts(0)
                if (typeof window !== "undefined") {
                  localStorage.setItem("tourist_last_viewed_alerts", String(Date.now()))
                }
              }}
              className="relative p-2 bg-gray-50 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Bell className="h-4 w-4" />
              {unreadAlerts > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* User Avatar with Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="h-8 w-8 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center bg-blue-100 font-semibold text-xs text-blue-600 hover:ring-2 hover:ring-blue-500/20 focus:outline-none"
              >
                {user?.name ? user.name.substring(0, 2).toUpperCase() : "JE"}
              </button>

              {isProfileDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-35 bg-transparent" 
                    onClick={() => setIsProfileDropdownOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-40 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 py-1.5 border-b border-gray-100">
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{t("profile.title")}</p>
                      <p className="text-xs font-semibold text-gray-800 truncate">{user?.name || "Jeevika"}</p>
                      <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                    </div>
                    
                    <button
                      id="profile-dropdown-navigation-settings"
                      data-testid="navigation-profile"
                      onClick={() => {
                        setActiveTab("profile");
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      <span>{t("navigation.profile") || "navigation.profile"}</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        signOut();
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-750 transition-colors border-t border-gray-100"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>{t("header.logout")}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <div className="p-6">
          
          {/* TAB 1: DASHBOARD VIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* METRICS ROW */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* 1. Safety Status */}
                <Card className="bg-white border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{t("cards.safety_status")}</span>
                      <h3 className="text-2xl font-bold text-emerald-500">{t("status.safe")}</h3>
                      <p className="text-[10px] text-gray-400">{t("status.all_systems_operational")}</p>
                    </div>
                    {/* Tiny line chart pulse SVG */}
                    <div className="flex items-center space-x-3">
                      <svg className="w-16 h-8 text-emerald-500" viewBox="0 0 100 30" fill="none">
                        <path d="M0,25 Q15,5 30,18 T60,8 T90,20 T100,5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx="100" cy="5" r="3" fill="currentColor" />
                      </svg>
                      <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg">
                        <Shield className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Location */}
                <Card className="bg-white border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{t("cards.location")}</span>
                      <h3 className="text-base font-bold text-gray-800 truncate max-w-[130px]" title={currentLocation ? locationName : "Locating..."}>
                        {locationName}
                      </h3>
                      <p className="text-[10px] text-gray-400">
                        {currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : "11.0159, 76.9368"}
                      </p>
                      <button 
                        onClick={() => setActiveTab("tracking")}
                        className="text-[10px] text-blue-600 font-semibold flex items-center space-x-0.5 hover:underline mt-1"
                      >
                        <span>{t("tracking.currentLocation") || t("tabs.tracking")}</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="p-2.5 bg-blue-50 text-blue-500 rounded-lg">
                      <MapPin className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Connection */}
                <Card className="bg-white border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{t("cards.connection")}</span>
                      <h3 className="text-2xl font-bold text-indigo-500">{isOnline ? t("status.online") : t("status.offline")}</h3>
                      <p className="text-[10px] text-gray-400">{isOnline ? t("status.strong_signal") : t("status.offline")}</p>
                    </div>
                    {/* Signal bars SVG */}
                    <div className="flex items-center space-x-3">
                      <svg className="w-8 h-6 text-indigo-500" viewBox="0 0 40 20" fill="currentColor">
                        <rect x="0" y="14" width="5" height="6" rx="1" className={isOnline ? "opacity-100" : "opacity-30"} />
                        <rect x="8" y="10" width="5" height="10" rx="1" className={isOnline ? "opacity-100" : "opacity-30"} />
                        <rect x="16" y="6" width="5" height="14" rx="1" className={isOnline ? "opacity-100" : "opacity-30"} />
                        <rect x="24" y="0" width="5" height="20" rx="1" className={isOnline ? "opacity-100" : "opacity-30"} />
                      </svg>
                      <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg">
                        <Wifi className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 4. Battery */}
                <Card className="bg-white border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{t("cards.battery")}</span>
                      <h3 className="text-2xl font-bold text-emerald-500">{batteryLevel}</h3>
                      <p className="text-[10px] text-gray-400">{batteryCharging ? t("common.loading") || "Charging" : t("status.good_level")}</p>
                    </div>
                    {/* Radial battery progress ring */}
                    <div className="flex items-center space-x-3">
                      <div className="relative w-10 h-10 flex items-center justify-center">
                        <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.9155" fill="transparent" stroke="#f1f5f9" strokeWidth="3.5" />
                          <circle cx="18" cy="18" r="15.9155" fill="transparent" stroke="#10b981" strokeWidth="3.5" strokeDasharray="99 100" strokeLinecap="round" />
                        </svg>
                        <Zap className="h-4 w-4 text-emerald-500 animate-pulse" />
                      </div>
                      <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg">
                        <Battery className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {!isVerified ? (
                <div className="bg-white border border-gray-200/80 rounded-2xl p-8 sm:p-10 shadow-sm text-center max-w-xl mx-auto my-8 space-y-6 animate-in fade-in duration-200">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <Shield className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-900">Digital Tourist ID Verification Required</h3>
                    <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                      Please enter the ID or scan the QR code. Quick Actions, Live GPS Tracking, Emergency Dispatch, Danger Zone Alerts, and AI Safety features are unlocked once your admin-issued Blockchain ID is verified.
                    </p>
                  </div>

                  {verifyError && (
                    <Alert variant="destructive" className="py-2.5 text-left">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs font-medium">{verifyError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="Please enter the ID or scan the QR code" 
                      value={verifyIdInput} 
                      onChange={e => setVerifyIdInput(e.target.value)} 
                      className="w-full p-3.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all" 
                      onKeyDown={(e) => e.key === 'Enter' && handleVerifyId()}
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleVerifyId()} 
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20"
                        disabled={isVerifying}
                      >
                        {isVerifying ? "Verifying..." : "Verify ID"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("digital-id")}
                        className="text-xs py-3 rounded-xl border-gray-200 hover:bg-gray-50"
                      >
                        Scan QR Code
                      </Button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="inline-block bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100 text-[11px] text-gray-500">
                      <span className="font-semibold text-gray-700 mr-2">Admin Example ID:</span>
                      <span className="font-mono bg-white px-2 py-0.5 rounded border text-blue-600 font-bold shadow-xs">BCH-TOURIST-ADMIN-999</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* DIGITAL ID CARD — shown when verified */}
                  {verifiedIdData && (
                    <Card className="bg-gradient-to-r from-blue-600 to-purple-700 border-0 shadow-lg text-white overflow-hidden">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          {/* Left: Info */}
                          <div className="flex items-center space-x-4">
                            <div className="p-2.5 bg-white/15 rounded-xl">
                              <Shield className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 mb-0.5">
                                <span className="font-bold text-sm text-white">Digital Tourist ID</span>
                                <span className="bg-white/20 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                                  ✓ Admin Verified
                                </span>
                              </div>
                              <p className="text-xs text-white/70">
                                {verifiedIdData.tourist?.name || user?.name || "Tourist"} &nbsp;·&nbsp;
                                {verifiedIdData.documentType === "aadhaar" ? "Aadhaar Card"
                                  : verifiedIdData.documentType === "passport" ? "Passport"
                                  : verifiedIdData.documentType || "Govt. ID"} &nbsp;·&nbsp;
                                ***{verifiedIdData.documentNumber?.slice(-4)}
                              </p>
                              {verifiedIdData.tripPeriod?.start && verifiedIdData.tripPeriod?.end && (
                                <p className="text-[10px] text-white/60 mt-0.5">
                                  Trip: {new Date(verifiedIdData.tripPeriod.start).toLocaleDateString("en-IN")} → {new Date(verifiedIdData.tripPeriod.end).toLocaleDateString("en-IN")}
                                </p>
                              )}
                            </div>
                          </div>
                          {/* Right: Validity + CTA */}
                          <div className="text-right shrink-0 ml-4">
                            <p className="text-[10px] text-white/60 uppercase tracking-wider">Valid Until</p>
                            <p className="font-bold text-sm text-white">{new Date(verifiedIdData.validUntil).toLocaleDateString("en-IN")}</p>
                            <button
                              onClick={() => setActiveTab("digital-id")}
                              className="mt-1 text-[10px] text-white/80 hover:text-white underline underline-offset-2 transition-colors"
                            >
                              View Full ID →
                            </button>
                          </div>
                        </div>
                        {/* Emergency contact inline */}
                        {(verifiedIdData.emergencyContact?.name || verifiedIdData.emergencyContact?.phone) && (
                          <div className="mt-3 pt-3 border-t border-white/10 flex items-center space-x-2 text-xs text-white/70">
                            <span className="font-semibold text-white/80">Emergency Contact:</span>
                            <span>{verifiedIdData.emergencyContact.name}</span>
                            {verifiedIdData.emergencyContact.phone && (
                              <span className="font-mono">{verifiedIdData.emergencyContact.phone}</span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* QUICK ACTIONS SECTION */}
                  <Card className="bg-white border-gray-200/80 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-bold text-gray-800 uppercase tracking-wide">{t("actions.quick_actions")}</CardTitle>
                      <CardDescription className="text-xs text-gray-400">{t("actions.emergency_assistance")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        
                        {/* 1. Emergency */}
                        <EmergencyAlert
                          type="emergency"
                          icon={<AlertTriangle className="h-5 w-5 mr-2" />}
                          label={t("emergency.emergency")}
                          description={t("emergency.emergency_desc")}
                          className="bg-transparent hover:bg-red-50 text-red-600 border border-red-200 font-semibold py-5 rounded-xl justify-between flex w-full transition-colors group"
                          isVerified={isVerified}
                          onVerifyRequired={() => setActiveTab("digital-id")}
                        />

                        {/* 2. Medical */}
                        <EmergencyAlert
                          type="medical"
                          icon={<Heart className="h-5 w-5 mr-2" />}
                          label={t("emergency.medical")}
                          description={t("emergency.medical_desc")}
                          className="bg-transparent hover:bg-orange-50 text-orange-600 border border-orange-200 font-semibold py-5 rounded-xl justify-between flex w-full transition-colors group"
                          isVerified={isVerified}
                          onVerifyRequired={() => setActiveTab("digital-id")}
                        />

                        {/* 3. Security */}
                        <EmergencyAlert
                          type="security"
                          icon={<Shield className="h-5 w-5 mr-2" />}
                          label={t("emergency.security")}
                          description={t("emergency.security_desc")}
                          className="bg-transparent hover:bg-yellow-50 text-yellow-600 border border-yellow-200 font-semibold py-5 rounded-xl justify-between flex w-full transition-colors group"
                          isVerified={isVerified}
                          onVerifyRequired={() => setActiveTab("digital-id")}
                        />

                        {/* 4. Assistance */}
                        <EmergencyAlert
                          type="assistance"
                          icon={<HelpCircle className="h-5 w-5 mr-2" />}
                          label={t("emergency.assistance")}
                          description={t("emergency.assistance_desc")}
                          className="bg-transparent hover:bg-blue-50 text-blue-600 border border-blue-200 font-semibold py-5 rounded-xl justify-between flex w-full transition-colors group"
                          isVerified={isVerified}
                          onVerifyRequired={() => setActiveTab("digital-id")}
                        />
                      </div>
                    </CardContent>
                  </Card>

              {/* MIDDLE DOUBLE COLUMN PANEL GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT HALF: Map & Services (8 Columns) */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* Map Panel Container */}
                  <Card className="bg-white border-gray-200/80 shadow-sm overflow-hidden">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-bold text-gray-800">{t("tracking.title")}</CardTitle>
                        <CardDescription className="text-xs text-gray-400">{t("tracking.subtitle")}</CardDescription>
                      </div>
                      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200">
                        ● Live
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-0 relative h-96 bg-[#0f172a] flex items-center justify-center overflow-hidden">
                      {/* Dark themed map simulation */}
                      <div className="absolute inset-0 bg-cover opacity-35" style={{ backgroundImage: `url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/${currentLocation ? `${currentLocation.lng},${currentLocation.lat}` : '76.9368,11.0159'},12/800x450?access_token=mock')` }}></div>
                      
                      {/* Radar pulses and markers overlay */}
                      <div className="relative w-full h-full flex items-center justify-center">
                        {/* Center user location marker */}
                        <div className="relative z-10">
                          <span className="absolute -inset-3 bg-blue-500 rounded-full opacity-30 animate-ping"></span>
                          <span className="absolute -inset-6 bg-blue-500 rounded-full opacity-10 animate-pulse"></span>
                          <div className="h-5 w-5 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50">
                            <div className="h-2 w-2 bg-white rounded-full"></div>
                          </div>
                        </div>

                        {/* Simulated Nearby SOS marker */}
                        <div className="absolute top-1/4 right-1/3">
                          <span className="absolute -inset-4 bg-red-500 rounded-full opacity-25 animate-ping"></span>
                          <div className="h-6 w-6 bg-red-600 border border-white rounded-full flex items-center justify-center shadow-md">
                            <span className="text-[8px] font-bold text-white uppercase">SOS</span>
                          </div>
                        </div>

                        {/* Dynamic city text markers */}
                        <div className="absolute top-1/2 left-1/4 text-gray-500 text-[10px] font-semibold tracking-wider">
                          {locationName ? locationName.split(',')[0].toUpperCase() : "COIMBATORE MAIN"}
                        </div>
                        <div className="absolute bottom-1/3 right-1/4 text-gray-500 text-[10px] font-semibold tracking-wider">
                          {locationName ? `${locationName.split(',')[0].toUpperCase()} HUB` : "VOC PARK"}
                        </div>

                        {/* Map controls */}
                        <div className="absolute right-4 bottom-4 flex flex-col space-y-1.5 z-20">
                          <button className="h-8 w-8 bg-gray-900 border border-gray-800 text-white rounded-md flex items-center justify-center font-bold text-lg hover:bg-gray-800">+</button>
                          <button className="h-8 w-8 bg-gray-900 border border-gray-800 text-white rounded-md flex items-center justify-center font-bold text-lg hover:bg-gray-800">-</button>
                        </div>
                      </div>

                      {/* Map Status Footer Bar */}
                      <div className="absolute bottom-3 left-4 z-20 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center space-x-1">
                        <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
                        <span className="text-[10px] text-emerald-400 font-semibold">Accuracy: High (5m)</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Nearby Services List Panel */}
                  <Card className="bg-white border-gray-200/80 shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-bold text-gray-800">{t("services.nearby_emergency")}</CardTitle>
                        <CardDescription className="text-xs text-gray-400">{t("services.important_contacts")}</CardDescription>
                      </div>
                      <button onClick={() => setActiveTab("safety")} className="text-xs text-blue-600 font-semibold hover:underline">
                        {t("common.view") || "View All"}
                      </button>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="space-y-3">
                        {nearbyServices.map((service, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                            <div className="flex items-center space-x-3">
                              <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
                              <div>
                                <h4 className="font-semibold text-xs text-gray-800">{service.name}</h4>
                                <span className="text-[10px] text-gray-400">{service.distance}</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full">
                              <Phone className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* RIGHT HALF: Recent Alerts & Live Tracking (4 Columns) */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Recent Alerts Logs Panel */}
                  <Card className="bg-white border-gray-200/80 shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-bold text-gray-800">{t("alerts.geoFence") || t("tabs.alerts")}</CardTitle>
                        <CardDescription className="text-xs text-gray-400">{t("services.emergency_contacts")}</CardDescription>
                      </div>
                      <button onClick={() => setActiveTab("alerts")} className="text-xs text-blue-600 font-semibold hover:underline">
                        {t("common.view") || "View All"}
                      </button>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="space-y-4">
                        {alerts.length === 0 ? (
                          <div className="text-center py-4 text-xs text-gray-400">
                            {t("status.unknown") || "No recent safety alerts."}
                          </div>
                        ) : (
                          alerts.slice(0, 4).map((alert) => {
                            let badgeBg = "bg-red-50 text-red-755 border-red-200"
                            if (alert.severity === "medium" || alert.severity === "warning") {
                              badgeBg = "bg-orange-50 text-orange-755 border-orange-200"
                            } else if (alert.severity === "low" || alert.severity === "info") {
                              badgeBg = "bg-blue-50 text-blue-750 border-blue-200"
                            }

                            const isAutomatic = alert.type === "geofence" || alert.type === "geofence_entry" || alert.type === "unusual_location" || alert.type === "zone_violation"

                            return (
                              <div key={alert.id} className="flex items-start justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                                <div className="space-y-0.5 pr-2 max-w-[70%]">
                                  <div className="flex items-center space-x-1.5">
                                    <h4 className="font-semibold text-xs text-gray-800 truncate uppercase">{alert.type} Alert</h4>
                                    <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                                      isAutomatic ? "bg-purple-50 text-purple-600 border border-purple-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                                    }`}>
                                      {isAutomatic ? "alert send for me automaticaly when i reach the risk zone" : "i sent alert"}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-gray-450 block truncate">{alert.message}</span>
                                </div>
                                <Badge className={`px-2 py-0.5 text-[9px] font-bold border rounded-full capitalize shrink-0 ${badgeBg}`}>
                                  {alert.severity}
                                </Badge>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Live Tracking Users Panel */}
                  <Card className="bg-white border-gray-200/80 shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-bold text-gray-800">{t("tabs.tracking")}</CardTitle>
                        <CardDescription className="text-xs text-gray-400">{t("tracking.locationEnabled") || "Family members & travel companion status"}</CardDescription>
                      </div>
                      <button onClick={() => setActiveTab("tracking")} className="text-xs text-blue-600 font-semibold hover:underline">
                        {t("common.view") || "View All"}
                      </button>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="space-y-3.5">
                        {liveTrackUsers.map((person, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2.5">
                              <div className="h-8 w-8 bg-blue-100 text-blue-600 font-bold text-[10px] rounded-full flex items-center justify-center">
                                {person.avatar}
                              </div>
                              <div>
                                <h4 className="font-semibold text-xs text-gray-800">{person.name}</h4>
                                <span className="text-[10px] text-gray-450 block">{person.location}</span>
                              </div>
                            </div>
                            {person.status === "Live" ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 border border-emerald-500/20 text-[9px] font-bold">
                                Live
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-medium">{person.status}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                </div>

              </div>

              {/* BOTTOM COLUMN: Charts & System Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                
                {/* 1. Safety Overview line chart (4 columns) */}
                <Card className="lg:col-span-4 bg-white border-gray-200/80 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-gray-800">{t("safetyScore.title") || "Safety Overview"}</CardTitle>
                    <CardDescription className="text-xs text-gray-400">{t("safetyScore.currentScore") || "Weekly alert incidence tracker"}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    {/* SVG Line Chart */}
                    <svg className="w-full h-44" viewBox="0 0 600 180">
                      <line x1="40" y1="20" x2="560" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="40" y1="60" x2="560" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="40" y1="100" x2="560" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="40" y1="140" x2="560" y2="140" stroke="#f1f5f9" strokeWidth="1" />
                      
                      {/* Gradient Fill */}
                      <path d="M40,140 C80,130 125,160 170,110 C215,60 260,115 305,95 C350,75 395,120 440,110 C485,100 520,40 560,50 L560,160 L40,160 Z" fill="url(#chart-gradient)" opacity="0.15" />
                      
                      {/* Trend Line */}
                      <path d="M40,140 C80,130 125,160 170,110 C215,60 260,115 305,95 C350,75 395,120 440,110 C485,100 520,40 560,50" fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" />
                      
                      {/* Active Node Circle */}
                      <circle cx="215" cy="60" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2.5" />
                      
                      <text x="40" y="175" fill="#94a3b8" fontSize="11" textAnchor="middle">Mon</text>
                      <text x="126" y="175" fill="#94a3b8" fontSize="11" textAnchor="middle">Tue</text>
                      <text x="212" y="175" fill="#94a3b8" fontSize="11" textAnchor="middle">Wed</text>
                      <text x="298" y="175" fill="#94a3b8" fontSize="11" textAnchor="middle">Thu</text>
                      <text x="384" y="175" fill="#94a3b8" fontSize="11" textAnchor="middle">Fri</text>
                      <text x="470" y="175" fill="#94a3b8" fontSize="11" textAnchor="middle">Sat</text>
                      <text x="560" y="175" fill="#94a3b8" fontSize="11" textAnchor="middle">Sun</text>
                      
                      <defs>
                        <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" />
                          <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </CardContent>
                </Card>

                {/* 2. Alerts by Type donut chart (3 columns) */}
                <Card className="lg:col-span-3 bg-white border-gray-200/80 shadow-sm">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-sm font-bold text-gray-800">{t("heatmap.title") || "Alerts by Type"}</CardTitle>
                    <CardDescription className="text-xs text-gray-400">{t("heatmap.desc") || "Distribution category breakdown"}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 flex flex-col items-center">
                    {/* Donut Chart SVG */}
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.9155" fill="transparent" stroke="#f8fafc" strokeWidth="4.5" />
                        
                        {/* Emergency: 38% */}
                        <circle cx="18" cy="18" r="15.9155" fill="transparent" stroke="#ef4444" strokeWidth="4.5" strokeDasharray="38 100" strokeDashoffset="0" />
                        {/* Medical: 25% */}
                        <circle cx="18" cy="18" r="15.9155" fill="transparent" stroke="#f97316" strokeWidth="4.5" strokeDasharray="25 100" strokeDashoffset="-38" />
                        {/* Security: 20% */}
                        <circle cx="18" cy="18" r="15.9155" fill="transparent" stroke="#eab308" strokeWidth="4.5" strokeDasharray="20 100" strokeDashoffset="-63" />
                        {/* Weather: 10% */}
                        <circle cx="18" cy="18" r="15.9155" fill="transparent" stroke="#3b82f6" strokeWidth="4.5" strokeDasharray="10 100" strokeDashoffset="-83" />
                        {/* Others: 7% */}
                        <circle cx="18" cy="18" r="15.9155" fill="transparent" stroke="#94a3b8" strokeWidth="4.5" strokeDasharray="7 100" strokeDashoffset="-93" />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-xl font-bold text-gray-800">145</span>
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">Alerts</span>
                      </div>
                    </div>

                    {/* Donut Legend */}
                    <div className="grid grid-cols-3 gap-y-1.5 gap-x-2 text-[10px] font-medium text-gray-500 mt-2.5 w-full">
                      <div className="flex items-center space-x-1"><span className="h-2 w-2 rounded-full bg-red-500"></span><span>Emerg (38%)</span></div>
                      <div className="flex items-center space-x-1"><span className="h-2 w-2 rounded-full bg-orange-500"></span><span>Medic (25%)</span></div>
                      <div className="flex items-center space-x-1"><span className="h-2 w-2 rounded-full bg-yellow-500"></span><span>Secur (20%)</span></div>
                      <div className="flex items-center space-x-1"><span className="h-2 w-2 rounded-full bg-blue-500"></span><span>Weath (10%)</span></div>
                      <div className="flex items-center space-x-1"><span className="h-2 w-2 rounded-full bg-gray-400"></span><span>Other (7%)</span></div>
                    </div>
                  </CardContent>
                </Card>

                {/* 3. System Health (2 columns) */}
                <Card className="lg:col-span-2 bg-white border-gray-200/80 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold text-gray-800">{t("header.system.operational")}</CardTitle>
                    <CardDescription className="text-xs text-gray-400">{t("status.all_systems_operational")}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-3.5">
                      {systemHealthItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-600">{item.name}</span>
                          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5">
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 4. AI Assistant Card widget (3 columns) */}
                <Card className="lg:col-span-3 bg-gradient-to-br from-indigo-900 to-blue-950 text-gray-150 border-0 shadow-lg shadow-indigo-950/20">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-white flex items-center space-x-1.5">
                        <span>{t("tabs.ai_assistant")}</span>
                        <span className="bg-blue-500 text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-full text-white font-black">New</span>
                      </CardTitle>
                      <CardDescription className="text-[11px] text-indigo-200">{t("ai.title")}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-3.5">
                    {/* Quick response pills */}
                    <div className="flex flex-wrap gap-1">
                      {[
                        "Safety tips for this area",
                        "Weather update",
                        "Nearby hospitals",
                        "Emergency contacts"
                      ].map((pillText, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setAiInputValue(pillText)
                          }}
                          className="bg-white/10 hover:bg-white/15 border border-white/10 text-[9px] text-white/90 rounded-full px-2 py-1 transition-colors text-left"
                        >
                          {pillText}
                        </button>
                      ))}
                    </div>

                    {/* Simple Message History Log */}
                    <div className="h-16 overflow-y-auto pr-1 text-[11px] space-y-1.5 scrollbar-thin">
                      {aiMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`rounded-lg p-2 max-w-[85%] leading-normal ${
                            msg.sender === "user" ? "bg-blue-600 text-white" : "bg-white/10 text-indigo-100"
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chat Text Form */}
                    <form onSubmit={handleSendAiMessage} className="flex items-center space-x-1.5 bg-white/10 rounded-full p-1 border border-white/15">
                      <input
                        type="text"
                        placeholder={t("common.search") || "Ask me anything..."}
                        value={aiInputValue}
                        onChange={(e) => setAiInputValue(e.target.value)}
                        className="bg-transparent text-xs text-white placeholder-indigo-300/60 focus:outline-none flex-1 px-3 py-1"
                      />
                      <button type="submit" className="h-6 w-6 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white shrink-0">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </form>
                  </CardContent>
                </Card>

              </div>

                </>
              )}

            </div>
          )}

          {/* TAB 2: ALERTS TAB */}
          {activeTab === "alerts" && (
            isVerified ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Header Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center space-x-3 shadow-sm">
                  <div className="p-2.5 bg-blue-50 rounded-lg">
                    <Bell className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{t("authority.activeAlerts") || "Total Alerts"}</p>
                    <h3 className="text-2xl font-bold text-gray-800">{sentAlerts.length + receivedAlerts.length}</h3>
                  </div>
                </div>
                <div className="bg-white border border-blue-100 rounded-xl p-4 flex items-center space-x-3 shadow-sm">
                  <div className="p-2.5 bg-blue-50 rounded-lg">
                    <User className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{t("profile.title") || "Sent by Me"}</p>
                    <h3 className="text-2xl font-bold text-blue-600">{sentAlerts.length}</h3>
                  </div>
                </div>
                <div className="bg-white border border-purple-100 rounded-xl p-4 flex items-center space-x-3 shadow-sm">
                  <div className="p-2.5 bg-purple-50 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{t("alerts.anomaly") || "Auto Received"}</p>
                    <h3 className="text-2xl font-bold text-purple-600">{receivedAlerts.length}</h3>
                  </div>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* LEFT: Sent Alerts (Manual) */}
                <Card className="bg-white border-blue-100 shadow-sm">
                  <CardHeader className="pb-3 border-b border-blue-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-bold text-gray-800">{t("profile.title") || "Alerts I Sent"}</CardTitle>
                          <CardDescription className="text-[11px] text-gray-400">{t("emergency.alert_sent") || "Manually triggered by you"}</CardDescription>
                        </div>
                      </div>
                      <Badge className="bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px]">
                        {sentAlerts.length} total
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    {sentAlerts.length === 0 ? (
                      <div className="text-center py-10 space-y-2">
                        <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                          <CheckCircle className="h-5 w-5 text-gray-300" />
                        </div>
                        <p className="text-xs text-gray-400">No manual alerts sent yet.</p>
                        <p className="text-[10px] text-gray-300">Use the Quick Actions to send an alert.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {sentAlerts.map((alert) => {
                          const sColor = alert.severity === "critical" ? "border-red-200 bg-red-50/30"
                            : alert.severity === "high" ? "border-orange-200 bg-orange-50/20"
                            : "border-gray-100 bg-gray-50/20"
                          const severityBadge = alert.severity === "critical" ? "bg-red-100 text-red-700"
                            : alert.severity === "high" ? "bg-orange-100 text-orange-700"
                            : "bg-gray-100 text-gray-600"
                          const typeIcon = alert.type === "medical" ? "🩺"
                            : alert.type === "security" ? "🛡️"
                            : alert.type === "assistance" ? "🤝"
                            : "🚨"
                          return (
                            <div key={alert.id} className={`border rounded-xl p-3.5 ${sColor} transition-colors`}>
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-base">{typeIcon}</span>
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">{alert.type} Alert</h4>
                                    <span className="text-[10px] text-gray-400">{new Date(alert.created_at).toLocaleString()}</span>
                                  </div>
                                </div>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${severityBadge}`}>
                                  {alert.severity}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-600 leading-relaxed">{alert.message}</p>
                              {alert.location_lat && alert.location_lng && (
                                <div className="flex items-center space-x-1 mt-2">
                                  <MapPin className="h-3 w-3 text-gray-400" />
                                  <span className="text-[10px] text-gray-400 font-mono">{Number(alert.location_lat).toFixed(4)}, {Number(alert.location_lng).toFixed(4)}</span>
                                </div>
                              )}
                              <div className="mt-2 flex items-center space-x-1.5">
                                <div className={`h-1.5 w-1.5 rounded-full ${alert.status === "active" ? "bg-orange-400 animate-pulse" : "bg-emerald-400"}`} />
                                <span className={`text-[9px] font-semibold uppercase ${alert.status === "active" ? "text-orange-500" : "text-emerald-500"}`}>{alert.status}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* RIGHT: Received Alerts (Automatic / Geofence) */}
                <Card className="bg-white border-purple-100 shadow-sm">
                  <CardHeader className="pb-3 border-b border-purple-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-purple-100 rounded-lg">
                          <AlertCircle className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-bold text-gray-800">{t("alerts.anomaly") || "Auto Alerts Received"}</CardTitle>
                          <CardDescription className="text-[11px] text-gray-400">{t("tracking.safeZone") || "Sent automatically when you enter a risk zone"}</CardDescription>
                        </div>
                      </div>
                      <Badge className="bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[10px]">
                        {receivedAlerts.length} total
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    {receivedAlerts.length === 0 ? (
                      <div className="text-center py-10 space-y-2">
                        <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                          <Shield className="h-5 w-5 text-emerald-400" />
                        </div>
                        <p className="text-xs text-gray-400">No geofence alerts yet.</p>
                        <p className="text-[10px] text-gray-300">You'll be alerted automatically when entering a risk area.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {receivedAlerts.map((alert) => {
                          const sColor = alert.severity === "critical" ? "border-red-200 bg-red-50/30"
                            : alert.severity === "high" ? "border-purple-200 bg-purple-50/20"
                            : "border-gray-100 bg-gray-50/20"
                          const severityBadge = alert.severity === "critical" ? "bg-red-100 text-red-700"
                            : alert.severity === "high" ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-600"
                          const zoneIcon = alert.type === "geofence_entry" ? "🔴" : alert.type === "geofence_exit" ? "🟢" : "⚠️"
                          return (
                            <div key={alert.id} className={`border rounded-xl p-3.5 ${sColor} transition-colors`}>
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-base">{zoneIcon}</span>
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                                      {alert.type?.replace(/_/g, " ")} Alert
                                    </h4>
                                    <span className="text-[10px] text-gray-400">{new Date(alert.created_at).toLocaleString()}</span>
                                  </div>
                                </div>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${severityBadge}`}>
                                  {alert.severity}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-600 leading-relaxed">{alert.message}</p>
                              {alert.location_lat && alert.location_lng && (
                                <div className="flex items-center space-x-1 mt-2">
                                  <MapPin className="h-3 w-3 text-gray-400" />
                                  <span className="text-[10px] text-gray-400 font-mono">{Number(alert.location_lat).toFixed(4)}, {Number(alert.location_lng).toFixed(4)}</span>
                                </div>
                              )}
                              <div className="mt-2 flex items-center space-x-1.5">
                                <Navigation className="h-3 w-3 text-purple-400" />
                                <span className="text-[9px] font-semibold text-purple-500 uppercase">Auto-generated by system</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>
            </div>
            ) : renderVerifyPrompt()
          )}


          {/* TAB 3: DIGITAL ID */}
          {activeTab === "digital-id" && (
            isVerified ? <DigitalIDTab verifiedIdData={verifiedIdData} /> : renderVerifyPrompt()
          )}

          {/* TAB 4: LIVE TRACKING */}
          {activeTab === "tracking" && (
            isVerified ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="text-center max-w-xl mx-auto mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{t("tracking.title")}</h2>
                <p className="text-xs text-gray-500">{t("tracking.subtitle")}</p>
              </div>
              <LiveTrackingMap />
            </div>
            ) : renderVerifyPrompt()
          )}

          {/* TAB 5: EMERGENCY SYSTEM */}
          {activeTab === "emergency" && (
            isVerified ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="text-center max-w-xl mx-auto mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{t("emergency.title")}</h2>
                <p className="text-xs text-gray-500">{t("emergency.panicButtonSubtext") || "Trigger immediate panic signals, record emergency voice memos, or sync offline alerts."}</p>
              </div>
              <EnhancedEmergencySystem />
            </div>
            ) : renderVerifyPrompt()
          )}

          {/* TAB 6: SAFETY ADVICE */}
          {activeTab === "safety" && (
            <div className="grid gap-6 lg:grid-cols-2 animate-in fade-in duration-200">
              
              <Card className="bg-white border-gray-200/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-800 text-sm font-bold uppercase tracking-wide">{t("safety.tips_title")}</CardTitle>
                  <CardDescription className="text-xs text-gray-400">{t("safety.tips_desc")}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-3">
                    {safetyTips.map((tip, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-800 leading-normal">{tip}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-800 text-sm font-bold uppercase tracking-wide">{t("safety.what_to_do")}</CardTitle>
                  <CardDescription className="text-xs text-gray-400">{t("safety.local_emergency_desc")}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-4">
                    <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/30">
                      <h4 className="font-semibold text-xs mb-2 text-gray-850">{t("safety.emergency_numbers")}</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <p>Police Station: 100</p>
                        <p>Ambulance Service: 102</p>
                        <p>Fire Rescue: 101</p>
                        <p>Tourist Help Desk: 1800-425-4747</p>
                      </div>
                    </div>
                    <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/30">
                      <h4 className="font-semibold text-xs mb-2 text-gray-850">{t("safety.local_emergency")}</h4>
                      <ol className="space-y-2 text-xs text-gray-650 list-decimal list-inside leading-normal">
                        <li>Press the main SOS button or dial emergency contacts.</li>
                        <li>Find a secure, public lit environment and stay there.</li>
                        <li>Keep your device battery active; do not run streaming apps.</li>
                        <li>Broadcast your location coordinate updates continuously.</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          )}

          {/* TAB 7: AI SAFETY PANEL (Combined) */}
          {activeTab === "ai-assistant" && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="text-center max-w-xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{t("ai.title")}</h2>
                <p className="text-xs text-gray-500">{t("ai.desc")}</p>
              </div>
              
              <AISafetyAssistant />
              <AISafetyAdvisor />
            </div>
          )}

          {/* TAB 9: REPORTS (AI ANOMALY DETECTOR) */}
          {activeTab === "ai-anomaly" && (
            isVerified ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="text-center max-w-xl mx-auto mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{t("tabs.ai_anomaly")}</h2>
                <p className="text-xs text-gray-500">{t("ai.realtime_desc")}</p>
              </div>
              <AIAnomalyDetector />
            </div>
            ) : renderVerifyPrompt()
          )}

          {/* TAB 9.5: OFFLINE SAFETY */}
          {activeTab === "offline" && (
            <div className="animate-in fade-in duration-200 space-y-6">
              <OfflineSafetyPanel userId={user?.id} />
            </div>
          )}

          {/* TAB 10: SETTINGS / PROFILE DETAILS */}
          {activeTab === "profile" && (
            <Card className="bg-white border-gray-200 max-w-3xl mx-auto shadow-sm animate-in fade-in duration-200">
              <CardHeader>
                <CardTitle className="text-gray-800">{t("navigation.settings") || t("profile.title") || "Navigation Settings"}</CardTitle>
                <CardDescription>{t("profile.desc")}</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  {saveSuccess && (
                    <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800">
                      <CheckCircle className="h-4 w-4 text-emerald-600 mr-2 shrink-0" />
                      <AlertDescription>{t("common.success")}</AlertDescription>
                    </Alert>
                  )}
                  {profileError && (
                    <Alert className="bg-red-50 border-red-200 text-red-800">
                      <AlertCircle className="h-4 w-4 text-red-650 mr-2 shrink-0" />
                      <AlertDescription>{profileError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center space-x-4 pb-4 border-b border-gray-100">
                    <div className="h-16 w-16 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center font-bold text-blue-600 text-lg">
                      {profileName ? profileName.substring(0, 2).toUpperCase() : (user?.email ? user.email.substring(0, 2).toUpperCase() : "JE")}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{profileName || user?.email?.split('@')[0] || "Tourist"}</h3>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <Badge className="mt-1 bg-emerald-500 text-white text-[9px] font-bold">Verified Tourist</Badge>
                    </div>
                  </div>

                  {/* Personal Info */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">{t("digital_id.title") || "Personal Information"}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500">{t("digitalId.form.aadhaarNumber") || "Full Name"}</label>
                        <input
                          type="text"
                          required
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="w-full text-xs border border-gray-200 rounded-lg p-2.5 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500">Phone Number</label>
                        <input
                          type="text"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full text-xs border border-gray-200 rounded-lg p-2.5 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contacts */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">{t("services.emergency_contacts")}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500">{t("digitalId.form.emergencyContactName")}</label>
                        <input
                          type="text"
                          value={emergencyContact}
                          onChange={(e) => setEmergencyContact(e.target.value)}
                          placeholder="Spouse, parent, or trusted contact"
                          className="w-full text-xs border border-gray-200 rounded-lg p-2.5 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500">{t("digitalId.form.emergencyContactPhone")}</label>
                        <input
                          type="text"
                          value={emergencyPhone}
                          onChange={(e) => setEmergencyPhone(e.target.value)}
                          placeholder="Emergency phone number"
                          className="w-full text-xs border border-gray-200 rounded-lg p-2.5 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 space-y-4 text-xs text-gray-600">
                    {/* Blockchain Digital ID panel */}
                    {digitalIdInfo ? (
                      <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl p-4 text-white space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Shield className="h-4 w-4" />
                            <span className="font-semibold text-sm">Digital Tourist ID — Active</span>
                          </div>
                          <Badge className="bg-white/20 text-white border-white/30 text-[10px]">
                            {digitalIdInfo.is_active ? "✓ Verified" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[10px] opacity-70 uppercase tracking-wide">Document Type</p>
                            <p className="font-semibold capitalize mt-0.5">{digitalIdInfo.document_type}</p>
                          </div>
                          <div>
                            <p className="text-[10px] opacity-70 uppercase tracking-wide">Document No.</p>
                            <p className="font-semibold mt-0.5">***{digitalIdInfo.document_number?.slice(-4)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] opacity-70 uppercase tracking-wide">Valid From</p>
                            <p className="font-semibold mt-0.5">{new Date(digitalIdInfo.valid_from).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] opacity-70 uppercase tracking-wide">Valid Until</p>
                            <p className="font-semibold mt-0.5">{new Date(digitalIdInfo.valid_until).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] opacity-70 uppercase tracking-wide mb-1">Blockchain Hash</p>
                          <code className="bg-white/10 rounded p-2 block font-mono text-[10px] break-all">
                            0x{digitalIdInfo.blockchain_hash?.slice(0, 48)}...
                          </code>
                        </div>
                        <div>
                          <p className="text-[10px] opacity-70 uppercase tracking-wide mb-1">Created</p>
                          <p className="text-[11px]">{new Date(digitalIdInfo.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center">
                        <Shield className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-xs font-medium">No Digital Tourist ID created yet</p>
                        <p className="text-gray-400 text-[10px] mt-1">Go to the Digital ID tab to generate your blockchain-verified identity.</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <span className="font-semibold block mb-1">Status Verification</span>
                          <span className="bg-emerald-50 text-emerald-800 p-2 rounded block border border-emerald-100 font-medium flex items-center space-x-1.5">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Active / Safe Profile</span>
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <span className="font-semibold block mb-1">User Account Role</span>
                          <span className="bg-gray-50 p-2 rounded block text-gray-800 uppercase tracking-wider font-semibold">{user?.role || "tourist"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="text-red-650 hover:text-red-750 hover:bg-red-50 border-red-200 transition-colors text-xs"
                    >
                      {isLoggingOut ? <LoadingSpinner size="sm" /> : <LogOut className="h-4 w-4 mr-2" />}
                      {t("header.logout")}
                    </Button>

                    <Button
                      type="submit"
                      disabled={isSavingProfile}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-xs transition-colors shadow-sm"
                    >
                      {isSavingProfile ? <LoadingSpinner size="sm" /> : t("common.save")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

        </div>

      </main>

      {/* Floating AI Chat Assistant Component */}
      <AIChatAssistant
        touristName={user?.name}
        location={currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : undefined}
      />

    </div>
  )
}
