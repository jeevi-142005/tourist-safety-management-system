"use client"

import { useState, useEffect } from "react"
import { db, type User, type Alert, type TouristActivity } from "@/lib/database"

export function useDatabase() {
  const [users, setUsers] = useState<User[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [activities, setActivities] = useState<TouristActivity[]>([])
  const [loading, setLoading] = useState(true)

  const refreshData = async () => {
    setLoading(true)
    try {
      const [usersData, alertsData, activitiesData] = await Promise.all([
        db.getUsers(),
        db.getAlerts(),
        db.getActivities(),
      ])

      setUsers(usersData)
      setAlerts(alertsData)
      setActivities(activitiesData)
    } catch (error) {
      console.error("Error refreshing database:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  return {
    users,
    alerts,
    activities,
    loading,
    refreshData,
    db,
  }
}

export function useAlertStats() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const alertStats = await db.getAlertStats()
        const touristStats = await db.getTouristStats()
        setStats({ alerts: alertStats, tourists: touristStats })
      } catch (error) {
        console.error("Error loading stats:", error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  return { stats, loading }
}
