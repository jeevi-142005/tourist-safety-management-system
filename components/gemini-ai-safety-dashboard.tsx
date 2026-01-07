"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Brain, Shield, AlertTriangle, TrendingUp, Activity, MapPin, Zap, Eye, RefreshCw, Loader2 } from "lucide-react"
import { AISafetyAssistant } from "./ai-safety-assistant"
import { AISafetyAdvisor } from "./ai-safety-advisor"
import { AIAnomalyDetector } from "./ai-anomaly-detector"
import { SafetyScoreDashboard } from "./safety-score-dashboard"
import { useAuth } from "@/hooks/use-auth"

interface GeminiAnalysis {
  overallThreatLevel: "safe" | "low" | "medium" | "high" | "critical"
  safetyScore: number
  riskFactors: Array<{
    category: string
    severity: "low" | "medium" | "high" | "critical"
    confidence: number
    description: string
    recommendations: string[]
  }>
  predictiveInsights: Array<{
    type: "behavioral" | "environmental" | "temporal" | "location"
    prediction: string
    likelihood: number
    timeframe: string
    preventiveActions: string[]
  }>
  emergencyProtocols: Array<{
    trigger: string
    severity: "low" | "medium" | "high" | "critical"
    actions: string[]
    contacts: string[]
  }>
  aiConfidence: number
  lastAnalysis: string
  systemStatus: "active" | "standby" | "maintenance" | "error"
}

