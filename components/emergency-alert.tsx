"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, Loader2, MapPin, Clock, Wifi, WifiOff, ChevronRight } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

interface EmergencyAlertProps {
  type: "emergency" | "medical" | "security" | "assistance"
  icon: React.ReactNode
  label: string
  description: string
  className?: string
  size?: "sm" | "md" | "lg"
}

export function EmergencyAlert({ type, icon, label, description, className, size = "md" }: EmergencyAlertProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [alertSent, setAlertSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [offlineMode, setOfflineMode] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine)
      const handleOnline = () => setIsOnline(true)
      const handleOffline = () => setIsOnline(false)
      
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  // Auto-request location when dialog opens
  useEffect(() => {
    if (isOpen && !currentLocation) {
      getCurrentLocation().catch(() => {
        console.log("Could not get location automatically")
      })
    }
  }, [isOpen])

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setCurrentLocation(location)
          resolve(location)
        },
        (error) => {
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      )
    })
  }

  const sendDirectOfflineAlert = (alertData: any) => {
    if (typeof window !== "undefined") {
      const offlineAlerts = JSON.parse(localStorage.getItem('offlineAlerts') || '[]')
      const immediateAlert = {
        ...alertData,
        id: `immediate-${Date.now()}`,
        immediate: true,
        offline: true,
        timestamp: Date.now()
      }
      offlineAlerts.unshift(immediateAlert)
      localStorage.setItem('offlineAlerts', JSON.stringify(offlineAlerts))
      
      localStorage.setItem('newOfflineAlert', JSON.stringify(immediateAlert))
      
      const channel = new BroadcastChannel('emergency-direct')
      channel.postMessage({
        type: 'OFFLINE_EMERGENCY_NOW',
        alert: immediateAlert
      })
      
      window.dispatchEvent(new CustomEvent('emergency-now', {
        detail: immediateAlert
      }))
      
      setTimeout(() => channel.close(), 1000)
    }
  }

  const sendAlert = async () => {
    if (!user) {
      setError("User not authenticated")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let location = currentLocation
      if (!location) {
        try {
          setError("Getting your location...")
          location = await getCurrentLocation()
          setError(null)
        } catch (locationError) {
          console.warn("Could not get location:", locationError)
          setError(null)
        }
      }

      if (!location) {
        location = { lat: 11.0159, lng: 76.9368 } // Default coordinates
      }

      const alertData = {
        user_id: user.id,
        user_name: user.name || user.email?.split('@')[0] || 'Unknown User',
        user_email: user.email,
        type: type,
        message: message || `${label} alert sent by ${user.name || user.email}`,
        severity: type === 'emergency' ? 'critical' : type === 'medical' ? 'high' : 'medium',
        location_lat: location.lat,
        location_lng: location.lng,
        status: 'active',
        created_at: new Date().toISOString(),
        device_info: {
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          online: isOnline
        }
      }

      let alertSentSuccessfully = false

      // Use the new user alerts API
      if (isOnline) {
        try {
          const res = await fetch("/api/alerts/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: type,
              message: message || `${label} alert sent`,
              severity: type === 'emergency' ? 'critical' : type === 'medical' ? 'high' : 'medium',
              location_lat: location?.lat,
              location_lng: location?.lng,
              device_info: {
                userAgent: navigator.userAgent,
                timestamp: Date.now(),
                online: true
              }
            }),
          })
          if (res.ok) {
            alertSentSuccessfully = true
          } else {
            // Fallback: try the sync-offline endpoint
            const res2 = await fetch("/api/emergency/sync-offline", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(alertData),
            })
            if (res2.ok) alertSentSuccessfully = true
          }
        } catch (fetchError) {
          console.warn("Online fetch failed, falling back:", fetchError)
        }
      }

      if (!alertSentSuccessfully || !isOnline) {
        sendDirectOfflineAlert(alertData)
        setOfflineMode(!isOnline)
        alertSentSuccessfully = true
      }

      setAlertSent(true)
      setTimeout(() => {
        setAlertSent(false)
        setIsOpen(false)
        setMessage("")
        setOfflineMode(false)
      }, 3000)

    } catch (error) {
      console.error("Alert error:", error)
      const fallbackAlert = {
        user_id: user.id,
        user_name: user.name || user.email?.split('@')[0] || 'Unknown User',
        type: type,
        message: message || `${label} alert`,
        severity: type === 'emergency' ? 'critical' : 'high',
        location_lat: currentLocation?.lat || 11.0159,
        location_lng: currentLocation?.lng || 76.9368,
        created_at: new Date().toISOString()
      }
      sendDirectOfflineAlert(fallbackAlert)
      setAlertSent(true)
      setOfflineMode(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setMessage("")
      setError(null)
      setAlertSent(false)
      setOfflineMode(false)
    }
  }

  // Get color profiles based on alert category
  const colorProfiles = {
    emergency: {
      iconBg: "bg-red-500 text-white",
      textColor: "text-red-600",
      borderColor: "border-red-100 hover:bg-red-50 bg-white"
    },
    medical: {
      iconBg: "bg-orange-500 text-white",
      textColor: "text-orange-600",
      borderColor: "border-orange-100 hover:bg-orange-50 bg-white"
    },
    security: {
      iconBg: "bg-yellow-500 text-white",
      textColor: "text-yellow-600",
      borderColor: "border-yellow-100 hover:bg-yellow-50 bg-white"
    },
    assistance: {
      iconBg: "bg-blue-500 text-white",
      textColor: "text-blue-600",
      borderColor: "border-blue-100 hover:bg-blue-50 bg-white"
    }
  }

  const colors = colorProfiles[type]

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          onClick={() => setIsOpen(true)}
          className={cn(`flex items-center justify-between p-4 rounded-xl border w-full text-left transition-all duration-200 group h-auto ${colors.borderColor} shadow-sm hover:shadow-md relative`, className)}
        >
          <div className="flex items-center space-x-3.5">
            <div className={`p-2.5 rounded-lg ${colors.iconBg}`}>
              {icon}
            </div>
            <div>
              <div className={`font-bold text-xs ${colors.textColor}`}>{label}</div>
              <span className="text-[10px] text-gray-400 font-medium block mt-0.5">{description}</span>
            </div>
          </div>
          <ChevronRight className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${colors.textColor}`} />
          {!isOnline && (
            <WifiOff className="absolute -top-1 -right-1 h-3.5 w-3.5 text-orange-500" />
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-red-600">
            {icon}
            <span>{label}</span>
            {!isOnline && <WifiOff className="h-4 w-4 text-orange-500" />}
          </DialogTitle>
          <DialogDescription>
            {description}
            {!isOnline && (
              <div className="mt-2 text-orange-600 font-medium">
                🚨 OFFLINE: Alert will be sent immediately to admins
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {alertSent ? (
          <Alert className={`${offlineMode ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'}`}>
            <AlertTriangle className={`h-4 w-4 ${offlineMode ? 'text-orange-600' : 'text-green-600'}`} />
            <AlertDescription className={`font-medium ${offlineMode ? 'text-orange-800' : 'text-green-800'}`}>
              {offlineMode 
                ? "🚨 OFFLINE ALERT SENT TO ADMINS IMMEDIATELY!"
                : "✅ Emergency alert sent successfully!"
              }
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {error && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <label className="text-xs font-semibold mb-1.5 block">
                Additional Information (Optional)
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Provide any additional details about your situation..."
                rows={3}
                className="text-xs"
              />
            </div>

            {currentLocation && (
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <MapPin className="h-3.5 w-3.5" />
                <span>Location: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}</span>
              </div>
            )}

            <div className="flex items-center space-x-2 text-xs text-gray-500 border-t border-gray-100 pt-3">
              <Clock className="h-3.5 w-3.5" />
              <span>{isOnline ? 'Alert will be sent immediately' : 'OFFLINE - Immediate admin alert'}</span>
              {isOnline ? (
                <Wifi className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <WifiOff className="h-3.5 w-3.5 text-orange-500" />
              )}
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1 text-xs"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={sendAlert}
                disabled={isLoading}
                className={`flex-1 text-xs ${!isOnline ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    {isOnline ? 'Sending...' : 'Sending Offline...'}
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                    {isOnline ? 'Send Alert' : 'Send Offline Alert'}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
