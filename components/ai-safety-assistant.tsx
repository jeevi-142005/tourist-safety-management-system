"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Brain, Shield, TrendingUp, MapPin, Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export function AISafetyAssistant() {
  const [predictions, setPredictions] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const generatePredictions = async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/ai/safety-assistant")
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch AI insights")
      }

      setPredictions(data.predictions)
      setRecommendations(data.recommendations)
    } catch (err) {
      console.error("Failed to generate AI predictions:", err)
      setError(err instanceof Error ? err.message : "Failed to load AI insights")
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
    <Card className="border-purple-200 shadow-sm transition-all">
      <CardHeader className="bg-purple-50/50 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="h-5 w-5 text-purple-600" />
            </div>
            <span className="font-bold text-gray-800">AI Safety Assistant</span>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={generatePredictions} disabled={isLoading} className="text-xs bg-white">
            {isLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
            Refresh AI Analysis
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-5">
        {error && (
          <Alert className="border-red-200 bg-red-50 text-red-800">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <p className="text-sm font-medium text-gray-500">Google Gemini AI is analyzing your safety profile and database history...</p>
          </div>
        ) : predictions ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Overall Risk Assessment */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-gray-500" />
                <span className="font-semibold text-gray-700">Overall AI Risk Assessment:</span>
              </div>
              <Badge className={`${getRiskColor(predictions.overallRisk)} font-bold px-3 py-1 text-xs uppercase tracking-wider`}>
                {predictions.overallRisk} RISK
              </Badge>
            </div>

            <Separator className="bg-purple-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Risk Factors */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-800 flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <span>Identified Risk Factors</span>
                </h4>
                <div className="space-y-2">
                  {predictions.riskFactors.map((factor: any, index: number) => (
                    <div key={index} className="flex flex-col p-3 bg-white border border-gray-100 shadow-sm rounded-lg">
                      <span className="text-sm font-medium text-gray-800 mb-1.5">{factor.factor}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={`text-[10px] ${getSeverityColor(factor.severity)} border-${getSeverityColor(factor.severity).split('-')[1]}-200`}>
                          {factor.severity.toUpperCase()} SEVERITY
                        </Badge>
                        <span className="text-[10px] text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded">
                          {Math.round(factor.likelihood * 100)}% LIKELIHOOD
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preventive Actions */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-800 flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>AI-Recommended Actions</span>
                </h4>
                <ul className="space-y-2 bg-green-50 border border-green-100 p-4 rounded-xl">
                  {predictions.preventiveActions.map((action: string, index: number) => (
                    <li key={index} className="text-sm text-green-800 flex items-start space-x-2">
                      <span className="text-green-600 font-bold shrink-0 mt-0.5">✓</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Separator className="bg-purple-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Monitoring Recommendations */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-800">Monitoring Advice</h4>
                <div className="flex flex-wrap gap-2">
                  {predictions.monitoringRecommendations.map((rec: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors py-1 px-2.5">
                      {rec}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Location-Based Safety Tips */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-800 flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  <span>Location-Based Tips</span>
                </h4>
                <ul className="space-y-2">
                  {recommendations.map((tip: string, index: number) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start space-x-2 bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                      <span className="text-blue-500 font-bold shrink-0 mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Brain className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">AI insights are ready</p>
            <p className="text-xs text-gray-400 mt-1">Click refresh to analyze your database profile and history.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
