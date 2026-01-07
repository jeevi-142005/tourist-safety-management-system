"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { MapPin, AlertTriangle, Shield, Eye, Bell, Clock, CheckCircle, Loader2 } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"

interface GeofenceAlert {
  id: string
  message: string
  alert_type: string
  severity: string
  location_lat: number
  location_lng: number
  is_read: boolean
  is_acknowledged: boolean
  created_at: string
  read_at?: string
  acknowledged_at?: string
}

interface AlertSettings {
  geofence_enabled: boolean
  high_risk_notifications: boolean
  restricted_zone_notifications: boolean
  caution_zone_notifications: boolean
  safe_zone_notifications: boolean
  sound_alerts: boolean
  push_notifications: boolean
}

export function GeofenceAlertManager() {
  const [alerts, setAlerts] = useState<GeofenceAlert[]>([])
  const [settings, setSettings] = useState<AlertSettings>({
    geofence_enabled: true,
    high_risk_notifications: true,
    restricted_zone_notifications: true,
    caution_zone_notifications: true,
    safe_zone_notifications: false,
    sound_alerts: true,
    push_notifications: true,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    fetchAlerts()
    loadSettings()
    setupRealtimeSubscription()
  }, [])

  const fetchAlerts = async () => {
    try {
      const response = await fetch("/api/alerts/geofence")
      if (!response.ok) throw new Error("Failed to fetch alerts")

      const data = await response.json()
      setAlerts(data.alerts || [])
    } catch (error) {
      console.error("Error fetching alerts:", error)
      setError("Failed to load alerts")
    } finally {
      setLoading(false)
    }
  }

  const loadSettings = () => {
    const savedSettings = localStorage.getItem("geofence_alert_settings")
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }

  const saveSettings = (newSettings: AlertSettings) => {
    setSettings(newSettings)
    localStorage.setItem("geofence_alert_settings", JSON.stringify(newSettings))
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("geofence_alerts")
      .on("broadcast", { event: "geofence_alert" }, (payload) => {
        console.log("[v0] Received real-time geofence alert:", payload)

        // Add new alert to the list
        const newAlert: GeofenceAlert = {
          id: `temp-${Date.now()}`,
          message: `Geofence alert: ${payload.payload.event_type} ${payload.payload.zone_name}`,
          alert_type: "geofence",
          severity: payload.payload.severity,
          location_lat: 0,
          location_lng: 0,
          is_read: false,
          is_acknowledged: false,
          created_at: payload.payload.timestamp,
        }

        setAlerts((prev) => [newAlert, ...prev])

        // Play sound if enabled
        if (settings.sound_alerts) {
          playAlertSound(payload.payload.severity)
        }

        // Show browser notification if enabled
        if (settings.push_notifications && "Notification" in window && Notification.permission === "granted") {
          new Notification(`Geofence Alert: ${payload.payload.zone_name}`, {
            body: `You have ${payload.payload.event_type} a ${payload.payload.zone_type} zone`,
            icon: "/favicon.ico",
            tag: `geofence-${payload.payload.zone_name}`,
          })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const playAlertSound = (severity: string) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Different frequencies for different severities
      const frequency = severity === "critical" ? 1000 : severity === "high" ? 800 : 600
      oscillator.frequency.value = frequency
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.log("[v0] Audio notification not supported")
    }
  }

  const markAsRead = async (alertId: string) => {
    try {
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, is_read: true, read_at: new Date().toISOString() } : alert,
        ),
      )
    } catch (error) {
      console.error("Error marking alert as read:", error)
    }
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId
            ? {
                ...alert,
                is_acknowledged: true,
                acknowledged_at: new Date().toISOString(),
              }
            : alert,
        ),
      )
    } catch (error) {
      console.error("Error acknowledging alert:", error)
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

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case "medium":
        return <Shield className="h-4 w-4 text-yellow-600" />
      case "low":
        return <Eye className="h-4 w-4 text-blue-600" />
      default:
        return <MapPin className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading geofence alerts...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alert Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Geofence Alert Settings</span>
          </CardTitle>
          <CardDescription>Configure your geofence notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="geofence_enabled" className="font-medium">
                  Geofence Alerts
                </Label>
                <p className="text-sm text-gray-600">Enable all geofence notifications</p>
              </div>
              <Switch
                id="geofence_enabled"
                checked={settings.geofence_enabled}
                onCheckedChange={(checked) => saveSettings({ ...settings, geofence_enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="sound_alerts" className="font-medium">
                  Sound Alerts
                </Label>
                <p className="text-sm text-gray-600">Play sound for new alerts</p>
              </div>
              <Switch
                id="sound_alerts"
                checked={settings.sound_alerts}
                onCheckedChange={(checked) => saveSettings({ ...settings, sound_alerts: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div>
                <Label htmlFor="high_risk_notifications" className="font-medium">
                  High Risk Zones
                </Label>
                <p className="text-sm text-gray-600">Critical security alerts</p>
              </div>
              <Switch
                id="high_risk_notifications"
                checked={settings.high_risk_notifications}
                onCheckedChange={(checked) => saveSettings({ ...settings, high_risk_notifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div>
                <Label htmlFor="restricted_zone_notifications" className="font-medium">
                  Restricted Zones
                </Label>
                <p className="text-sm text-gray-600">Access control alerts</p>
              </div>
              <Switch
                id="restricted_zone_notifications"
                checked={settings.restricted_zone_notifications}
                onCheckedChange={(checked) => saveSettings({ ...settings, restricted_zone_notifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <Label htmlFor="caution_zone_notifications" className="font-medium">
                  Caution Zones
                </Label>
                <p className="text-sm text-gray-600">Safety advisory alerts</p>
              </div>
              <Switch
                id="caution_zone_notifications"
                checked={settings.caution_zone_notifications}
                onCheckedChange={(checked) => saveSettings({ ...settings, caution_zone_notifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <Label htmlFor="safe_zone_notifications" className="font-medium">
                  Safe Zones
                </Label>
                <p className="text-sm text-gray-600">Safety confirmation alerts</p>
              </div>
              <Switch
                id="safe_zone_notifications"
                checked={settings.safe_zone_notifications}
                onCheckedChange={(checked) => saveSettings({ ...settings, safe_zone_notifications: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Recent Geofence Alerts</span>
            </div>
            <Badge variant="outline">{alerts.filter((alert) => !alert.is_read).length} unread</Badge>
          </CardTitle>
          <CardDescription>Your recent geofence zone entry and exit notifications</CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No geofence alerts yet</p>
              <p className="text-sm text-gray-400">Alerts will appear here when you enter or exit geo-fenced zones</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    !alert.is_read ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={getSeverityColor(alert.severity)}>{alert.severity.toUpperCase()}</Badge>
                          {!alert.is_read && (
                            <Badge variant="outline" className="text-xs">
                              NEW
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(alert.created_at).toLocaleString()}</span>
                          </div>
                          {alert.is_acknowledged && (
                            <div className="flex items-center space-x-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              <span>Acknowledged</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {!alert.is_read && (
                        <Button variant="outline" size="sm" onClick={() => markAsRead(alert.id)}>
                          Mark Read
                        </Button>
                      )}
                      {!alert.is_acknowledged && (
                        <Button variant="outline" size="sm" onClick={() => acknowledgeAlert(alert.id)}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
