"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, X, AlertTriangle, Heart, Shield, HelpCircle, WifiOff, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAlerts } from "@/hooks/use-alerts"
import { useAuth } from "@/hooks/use-auth"

interface Notification {
  id: string
  type: "alert" | "system" | "success" | "offline"
  title: string
  message: string
  timestamp: string
  read: boolean
  alertType?: "emergency" | "medical" | "security" | "assistance"
  offline?: boolean
  priority?: "low" | "medium" | "high" | "critical"
  location?: string
}

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const { activeAlerts } = useAlerts()
  const { user } = useAuth()
  const audioContextRef = useRef<AudioContext | null>(null)
  const channelRef = useRef<BroadcastChannel | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine)
    }
  }, [])

  useEffect(() => {
    if (user?.role === "admin") {
      setupDirectAlertReceiver()
      startOfflineAlertPolling()
    }
    
    return () => {
      if (channelRef.current) {
        channelRef.current.close()
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [user?.role])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const startOfflineAlertPolling = () => {
    pollingRef.current = setInterval(() => {
      const newAlert = localStorage.getItem('newOfflineAlert')
      if (newAlert) {
        try {
          const alertData = JSON.parse(newAlert)
          receiveDirectAlert(alertData)
          localStorage.removeItem('newOfflineAlert')
        } catch (error) {
          console.error('Error processing offline alert:', error)
        }
      }
    }, 1000)
  }

  const setupDirectAlertReceiver = () => {
    channelRef.current = new BroadcastChannel('emergency-direct')
    channelRef.current.onmessage = (event) => {
      if (event.data.type === 'OFFLINE_EMERGENCY_NOW') {
        receiveDirectAlert(event.data.alert)
      }
    }

    const handleDirectAlert = (event: CustomEvent) => {
      receiveDirectAlert(event.detail)
    }
    window.addEventListener('emergency-now', handleDirectAlert as EventListener)

    return () => {
      window.removeEventListener('emergency-now', handleDirectAlert as EventListener)
    }
  }

  const receiveDirectAlert = (alertData: any) => {
    let locationStr = 'Not available'
    let lat = null
    let lng = null

    if (alertData.location_lat !== undefined && alertData.location_lat !== null && 
        alertData.location_lng !== undefined && alertData.location_lng !== null) {
      lat = Number(alertData.location_lat)
      lng = Number(alertData.location_lng)
    } else if (alertData.lat !== undefined && alertData.lat !== null && 
               alertData.lng !== undefined && alertData.lng !== null) {
      lat = Number(alertData.lat)
      lng = Number(alertData.lng)
    }

    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      locationStr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }

    const notification: Notification = {
      id: `direct-${alertData.id}`,
      type: "offline",
      title: `🚨 OFFLINE ${alertData.type?.toUpperCase() || 'EMERGENCY'} ALERT`,
      message: `${alertData.user_name || 'Unknown User'}: ${alertData.message || 'Emergency situation'}`,
      timestamp: alertData.created_at || new Date().toISOString(),
      read: false,
      alertType: alertData.type,
      offline: true,
      priority: 'critical',
      location: locationStr
    }

    setNotifications(prev => {
      if (prev.some(n => n.id === notification.id)) return prev
      return [notification, ...prev].slice(0, 50)
    })
    
    saveToTouristDashboard(alertData, locationStr)
    playDirectAlertSound()
    setIsOpen(true)
  }

  const saveToTouristDashboard = (alertData: any, locationStr: string) => {
    try {
      const existingTourists = JSON.parse(localStorage.getItem('adminTouristData') || '[]')
      let touristIndex = existingTourists.findIndex((t: any) => t.user_id === alertData.user_id)
      
      if (touristIndex === -1) {
        const newTourist = {
          user_id: alertData.user_id,
          name: alertData.user_name,
          email: alertData.user_email || '',
          status: 'emergency',
          location: locationStr,
          location_lat: alertData.location_lat,
          location_lng: alertData.location_lng,
          last_seen: alertData.created_at || new Date().toISOString(),
          alerts: [],
          offline_alerts: []
        }
        existingTourists.push(newTourist)
        touristIndex = existingTourists.length - 1
      }
      
      const alertEntry = {
        id: alertData.id,
        type: alertData.type,
        message: alertData.message,
        severity: alertData.severity,
        location: locationStr,
        location_lat: alertData.location_lat,
        location_lng: alertData.location_lng,
        created_at: alertData.created_at || new Date().toISOString(),
        offline: true,
        acknowledged: false
      }
      
      existingTourists[touristIndex].status = 'emergency'
      existingTourists[touristIndex].location = locationStr
      existingTourists[touristIndex].location_lat = alertData.location_lat
      existingTourists[touristIndex].location_lng = alertData.location_lng
      existingTourists[touristIndex].last_seen = alertData.created_at || new Date().toISOString()
      
      if (!existingTourists[touristIndex].offline_alerts) {
        existingTourists[touristIndex].offline_alerts = []
      }
      existingTourists[touristIndex].offline_alerts.unshift(alertEntry)
      existingTourists[touristIndex].offline_alerts = existingTourists[touristIndex].offline_alerts.slice(0, 20)
      
      localStorage.setItem('adminTouristData', JSON.stringify(existingTourists))
    } catch (error) {
      console.error("Failed to save alert to tourist dashboard:", error)
    }
  }

  const playDirectAlertSound = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      
      const audioContext = audioContextRef.current
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 1200
      oscillator.type = "sine"
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 1)
    } catch (error) {
      console.log("Audio not supported")
    }
  }

  useEffect(() => {
    if (user?.role === "admin" && activeAlerts && activeAlerts.length > 0) {
      const alertNotifications: Notification[] = activeAlerts.map((alert) => ({
        id: `alert-${alert.id}`,
        type: "alert" as const,
        title: `${alert.type.toUpperCase()} Alert`,
        message: `${alert.touristName}: ${alert.message}`,
        timestamp: alert.timestamp,
        read: false,
        alertType: alert.type as any,
        priority: (alert as any).severity === 'critical' || alert.priority === 'critical' ? 'critical' : (alert.priority || 'high')
      }))

      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id))
        const newNotifications = alertNotifications.filter((n) => !existingIds.has(n.id))
        if (newNotifications.length === 0) return prev
        return [...newNotifications, ...prev].slice(0, 50)
      })
    }
  }, [activeAlerts, user?.role])

  const unreadCount = notifications.filter((n) => !n.read).length
  const directOfflineCount = notifications.filter((n) => !n.read && n.offline).length

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const getAlertIcon = (alertType?: string, offline?: boolean) => {
    const iconClass = offline ? "text-orange-500" : ""
    
    switch (alertType) {
      case "emergency":
        return <AlertTriangle className={`h-4 w-4 text-red-500 ${iconClass}`} />
      case "medical":
        return <Heart className={`h-4 w-4 text-pink-500 ${iconClass}`} />
      case "security":
        return <Shield className={`h-4 w-4 text-orange-500 ${iconClass}`} />
      case "assistance":
        return <HelpCircle className={`h-4 w-4 text-blue-500 ${iconClass}`} />
      default:
        return <Bell className={`h-4 w-4 ${iconClass}`} />
    }
  }

  const getAlertColor = (alertType?: string, offline?: boolean) => {
    if (offline) {
      return "bg-red-50 border-red-200 border-l-4 border-l-red-500"
    }
    
    switch (alertType) {
      case "emergency":
        return "bg-red-50 border-red-200"
      case "medical":
        return "bg-pink-50 border-pink-200"
      case "security":
        return "bg-orange-50 border-orange-200"
      case "assistance":
        return "bg-blue-50 border-blue-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  if (user?.role !== "admin") {
    return null
  }

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)} className="relative">
        <Bell className="h-4 w-4" />
        {!isOnline && <WifiOff className="h-3 w-3 absolute -top-1 -left-1 text-orange-500" />}
        {unreadCount > 0 && (
          <Badge
            variant={directOfflineCount > 0 ? "destructive" : "default"}
            className={`absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs ${
              directOfflineCount > 0 ? 'animate-pulse bg-red-600' : ''
            }`}
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Admin Alerts</h3>
              {directOfflineCount > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {directOfflineCount} OFFLINE
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No alerts</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    !notification.read ? "bg-blue-50" : ""
                  } ${getAlertColor(notification.alertType, notification.offline)} ${
                    notification.offline ? 'animate-pulse' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-1">
                      {getAlertIcon(notification.alertType, notification.offline)}
                      {notification.offline && <WifiOff className="h-3 w-3 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-red-700">
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-1">
                          {notification.offline && (
                            <Badge variant="destructive" className="text-xs">
                              OFFLINE
                            </Badge>
                          )}
                          {!notification.read && <div className="w-2 h-2 bg-red-500 rounded-full" />}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <p className="text-xs text-gray-500">
                          📍 {notification.location || 'Location not available'}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.timestamp).toLocaleString()}
                        {notification.offline && ' • Offline Alert'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
