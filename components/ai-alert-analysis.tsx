"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Brain, AlertTriangle, Clock, Target, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { useAIAutomation } from "@/hooks/use-ai-automation"
import type { Alert } from "@/lib/database"

interface AIAlertAnalysisProps {
  alert: Alert
  onResponsePlanGenerated?: (plan: any) => void
}

export function AIAlertAnalysis({ alert, onResponsePlanGenerated }: AIAlertAnalysisProps) {
  const [analysis, setAnalysis] = useState<any>(null)
  const [responsePlan, setResponsePlan] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)
  const { isAnalyzing, analyzeAlert, generateResponsePlan } = useAIAutomation()

  useEffect(() => {
    const performAnalysis = async () => {
      try {
        const result = await analyzeAlert(alert)
        setAnalysis(result)

        // Auto-generate response plan for high-risk alerts
        if (result.riskLevel === "high" || result.riskLevel === "critical") {
          const plan = await generateResponsePlan(alert, result)
          setResponsePlan(plan)
          onResponsePlanGenerated?.(plan)
        }
      } catch (error) {
        console.error("Failed to analyze alert:", error)
      }
    }

    performAnalysis()
  }, [alert]) // Updated dependency to alert

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
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

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "immediate":
        return "bg-red-500 text-white"
      case "high":
        return "bg-orange-500 text-white"
      case "medium":
        return "bg-yellow-500 text-black"
      case "low":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  if (isAnalyzing && !analysis) {
    return (
      <Card className="border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <span className="text-sm text-gray-600">AI analyzing alert...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) return null

  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-500" />
            <span>AI Analysis</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Assessment */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Risk Level:</span>
          </div>
          <Badge className={getRiskColor(analysis.riskLevel)}>{analysis.riskLevel.toUpperCase()}</Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Urgency:</span>
          </div>
          <Badge className={getUrgencyColor(analysis.urgency)}>{analysis.urgency.toUpperCase()}</Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Confidence:</span>
          </div>
          <Badge variant="outline">{Math.round(analysis.confidence * 100)}%</Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Response Time:</span>
          <span className="text-sm text-gray-600">{analysis.estimatedResponseTime}</span>
        </div>

        {showDetails && (
          <>
            <Separator />

            {/* Threat Type */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Threat Classification</h4>
              <Badge variant="secondary">{analysis.threatType}</Badge>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="text-sm font-semibold mb-2">AI Recommendations</h4>
              <ul className="space-y-1">
                {analysis.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Response Plan */}
            {responsePlan && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-2">Automated Response Plan</h4>

                  <div className="space-y-3">
                    <div>
                      <h5 className="text-xs font-medium text-gray-700 mb-1">Immediate Actions:</h5>
                      <ul className="space-y-1">
                        {responsePlan.immediateActions.map((action: string, index: number) => (
                          <li key={index} className="text-xs text-gray-600 flex items-start space-x-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5 className="text-xs font-medium text-gray-700 mb-1">Resources Needed:</h5>
                      <div className="flex flex-wrap gap-1">
                        {responsePlan.resourcesNeeded.map((resource: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {resource}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-xs font-medium text-gray-700 mb-1">Contact Priority:</h5>
                      <div className="flex flex-wrap gap-1">
                        {responsePlan.contactPriority.map((contact: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {index + 1}. {contact}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs text-gray-600">
                      <strong>Estimated Resolution:</strong> {responsePlan.estimatedResolution}
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
