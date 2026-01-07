"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Mic, MicOff, Send, Shield, Heart, Zap, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface EmergencyContact {
  id: string
  name: string
  phone: string
  relationship: string
  priority: number
}

interface PoliceStation {
  id: string
  name: string
  phone: string
  address: string
  distance: number
}

export function EmergencyAlertSystem() {
  const [isPanicMode, setIsPanicMode] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [emergencyType, setEmergencyType] = useState("")
  const [emergencyMessage, setEmergencyMessage] = useState("")
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])
  const [nearbyPolice, setNearbyPolice] = useState<PoliceStation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [alertSent, setAlertSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const panicTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    getCurrentLocation()
    fetchEmergencyContacts()
    setupSpeechRecognition()

    return () => {
      if (panicTimeoutRef.current) {
        clearTimeout(panicTimeoutRef.current)
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setCurrentLocation(location)
          fetchNearbyPolice(location)
        },
        (error) => {
          console.error("Error getting location:", error)
          setError("Unable to get current location")
        },
      )
    }
  }

  const fetchEmergencyContacts = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("priority", { ascending: true })

      if (error) throw error
      setEmergencyContacts(data || [])
    } catch (error) {
      console.error("Error fetching emergency contacts:", error)
    }
  }

  const fetchNearbyPolice = async (location: { lat: number; lng: number }) => {
    try {
      // Mock data - in production, this would query a real database
      const mockPoliceStations: PoliceStation[] = [
        {
          id: "1",
          name: "Central Police Station",
          phone: "100",
          address: "123 Main Street",
          distance: 0.8,
        },
        {
          id: "2",
          name: "Tourist Police Unit",
          phone: "1091",
          address: "456 Tourist Area",
          distance: 1.2,
        },
      ]
      setNearbyPolice(mockPoliceStations)
    } catch (error) {
      console.error("Error fetching nearby police:", error)
    }
  }

  const setupSpeechRecognition = () => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()

      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setEmergencyMessage((prev) => prev + " " + transcript)
        setIsListening(false)
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
        setError("Speech recognition error")
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }

  const handlePanicButtonPress = () => {
    setIsPanicMode(true)
    panicTimeoutRef.current = setTimeout(() => {
      sendEmergencyAlert("panic", "PANIC BUTTON ACTIVATED - Immediate assistance required!")
    }, 3000)
  }

  const handlePanicButtonRelease = () => {
    setIsPanicMode(false)
    if (panicTimeoutRef.current) {
      clearTimeout(panicTimeoutRef.current)
      panicTimeoutRef.current = null
    }
  }

  const startVoiceRecording = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true)
      setError(null)
      recognitionRef.current.start()
    }
  }

  const stopVoiceRecording = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const sendEmergencyAlert = async (type: string, message: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/emergency/voice-alert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          alertType: type,
          message: message,
          location: currentLocation,
          emergencyContacts: emergencyContacts.map((c) => c.phone),
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send emergency alert")
      }

      const data = await response.json()
      setAlertSent(true)

      // Reset form after successful alert
      setTimeout(() => {
        setAlertSent(false)
        setEmergencyMessage("")
        setEmergencyType("")
      }, 5000)
    } catch (error) {
      console.error("Error sending emergency alert:", error)
      setError("Failed to send emergency alert. Please try again.")
    } finally {
      setIsLoading(false)
      setIsPanicMode(false)
    }
  }

  const handleSendAlert = () => {
    if (!emergencyType || !emergencyMessage.trim()) {
      setError("Please select emergency type and provide a message")
      return
    }
    sendEmergencyAlert(emergencyType, emergencyMessage)
  }

  const getEmergencyIcon = (type: string) => {
    switch (type) {
      case "medical":
        return <Heart className="h-5 w-5" />
      case "security":
        return <Shield className="h-5 w-5" />
      case "natural_disaster":
        return <Zap className="h-5 w-5" />
      default:
        return <AlertTriangle className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Panic Button */}
      <Card className={`transition-all duration-300 ${isPanicMode ? "ring-4 ring-red-500 bg-red-50" : ""}`}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-red-600">Emergency Alert System</CardTitle>
          <CardDescription>
            {isPanicMode
              ? "Release button to cancel • Hold for 3 seconds to send alert"
              : "Press and hold for emergency assistance"}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="relative">
            <Button
              size="lg"
              className={`w-32 h-32 rounded-full text-white font-bold text-lg transition-all duration-300 ${
                isPanicMode ? "bg-red-600 hover:bg-red-700 scale-110 animate-pulse" : "bg-red-500 hover:bg-red-600"
              }`}
              onMouseDown={handlePanicButtonPress}
              onMouseUp={handlePanicButtonRelease}
              onTouchStart={handlePanicButtonPress}
              onTouchEnd={handlePanicButtonRelease}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <>
                  <AlertTriangle className="h-8 w-8 mb-2" />
                  <div>PANIC</div>
                  <div className="text-sm">BUTTON</div>
                </>
              )}
            </Button>

            {isPanicMode && <div className="absolute -inset-4 border-4 border-red-500 rounded-full animate-ping"></div>}
          </div>

          {isPanicMode && (
            <div className="text-red-600 font-medium animate-pulse">
              Hold for {3} more seconds to send emergency alert...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Success Message */}
      {alertSent && (
        <Alert className="border-green-200 bg-green-50">
          <Shield className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 font-medium">
            Emergency alert sent successfully! Authorities and emergency contacts have been notified.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Manual Emergency Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Send className="h-5 w-5" />
            <span>Report Emergency</span>
          </CardTitle>
          <CardDescription>Provide details about your emergency situation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Emergency Type</label>
            <Select value={emergencyType} onValueChange={setEmergencyType}>
              <SelectTrigger>
                <SelectValue placeholder="Select emergency type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medical">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span>Medical Emergency</span>
                  </div>
                </SelectItem>
                <SelectItem value="security">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-orange-500" />
                    <span>Security Threat</span>
                  </div>
                </SelectItem>
                <SelectItem value="natural_disaster">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span>Natural Disaster</span>
                  </div>
                </SelectItem>
                <SelectItem value="other">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-gray-500" />
                    <span>Other Emergency</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Emergency Message</label>
            <Textarea
              value={emergencyMessage}
              onChange={(e) => setEmergencyMessage(e.target.value)}
              placeholder="Describe your emergency situation..."
              rows={4}
            />
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={startVoiceRecording}
              disabled={isListening}
              variant="outline"
              className="flex-1 bg-transparent"
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4 mr-2 text-red-500" />
                  Listening...
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Voice Message
                </>
              )}
            </Button>

            <Button
              onClick={handleSendAlert}
              disabled={isLoading || !emergencyType || !emergencyMessage.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send Alert
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      {/* Add Emergency Contact Form */}
{emergencyContacts.length === 0 && (
  <Card>
    <CardHeader>
      <CardTitle>Add Emergency Contact</CardTitle>
      <CardDescription>Add someone who should be notified in emergencies</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input placeholder="Full Name" />
          <Input placeholder="Phone Number" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select>
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
          <Select>
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
        <Button className="w-full">
          <Phone className="h-4 w-4 mr-2" />
          Add Emergency Contact
        </Button>
      </div>
    </CardContent>
  </Card>
)}

      {/* Nearby Police Stations */}
      {nearbyPolice.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nearby Police Stations</CardTitle>
            <CardDescription>Emergency services in your area</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {nearbyPolice.map((station) => (
                <div key={station.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <div className="font-medium">{station.name}</div>
                    <div className="text-sm text-gray-600">{station.address}</div>
                    <div className="text-xs text-gray-500">{station.distance} km away</div>
                  </div>
                  <div className="text-sm font-mono text-blue-600">{station.phone}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
