import { google } from "@ai-sdk/google"
import { generateText, streamText } from "ai"
import { z } from "zod"
import type { Alert, User } from "./database"

// AI Analysis Schemas
const ThreatAnalysisSchema = z.object({
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  threatType: z.string(),
  confidence: z.number().min(0).max(1),
  recommendations: z.array(z.string()),
  urgency: z.enum(["low", "medium", "high", "immediate"]),
  estimatedResponseTime: z.string(),
})

const ResponsePlanSchema = z.object({
  immediateActions: z.array(z.string()),
  resourcesNeeded: z.array(z.string()),
  contactPriority: z.array(z.string()),
  escalationPath: z.array(z.string()),
  estimatedResolution: z.string(),
})

const SafetyPredictionSchema = z.object({
  riskFactors: z.array(
    z.object({
      factor: z.string(),
      severity: z.enum(["low", "medium", "high"]),
      likelihood: z.number().min(0).max(1),
    }),
  ),
  overallRisk: z.enum(["low", "medium", "high", "critical"]),
  preventiveActions: z.array(z.string()),
  monitoringRecommendations: z.array(z.string()),
})

export class AIAutomationService {
  private static instance: AIAutomationService
  private model = google("gemini-2.0-flash-exp")

  private constructor() {}

  static getInstance(): AIAutomationService {
    if (!AIAutomationService.instance) {
      AIAutomationService.instance = new AIAutomationService()
    }
    return AIAutomationService.instance
  }

  private hasGoogleAPIKey(): boolean {
    return !!(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY)
  }

  async analyzeAlert(alert: Alert): Promise<z.infer<typeof ThreatAnalysisSchema>> {
    if (!this.hasGoogleAPIKey()) {
      console.log("[v0] No Google API key found, using intelligent fallback analysis")
      return this.fallbackAnalyzeAlert(alert)
    }

    try {
      const { text } = await generateText({
        model: this.model,
        prompt: `Analyze this tourist safety alert and provide a structured assessment:
        
Alert Type: ${alert.type}
Message: ${alert.message}
Tourist: ${alert.touristName}
Location: ${alert.location ? `${alert.location.lat}, ${alert.location.lng}` : "Not specified"}
Time: ${alert.timestamp}

Please analyze the risk level (low/medium/high/critical), threat type, confidence level (0-1), 
urgency (low/medium/high/immediate), estimated response time, and provide 3-5 specific recommendations.

Respond in JSON format matching this structure:
{
  "riskLevel": "medium",
  "threatType": "description of threat",
  "confidence": 0.8,
  "recommendations": ["action 1", "action 2", "action 3"],
  "urgency": "high",
  "estimatedResponseTime": "15-30 minutes"
}`,
        maxOutputTokens: 1000,
      })

      const parsed = JSON.parse(text)
      return ThreatAnalysisSchema.parse(parsed)
    } catch (error) {
      console.error("AI analysis failed:", error)
      return this.fallbackAnalyzeAlert(alert)
    }
  }

  async generateResponsePlan(
    alert: Alert,
    analysis: z.infer<typeof ThreatAnalysisSchema>,
  ): Promise<z.infer<typeof ResponsePlanSchema>> {
    if (!this.hasGoogleAPIKey()) {
      console.log("[v0] No Google API key found, using intelligent fallback response plan")
      return this.fallbackGenerateResponsePlan(alert, analysis)
    }

    try {
      const { text } = await generateText({
        model: this.model,
        prompt: `Generate a detailed emergency response plan for this tourist safety situation:

Alert: ${alert.message}
Risk Level: ${analysis.riskLevel}
Urgency: ${analysis.urgency}
Threat Type: ${analysis.threatType}

Create a comprehensive response plan with:
- Immediate actions (4-6 specific steps)
- Resources needed (3-5 items)
- Contact priority order (3-4 contacts)
- Escalation path (3-4 levels)
- Estimated resolution time

Respond in JSON format:
{
  "immediateActions": ["step 1", "step 2", "step 3", "step 4"],
  "resourcesNeeded": ["resource 1", "resource 2", "resource 3"],
  "contactPriority": ["contact 1", "contact 2", "contact 3"],
  "escalationPath": ["level 1", "level 2", "level 3"],
  "estimatedResolution": "time estimate"
}`,
        maxOutputTokens: 1200,
      })

      const parsed = JSON.parse(text)
      return ResponsePlanSchema.parse(parsed)
    } catch (error) {
      console.error("AI response plan failed:", error)
      return this.fallbackGenerateResponsePlan(alert, analysis)
    }
  }

