import { NavigationMenu } from "@/components/navigation-menu"
import { LiveTrackingMap } from "@/components/live-tracking-map"

export default function TrackingPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavigationMenu />
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Live Location Tracking</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Real-time location monitoring with geo-fence alerts for enhanced tourist safety. Your location is tracked
            securely and alerts are sent when entering high-risk areas.
          </p>
        </div>
        <LiveTrackingMap />
      </div>
    </div>
  )
}
