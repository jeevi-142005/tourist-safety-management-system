export interface User {
  id: string
  email: string
  name: string
  role: "tourist" | "admin"
  blockchainId?: string
  location?: {
    latitude: number
    longitude: number
    address: string
  }
  createdAt: string
}

export interface Alert {
  id: string
  touristId: string
  touristName: string
  type: "emergency" | "medical" | "security" | "assistance"
  message: string
  location: {
    latitude: number
    longitude: number
    address: string
  }
  timestamp: string
  status: "active" | "resolved" | "investigating"
  priority: "low" | "medium" | "high" | "critical"
  assignedTo?: string
  resolvedAt?: string
  notes?: string
}

export interface TouristActivity {
  id: string
  touristId: string
  type: "check-in" | "location-update" | "alert" | "safe-zone-entry" | "safe-zone-exit"
  location: {
    latitude: number
    longitude: number
    address: string
  }
  timestamp: string
  metadata?: Record<string, any>
}

class DatabaseService {
  private readonly USERS_KEY = "tourist_safety_users"
  private readonly ALERTS_KEY = "tourist_safety_alerts"
  private readonly ACTIVITIES_KEY = "tourist_safety_activities"

  // User management
  async getUsers(): Promise<User[]> {
    if (typeof window === "undefined") return []
    const users = localStorage.getItem(this.USERS_KEY)
    return users ? JSON.parse(users) : []
  }

  async getUserById(id: string): Promise<User | null> {
    const users = await this.getUsers()
    return users.find((user) => user.id === id) || null
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.getUsers()
    return users.find((user) => user.email === email) || null
  }

  async createUser(userData: Omit<User, "id" | "createdAt">): Promise<User> {
    const users = await this.getUsers()
    const newUser: User = {
      ...userData,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users))
    return newUser
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const users = await this.getUsers()
    const userIndex = users.findIndex((user) => user.id === id)

    if (userIndex === -1) return null