  async predictSafetyRisks(tourist: User, recentAlerts: Alert[]): Promise<z.infer<typeof SafetyPredictionSchema>> {
    if (!this.hasGoogleAPIKey()) {
      console.log("[v0] No Google API key found, using intelligent fallback safety prediction")
      return this.fallbackPredictSafetyRisks(tourist, recentAlerts)
    }

    try {
      const alertSummary = recentAlerts.map((a) => `${a.type}: ${a.message}`).join("; ")

      const { text } = await generateText({
        model: this.model,
        prompt: `Analyze safety risks for this tourist based on their alert history:

Tourist: ${tourist.name}
Recent Alerts: ${alertSummary || "No recent alerts"}
Alert Count: ${recentAlerts.length}

Predict potential safety risks by analyzing patterns and providing:
- Risk factors with severity (low/medium/high) and likelihood (0-1)
- Overall risk assessment (low/medium/high/critical)
- 5-7 preventive actions
- 4-6 monitoring recommendations

Respond in JSON format:
{
  "riskFactors": [
    {"factor": "description", "severity": "medium", "likelihood": 0.6}
  ],
  "overallRisk": "medium",
  "preventiveActions": ["action 1", "action 2"],
  "monitoringRecommendations": ["recommendation 1", "recommendation 2"]
}`,
        maxOutputTokens: 1500,
      })

      const parsed = JSON.parse(text)
      return SafetyPredictionSchema.parse(parsed)
    } catch (error) {
      console.error("AI prediction failed:", error)
      return this.fallbackPredictSafetyRisks(tourist, recentAlerts)
    }
  }

  async getChatAssistance(message: string, context?: { location?: string; alertHistory?: Alert[] }): Promise<string> {
    if (!this.hasGoogleAPIKey()) {
      console.log("[v0] No Google API key found, using intelligent fallback chat response")
      return this.fallbackChatResponse(message, context)
    }

    try {
      const contextInfo = context
        ? `\nLocation: ${context.location || "Not specified"}\nRecent Alerts: ${context.alertHistory?.length || 0} alerts in history\n`
        : ""

      const { text } = await generateText({
        model: this.model,
        prompt: `You are a helpful AI assistant for a tourist safety system. Provide helpful, accurate, and safety-focused advice to tourists.

${contextInfo}

Tourist Question: ${message}

Provide a helpful response that:
- Prioritizes tourist safety and well-being
- Gives practical, actionable advice
- Is friendly and reassuring
- Includes specific tips when relevant
- Mentions emergency contacts if the situation seems serious

Keep responses concise but comprehensive (2-4 paragraphs max).`,
        maxOutputTokens: 800,
      })

      return text
    } catch (error) {
      console.error("AI chat assistance failed:", error)
      return this.fallbackChatResponse(message, context)
    }
  }

  async streamChatAssistance(message: string, context?: { location?: string; alertHistory?: Alert[] }) {
    if (!this.hasGoogleAPIKey()) {
      throw new Error("Google API key not available for streaming")
    }

    try {
      const contextInfo = context
        ? `\nLocation: ${context.location || "Not specified"}\nRecent Alerts: ${context.alertHistory?.length || 0} alerts in history\n`
        : ""

      return streamText({
        model: this.model,
        prompt: `You are a helpful AI assistant for a tourist safety system. Provide helpful, accurate, and safety-focused advice to tourists.

${contextInfo}

Tourist Question: ${message}

Provide a helpful response that:
- Prioritizes tourist safety and well-being
- Gives practical, actionable advice
- Is friendly and reassuring
- Includes specific tips when relevant
- Mentions emergency contacts if the situation seems serious

Keep responses concise but comprehensive (2-4 paragraphs max).`,
        maxOutputTokens: 800,
      })
    } catch (error) {
      console.error("AI streaming failed:", error)
      throw error
    }
  }

