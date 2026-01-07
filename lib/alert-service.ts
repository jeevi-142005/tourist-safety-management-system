import { db, type Alert } from "./database"

export class AlertService {
  private static instance: AlertService
  private listeners: ((alerts: Alert[]) => void)[] = []

  private constructor() {}

  static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService()
    }
    return AlertService.instance
  }

  // Subscribe to alert updates
  subscribe(callback: (alerts: Alert[]) => void): () => void {
    this.listeners.push(callback)

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback)
    }
  }

  // Notify all listeners of alert changes
  private notifyListeners(alerts: Alert[]) {
    this.listeners.forEach((callback) => callback(alerts))
  }

  // Create a new alert
  async createAlert(alert: Omit<Alert, "id" | "timestamp">): Promise<Alert> {
    const newAlert = await db.createAlert(alert)

    // Notify listeners of the update
    const allAlerts = await db.getAlerts()
    this.notifyListeners(allAlerts)

    return newAlert
  }

  // Update alert status
  async updateAlert(alertId: string, updates: Partial<Alert>): Promise<void> {
    await db.updateAlert(alertId, updates)

    // Notify listeners of the update
    const allAlerts = await db.getAlerts()
    this.notifyListeners(allAlerts)
  }

  // Get all alerts
  async getAlerts(): Promise<Alert[]> {
    return await db.getAlerts()
  }

  // Get active alerts
  async getActiveAlerts(): Promise<Alert[]> {
    return await db.getActiveAlerts()
  }

  // Resolve an alert
  async resolveAlert(alertId: string, notes?: string): Promise<void> {
    await db.resolveAlert(alertId, notes)

    // Notify listeners of the update
    const allAlerts = await db.getAlerts()
    this.notifyListeners(allAlerts)
  }

  // Simulate real-time updates (in a real app, this would be WebSocket/SSE)
  startPolling(): void {
    setInterval(async () => {
      const alerts = await db.getAlerts()
      this.notifyListeners(alerts)
    }, 5000)
  }
}

// Export singleton instance
export const alertService = AlertService.getInstance()