    users[userIndex] = { ...users[userIndex], ...updates }
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users))
    return users[userIndex]
  }

  // Alert management
  async getAlerts(): Promise<Alert[]> {
    if (typeof window === "undefined") return []
    const alerts = localStorage.getItem(this.ALERTS_KEY)
    return alerts ? JSON.parse(alerts) : []
  }

  async getActiveAlerts(): Promise<Alert[]> {
    const alerts = await this.getAlerts()
    return alerts.filter((alert) => alert.status === "active")
  }

  async getAlertsByTourist(touristId: string): Promise<Alert[]> {
    const alerts = await this.getAlerts()
    return alerts.filter((alert) => alert.touristId === touristId)
  }

  async createAlert(alertData: Omit<Alert, "id" | "timestamp">): Promise<Alert> {
    const alerts = await this.getAlerts()
    const newAlert: Alert = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    }

    alerts.push(newAlert)
    localStorage.setItem(this.ALERTS_KEY, JSON.stringify(alerts))

    // Also log as activity
    await this.logActivity({
      touristId: alertData.touristId,
      type: "alert",
      location: alertData.location,
      metadata: {
        alertType: alertData.type,
        alertId: newAlert.id,
        message: alertData.message,
      },
    })

    return newAlert
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | null> {
    const alerts = await this.getAlerts()
    const alertIndex = alerts.findIndex((alert) => alert.id === id)

    if (alertIndex === -1) return null

    alerts[alertIndex] = { ...alerts[alertIndex], ...updates }
    localStorage.setItem(this.ALERTS_KEY, JSON.stringify(alerts))
    return alerts[alertIndex]
  }

  async resolveAlert(id: string, notes?: string): Promise<Alert | null> {
    return this.updateAlert(id, {
      status: "resolved",
      resolvedAt: new Date().toISOString(),
      notes,
    })
  }

  // Activity logging
  async getActivities(): Promise<TouristActivity[]> {
    if (typeof window === "undefined") return []
    const activities = localStorage.getItem(this.ACTIVITIES_KEY)
    return activities ? JSON.parse(activities) : []
  }

  async getActivitiesByTourist(touristId: string): Promise<TouristActivity[]> {
    const activities = await this.getActivities()
    return activities.filter((activity) => activity.touristId === touristId)
  }

  async logActivity(activityData: Omit<TouristActivity, "id" | "timestamp">): Promise<TouristActivity> {
    const activities = await this.getActivities()
    const newActivity: TouristActivity = {
      ...activityData,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    }

    activities.push(newActivity)
    // Keep only last 1000 activities to prevent storage bloat
    const trimmedActivities = activities.slice(-1000)
    localStorage.setItem(this.ACTIVITIES_KEY, JSON.stringify(trimmedActivities))
    return newActivity
  }

  // Analytics and reporting
  async getAlertStats(): Promise<{
    total: number
    active: number
    resolved: number
    byType: Record<string, number>
    byPriority: Record<string, number>
  }> {
    const alerts = await this.getAlerts()

    const stats = {
      total: alerts.length,
      active: alerts.filter((a) => a.status === "active").length,
      resolved: alerts.filter((a) => a.status === "resolved").length,
      byType: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
    }

    alerts.forEach((alert) => {
      stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1
      stats.byPriority[alert.priority] = (stats.byPriority[alert.priority] || 0) + 1
    })

    return stats
  }

  async getTouristStats(): Promise<{
    total: number
    active: number
    safeZone: number
    withAlerts: number
  }> {
    const users = await this.getUsers()
    const tourists = users.filter((user) => user.role === "tourist")
    const alerts = await this.getActiveAlerts()

    return {
      total: tourists.length,
      active: tourists.filter((t) => t.location).length,
      safeZone: tourists.filter((t) => t.location && this.isInSafeZone(t.location)).length,
      withAlerts: new Set(alerts.map((a) => a.touristId)).size,
    }
  }

  private isInSafeZone(location: { latitude: number; longitude: number }): boolean {
    // Simple safe zone check - in a real app, this would check against defined safe zones
    // For demo purposes, consider areas within certain coordinates as safe
    const safeZones = [
      { lat: 40.7128, lng: -74.006, radius: 0.01 }, // NYC example
      { lat: 34.0522, lng: -118.2437, radius: 0.01 }, // LA example
    ]

    return safeZones.some((zone) => {
      const distance = Math.sqrt(Math.pow(location.latitude - zone.lat, 2) + Math.pow(location.longitude - zone.lng, 2))
      return distance <= zone.radius
    })
  }

  // Data seeding for demo
  async seedDemoData(): Promise<void> {
    const existingUsers = await this.getUsers()
    if (existingUsers.length > 0) return // Already seeded

    // Create demo admin
    await this.createUser({
      email: "admin@safetour.com",
      name: "Safety Admin",
      role: "admin",
    })

    // Create demo tourists
    const tourists = [
      {
        email: "john.doe@email.com",
        name: "John Doe",
        role: "tourist" as const,
        blockchainId: "BC_" + Math.random().toString(36).substr(2, 12).toUpperCase(),
        location: {
          latitude: 40.7128,
          longitude: -74.006,
          address: "New York, NY, USA",
        },
      },
      {
        email: "jane.smith@email.com",
        name: "Jane Smith",
        role: "tourist" as const,
        blockchainId: "BC_" + Math.random().toString(36).substr(2, 12).toUpperCase(),
        location: {
          latitude: 34.0522,
          longitude: -118.2437,
          address: "Los Angeles, CA, USA",
        },
      },
    ]

    for (const tourist of tourists) {
      await this.createUser(tourist)
    }

    console.log("Demo data seeded successfully")
  }
}

export const db = new DatabaseService()

// Initialize demo data on first load
if (typeof window !== "undefined") {
  db.seedDemoData()
}
