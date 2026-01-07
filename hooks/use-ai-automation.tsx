"use client"

import { useState } from "react"
import { aiAutomation } from "@/lib/ai-automation"
import type { Alert, User } from "@/lib/database"

interface AIAnalysis {
  riskLevel: "low" | "medium" | "high" | "critical"
  threatType: string
  confidence: number
  recommendations: string[]
  urgency: "low" | "medium" | "high" | "immediate"
  estimatedResponseTime: string
}

interface ResponsePlan {
  immediateActions: string[]
  resourcesNeeded: string[]
  contactPriority: string[]
  escalationPath: string[]
  estimatedResolution: string
}

interface SafetyPrediction {
  riskFactors: Array<{
    factor: string
    severity: "low" | "medium" | "high"
    likelihood: number
  }>
  overallRisk: "low" | "medium" | "high" | "critical"
  preventiveActions: string[]
  monitoringRecommendations: string[]
}

export function useAIAutomation() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisCache, setAnalysisCache] = useState<Map<string, AIAnalysis>>(new Map())
  const [responsePlanCache, setResponsePlanCache] = useState<Map<string, ResponsePlan>>(new Map())

  const analyzeAlert = async (alert: Alert): Promise<AIAnalysis> => {
    // Check cache first
    const cached = analysisCache.get(alert.id)
    if (cached) return cached

    setIsAnalyzing(true)
    try {
      const analysis = await aiAutomation.analyzeAlert(alert)

      // Cache the result
      setAnalysisCache((prev) => new Map(prev).set(alert.id, analysis))

      return analysis
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateResponsePlan = async (alert: Alert, analysis: AIAnalysis): Promise<ResponsePlan> => {
    // Check cache first
    const cacheKey = `${alert.id}-${analysis.riskLevel}`
    const cached = responsePlanCache.get(cacheKey)
    if (cached) return cached

    setIsAnalyzing(true)
    try {
      const plan = await aiAutomation.generateResponsePlan(alert, analysis)

      // Cache the result
      setResponsePlanCache((prev) => new Map(prev).set(cacheKey, plan))

      return plan
    } finally {
      setIsAnalyzing(false)
    }
  }

  const predictSafetyRisks = async (tourist: User, recentAlerts: Alert[]): Promise<SafetyPrediction> => {
    setIsAnalyzing(true)
    try {
      return await aiAutomation.predictSafetyRisks(tourist, recentAlerts)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateSafetyRecommendations = async (
    location: { lat: number; lng: number },
    alertHistory: Alert[],
  ): Promise<string[]> => {
    setIsAnalyzing(true)
    try {
      return await aiAutomation.generateSafetyRecommendations(location, alertHistory)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const prioritizeAlerts = async (alerts: Alert[]): Promise<Alert[]> => {
    setIsAnalyzing(true)
    try {
      return await aiAutomation.prioritizeAlerts(alerts)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateIncidentReport = async (alert: Alert, resolution: string): Promise<string> => {
    setIsAnalyzing(true)
    try {
      return await aiAutomation.generateIncidentReport(alert, resolution)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return {
    isAnalyzing,
    analyzeAlert,
    generateResponsePlan,
    predictSafetyRisks,
    generateSafetyRecommendations,
    prioritizeAlerts,
    generateIncidentReport,
  }
}