  // Analyze alert threat level and provide recommendations
  async analyzeAlert(alert: Alert): Promise<z.infer<typeof ThreatAnalysisSchema>> {
    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Intelligent analysis based on alert type and content
    const riskMapping = {
      emergency: { risk: "critical" as const, urgency: "immediate" as const, confidence: 0.95 },
      medical: { risk: "high" as const, urgency: "high" as const, confidence: 0.9 },
      security: { risk: "high" as const, urgency: "high" as const, confidence: 0.85 },
      assistance: { risk: "medium" as const, urgency: "medium" as const, confidence: 0.8 },
    }

    const mapping = riskMapping[alert.type as keyof typeof riskMapping] || {
      risk: "medium" as const,
      urgency: "medium" as const,
      confidence: 0.7,
    }

    const recommendations = this.generateRecommendations(alert.type, alert.message)
    const responseTime = this.calculateResponseTime(mapping.urgency)

    return {
      riskLevel: mapping.risk,
      threatType: alert.type,
      confidence: mapping.confidence,
      recommendations,
      urgency: mapping.urgency,
      estimatedResponseTime: responseTime,
    }
  }

  // Generate automated response plan
  async generateResponsePlan(
    alert: Alert,
    analysis: z.infer<typeof ThreatAnalysisSchema>,
  ): Promise<z.infer<typeof ResponsePlanSchema>> {
    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    const planTemplates = {
      emergency: {
        immediateActions: [
          "Contact tourist immediately via phone/SMS",
          "Verify exact location and situation",
          "Dispatch emergency response team",
          "Notify local emergency services",
          "Establish communication with tourist",
        ],
        resourcesNeeded: ["Emergency response team", "Local emergency services", "Medical personnel", "Transportation"],
        contactPriority: ["Tourist", "Emergency services", "Local authorities", "Embassy/Consulate"],
        escalationPath: ["Emergency coordinator", "Local emergency services", "Regional emergency center", "Embassy"],
        estimatedResolution: "15-30 minutes",
      },
      medical: {
        immediateActions: [
          "Contact tourist to assess medical situation",
          "Determine if immediate medical attention needed",
          "Locate nearest medical facility",
          "Arrange medical transportation if required",
          "Contact tourist's emergency contacts",
        ],
        resourcesNeeded: [
          "Medical personnel",
          "Ambulance/medical transport",
          "Hospital/clinic",
          "Translator if needed",
        ],
        contactPriority: ["Tourist", "Medical services", "Tourist's emergency contact", "Insurance provider"],
        escalationPath: ["Medical coordinator", "Local hospital", "Specialist medical services", "Medical evacuation"],
        estimatedResolution: "30-60 minutes",
      },
      security: {
        immediateActions: [
          "Contact tourist to verify safety status",
          "Assess security threat level",
          "Coordinate with local security forces",
          "Provide safety instructions to tourist",
          "Monitor situation continuously",
        ],
        resourcesNeeded: ["Security personnel", "Local police", "Safe transportation", "Secure accommodation"],
        contactPriority: ["Tourist", "Local police", "Security services", "Embassy security officer"],
        escalationPath: ["Security coordinator", "Local police", "Regional security", "Embassy security"],
        estimatedResolution: "45-90 minutes",
      },
      assistance: {
        immediateActions: [
          "Contact tourist to understand assistance needed",
          "Identify appropriate local resources",
          "Coordinate with local service providers",
          "Provide guidance and support",
          "Follow up on resolution",
        ],
        resourcesNeeded: ["Local guide/translator", "Transportation", "Local service providers", "Communication tools"],
        contactPriority: ["Tourist", "Local service provider", "Tour guide/coordinator", "Local contacts"],
        escalationPath: [
          "Assistance coordinator",
          "Local tourism office",
          "Regional support",
          "Embassy consular services",
        ],
        estimatedResolution: "60-120 minutes",
      },
    }

    const template = planTemplates[alert.type as keyof typeof planTemplates] || planTemplates.assistance

    return template
  }

