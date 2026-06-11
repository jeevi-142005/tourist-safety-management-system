"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertTriangle, Shield, Heart, Phone, MapPin, Zap, CheckCircle, X, RefreshCw,
  Loader2, Siren, Wifi, WifiOff, Trash2, Clock, Plus
} from "lucide-react"

interface EmergencyContact {
  id: string
  name: string
  phone: string
  relationship: string
  priority: number
}

interface SOSAlert {
  id: string
  type: string
  message: string
  severity: string
  location_lat: number | null
  location_lng: number | null
  status: string
  created_at: string
}

export function EnhancedEmergencySystem() {
  // System state
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [panicMode, setPanicMode] = useState(false)
  const [panicTimer, setPanicTimer] = useState(0)
  const [showPanicDialog, setShowPanicDialog] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)
  const [isConnected, setIsConnected] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)

  // Data state
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])
  const [activeAlerts, setActiveAlerts] = useState<SOSAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingAlert, setSendingAlert] = useState(false)
  const [savingContacts, setSavingContacts] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Contact form state
  const [contactForm, setContactForm] = useState({ name: "", phone: "", relationship: "", priority: "" })

  // Active alert type selector
  const [selectedAlertType, setSelectedAlertType] = useState<string>("emergency")
  const [customMessage, setCustomMessage] = useState("")

  const panicTimerRef = useRef<NodeJS.Timeout | null>(null)
  const locationWatchRef = useRef<number | null>(null)

  // ------------------------------------------------------------------
  // Load contacts + recent alerts from DB on mount
  // ------------------------------------------------------------------
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/sos")
      if (!res.ok) throw new Error("Failed to load SOS data")
      const data = await res.json()
      setEmergencyContacts(data.contacts || [])
      setActiveAlerts(data.alerts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ------------------------------------------------------------------
  // Online / offline detection
  // ------------------------------------------------------------------
  useEffect(() => {
    const goOnline = () => setIsConnected(true)
    const goOffline = () => setIsConnected(false)
    window.addEventListener("online", goOnline)
    window.addEventListener("offline", goOffline)
    return () => { window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline) }
  }, [])

  // ------------------------------------------------------------------
  // Battery API
  // ------------------------------------------------------------------
  useEffect(() => {
    const nav = navigator as any
    if (nav.getBattery) {
      nav.getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100))
        battery.addEventListener("levelchange", () => setBatteryLevel(Math.round(battery.level * 100)))
      })
    }
  }, [])

  // ------------------------------------------------------------------
  // GPS Monitoring
  // ------------------------------------------------------------------
  useEffect(() => {
    if (isMonitoring) {
      if (navigator.geolocation) {
        locationWatchRef.current = navigator.geolocation.watchPosition(
          (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => console.error("GPS error:", err),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
        )
      }
    } else {
      if (locationWatchRef.current !== null) {
        navigator.geolocation.clearWatch(locationWatchRef.current)
        locationWatchRef.current = null
      }
    }
    return () => { if (locationWatchRef.current !== null) navigator.geolocation.clearWatch(locationWatchRef.current!) }
  }, [isMonitoring])

  // ------------------------------------------------------------------
  // Flash success helper
  // ------------------------------------------------------------------
  const flash = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3500)
  }

  // ------------------------------------------------------------------
  // Trigger SOS alert → saves to DB
  // ------------------------------------------------------------------
  const triggerAlert = async (
    type: string,
    severity: "low" | "medium" | "high" | "critical",
    messageOverride?: string
  ) => {
    setSendingAlert(true)
    setError(null)
    try {
      const msgs: Record<string, string> = {
        panic: "🚨 PANIC ALERT — Tourist requires IMMEDIATE assistance!",
        medical: "🩺 MEDICAL EMERGENCY — Tourist needs urgent medical help!",
        security: "🛡️ SECURITY THREAT — Tourist in danger / unsafe situation!",
        assistance: "🤝 ASSISTANCE NEEDED — Tourist requires help at current location.",
        emergency: "⚠️ EMERGENCY ALERT — Tourist triggered manual emergency signal!",
      }
      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          severity,
          message: messageOverride || msgs[type] || `Emergency alert: ${type}`,
          location_lat: currentLocation?.lat ?? null,
          location_lng: currentLocation?.lng ?? null,
          device_info: {
            battery: batteryLevel,
            online: isConnected,
            userAgent: navigator.userAgent.slice(0, 100),
          },
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Failed to send alert")
      const result = await res.json()
      setActiveAlerts(prev => [result.alert, ...prev])
      flash(`✓ ${type.toUpperCase()} alert sent and logged to database`)
      cancelPanicMode()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send alert")
    } finally {
      setSendingAlert(false)
    }
  }

  // ------------------------------------------------------------------
  // Resolve an alert in DB
  // ------------------------------------------------------------------
  const resolveAlert = async (alertId: string) => {
    try {
      await fetch("/api/sos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alert_id: alertId, status: "resolved" }),
      })
      setActiveAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: "resolved" } : a))
    } catch (err) {
      setError("Failed to resolve alert")
    }
  }

  // ------------------------------------------------------------------
  // Save contacts to DB
  // ------------------------------------------------------------------
  const saveContacts = async (contacts: EmergencyContact[]) => {
    setSavingContacts(true)
    try {
      const res = await fetch("/api/sos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts }),
      })
      if (!res.ok) throw new Error("Failed to save contacts")
      flash("Emergency contacts saved to database")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save contacts")
    } finally {
      setSavingContacts(false)
    }
  }

  const addContact = async () => {
    if (!contactForm.name || !contactForm.phone || !contactForm.relationship || !contactForm.priority) return
    const newContact: EmergencyContact = {
      id: `ec-${Date.now()}`,
      name: contactForm.name,
      phone: contactForm.phone,
      relationship: contactForm.relationship,
      priority: parseInt(contactForm.priority),
    }
    const updated = [...emergencyContacts, newContact].sort((a, b) => a.priority - b.priority)
    setEmergencyContacts(updated)
    setContactForm({ name: "", phone: "", relationship: "", priority: "" })
    await saveContacts(updated)
  }

  const removeContact = async (id: string) => {
    const updated = emergencyContacts.filter(c => c.id !== id)
    setEmergencyContacts(updated)
    await saveContacts(updated)
  }

  // ------------------------------------------------------------------
  // Panic countdown
  // ------------------------------------------------------------------
  const activatePanicMode = () => {
    setPanicMode(true)
    setShowPanicDialog(true)
    setPanicTimer(10)
    panicTimerRef.current = setInterval(() => {
      setPanicTimer(prev => {
        if (prev <= 1) {
          clearInterval(panicTimerRef.current!)
          triggerAlert("panic", "critical")
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const cancelPanicMode = () => {
    setPanicMode(false)
    setShowPanicDialog(false)
    setPanicTimer(0)
    if (panicTimerRef.current) { clearInterval(panicTimerRef.current); panicTimerRef.current = null }
  }

  const activeCount = activeAlerts.filter(a => a.status === "active").length
  const batteryColor = batteryLevel !== null ? (batteryLevel > 50 ? "text-green-600" : batteryLevel > 20 ? "text-yellow-600" : "text-red-600") : "text-gray-400"

  return (
    <div className="space-y-6">

      {/* Alerts */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
      {successMsg && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMsg}</AlertDescription>
        </Alert>
      )}

      {/* ─── STATUS BAR ─── */}
      <Card className={`transition-all duration-300 ${panicMode ? "border-red-500 bg-red-50 shadow-lg shadow-red-100" : "border-gray-200"}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center space-x-2">
              <Shield className={`h-5 w-5 ${panicMode ? "text-red-600 animate-pulse" : "text-blue-600"}`} />
              <span>Advanced SOS Panel</span>
            </div>
            <div className="flex items-center space-x-2">
              {panicMode && <Badge className="bg-red-500 text-white animate-pulse text-xs">PANIC ACTIVE</Badge>}
              {activeCount > 0 && <Badge className="bg-orange-500 text-white text-xs">{activeCount} Active</Badge>}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Status grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl">
              <div className="flex items-center space-x-2 mb-1">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-800">Location</span>
              </div>
              {currentLocation ? (
                <p className="text-[10px] text-blue-600 font-mono">
                  {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                </p>
              ) : (
                <p className="text-xs text-blue-400">{isMonitoring ? "Acquiring…" : "Off"}</p>
              )}
            </div>

            <div className="bg-green-50 border border-green-100 p-3 rounded-xl">
              <div className="flex items-center space-x-2 mb-1">
                <Zap className="h-4 w-4 text-green-600" />
                <span className="text-xs font-semibold text-green-800">Battery</span>
              </div>
              <p className={`text-xs font-bold ${batteryColor}`}>
                {batteryLevel !== null ? `${batteryLevel}%` : "N/A"}
              </p>
            </div>

            <div className={`p-3 rounded-xl border ${isConnected ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
              <div className="flex items-center space-x-2 mb-1">
                {isConnected ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
                <span className={`text-xs font-semibold ${isConnected ? "text-green-800" : "text-red-800"}`}>Network</span>
              </div>
              <p className={`text-xs font-medium ${isConnected ? "text-green-600" : "text-red-600"}`}>
                {isConnected ? "Online" : "Offline"}
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-100 p-3 rounded-xl">
              <div className="flex items-center space-x-2 mb-1">
                <Phone className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-semibold text-purple-800">Contacts</span>
              </div>
              <p className="text-xs font-bold text-purple-600">
                {loading ? "…" : `${emergencyContacts.length} saved`}
              </p>
            </div>
          </div>

          {/* Monitoring toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
            <div>
              <Label htmlFor="monitoring-toggle" className="font-semibold text-sm">GPS Monitoring</Label>
              <p className="text-xs text-gray-500 mt-0.5">Tracks live location for SOS alerts</p>
            </div>
            <Switch id="monitoring-toggle" checked={isMonitoring} onCheckedChange={setIsMonitoring} />
          </div>

          {/* PANIC BUTTON */}
          <button
            onClick={activatePanicMode}
            disabled={panicMode || sendingAlert}
            className={`w-full h-20 rounded-xl font-black text-xl flex items-center justify-center space-x-3 transition-all duration-200 shadow-lg
              ${panicMode
                ? "bg-red-700 text-white cursor-not-allowed opacity-80"
                : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white active:scale-[0.98] shadow-red-300"
              }`}
          >
            {sendingAlert ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <Siren className="h-8 w-8" />
            )}
            <span>{panicMode ? "PANIC MODE ACTIVE" : "EMERGENCY PANIC BUTTON"}</span>
          </button>
          <p className="text-center text-xs text-gray-400">Hold for 10s countdown • Sends location + alert to database</p>

          {/* Quick alert buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { type: "medical", label: "Medical", icon: "🩺", sev: "critical" as const, color: "border-red-200 hover:bg-red-50 text-red-700" },
              { type: "security", label: "Security", icon: "🛡️", sev: "high" as const, color: "border-orange-200 hover:bg-orange-50 text-orange-700" },
              { type: "assistance", label: "Assistance", icon: "🤝", sev: "medium" as const, color: "border-blue-200 hover:bg-blue-50 text-blue-700" },
              { type: "emergency", label: "Emergency", icon: "⚠️", sev: "high" as const, color: "border-purple-200 hover:bg-purple-50 text-purple-700" },
            ].map(({ type, label, icon, sev, color }) => (
              <button
                key={type}
                onClick={() => triggerAlert(type, sev)}
                disabled={sendingAlert}
                className={`flex flex-col items-center justify-center p-3 border rounded-xl text-xs font-semibold transition-colors ${color} disabled:opacity-50`}
              >
                <span className="text-xl mb-1">{icon}</span>
                {label}
              </button>
            ))}
          </div>

          {/* Custom message alert */}
          <div className="flex gap-2">
            <Input
              placeholder="Custom SOS message..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="text-sm"
            />
            <Button
              onClick={() => { if (customMessage.trim()) { triggerAlert("emergency", "high", customMessage); setCustomMessage("") } }}
              disabled={!customMessage.trim() || sendingAlert}
              className="shrink-0"
            >
              {sendingAlert ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── EMERGENCY CONTACTS ─── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center space-x-2">
                <Phone className="h-4 w-4 text-blue-600" />
                <span>Emergency Contacts</span>
              </CardTitle>
              <CardDescription className="text-xs">Saved to database — notified when SOS triggers</CardDescription>
            </div>
            {savingContacts && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add contact form */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Add New Contact</p>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Full Name *" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} className="text-sm" />
              <Input placeholder="Phone Number *" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} className="text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select value={contactForm.relationship} onValueChange={(v) => setContactForm({ ...contactForm, relationship: v })}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Relationship *" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="family">Family Member</SelectItem>
                  <SelectItem value="spouse">Spouse / Partner</SelectItem>
                  <SelectItem value="friend">Friend</SelectItem>
                  <SelectItem value="colleague">Colleague</SelectItem>
                  <SelectItem value="emergency">Emergency Contact</SelectItem>
                </SelectContent>
              </Select>
              <Select value={contactForm.priority} onValueChange={(v) => setContactForm({ ...contactForm, priority: v })}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Priority *" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">🔴 High Priority</SelectItem>
                  <SelectItem value="2">🟡 Medium Priority</SelectItem>
                  <SelectItem value="3">🟢 Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={addContact}
              disabled={!contactForm.name || !contactForm.phone || !contactForm.relationship || !contactForm.priority || savingContacts}
              className="w-full"
              size="sm"
            >
              {savingContacts ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Save Contact to Database
            </Button>
          </div>

          {/* Contact list */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="ml-2 text-sm text-gray-500">Loading contacts…</span>
            </div>
          ) : emergencyContacts.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl">
              <Phone className="h-10 w-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No emergency contacts saved yet</p>
              <p className="text-xs text-gray-300">Add contacts above to be notified during emergencies</p>
            </div>
          ) : (
            <div className="space-y-2">
              {emergencyContacts
                .sort((a, b) => a.priority - b.priority)
                .map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm
                        ${contact.priority === 1 ? "bg-red-100 text-red-600" : contact.priority === 2 ? "bg-yellow-100 text-yellow-600" : "bg-green-100 text-green-600"}`}>
                        {contact.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{contact.name}</p>
                        <p className="text-xs text-gray-500">{contact.relationship} • {contact.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-[10px]">P{contact.priority}</Badge>
                      <button onClick={() => removeContact(contact.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── RECENT SOS ALERTS LOG ─── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span>SOS Alert History</span>
              </CardTitle>
              <CardDescription className="text-xs">All alerts stored in database</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={loadData} className="text-xs">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : activeAlerts.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl">
              <Shield className="h-10 w-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No SOS alerts sent yet</p>
              <p className="text-xs text-gray-300">All alerts you trigger will be logged here</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {activeAlerts.map((alert) => {
                const sev = alert.severity
                const sevColor = sev === "critical" ? "bg-red-100 text-red-700 border-red-200"
                  : sev === "high" ? "bg-orange-100 text-orange-700 border-orange-200"
                  : sev === "medium" ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                  : "bg-gray-100 text-gray-600 border-gray-200"
                const typeIcon: Record<string, string> = { panic: "🚨", medical: "🩺", security: "🛡️", assistance: "🤝", emergency: "⚠️" }
                return (
                  <div key={alert.id} className={`flex items-start justify-between p-3 rounded-xl border ${alert.status === "active" ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
                    <div className="flex items-start space-x-2 flex-1 min-w-0">
                      <span className="text-lg shrink-0">{typeIcon[alert.type] || "⚠️"}</span>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="text-xs font-bold text-gray-800 uppercase">{alert.type}</span>
                          <Badge className={`text-[9px] px-1.5 border ${sevColor}`}>{alert.severity}</Badge>
                          {alert.status === "active"
                            ? <Badge className="text-[9px] bg-red-500 text-white px-1.5 animate-pulse">Active</Badge>
                            : <Badge className="text-[9px] bg-gray-200 text-gray-600 px-1.5">Resolved</Badge>
                          }
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5 truncate">{alert.message}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{new Date(alert.created_at).toLocaleString()}</p>
                        {alert.location_lat && alert.location_lng && (
                          <p className="text-[10px] text-blue-500 font-mono">
                            📍 {alert.location_lat.toFixed(4)}, {alert.location_lng.toFixed(4)}
                          </p>
                        )}
                      </div>
                    </div>
                    {alert.status === "active" && (
                      <button onClick={() => resolveAlert(alert.id)} className="ml-2 shrink-0 text-xs text-gray-400 hover:text-green-600 border border-gray-200 hover:border-green-200 rounded px-2 py-1 transition-colors">
                        Resolve
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── PANIC COUNTDOWN DIALOG ─── */}
      <Dialog open={showPanicDialog} onOpenChange={(open) => { if (!open) cancelPanicMode() }}>
        <DialogContent className="sm:max-w-sm border-red-300">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 animate-bounce" />
              <span>Emergency Alert Activating!</span>
            </DialogTitle>
            <DialogDescription>
              A PANIC alert will be sent to authorities in <strong>{panicTimer}</strong> seconds
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="text-center py-2">
              <div className="text-7xl font-black text-red-600 mb-3 animate-pulse">{panicTimer}</div>
              <Progress value={(10 - panicTimer) * 10} className="h-3" />
              <p className="text-xs text-gray-500 mt-2">Alert saves to database with your GPS location</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={cancelPanicMode} variant="outline" className="flex-1">
                <X className="h-4 w-4 mr-2" />Cancel
              </Button>
              <Button
                onClick={() => triggerAlert("panic", "critical")}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={sendingAlert}
              >
                {sendingAlert ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Siren className="h-4 w-4 mr-2" />}
                Send Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
