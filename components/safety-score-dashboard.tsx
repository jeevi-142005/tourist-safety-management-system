"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Shield, AlertTriangle, TrendingUp, TrendingDown, MapPin, Clock, Brain, RefreshCw, Loader2 } from "lucide-react"

interface SafetyScore {
  overall_score: number
  route_safety: number
  risk_exposure: number
  alert_frequency: number
  behavior_pattern: number
  risk_level: "low" | "medium" | "high" | "critical"
  recommendations: string[]
  last_updated: string
}

interface SafetyFactor {
  name: string
  score: number
  weight: number
  description: string
  trend: "up" | "down" | "stable"
}

export function SafetyScoreDashboard() {
  const [safetyScore, setSafetyScore] = useState<SafetyScore | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSafetyScore()
    // Set up periodic refresh every 5 minutes
    const interval = setInterval(fetchSafetyScore, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchSafetyScore = async () => {
    try {
      setError(null)
      const response = await fetch("/api/ai/safety-score")

      if (!response.ok) {
        throw new Error("Failed to fetch safety score")
      }

      const data = await response.json()
      setSafetyScore(data.safetyScore)
    } catch (err) {
      console.error("Error fetching safety score:", err)
      setError(err instanceof Error ? err.message : "Failed to load safety score")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchSafetyScore()
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "text-green-600 bg-green-100 border-green-200"
      case "medium":
        return "text-yellow-600 bg-yellow-100 border-yellow-200"
      case "high":
        return "text-orange-600 bg-orange-100 border-orange-200"
      case "critical":
        return "text-red-600 bg-red-100 border-red-200"
      default:
        return "text-gray-600 bg-gray-100 border-gray-200"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    if (score >= 40) return "text-orange-600"
    return "text-red-600"
  }

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    if (score >= 40) return "bg-orange-500"
    return "bg-red-500"
  }

  const safetyFactors: SafetyFactor[] = safetyScore
    ? [
        {
          name: "Route Safety",
          score: safetyScore.route_safety,
          weight: 0.3,
          description: "Safety assessment of your current route and destination",
          trend: "stable",
        },
        {
          name: "Risk Exposure",
          score: safetyScore.risk_exposure,
          weight: 0.25,
          description: "Exposure to known risk factors in your area",
          trend: "down",
        },
        {
          name: "Alert Frequency",
          score: safetyScore.alert_frequency,
          weight: 0.25,
          description: "Frequency of safety alerts in your vicinity",
          trend: "up",
        },
        {
          name: "Behavior Pattern",
          score: safetyScore.behavior_pattern,
          weight: 0.2,
          description: "Analysis of your movement and behavior patterns",
          trend: "stable",
        },
      ]
    : []

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Analyzing safety data...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
          <Button onClick={handleRefresh} className="mt-4 bg-transparent" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!safetyScore) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-600">No safety data available</p>
          <Button onClick={handleRefresh} className="mt-4 bg-transparent" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Load Safety Score
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Safety Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>AI Safety Score Analysis</span>
              </CardTitle>
              <CardDescription>Advanced AI-powered safety assessment for your current situation</CardDescription>
            </div>
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Main Score Display */}
            <div className="text-center space-y-4">
              <div className="relative">
                <div className={`text-6xl font-bold ${getScoreColor(safetyScore.overall_score)}`}>
                  {Math.round(safetyScore.overall_score)}
                </div>
                <div className="text-sm text-gray-500 mt-1">out of 100</div>
              </div>

              <div className="flex items-center justify-center space-x-2">
                <Badge className={`${getRiskColor(safetyScore.risk_level)} border`}>
                  {safetyScore.risk_level.toUpperCase()} RISK
                </Badge>
                {safetyScore.risk_level === "low" && <Shield className="h-4 w-4 text-green-600" />}
                {safetyScore.risk_level !== "low" && <AlertTriangle className="h-4 w-4 text-orange-600" />}
              </div>

              <Progress
                value={safetyScore.overall_score}
                className="w-full h-3"
                style={{
                  background: `linear-gradient(to right, ${getProgressColor(safetyScore.overall_score)} 0%, ${getProgressColor(safetyScore.overall_score)} ${safetyScore.overall_score}%, #e5e7eb ${safetyScore.overall_score}%)`,
                }}
              />
            </div>

            {/* Last Updated */}
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Last updated: {new Date(safetyScore.last_updated).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety Factors Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Safety Factors Analysis</CardTitle>
          <CardDescription>Detailed breakdown of factors affecting your safety score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {safetyFactors.map((factor, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{factor.name}</span>
                    <Badge variant="outline" className="text-xs">
                      Weight: {Math.round(factor.weight * 100)}%
                    </Badge>
                    {factor.trend === "up" && <TrendingUp className="h-4 w-4 text-green-600" />}
                    {factor.trend === "down" && <TrendingDown className="h-4 w-4 text-red-600" />}
                  </div>
                  <span className={`font-bold ${getScoreColor(factor.score)}`}>{Math.round(factor.score)}</span>
                </div>
                <Progress value={factor.score} className="h-2" />
                <p className="text-sm text-gray-600">{factor.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      {safetyScore.recommendations && safetyScore.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Safety Recommendations</span>
            </CardTitle>
            <CardDescription>AI-generated suggestions to improve your safety</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {safetyScore.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <p className="text-sm text-blue-800">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Level Alert */}
      {safetyScore.risk_level === "high" ||
        (safetyScore.risk_level === "critical" && (
          <Alert className={`border-2 ${getRiskColor(safetyScore.risk_level)}`}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {safetyScore.risk_level === "critical"
                ? "CRITICAL RISK DETECTED: Consider immediate safety measures and contact authorities if needed."
                : "HIGH RISK DETECTED: Exercise extra caution and follow safety recommendations."}
            </AlertDescription>
          </Alert>
        ))}
    </div>
  )
}
