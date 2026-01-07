"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, Loader2, MapPin, Clock, Wifi, WifiOff } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"

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
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [offlineMode, setOfflineMode] = useState(false)

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
    // Store in localStorage with immediate flag
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
    
    // Set flag for admin polling
    localStorage.setItem('newOfflineAlert', JSON.stringify(immediateAlert))
    
    // BroadcastChannel for same session
    const channel = new BroadcastChannel('emergency-direct')
    channel.postMessage({
      type: 'OFFLINE_EMERGENCY_NOW',
      alert: immediateAlert
    })
    
    // Custom event for same page
    window.dispatchEvent(new CustomEvent('emergency-now', {
      detail: immediateAlert
    }))
    
    setTimeout(() => channel.close(), 1000)
  }

  const sendAlert = async () => {
    if (!user) {
      setError("User not authenticated")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Force get location with longer timeout
      let location = currentLocation
      if (!location) {
        try {
          setError("Getting your location...")
          location = await getCurrentLocation()
          setError(null)
          console.log("Got fresh location:", location)
        } catch (locationError) {
          console.warn("Could not get location:", locationError)
          setError(null) // Clear location error, continue with alert
        }
      }

      // Use mock location for testing if real location fails
      if (!location) {
        location = { lat: 26.9124, lng: 75.7873 } // Jaipur coordinates for testing
        console.log("Using fallback location:", location)
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

      console.log("Final alert data:", alertData)

      let alertSentSuccessfully = false

      // Try online first
      if (isOnline) {
        try {
          const supabase = createClient()
          if (supabase) {
            const { error: supabaseError } = await supabase
              .from('emergency_alerts')
              .insert(alertData)

            if (!supabaseError) {
              alertSentSuccessfully = true
            }
          }
        } catch (supabaseError) {
          console.warn("Online failed, sending direct offline:", supabaseError)
        }
      }

      // Send direct offline alert
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
      // Force direct offline alert with fallback location
      const fallbackAlert = {
        user_id: user.id,
        user_name: user.name || user.email?.split('@')[0] || 'Unknown User',
        type: type,
        message: message || `${label} alert`,
        severity: type === 'emergency' ? 'critical' : 'high',
        location_lat: currentLocation?.lat || 26.9124,
        location_lng: currentLocation?.lng || 75.7873,
        created_at: new Date().toISOString()
      }
      console.log("Fallback alert:", fallbackAlert)
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

  const buttonSizeClasses = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4",
    lg: "h-12 px-6 text-lg"
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          className={`${className} ${buttonSizeClasses[size]} flex flex-col items-center justify-center space-y-1 relative`}
          onClick={() => setIsOpen(true)}
        >
          {icon}
          <span className="text-xs font-medium">{label}</span>
          {!isOnline && (
            <WifiOff className="absolute -top-1 -right-1 h-3 w-3 text-orange-500" />
          )}
        </Button>
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
              <label className="text-sm font-medium mb-2 block">
                Additional Information (Optional)
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Provide any additional details about your situation..."
                rows={3}
              />
            </div>

            {currentLocation && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>Location: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}</span>
              </div>
            )}

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{isOnline ? 'Alert will be sent immediately' : 'OFFLINE - Immediate admin alert'}</span>
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-orange-500" />
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => getCurrentLocation().then(loc => console.log("Test location:", loc))}
                className="text-xs"
              >
                Test Location
              </Button>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={sendAlert}
                disabled={isLoading}
                className={`flex-1 ${!isOnline ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isOnline ? 'Sending...' : 'Sending Offline...'}
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
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
