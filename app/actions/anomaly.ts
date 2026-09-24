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

  // Fetch user for name & digiId context
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, touristIds: { where: { isActive: true }, take: 1 } },
  })

  const userName = user?.name || user?.email.split("@")[0] || "Tourist"
  const digiIdHash = user?.touristIds[0]?.blockchainHash || null

  // Get anomalies from Gemini
  const anomalies = await analyzeDeviceMetricsForAnomalies(metrics, location)
  
  if (!anomalies || anomalies.length === 0) {
    return []
  }

  // Store in database and auto-raise alert + notification for significant anomalies
  const createdAnomalies = await Promise.all(
    anomalies.map(async (anomaly: any) => {
      const anomalyRecord = await db.anomalyPattern.create({
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

      // If anomaly severity is medium, high, or critical, auto-generate Emergency Alert & Admin Notification
      if (["medium", "high", "critical"].includes(anomaly.severity)) {
        // Create emergency alert record for Admin Dashboard
        await db.emergencyAlert.create({
          data: {
            userId,
            userName,
            type: `anomaly_${anomaly.type || "behavioral"}`,
            message: `Automatic Anomaly Alert: ${anomaly.description}`,
            severity: anomaly.severity,
            locationLat: location?.lat ? parseFloat(String(location.lat)) : null,
            locationLng: location?.lng ? parseFloat(String(location.lng)) : null,
            status: "active",
            deviceInfo: metrics ? metrics : null,
          }
        })

        // Create Admin Notification
        await db.adminNotification.create({
          data: {
            type: "anomaly_detected",
            title: `Safety Anomaly Detected for ${userName}`,
            message: `[${anomaly.severity.toUpperCase()}] ${anomaly.description}`,
            severity: anomaly.severity === "critical" ? "critical" : "warning",
            userId,
            metadata: {
              anomaly_id: anomalyRecord.id,
              digi_id_hash: digiIdHash,
              location: location,
            }
          }
        })
      }

      return anomalyRecord
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
