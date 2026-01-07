"use client"

import { useState, useEffect } from "react"
import type { Alert } from "@/lib/database"
import { alertService } from "@/lib/alert-service"

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial load
    const loadAlerts = async () => {
      const initialAlerts = await alertService.getAlerts()
      setAlerts(initialAlerts)
      setLoading(false)
    }

    loadAlerts()

    // Subscribe to updates
    const unsubscribe = alertService.subscribe((updatedAlerts) => {
      setAlerts(updatedAlerts)
    })

    // Start polling for updates
    alertService.startPolling()

    return unsubscribe
  }, [])

  const createAlert = async (alert: Omit<Alert, "id" | "timestamp">) => {
    return await alertService.createAlert(alert)
  }

  const resolveAlert = async (alertId: string, notes?: string) => {
    await alertService.resolveAlert(alertId, notes)
  }

  const updateAlert = async (alertId: string, updates: Partial<Alert>) => {
    await alertService.updateAlert(alertId, updates)
  }

  const activeAlerts = alerts.filter((alert) => alert.status === "active")
  const resolvedAlerts = alerts.filter((alert) => alert.status === "resolved")

  return {
    alerts,
    activeAlerts,
    resolvedAlerts,
    loading,
    createAlert,
    resolveAlert,
    updateAlert,
  }
}