export function GeminiAISafetyDashboard() {
  const { user } = useAuth()
  const [geminiAnalysis, setGeminiAnalysis] = useState<GeminiAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [systemMetrics, setSystemMetrics] = useState({
    totalAnalyses: 0,
    threatsDetected: 0,
    avgResponseTime: 0,
    systemUptime: "00:00:00",
  })

  useEffect(() => {
    if (user?.role === "tourist") {
      fetchGeminiAnalysis()
      const interval = setInterval(fetchGeminiAnalysis, 60000) // Refresh every minute
      return () => clearInterval(interval)
    }
  }, [user])

  const fetchGeminiAnalysis = async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch("/api/ai/gemini-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comprehensive: true }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch Gemini analysis")
      }

      const data = await response.json()
      setGeminiAnalysis(data.analysis)
      setSystemMetrics(data.metrics)
    } catch (error) {
      console.error("Error fetching Gemini analysis:", error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "safe":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    if (score >= 40) return "text-orange-600"
    return "text-red-600"
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "behavioral":
        return <Activity className="h-4 w-4" />
      case "environmental":
        return <Eye className="h-4 w-4" />
      case "temporal":
        return <TrendingUp className="h-4 w-4" />
      case "location":
        return <MapPin className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  if (user?.role !== "tourist") {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">AI Safety Dashboard is available for tourists only</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto" />
            <p className="text-gray-600">Initializing Gemini AI Safety System...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Brain className="h-8 w-8 text-purple-600" />
                {geminiAnalysis?.systemStatus === "active" && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <div>
                <CardTitle className="text-2xl text-balance">Gemini AI Safety Command Center</CardTitle>
                <CardDescription>
                  Advanced AI-powered comprehensive safety analysis and threat detection
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-700">System Status</div>
                <Badge className={getThreatLevelColor(geminiAnalysis?.systemStatus || "standby")}>
                  {geminiAnalysis?.systemStatus?.toUpperCase() || "STANDBY"}
                </Badge>
              </div>
              <Button onClick={fetchGeminiAnalysis} disabled={isRefreshing} variant="outline" size="sm">
                {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {geminiAnalysis && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white/70 backdrop-blur-sm rounded-lg border">
                <div className={`text-3xl font-bold mb-1 ${getScoreColor(geminiAnalysis.safetyScore)}`}>
                  {Math.round(geminiAnalysis.safetyScore)}
                </div>
                <div className="text-sm text-gray-600">Safety Score</div>
                <Progress value={geminiAnalysis.safetyScore} className="h-2 mt-2" />
              </div>
              <div className="text-center p-4 bg-white/70 backdrop-blur-sm rounded-lg border">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {Math.round(geminiAnalysis.aiConfidence * 100)}%
                </div>
                <div className="text-sm text-gray-600">AI Confidence</div>
                <div className="text-xs text-purple-500 mt-1">Gemini Pro</div>
              </div>
              <div className="text-center p-4 bg-white/70 backdrop-blur-sm rounded-lg border">
                <div className="text-3xl font-bold text-blue-600 mb-1">{geminiAnalysis.riskFactors.length}</div>
                <div className="text-sm text-gray-600">Risk Factors</div>
                <div className="text-xs text-blue-500 mt-1">Active monitoring</div>
              </div>
              <div className="text-center p-4 bg-white/70 backdrop-blur-sm rounded-lg border">
                <Badge
                  className={`${getThreatLevelColor(geminiAnalysis.overallThreatLevel)} text-lg px-4 py-2 font-bold`}
                >
                  {geminiAnalysis.overallThreatLevel.toUpperCase()}
                </Badge>
                <div className="text-sm text-gray-600 mt-1">Threat Level</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {geminiAnalysis &&
        (geminiAnalysis.overallThreatLevel === "critical" || geminiAnalysis.overallThreatLevel === "high") && (
          <Alert className={`border-2 ${getThreatLevelColor(geminiAnalysis.overallThreatLevel)}`}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              <strong>GEMINI AI ALERT:</strong>{" "}
              {geminiAnalysis.overallThreatLevel === "critical"
                ? "Critical threat detected. Immediate action recommended."
                : "High risk situation identified. Exercise extreme caution."}
            </AlertDescription>
          </Alert>
        )}

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
          <TabsTrigger value="anomalies">Anomaly Detection</TabsTrigger>
          <TabsTrigger value="advisor">Safety Advisor</TabsTrigger>
          <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <SafetyScoreDashboard />

          {geminiAnalysis && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Risk Factors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <span>Active Risk Factors</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {geminiAnalysis.riskFactors.map((factor, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${getThreatLevelColor(factor.severity)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(factor.category)}
                          <span className="font-medium">{factor.category}</span>
                        </div>
                        <Badge className={getThreatLevelColor(factor.severity)}>{factor.severity.toUpperCase()}</Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{factor.description}</p>
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-xs text-gray-500">Confidence:</span>
                        <Progress value={factor.confidence * 100} className="h-2 flex-1" />
                        <span className="text-xs font-medium">{Math.round(factor.confidence * 100)}%</span>
                      </div>
                      <div className="space-y-1">
                        {factor.recommendations.map((rec, recIndex) => (
                          <div key={recIndex} className="text-xs text-gray-600 flex items-start space-x-1">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Predictive Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    <span>Predictive Insights</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {geminiAnalysis.predictiveInsights.map((insight, index) => (
                    <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        {getCategoryIcon(insight.type)}
                        <span className="font-medium capitalize">{insight.type}</span>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(insight.likelihood * 100)}% likelihood
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{insight.prediction}</p>
                      <p className="text-xs text-gray-500 mb-3">Timeframe: {insight.timeframe}</p>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-700">Preventive Actions:</p>
                        {insight.preventiveActions.map((action, actionIndex) => (
                          <div key={actionIndex} className="text-xs text-gray-600 flex items-start space-x-1">
                            <span className="text-green-500 mt-0.5">✓</span>
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {geminiAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  <span>Comprehensive Gemini AI Analysis</span>
                </CardTitle>
                <CardDescription>
                  Last updated: {new Date(geminiAnalysis.lastAnalysis).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Emergency Protocols */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-red-500" />
                    <span>Emergency Response Protocols</span>
                  </h3>
                  <div className="space-y-4">
                    {geminiAnalysis.emergencyProtocols.map((protocol, index) => (
                      <div key={index} className={`p-4 rounded-lg border ${getThreatLevelColor(protocol.severity)}`}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{protocol.trigger}</h4>
                          <Badge className={getThreatLevelColor(protocol.severity)}>
                            {protocol.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Actions:</p>
                            <ul className="space-y-1">
                              {protocol.actions.map((action, actionIndex) => (
                                <li key={actionIndex} className="text-sm text-gray-600 flex items-start space-x-1">
                                  <span className="text-red-500 mt-0.5">•</span>
                                  <span>{action}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Emergency Contacts:</p>
                            <ul className="space-y-1">
                              {protocol.contacts.map((contact, contactIndex) => (
                                <li key={contactIndex} className="text-sm text-gray-600 flex items-start space-x-1">
                                  <span className="text-blue-500 mt-0.5">📞</span>
                                  <span>{contact}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Metrics */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">System Performance Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-700">{systemMetrics.totalAnalyses}</div>
                      <div className="text-sm text-gray-600">Total Analyses</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{systemMetrics.threatsDetected}</div>
                      <div className="text-sm text-gray-600">Threats Detected</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{systemMetrics.avgResponseTime}ms</div>
                      <div className="text-sm text-gray-600">Avg Response</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{systemMetrics.systemUptime}</div>
                      <div className="text-sm text-gray-600">System Uptime</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="anomalies">
          <AIAnomalyDetector />
        </TabsContent>

        <TabsContent value="advisor">
          <AISafetyAdvisor />
        </TabsContent>

        <TabsContent value="assistant">
          <AISafetyAssistant />
        </TabsContent>
      </Tabs>
    </div>
  )
}
