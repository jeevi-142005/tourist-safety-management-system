// "use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle, Shield, Heart, Phone, MapPin, Zap, CheckCircle, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EmergencyContact {
  id: string
  name: string
  phone: string
  relationship: string
  priority: number
}

interface EmergencyAlert {
  id: string
  type: "panic" | "fall" | "medical" | "location" | "manual"
  severity: "low" | "medium" | "high" | "critical"
  location: { lat: number; lng: number }
  timestamp: string
  status: "active" | "acknowledged" | "resolved"
  auto_detected: boolean
}

export function EnhancedEmergencySystem() {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [panicMode, setPanicMode] = useState(false)
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlert[]>([])
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [batteryLevel, setBatteryLevel] = useState(100)
  const [isConnected, setIsConnected] = useState(true)
  const [panicTimer, setPanicTimer] = useState(0)
  const [showPanicDialog, setShowPanicDialog] = useState(false)
  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    relationship: "",
    priority: ""
  })

  const panicTimerRef = useRef<NodeJS.Timeout | null>(null)
  const locationWatchRef = useRef<number | null>(null)

  useEffect(() => {
    if (isMonitoring) {
      startEmergencyMonitoring()
    } else {
      stopEmergencyMonitoring()
    }
    return () => stopEmergencyMonitoring()
  }, [isMonitoring])

  const startEmergencyMonitoring = () => {
    if (navigator.geolocation) {
      locationWatchRef.current = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => console.error("Location error:", error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      )
    }
  }

  const stopEmergencyMonitoring = () => {
    if (locationWatchRef.current) {
      navigator.geolocation.clearWatch(locationWatchRef.current)
      locationWatchRef.current = null
    }
  }

  const activatePanicMode = () => {
    setPanicMode(true)
    setShowPanicDialog(true)
    setPanicTimer(10)

    panicTimerRef.current = setInterval(() => {
      setPanicTimer((prev) => {
        if (prev <= 1) {
          triggerEmergencyAlert("panic", "critical")
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
    if (panicTimerRef.current) {
      clearInterval(panicTimerRef.current)
      panicTimerRef.current = null
    }
  }

  const triggerEmergencyAlert = async (
    type: EmergencyAlert["type"],
    severity: EmergencyAlert["severity"],
    autoDetected = false
  ) => {
    console.log(`Emergency alert: ${type} - ${severity}`)
    if (panicMode) {
      cancelPanicMode()
    }
  }

  return (
    <div className="space-y-6">
      <Card className={panicMode ? "border-red-500 bg-red-50" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Enhanced Emergency System</span>
            </div>
            {panicMode && <Badge className="bg-red-500 text-white animate-pulse">PANIC MODE ACTIVE</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Location</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">{currentLocation ? "Tracked" : "Unknown"}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Battery</span>
              </div>
              <p className="text-xs text-green-600 mt-1">{batteryLevel}%</p>
            </div>
            <div className={`p-3 rounded-lg ${isConnected ? "bg-green-50" : "bg-red-50"}`}>
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                <span className={`text-sm font-medium ${isConnected ? "text-green-800" : "text-red-800"}`}>
                  Connection
                </span>
              </div>
              <p className={`text-xs mt-1 ${isConnected ? "text-green-600" : "text-red-600"}`}>
                {isConnected ? "Online" : "Offline"}
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Contacts</span>
              </div>
              <p className="text-xs text-purple-600 mt-1">{emergencyContacts.length} ready</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="monitoring" className="font-medium">Emergency Monitoring</Label>
              <p className="text-sm text-gray-600">Automatic fall detection and location tracking</p>
            </div>
            <Switch id="monitoring" checked={isMonitoring} onCheckedChange={setIsMonitoring} />
          </div>

          <div className="text-center">
            <Button
              onClick={activatePanicMode}
              disabled={panicMode}
              className="w-full h-20 bg-red-600 hover:bg-red-700 text-white text-xl font-bold"
              size="lg"
            >
              <AlertTriangle className="h-8 w-8 mr-3" />
              {panicMode ? "PANIC MODE ACTIVE" : "EMERGENCY PANIC BUTTON"}
            </Button>
            <p className="text-xs text-gray-500 mt-2">Tap to activate emergency mode</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Emergency Contacts</CardTitle>
          <CardDescription>Add people who should be notified in emergencies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input 
                placeholder="Full Name" 
                value={contactForm.name}
                onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
              />
              <Input 
                placeholder="Phone Number" 
                value={contactForm.phone}
                onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select value={contactForm.relationship} onValueChange={(value) => setContactForm({...contactForm, relationship: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="family">Family Member</SelectItem>
                  <SelectItem value="friend">Friend</SelectItem>
                  <SelectItem value="colleague">Colleague</SelectItem>
                  <SelectItem value="emergency">Emergency Contact</SelectItem>
                </SelectContent>
              </Select>
              <Select value={contactForm.priority} onValueChange={(value) => setContactForm({...contactForm, priority: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">High Priority</SelectItem>
                  <SelectItem value="2">Medium Priority</SelectItem>
                  <SelectItem value="3">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="w-full" 
              onClick={() => {
                if (contactForm.name && contactForm.phone && contactForm.relationship && contactForm.priority) {
                  const newContact = {
                    id: Date.now().toString(),
                    name: contactForm.name,
                    phone: contactForm.phone,
                    relationship: contactForm.relationship,
                    priority: parseInt(contactForm.priority)
                  }
                  setEmergencyContacts([...emergencyContacts, newContact])
                  setContactForm({ name: "", phone: "", relationship: "", priority: "" })
                }
              }}
              disabled={!contactForm.name || !contactForm.phone || !contactForm.relationship || !contactForm.priority}
            >
              <Phone className="h-4 w-4 mr-2" />
              Add Emergency Contact
            </Button>
          </div>

          {emergencyContacts.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="font-medium">Added Contacts:</h4>
              {emergencyContacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-gray-500">{contact.relationship} • {contact.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">Priority {contact.priority}</Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEmergencyContacts(emergencyContacts.filter(c => c.id !== contact.id))}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPanicDialog} onOpenChange={setShowPanicDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Emergency Alert Activating</span>
            </DialogTitle>
            <DialogDescription>
              Emergency services will be notified in {panicTimer} seconds
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-6xl font-bold text-red-600 mb-2">{panicTimer}</div>
              <Progress value={(10 - panicTimer) * 10} className="w-full" />
            </div>
            <div className="flex space-x-3">
              <Button onClick={cancelPanicMode} variant="outline" className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={() => triggerEmergencyAlert("panic", "critical")}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Send Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
