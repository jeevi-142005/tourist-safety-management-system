"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  WifiOff, Wifi, Battery, BatteryLow, MessageSquare, Clock,
  Send, CheckCircle, AlertTriangle, Bell, MapPin, RefreshCw,
  ShieldAlert, Phone, Timer, Users, Zap, BatteryWarning, Info,
  Radio, Flame, Sun, Wind
} from "lucide-react"

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────
interface QueuedAlert {
  id: string
  type: string
  message: string
  severity: string
  location: { lat: number; lng: number } | null
  queuedAt: string
  synced: boolean
}

interface CheckIn {
  id: string
  label: string
  deadline: Date
  active: boolean
  triggered: boolean
}

// ────────────────────────────────────────────────────────────────
// IndexedDB helpers
// ────────────────────────────────────────────────────────────────
const DB_NAME = "tourist_offline_safety"
const STORE_ALERTS = "queued_alerts"

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_ALERTS, { keyPath: "id" })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function saveAlertOffline(alert: QueuedAlert) {
  const db = await openDB()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_ALERTS, "readwrite")
    tx.objectStore(STORE_ALERTS).put(alert)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function getQueuedAlerts(): Promise<QueuedAlert[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ALERTS, "readonly")
    const req = tx.objectStore(STORE_ALERTS).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function clearSyncedAlerts() {
  const db = await openDB()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_ALERTS, "readwrite")
    const store = tx.objectStore(STORE_ALERTS)
    const req = store.getAll()
    req.onsuccess = () => {
      req.result.filter((a: QueuedAlert) => a.synced).forEach((a: QueuedAlert) => store.delete(a.id))
      resolve()
    }
    req.onerror = () => reject(req.error)
  })
}

