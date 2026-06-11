"use server"

import { db } from "@/lib/db"
import { analyzeDeviceMetricsForAnomalies } from "@/lib/gemini"

function mapAnomalyToFrontend(dbAnomaly: any) {
  return {
    id: dbAnomaly.id,
    type: dbAnomaly.type,
    severity: dbAnomaly.severity,
    confidence: dbAnomaly.confidence,
    description: dbAnomaly.description,
    detected_at: dbAnomaly.createdAt.toISOString(),
    resolved: dbAnomaly.resolved,
    risk_factors: dbAnomaly.riskFactors || [],
    recommendations: dbAnomaly.recommendations || []
  }
}

export async function analyzeAndStoreAnomalies(metrics: any, location: any, userId: string) {
  if (!userId) {
    throw new Error("User ID is required")
  }

  // Get anomalies from Gemini
  const anomalies = await analyzeDeviceMetricsForAnomalies(metrics, location)
  
  if (!anomalies || anomalies.length === 0) {
    return []
  }

  // Store in database
  const createdAnomalies = await Promise.all(
    anomalies.map(async (anomaly: any) => {
      return await db.anomalyPattern.create({
        data: {
          userId,
          type: anomaly.type || "behavioral",
          severity: anomaly.severity || "low",
          description: anomaly.description || "Unknown anomaly detected",
          locationLat: location?.lat || 0,
          locationLng: location?.lng || 0,
          confidence: anomaly.confidence || 0.5,
          riskFactors: anomaly.riskFactors || anomaly.risk_factors || [],
          recommendations: anomaly.recommendations || []
        }
      })
    })
  )

  return createdAnomalies.map(mapAnomalyToFrontend)
}

export async function getUserAnomalies(userId: string) {
  if (!userId) {
    throw new Error("User ID is required")
  }

  const dbAnomalies = await db.anomalyPattern.findMany({
    where: {
      userId,
      resolved: false
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 20
  })

  return dbAnomalies.map(mapAnomalyToFrontend)
}

export async function resolveUserAnomaly(anomalyId: string) {
  if (!anomalyId) {
    throw new Error("Anomaly ID is required")
  }

  const updated = await db.anomalyPattern.update({
    where: { id: anomalyId },
    data: {
      resolved: true,
      resolvedAt: new Date()
    }
  })

  return mapAnomalyToFrontend(updated)
}
