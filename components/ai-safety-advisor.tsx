"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Brain, MapPin, AlertTriangle, AlertCircle } from "lucide-react"

export function AISafetyAdvisor() {
  const [location, setLocation] = useState("")
  const [situation, setSituation] = useState("")
  const [destination, setDestination] = useState("")
  const [travelDate, setTravelDate] = useState("")
  const [advice, setAdvice] = useState("")
  const [riskAnalysis, setRiskAnalysis] = useState("")
  const [loadingAdvice, setLoadingAdvice] = useState(false)
  const [loadingRisk, setLoadingRisk] = useState(false)
  const [error, setError] = useState("")

  const getSafetyAdvice = async () => {
    if (!location || !situation) return

    setLoadingAdvice(true)
    setError("")
    
    try {
      const response = await fetch("/api/safety-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, situation }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to get safety advice")
      }
      
      if (data.advice) {
        setAdvice(data.advice)
      }
    } catch (error) {
      console.error("Error getting safety advice:", error)
      setError("Failed to get AI advice. Please check your API configuration.")
    } finally {
      setLoadingAdvice(false)
    }
  }

  const analyzeTravelRisk = async () => {
    if (!destination || !travelDate) return

    setLoadingRisk(true)
    setError("")
    
    try {
      const response = await fetch("/api/travel-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, travelDate }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze travel risk")
      }
      
      if (data.riskAnalysis) {
        setRiskAnalysis(data.riskAnalysis)
      }
    } catch (error) {
      console.error("Error analyzing travel risk:", error)
      setError("Failed to analyze travel risk. Please check your API configuration.")
    } finally {
      setLoadingRisk(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-balance mb-4 flex items-center justify-center gap-2">
          <Brain className="w-8 h-8 text-primary" />
          AI Safety Advisor
        </h2>
        <p className="text-muted-foreground text-balance">
          Get personalized safety advice and travel risk analysis powered by Google Gemini AI
        </p>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
            <br />
            <span className="text-sm">Make sure you have set up your Google Gemini API key in the .env.local file.</span>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Safety Advice Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Emergency Safety Advice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Current Location</label>
              <Input
                placeholder="e.g., Bangkok, Thailand"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Situation Description</label>
              <Textarea
                placeholder="Describe your current situation or safety concern..."
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                rows={3}
              />
            </div>
            <Button onClick={getSafetyAdvice} disabled={!location || !situation || loadingAdvice} className="w-full">
              {loadingAdvice ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Getting AI Advice...
                </>
              ) : (
                "Get AI Safety Advice"
              )}
            </Button>

            {advice && (
              <Card className="mt-4 bg-orange-50 border-orange-200">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-orange-100 text-orange-800">Gemini AI Generated</Badge>
                  </div>
                  <div className="whitespace-pre-wrap text-sm">{advice}</div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Travel Risk Analysis Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              Travel Risk Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Destination</label>
              <Input
                placeholder="e.g., Paris, France"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Travel Date</label>
              <Input type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} />
            </div>
            <Button
              onClick={analyzeTravelRisk}
              disabled={!destination || !travelDate || loadingRisk}
              className="w-full"
            >
              {loadingRisk ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                "Analyze Travel Risk with AI"
              )}
            </Button>

            {riskAnalysis && (
              <Card className="mt-4 bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-100 text-blue-800">Gemini AI Analysis</Badge>
                  </div>
                  <div className="whitespace-pre-wrap text-sm">{riskAnalysis}</div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
