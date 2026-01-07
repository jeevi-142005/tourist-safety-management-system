import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, TrendingUp, AlertCircle, Users, MapPin, Clock } from "lucide-react"

export function AIFeaturesSection() {
  const aiFeatures = [
    {
      icon: Brain,
      title: "Behavior Prediction",
      description:
        "Advanced ML models analyze tourist movement patterns to predict potential risks and suggest safer routes.",
      capabilities: ["Pattern Recognition", "Risk Assessment", "Route Optimization"],
      accuracy: "94%",
    },
    {
      icon: AlertCircle,
      title: "Anomaly Detection",
      description: "Real-time detection of unusual activities, sudden stops, or deviations from planned itineraries.",
      capabilities: ["Real-time Analysis", "Deviation Detection", "Activity Monitoring"],
      accuracy: "97%",
    },
    {
      icon: Users,
      title: "Missing Person Auto-Alerts",
      description: "Automated alert system that triggers when tourists haven't checked in or show signs of distress.",
      capabilities: ["Auto-triggering", "Multi-channel Alerts", "Emergency Contacts"],
      accuracy: "99%",
    },
  ]

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-balance mb-6">AI-Powered Intelligence</h2>
          <p className="text-xl text-muted-foreground text-balance max-w-3xl mx-auto">
            Cutting-edge artificial intelligence and machine learning capabilities that make tourist safety proactive
            rather than reactive.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {aiFeatures.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-xs font-bold">
                    {feature.accuracy} Accuracy
                  </Badge>
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{feature.description}</p>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Key Capabilities:</h4>
                  <div className="flex flex-wrap gap-2">
                    {feature.capabilities.map((capability, capIndex) => (
                      <Badge key={capIndex} variant="outline" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Model Performance */}
        <Card className="p-8">
          <h3 className="text-2xl font-bold text-center mb-8">AI Model Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-primary mb-2">97.3%</div>
              <div className="text-sm text-muted-foreground">Anomaly Detection Rate</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-secondary" />
              </div>
              <div className="text-3xl font-bold text-secondary mb-2">2.3s</div>
              <div className="text-sm text-muted-foreground">Average Response Time</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-accent" />
              </div>
              <div className="text-3xl font-bold text-accent mb-2">5m</div>
              <div className="text-sm text-muted-foreground">Location Accuracy</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-chart-4/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-chart-4" />
              </div>
              <div className="text-3xl font-bold text-chart-4 mb-2">0.2%</div>
              <div className="text-sm text-muted-foreground">False Positive Rate</div>
            </div>
          </div>
        </Card>

        {/* AI Technology Stack */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Machine Learning Models
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Deep Neural Networks</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Random Forest Classifier</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">LSTM for Time Series</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Geospatial Clustering</span>
                <Badge variant="secondary">Active</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              Data Processing Pipeline
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Real-time Stream Processing</span>
                <Badge className="bg-secondary text-secondary-foreground">Live</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Batch Analytics</span>
                <Badge className="bg-secondary text-secondary-foreground">Live</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Predictive Modeling</span>
                <Badge className="bg-secondary text-secondary-foreground">Live</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Alert Generation</span>
                <Badge className="bg-secondary text-secondary-foreground">Live</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
