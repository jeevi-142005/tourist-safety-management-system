"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Brain, Shield, TrendingUp, MapPin, Loader2, RefreshCw } from "lucide-react"
import { useAIAutomation } from "@/hooks/use-ai-automation"
import { useAuth } from "@/hooks/use-auth"
import { useAlerts } from "@/hooks/use-alerts"

export function AISafetyAssistant() {
  const [predictions, setPredictions] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const { alerts } = useAlerts()
  const { predictSafetyRisks, generateSafetyRecommendations } = useAIAutomation()

  const currentLocation = { lat: 40.7128, lng: -74.006 } // Default NYC coordinates

  const generatePredictions = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Get recent alerts for this user
      const userAlerts = alerts.filter((alert) => alert.touristId === user.id)
      const recentAlerts = userAlerts.slice(-5) // Last 5 alerts

      // Generate AI predictions and recommendations
      const [predictionResult, recommendationResult] = await Promise.all([
        predictSafetyRisks(user, recentAlerts),
        generateSafetyRecommendations(currentLocation, userAlerts),
      ])

      setPredictions(predictionResult)
      setRecommendations(recommendationResult)
    } catch (error) {
      console.error("Failed to generate AI predictions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === "tourist") {
      generatePredictions()
    }
  }, [user])

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600"
      case "medium":
        return "text-orange-600"
      case "low":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  if (user?.role !== "tourist") return null

  return (
    <Card className="border-purple-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <span>AI Safety Assistant</span>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={generatePredictions} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto" />
              <p className="text-sm text-gray-600">AI analyzing your safety profile...</p>
            </div>
          </div>
        ) : predictions ? (
          <>
            {/* Overall Risk Assessment */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Overall Risk Level:</span>
              </div>
              <Badge className={getRiskColor(predictions.overallRisk)}>{predictions.overallRisk.toUpperCase()}</Badge>
            </div>

            <Separator />

            {/* Risk Factors */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <span>Identified Risk Factors</span>
              </h4>
              <div className="space-y-2">
                {predictions.riskFactors.map((factor: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <span className="text-sm font-medium">{factor.factor}</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs ${getSeverityColor(factor.severity)}`}>
                          {factor.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">{Math.round(factor.likelihood * 100)}% likelihood</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Preventive Actions */}
            <div>
              <h4 className="text-sm font-semibold mb-3">AI-Recommended Preventive Actions</h4>
              <ul className="space-y-2">
                {predictions.preventiveActions.map((action: string, index: number) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* Monitoring Recommendations */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Monitoring Recommendations</h4>
              <div className="grid grid-cols-1 gap-2">
                {predictions.monitoringRecommendations.map((rec: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs justify-start p-2">
                    {rec}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Location-Based Safety Tips */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                <span>Location-Based Safety Tips</span>
              </h4>
              <ul className="space-y-2">
                {recommendations.map((tip: string, index: number) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600">Click refresh to get AI safety insights</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