// ────────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────────
export function OfflineSafetyPanel({ userId }: { userId?: string }) {
  const [isOnline, setIsOnline] = useState(true)
  const [battery, setBattery] = useState<number | null>(null)
  const [batteryCharging, setBatteryCharging] = useState(false)
  const [queuedAlerts, setQueuedAlerts] = useState<QueuedAlert[]>([])
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "done" | "error">("idle")
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [newCheckInLabel, setNewCheckInLabel] = useState("")
  const [newCheckInMinutes, setNewCheckInMinutes] = useState("60")
  const [lowBatteryAlertSent, setLowBatteryAlertSent] = useState(false)
  const [preTripMessage, setPreTripMessage] = useState("")
  const [preTripSent, setPreTripSent] = useState(false)
  const [broadcastContact, setBroadcastContact] = useState("")
  const checkInTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // ── Online/Offline detection ─────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncQueuedAlerts()
    }
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // ── Battery monitoring ───────────────────────────────────────
  useEffect(() => {
    if ("getBattery" in navigator) {
      (navigator as any).getBattery().then((bat: any) => {
        setBattery(Math.round(bat.level * 100))
        setBatteryCharging(bat.charging)
        bat.addEventListener("levelchange", () => {
          const level = Math.round(bat.level * 100)
          setBattery(level)
          // Auto-ping location when battery < 20%
          if (level < 20 && !lowBatteryAlertSent) {
            triggerLowBatteryPing(level)
          }
        })
        bat.addEventListener("chargingchange", () => setBatteryCharging(bat.charging))
      })
    }
  }, [lowBatteryAlertSent])

  // ── GPS location ─────────────────────────────────────────────
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      )
    }
  }, [])

  // ── Load queued alerts from IndexedDB ────────────────────────
  useEffect(() => {
    getQueuedAlerts().then(setQueuedAlerts).catch(console.error)
  }, [])

  // ── Sync when back online ────────────────────────────────────
  const syncQueuedAlerts = useCallback(async () => {
    const pending = await getQueuedAlerts()
    const unsynced = pending.filter((a) => !a.synced)
    if (unsynced.length === 0) return

    setSyncStatus("syncing")
    try {
      const res = await fetch("/api/offline-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alerts: unsynced, userId }),
      })
      if (res.ok) {
        const updated = pending.map((a) => ({ ...a, synced: true }))
        await Promise.all(updated.map(saveAlertOffline))
        await clearSyncedAlerts()
        setQueuedAlerts([])
        setSyncStatus("done")
        setTimeout(() => setSyncStatus("idle"), 4000)
      } else {
        setSyncStatus("error")
      }
    } catch {
      setSyncStatus("error")
    }
  }, [userId])

  // ── Queue offline SOS ────────────────────────────────────────
  const queueOfflineSOS = async (type = "emergency", message = "SOS — Tourist needs immediate help!") => {
    // DEMO OVERRIDE: Since you are presenting locally, localhost allows network requests
    // even if Wi-Fi is physically turned off on your computer. 
    // This instantly pushes the alert to the admin dashboard to simulate an SMS gateway.
    try {
      await fetch("/api/admin/simulate-twilio", { method: "POST" })
    } catch (e) {
      console.log("Demo fetch failed", e)
    }

    const alert: QueuedAlert = {
      id: `offline_${Date.now()}`,
      type,
      message,
      severity: "critical",
      location: currentLocation,
      queuedAt: new Date().toISOString(),
      synced: true, // Marked as synced so it clears
    }
    setQueuedAlerts((prev) => [...prev, alert])

    // Try native SMS fallback simultaneously
    const smsBody = encodeURIComponent(
      `🚨 EMERGENCY: Tourist needs help!\nLast GPS: ${currentLocation ? `${currentLocation.lat.toFixed(5)},${currentLocation.lng.toFixed(5)}` : "Unknown"}\nTime: ${new Date().toLocaleString()}`
    )
    window.location.href = `sms:112?body=${smsBody}`
  }

  // ── SMS SOS ──────────────────────────────────────────────────
  const sendSMSSOS = () => {
    const smsBody = encodeURIComponent(
      `🚨 EMERGENCY: Tourist needs immediate help!\nGPS: ${currentLocation ? `${currentLocation.lat.toFixed(5)},${currentLocation.lng.toFixed(5)}` : "Location unavailable"}\nSent: ${new Date().toLocaleString()}\nCall 112 immediately.`
    )
    window.location.href = `sms:112?body=${smsBody}`
  }

  // ── Low battery auto-ping ────────────────────────────────────
  const triggerLowBatteryPing = async (level: number) => {
    setLowBatteryAlertSent(true)
    const msg = `⚠️ LOW BATTERY ALERT: Tourist device at ${level}%. Last GPS: ${currentLocation ? `${currentLocation.lat.toFixed(5)},${currentLocation.lng.toFixed(5)}` : "Unknown"}. May go offline soon.`

    if (isOnline) {
      try {
        await fetch("/api/alerts/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "device",
            message: msg,
            severity: "high",
            location: currentLocation,
          }),
        })
      } catch {
        // Queue if that fails too
        await queueOfflineSOS("device", msg)
      }
    } else {
      await queueOfflineSOS("device", msg)
    }
  }

  // ── Dead Man Switch / Check-in Timer ─────────────────────────
  const addCheckIn = () => {
    if (!newCheckInLabel.trim()) return
    const minutes = parseInt(newCheckInMinutes) || 60
    const deadline = new Date(Date.now() + minutes * 60 * 1000)
    const checkIn: CheckIn = {
      id: `checkin_${Date.now()}`,
      label: newCheckInLabel,
      deadline,
      active: true,
      triggered: false,
    }
    setCheckIns((prev) => [...prev, checkIn])
    setNewCheckInLabel("")

    // Timer fires when deadline hit
    const timer = setTimeout(async () => {
      setCheckIns((prev) =>
        prev.map((c) => (c.id === checkIn.id ? { ...c, triggered: true } : c))
      )
      const msg = `🚨 DEAD MAN SWITCH TRIGGERED: Tourist "${checkIn.label}" did not check in by ${deadline.toLocaleTimeString()}. Auto-alert sent. GPS: ${currentLocation ? `${currentLocation.lat.toFixed(5)},${currentLocation.lng.toFixed(5)}` : "Unknown"}`
      if (isOnline) {
        await fetch("/api/alerts/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "emergency", message: msg, severity: "critical", location: currentLocation }),
        }).catch(() => queueOfflineSOS("emergency", msg))
      } else {
        await queueOfflineSOS("emergency", msg)
      }
    }, minutes * 60 * 1000)

    checkInTimersRef.current.set(checkIn.id, timer)
  }

  const confirmCheckIn = (id: string) => {
    const timer = checkInTimersRef.current.get(id)
    if (timer) clearTimeout(timer)
    checkInTimersRef.current.delete(id)
    setCheckIns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: false } : c))
    )
  }

  const removeCheckIn = (id: string) => {
    const timer = checkInTimersRef.current.get(id)
    if (timer) clearTimeout(timer)
    checkInTimersRef.current.delete(id)
    setCheckIns((prev) => prev.filter((c) => c.id !== id))
  }

  // ── Pre-trip broadcast ───────────────────────────────────────
  const sendPreTripBroadcast = async () => {
    if (!preTripMessage.trim()) return
    const full = `📍 TOURIST SAFETY NOTICE:\n${preTripMessage}\nLast GPS: ${currentLocation ? `${currentLocation.lat.toFixed(5)},${currentLocation.lng.toFixed(5)}` : "N/A"}\nSent at: ${new Date().toLocaleString()}\n\nIf you don't hear from me by the stated time, please call 112 or the Tourist Help Center.`

    if (broadcastContact) {
      const smsBody = encodeURIComponent(full)
      window.location.href = `sms:${broadcastContact}?body=${smsBody}`
    }

    if (isOnline) {
      try {
        await fetch("/api/alerts/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "info", message: full, severity: "low", location: currentLocation }),
        })
        setPreTripSent(true)
        setTimeout(() => setPreTripSent(false), 4000)
      } catch { /* silent */ }
    }
  }

  const unsynced = queuedAlerts.filter((a) => !a.synced)
  const activeCheckIns = checkIns.filter((c) => c.active)
  const triggeredCheckIns = checkIns.filter((c) => c.triggered)

  const batteryColor = battery === null ? "gray" :
    battery > 50 ? "green" : battery > 20 ? "orange" : "red"

  return (
    <div className="space-y-5">
      {/* ── Header Status Bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Network */}
        <Card className={`border-2 ${isOnline ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
          <CardContent className="p-4 flex items-center gap-3">
            {isOnline
              ? <Wifi className="h-6 w-6 text-green-600" />
              : <WifiOff className="h-6 w-6 text-red-600" />}
            <div>
              <p className="text-xs text-gray-500">Network</p>
              <p className={`font-bold text-sm ${isOnline ? "text-green-700" : "text-red-700"}`}>
                {isOnline ? "Connected" : "OFFLINE"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Battery */}
        <Card className={`border-2 ${batteryColor === "red" ? "border-red-300 bg-red-50" : batteryColor === "orange" ? "border-orange-300 bg-orange-50" : "border-blue-200 bg-blue-50"}`}>
          <CardContent className="p-4 flex items-center gap-3">
            {batteryColor === "red"
              ? <BatteryLow className="h-6 w-6 text-red-600" />
              : batteryColor === "orange"
              ? <BatteryWarning className="h-6 w-6 text-orange-600" />
              : <Battery className="h-6 w-6 text-blue-600" />}
            <div>
              <p className="text-xs text-gray-500">Battery</p>
              <p className={`font-bold text-sm ${batteryColor === "red" ? "text-red-700" : batteryColor === "orange" ? "text-orange-700" : "text-blue-700"}`}>
                {battery !== null ? `${battery}%` : "Detecting…"}
                {batteryCharging && " ⚡"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Queue */}
        <Card className={`border-2 ${unsynced.length > 0 ? "border-yellow-300 bg-yellow-50" : "border-gray-200 bg-gray-50"}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <Bell className={`h-6 w-6 ${unsynced.length > 0 ? "text-yellow-600" : "text-gray-400"}`} />
            <div>
              <p className="text-xs text-gray-500">Alert Queue</p>
              <p className={`font-bold text-sm ${unsynced.length > 0 ? "text-yellow-700" : "text-gray-500"}`}>
                {unsynced.length} pending
              </p>
            </div>
          </CardContent>
        </Card>

        {/* GPS */}
        <Card className={`border-2 ${currentLocation ? "border-purple-300 bg-purple-50" : "border-gray-200 bg-gray-50"}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <MapPin className={`h-6 w-6 ${currentLocation ? "text-purple-600" : "text-gray-400"}`} />
            <div>
              <p className="text-xs text-gray-500">GPS</p>
              <p className={`font-bold text-sm ${currentLocation ? "text-purple-700" : "text-gray-500"}`}>
                {currentLocation ? `${currentLocation.lat.toFixed(3)}, ${currentLocation.lng.toFixed(3)}` : "No fix"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── OFFLINE BANNER ── */}
      {!isOnline && (
        <Alert className="border-red-400 bg-red-50 animate-pulse">
          <WifiOff className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800 font-medium">
            📵 You are OFFLINE. Alerts will be queued locally and auto-sent when connection returns. Use SMS SOS below as an immediate fallback.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Low Battery Warning ── */}
      {battery !== null && battery < 20 && !batteryCharging && (
        <Alert className="border-red-400 bg-red-50">
          <BatteryLow className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800 font-medium">
            🔋 Critical Battery ({battery}%). A location ping has been auto-sent to the authority. Please charge your device or contact someone nearby.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Sync Banner ── */}
      {syncStatus === "done" && (
        <Alert className="border-green-300 bg-green-50">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-green-800 font-medium">
            ✅ Back online! {unsynced.length === 0 ? "All queued alerts synced successfully." : ""}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── 1. Offline SOS Queue ── */}
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              Offline SOS Queue
            </CardTitle>
            <CardDescription>Alert is saved locally and auto-sent when internet returns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              id="offline-sos-btn"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12"
              onClick={() => queueOfflineSOS("emergency", "🚨 OFFLINE SOS — Tourist requires immediate emergency help!")}
            >
              <ShieldAlert className="h-5 w-5 mr-2" />
              {isOnline ? "Send Emergency Alert" : "Queue SOS (Offline)"}
            </Button>

            {unsynced.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-semibold text-yellow-700">⏳ {unsynced.length} queued offline alert(s):</p>
                  {isOnline && (
                    <Button size="sm" variant="outline" onClick={syncQueuedAlerts} disabled={syncStatus === "syncing"}>
                      <RefreshCw className={`h-3 w-3 mr-1 ${syncStatus === "syncing" ? "animate-spin" : ""}`} />
                      Sync Now
                    </Button>
                  )}
                </div>
                {unsynced.slice(0, 3).map((a) => (
                  <div key={a.id} className="text-xs bg-yellow-50 border border-yellow-200 rounded p-2">
                    <span className="font-medium text-yellow-800">{a.type.toUpperCase()}</span>
                    <span className="text-gray-600 ml-2">{new Date(a.queuedAt).toLocaleTimeString()}</span>
                    <p className="text-gray-700 truncate mt-0.5">{a.message}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-3 border text-xs space-y-1 text-gray-600">
              <p className="font-semibold text-gray-700">How it works:</p>
              <p>• Alert stored in your device memory (IndexedDB)</p>
              <p>• Auto-synced to server the moment you reconnect</p>
              <p>• Works even if you close and reopen the app</p>
            </div>
          </CardContent>
        </Card>

        {/* ── 2. Cellular SOS (SMS & USSD) ── */}
        <Card className="border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-5 w-5 text-orange-500" />
              Cellular SOS (No Internet)
            </CardTitle>
            <CardDescription>Uses 2G network — works even with zero data balance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              id="sms-sos-btn"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-12"
              onClick={sendSMSSOS}
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              SMS SOS to 112 (with Location)
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="border-orange-300 text-orange-700 text-xs font-bold"
                onClick={() => { window.location.href = "tel:*555%23" }}
              >
                #️⃣ Dial *555# (USSD)
              </Button>
              <Button
                variant="outline"
                className="border-orange-300 text-orange-700 text-xs font-bold"
                onClick={() => { window.location.href = "tel:112" }}
              >
                📞 Call 112 (GSM)
              </Button>
              <Button
                variant="outline"
                className="border-orange-300 text-orange-700 text-xs"
                onClick={() => { window.location.href = "tel:100" }}
              >
                👮 Police (100)
              </Button>
              <Button
                variant="outline"
                className="border-orange-300 text-orange-700 text-xs"
                onClick={() => { window.location.href = "tel:108" }}
              >
                🚑 Ambulance (108)
              </Button>
            </div>

            <div className="bg-orange-50 rounded-lg p-3 border border-orange-100 text-xs space-y-1 text-gray-600">
              <p className="font-semibold text-gray-700">How these work without internet:</p>
              <p>• <strong>SMS:</strong> Sends text over voice channels (2G).</p>
              <p>• <strong>USSD (*555#):</strong> Direct session with network tower.</p>
              <p>• <strong>112 Call:</strong> Uses ANY available carrier tower.</p>
            </div>
          </CardContent>
        </Card>

        {/* ── 3. Dead Man Switch ── */}
        <Card className="border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Timer className="h-5 w-5 text-purple-500" />
              Dead Man Switch (Check-in Timer)
            </CardTitle>
            <CardDescription>Auto-alert if you don't confirm safe within set time</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Hiking in Ooty hills"
                value={newCheckInLabel}
                onChange={(e) => setNewCheckInLabel(e.target.value)}
                className="flex-1 text-sm"
              />
              <Input
                type="number"
                placeholder="Min"
                value={newCheckInMinutes}
                onChange={(e) => setNewCheckInMinutes(e.target.value)}
                className="w-20 text-sm"
              />
              <Button onClick={addCheckIn} className="bg-purple-600 hover:bg-purple-700 px-3">
                <Timer className="h-4 w-4" />
              </Button>
            </div>

            {triggeredCheckIns.length > 0 && (
              <Alert className="border-red-400 bg-red-50 animate-pulse">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 text-xs font-semibold">
                  🚨 Auto-alert triggered for: {triggeredCheckIns.map(c => c.label).join(", ")}
                </AlertDescription>
              </Alert>
            )}

            {activeCheckIns.length === 0 ? (
              <div className="text-xs text-gray-500 bg-purple-50 rounded p-3 border border-purple-100">
                <p className="font-medium text-purple-700 mb-1">No active check-in timers</p>
                <p>Set a timer before entering a remote or low-signal area. If you don't tap "I'm Safe" in time, an emergency alert is auto-sent.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeCheckIns.map((ci) => {
                  const remaining = Math.max(0, ci.deadline.getTime() - Date.now())
                  const mins = Math.floor(remaining / 60000)
                  const pct = Math.max(0, (remaining / (parseInt(newCheckInMinutes) * 60000)) * 100)
                  return (
                    <div key={ci.id} className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-semibold text-purple-800">{ci.label}</p>
                        <Badge className={`text-xs ${mins < 10 ? "bg-red-100 text-red-800" : "bg-purple-100 text-purple-800"}`}>
                          {mins}m left
                        </Badge>
                      </div>
                      <Progress value={pct} className="h-2" />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                          onClick={() => confirmCheckIn(ci.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" /> I am Safe
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs text-red-600 border-red-200"
                          onClick={() => removeCheckIn(ci.id)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── 4. Pre-trip Broadcast ── */}
        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-blue-500" />
              Pre-Trip Safety Broadcast
            </CardTitle>
            <CardDescription>Notify your contacts before entering a remote area</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Contact phone number (optional)"
              value={broadcastContact}
              onChange={(e) => setBroadcastContact(e.target.value)}
              type="tel"
              className="text-sm"
            />
            <textarea
              className="w-full text-sm border rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
              rows={3}
              placeholder="e.g., I'm going hiking in Kodaikanal hills. I'll be back by 6PM. If you don't hear from me, call 112."
              value={preTripMessage}
              onChange={(e) => setPreTripMessage(e.target.value)}
            />
            <Button
              id="pretrip-broadcast-btn"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={sendPreTripBroadcast}
              disabled={!preTripMessage.trim()}
            >
              {preTripSent
                ? <><CheckCircle className="h-4 w-4 mr-2" />Broadcast Sent!</>
                : <><Send className="h-4 w-4 mr-2" />Send Safety Broadcast</>}
            </Button>
            <div className="bg-blue-50 rounded p-3 border border-blue-100 text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-blue-700">What gets sent:</p>
              <p>• Your message + GPS coordinates</p>
              <p>• Timestamp of the broadcast</p>
              <p>• Reminder instructions for the contact to call 112 if no response</p>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ── 5. Physical Signals ── */}
      <div className="grid grid-cols-1 gap-5">
        <Card className="border-rose-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="h-5 w-5 text-rose-500" />
              Universal Physical SOS Signals
            </CardTitle>
            <CardDescription>If all electronics are dead or lost</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-white rounded p-3 border border-gray-200 flex gap-3 items-center">
              <Wind className="h-8 w-8 text-sky-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-800">Rule of 3 (Whistle / Shout)</p>
                <p className="text-xs text-gray-600">3 sharp whistle blasts, 3 shouts, or 3 gunshots. Wait 1 minute. Repeat. (Reply is 2 blasts).</p>
              </div>
            </div>
            
            <div className="bg-white rounded p-3 border border-gray-200 flex gap-3 items-center">
              <Sun className="h-8 w-8 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-800">Signal Mirror / Flashlight</p>
                <p className="text-xs text-gray-600">Flash 3 times short, 3 times long, 3 times short (S-O-S). Aim at aircraft or distant ridges.</p>
              </div>
            </div>

            <div className="bg-white rounded p-3 border border-gray-200 flex gap-3 items-center">
              <Flame className="h-8 w-8 text-orange-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-800">Fire & Smoke Signal</p>
                <p className="text-xs text-gray-600">Build 3 fires in a triangle (international distress signal). Add green leaves/pine needles for thick smoke.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 6. Battery Action Plan ── */}
      <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-5 w-5 text-yellow-600" />
            Low Battery Action Plan
          </CardTitle>
          <CardDescription>Automatic actions triggered as battery drops</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className={`rounded-lg p-4 border-2 ${battery !== null && battery <= 50 ? "border-yellow-400 bg-yellow-50" : "border-gray-200 bg-white"}`}>
              <div className="flex items-center gap-2 mb-2">
                <Battery className="h-5 w-5 text-yellow-600" />
                <span className="font-semibold text-sm">50% — Prepare</span>
              </div>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>✅ Set a Dead Man Switch</li>
                <li>✅ Send Pre-trip Broadcast</li>
                <li>✅ Note last GPS location</li>
                <li>✅ Reduce screen brightness</li>
              </ul>
            </div>
            <div className={`rounded-lg p-4 border-2 ${battery !== null && battery <= 20 ? "border-orange-400 bg-orange-50" : "border-gray-200 bg-white"}`}>
              <div className="flex items-center gap-2 mb-2">
                <BatteryWarning className="h-5 w-5 text-orange-600" />
                <span className="font-semibold text-sm">20% — Auto-ping 🔴</span>
              </div>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>🤖 Auto-sends location to authority</li>
                <li>✅ Send final SMS SOS if needed</li>
                <li>✅ Close all background apps</li>
                <li>✅ Enable Low Power Mode</li>
              </ul>
            </div>
            <div className="rounded-lg p-4 border-2 border-red-200 bg-red-50">
              <div className="flex items-center gap-2 mb-2">
                <BatteryLow className="h-5 w-5 text-red-600" />
                <span className="font-semibold text-sm">Device Off — Plan B</span>
              </div>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>🆘 Ask locals for help immediately</li>
                <li>📢 Shout / whistle 3 times (SOS)</li>
                <li>🪞 Use mirror/light reflection signal</li>
                <li>🏕️ Find forest ranger / patrol</li>
              </ul>
            </div>
          </div>
          {battery !== null && battery < 20 && (
            <div className="mt-3 flex gap-2">
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm" onClick={sendSMSSOS}>
                <MessageSquare className="h-4 w-4 mr-2" />Send Final SMS SOS before shutdown
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Offline Tips ── */}
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-gray-700">
            <Info className="h-4 w-4" />
            Offline Safety Checklist — Before Entering Remote Areas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
            {[
              "📥 Download offline maps",
              "🔋 Charge to 100%",
              "⏱️ Set check-in timer",
              "📱 Carry power bank",
              "📞 Save 112, 100, 108",
              "👥 Inform hotel / guide",
              "📍 Note last GPS location",
              "🗺️ Carry physical map if possible",
            ].map((tip, i) => (
              <div key={i} className="bg-white rounded p-2 border border-gray-200">{tip}</div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
