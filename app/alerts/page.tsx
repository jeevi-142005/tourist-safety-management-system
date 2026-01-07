"use client"

import { NavigationMenu } from "@/components/navigation-menu"
import { EmergencyAlertSystem } from "@/components/emergency-alert-system"
import { EnhancedEmergencySystem } from "@/components/enhanced-emergency-system"
import { NotificationSystem } from "@/components/notification-system"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Shield, Bell, Zap } from "lucide-react"

export default function AlertsPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavigationMenu />
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Safety Alert System</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive emergency response system with real-time alerts, geofencing notifications, and AI-powered
            threat detection.
          </p>
        </div>

        <Tabs defaultValue="emergency" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="emergency" className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Emergency</span>
            </TabsTrigger>
            <TabsTrigger value="enhanced" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Enhanced</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="geofence" className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Geofence</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="emergency">
            <EmergencyAlertSystem />
          </TabsContent>

          <TabsContent value="enhanced">
            <EnhancedEmergencySystem />
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Alert Notifications</CardTitle>
                <CardDescription>Real-time notifications and alert management</CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationSystem />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="geofence">
            <GeofenceAlertSystem />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function GeofenceAlertSystem() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Geofence Alert System</span>
          </CardTitle>
          <CardDescription>Automatic alerts when entering or exiting designated safety zones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Geofence alerts are automatically triggered through the Live Tracking system.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Visit the Live Tracking page to enable location monitoring and geofence alerts.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
