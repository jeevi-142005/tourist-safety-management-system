import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, AlertTriangle, TrendingUp, Shield } from "lucide-react"

export function DashboardPreview() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-balance mb-6">Real-time Dashboard Preview</h2>
          <p className="text-xl text-muted-foreground text-balance max-w-3xl mx-auto">
            Comprehensive monitoring and management interfaces for police departments and tourism authorities.
          </p>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Live Statistics */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Live Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Active Tourists</span>
                <span className="text-2xl font-bold text-primary">2,847</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">High-Risk Areas</span>
                <span className="text-2xl font-bold text-destructive">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Active Alerts</span>
                <span className="text-2xl font-bold text-secondary">3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Response Units</span>
                <span className="text-2xl font-bold text-accent">24</span>
              </div>
            </CardContent>
          </Card>

          {/* Heat Map Preview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-secondary" />
                Tourist Density Heat Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-64 bg-muted rounded-lg overflow-hidden">
                {/* Simulated Map Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-muted via-card to-muted"></div>

                {/* Heat Map Clusters */}
                <div className="absolute top-12 left-16 w-8 h-8 bg-primary/60 rounded-full animate-pulse"></div>
                <div className="absolute top-20 right-20 w-12 h-12 bg-secondary/60 rounded-full animate-pulse"></div>
                <div className="absolute bottom-16 left-1/3 w-6 h-6 bg-accent/60 rounded-full animate-pulse"></div>
                <div className="absolute bottom-20 right-1/4 w-10 h-10 bg-chart-4/60 rounded-full animate-pulse"></div>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-background/90 rounded-lg p-3">
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span>High Density</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-secondary rounded-full"></div>
                      <span>Medium</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-accent rounded-full"></div>
                      <span>Low</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                  <div>
                    <div className="font-semibold text-sm">Missing Tourist - ID: TID-2024-001</div>
                    <div className="text-xs text-muted-foreground">Last seen: Kaziranga National Park</div>
                  </div>
                  <Badge variant="destructive">Critical</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-chart-3/10 rounded-lg">
                  <div>
                    <div className="font-semibold text-sm">Geofence Violation - ID: TID-2024-045</div>
                    <div className="text-xs text-muted-foreground">Entered restricted zone: Border Area</div>
                  </div>
                  <Badge className="bg-chart-3 text-chart-3-foreground">Warning</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                  <div>
                    <div className="font-semibold text-sm">Panic Button - ID: TID-2024-078</div>
                    <div className="text-xs text-muted-foreground">Location: Shillong Peak Trail</div>
                  </div>
                  <Badge className="bg-secondary text-secondary-foreground">Emergency</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent" />
                Response Units
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                  <div>
                    <div className="font-semibold text-sm">Unit Alpha-1</div>
                    <div className="text-xs text-muted-foreground">Guwahati Police Station</div>
                  </div>
                  <Badge className="bg-accent text-accent-foreground">Available</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-chart-3/10 rounded-lg">
                  <div>
                    <div className="font-semibold text-sm">Unit Beta-2</div>
                    <div className="text-xs text-muted-foreground">Kaziranga Outpost</div>
                  </div>
                  <Badge className="bg-chart-3 text-chart-3-foreground">En Route</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                  <div>
                    <div className="font-semibold text-sm">Unit Gamma-3</div>
                    <div className="text-xs text-muted-foreground">Shillong Emergency</div>
                  </div>
                  <Badge variant="destructive">Responding</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