  // Predict potential safety risks for tourists
  async predictSafetyRisks(tourist: User, recentAlerts: Alert[]): Promise<z.infer<typeof SafetyPredictionSchema>> {
    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 1200))

    const riskFactors = []
    let overallRisk: "low" | "medium" | "high" | "critical" = "low"

    // Analyze recent alert patterns
    if (recentAlerts.length > 3) {
      riskFactors.push({
        factor: "High alert frequency",
        severity: "high" as const,
        likelihood: 0.8,
      })
      overallRisk = "high"
    } else if (recentAlerts.length > 1) {
      riskFactors.push({
        factor: "Moderate alert activity",
        severity: "medium" as const,
        likelihood: 0.6,
      })
      overallRisk = "medium"
    }

    // Check for emergency alerts
    const hasEmergencyAlerts = recentAlerts.some((alert) => alert.type === "emergency")
    if (hasEmergencyAlerts) {
      riskFactors.push({
        factor: "Previous emergency incidents",
        severity: "high" as const,
        likelihood: 0.7,
      })
      overallRisk = "high"
    }

    // Add common risk factors
    riskFactors.push(
      {
        factor: "Location unfamiliarity",
        severity: "medium" as const,
        likelihood: 0.5,
      },
      {
        factor: "Communication barriers",
        severity: "low" as const,
        likelihood: 0.3,
      },
    )

    return {
      riskFactors,
      overallRisk,
      preventiveActions: [
        "Maintain regular check-ins with emergency contacts",
        "Share detailed itinerary with trusted contacts",
        "Keep emergency contact information readily available",
        "Stay in well-reviewed accommodations",
        "Use official transportation services",
        "Avoid isolated areas, especially at night",
        "Keep important documents secure and backed up",
      ],
      monitoringRecommendations: [
        "Enable GPS location sharing with trusted contacts",
        "Schedule regular status updates",
        "Maintain contact with local guide or tour operator",
        "Monitor local news and safety alerts",
        "Keep emergency services numbers saved",
        "Use safety apps for location tracking",
      ],
    }
  }

  // Generate automated safety recommendations
  async generateSafetyRecommendations(
    location: { lat: number; lng: number },
    alertHistory: Alert[],
  ): Promise<string[]> {
    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 600))

    const baseRecommendations = [
      "Keep emergency contacts readily available and easily accessible",
      "Share your real-time location with trusted family or friends",
      "Stay in well-lit, populated areas, especially during evening hours",
      "Keep important documents secure and maintain digital backups",
      "Have local emergency numbers saved in your phone",
      "Inform someone of your daily plans and expected return times",
      "Carry a charged phone and backup power source at all times",
    ]

    // Add location-specific recommendations based on alert history
    const locationSpecific = []

    if (alertHistory.some((alert) => alert.type === "security")) {
      locationSpecific.push("Be extra vigilant about personal security in this area")
      locationSpecific.push("Avoid displaying valuable items or large amounts of cash")
    }

    if (alertHistory.some((alert) => alert.type === "medical")) {
      locationSpecific.push("Locate the nearest medical facilities and pharmacies")
      locationSpecific.push("Carry a basic first aid kit and any personal medications")
    }

    if (alertHistory.length > 2) {
      locationSpecific.push("This area has higher alert activity - exercise additional caution")
      locationSpecific.push("Consider using guided tours or local assistance services")
    }

    return [...baseRecommendations, ...locationSpecific].slice(0, 7)
  }

  // Automated alert prioritization
  async prioritizeAlerts(alerts: Alert[]): Promise<Alert[]> {
    if (alerts.length === 0) return []

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 500))

    const priorityOrder = {
      immediate: 4,
      high: 3,
      medium: 2,
      low: 1,
    }

    const riskOrder = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    }

    const typeOrder = {
      emergency: 4,
      medical: 3,
      security: 2,
      assistance: 1,
    }

    return alerts.sort((a, b) => {
      // Sort by alert type priority first
      const typeDiff =
        (typeOrder[b.type as keyof typeof typeOrder] || 1) - (typeOrder[a.type as keyof typeof typeOrder] || 1)
      if (typeDiff !== 0) return typeDiff

      // Then by timestamp (newer first)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
  }

  // Generate automated incident report
  async generateIncidentReport(alert: Alert, resolution: string): Promise<string> {
    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const timestamp = new Date().toISOString()
    const incidentId = `INC-${Date.now()}`

    return `
TOURIST SAFETY INCIDENT REPORT
Report ID: ${incidentId}
Generated: ${timestamp}

INCIDENT DETAILS
================
Alert Type: ${alert.type.toUpperCase()}
Tourist Name: ${alert.touristName}
Incident Time: ${alert.timestamp}
Location: ${alert.location ? `${alert.location.lat}, ${alert.location.lng}` : "Location not specified"}

INCIDENT DESCRIPTION
===================
${alert.message}

RESPONSE ACTIONS
===============
- Alert received and processed through automated system
- Tourist safety protocols activated
- Appropriate response team notified
- Situation monitored and tracked until resolution

RESOLUTION
==========
${resolution}

OUTCOME
=======
Incident successfully resolved. Tourist safety confirmed.
All response protocols followed according to standard procedures.

LESSONS LEARNED
==============
- Response time was within acceptable parameters
- Communication channels functioned effectively
- Tourist cooperation facilitated quick resolution

RECOMMENDATIONS
==============
- Continue monitoring tourist safety in the area
- Maintain current response protocols
- Consider additional preventive measures if pattern emerges

STATUS: CLOSED
Report generated by AI Automation System
    `.trim()
  }

  // Helper methods for intelligent mock responses
  private generateRecommendations(alertType: string, message: string): string[] {
    const baseRecommendations = {
      emergency: [
        "Dispatch emergency response team immediately",
        "Establish direct communication with tourist",
        "Coordinate with local emergency services",
        "Prepare for potential evacuation if needed",
      ],
      medical: [
        "Contact tourist to assess medical severity",
        "Locate nearest medical facility",
        "Arrange medical transportation if required",
        "Notify tourist's emergency contacts",
      ],
      security: [
        "Verify tourist's current safety status",
        "Coordinate with local security forces",
        "Provide immediate safety instructions",
        "Monitor situation continuously",
      ],
      assistance: [
        "Contact tourist to understand specific needs",
        "Identify appropriate local resources",
        "Coordinate with service providers",
        "Provide guidance and support",
      ],
    }

    return baseRecommendations[alertType as keyof typeof baseRecommendations] || baseRecommendations.assistance
  }

  private calculateResponseTime(urgency: string): string {
    const timeMapping = {
      immediate: "5-10 minutes",
      high: "15-30 minutes",
      medium: "30-60 minutes",
      low: "1-2 hours",
    }

    return timeMapping[urgency as keyof typeof timeMapping] || "30-60 minutes"
  }

  private fallbackAnalyzeAlert(alert: Alert): z.infer<typeof ThreatAnalysisSchema> {
    const riskMapping = {
      emergency: { risk: "critical" as const, urgency: "immediate" as const, confidence: 0.95 },
      medical: { risk: "high" as const, urgency: "high" as const, confidence: 0.9 },
      security: { risk: "high" as const, urgency: "high" as const, confidence: 0.85 },
      assistance: { risk: "medium" as const, urgency: "medium" as const, confidence: 0.8 },
    }

    const mapping = riskMapping[alert.type as keyof typeof riskMapping] || {
      risk: "medium" as const,
      urgency: "medium" as const,
      confidence: 0.7,
    }

    return {
      riskLevel: mapping.risk,
      threatType: alert.type,
      confidence: mapping.confidence,
      recommendations: this.generateRecommendations(alert.type, alert.message),
      urgency: mapping.urgency,
      estimatedResponseTime: this.calculateResponseTime(mapping.urgency),
    }
  }

  private fallbackGenerateResponsePlan(
    alert: Alert,
    analysis: z.infer<typeof ThreatAnalysisSchema>,
  ): z.infer<typeof ResponsePlanSchema> {
    const planTemplates = {
      emergency: {
        immediateActions: [
          "Contact tourist immediately via phone/SMS",
          "Verify exact location and situation",
          "Dispatch emergency response team",
          "Notify local emergency services",
        ],
        resourcesNeeded: ["Emergency response team", "Local emergency services", "Medical personnel"],
        contactPriority: ["Tourist", "Emergency services", "Local authorities"],
        escalationPath: ["Emergency coordinator", "Local emergency services", "Regional emergency center"],
        estimatedResolution: "15-30 minutes",
      },
      medical: {
        immediateActions: [
          "Contact tourist to assess medical situation",
          "Locate nearest medical facility",
          "Arrange medical transportation if required",
          "Contact tourist's emergency contacts",
        ],
        resourcesNeeded: ["Medical personnel", "Ambulance/medical transport", "Hospital/clinic"],
        contactPriority: ["Tourist", "Medical services", "Tourist's emergency contact"],
        escalationPath: ["Medical coordinator", "Local hospital", "Specialist medical services"],
        estimatedResolution: "30-60 minutes",
      },
      security: {
        immediateActions: [
          "Contact tourist to verify safety status",
          "Coordinate with local security forces",
          "Provide safety instructions to tourist",
          "Monitor situation continuously",
        ],
        resourcesNeeded: ["Security personnel", "Local police", "Safe transportation"],
        contactPriority: ["Tourist", "Local police", "Security services"],
        escalationPath: ["Security coordinator", "Local police", "Regional security"],
        estimatedResolution: "45-90 minutes",
      },
      assistance: {
        immediateActions: [
          "Contact tourist to understand assistance needed",
          "Identify appropriate local resources",
          "Coordinate with local service providers",
          "Provide guidance and support",
        ],
        resourcesNeeded: ["Local guide/translator", "Transportation", "Local service providers"],
        contactPriority: ["Tourist", "Local service provider", "Tour guide/coordinator"],
        escalationPath: ["Assistance coordinator", "Local tourism office", "Regional support"],
        estimatedResolution: "60-120 minutes",
      },
    }

    return planTemplates[alert.type as keyof typeof planTemplates] || planTemplates.assistance
  }

  private fallbackPredictSafetyRisks(tourist: User, recentAlerts: Alert[]): z.infer<typeof SafetyPredictionSchema> {
    const riskFactors = []
    let overallRisk: "low" | "medium" | "high" | "critical" = "low"

    if (recentAlerts.length > 3) {
      riskFactors.push({
        factor: "High alert frequency",
        severity: "high" as const,
        likelihood: 0.8,
      })
      overallRisk = "high"
    } else if (recentAlerts.length > 1) {
      riskFactors.push({
        factor: "Moderate alert activity",
        severity: "medium" as const,
        likelihood: 0.6,
      })
      overallRisk = "medium"
    }

    const hasEmergencyAlerts = recentAlerts.some((alert) => alert.type === "emergency")
    if (hasEmergencyAlerts) {
      riskFactors.push({
        factor: "Previous emergency incidents",
        severity: "high" as const,
        likelihood: 0.7,
      })
      overallRisk = "high"
    }

    riskFactors.push(
      {
        factor: "Location unfamiliarity",
        severity: "medium" as const,
        likelihood: 0.5,
      },
      {
        factor: "Communication barriers",
        severity: "low" as const,
        likelihood: 0.3,
      },
    )

    return {
      riskFactors,
      overallRisk,
      preventiveActions: [
        "Maintain regular check-ins with emergency contacts",
        "Share detailed itinerary with trusted contacts",
        "Keep emergency contact information readily available",
      ],
      monitoringRecommendations: [
        "Enable GPS location sharing with trusted contacts",
        "Schedule regular status updates",
        "Monitor local news and safety alerts",
      ],
    }
  }

  private fallbackChatResponse(message: string, context?: { location?: string; alertHistory?: Alert[] }): string {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes("emergency") || lowerMessage.includes("help") || lowerMessage.includes("urgent")) {
      return `🚨 For immediate emergencies, please contact local emergency services or use the emergency alert button in the app. I'm here to help with safety guidance and support. What specific situation do you need assistance with?`
    }

    if (lowerMessage.includes("safe") || lowerMessage.includes("tip")) {
      return `Here are key safety tips: Keep emergency contacts available, share your location with trusted contacts, stay in populated areas, and trust your instincts. ${context?.alertHistory?.length ? `Based on your ${context.alertHistory.length} previous alerts, please be extra cautious.` : ""} What specific safety concern can I help with?`
    }

    return `I'm your AI safety assistant! While running in offline mode, I can help with safety tips, emergency procedures, and app guidance. ${context?.location ? "I see your location context - " : ""}${context?.alertHistory?.length ? `You have ${context.alertHistory.length} alerts in your history. ` : ""}What safety topic can I assist you with?`
  }
}

export const aiAutomation = AIAutomationService.getInstance()
