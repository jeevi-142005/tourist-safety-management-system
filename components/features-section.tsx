import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Smartphone, Brain, Monitor, Lock, CreditCard, MapPin, Languages, Database } from "lucide-react"

export function FeaturesSection() {
  const features = [
    {
      icon: CreditCard,
      title: "Digital Tourist ID",
      subtitle: "Blockchain-powered",
      description:
        "Secure KYC verification with temporary validity and tamper-proof records using blockchain technology.",
      badges: ["Blockchain", "KYC", "Secure"],
      color: "bg-primary/10 text-primary",
    },
    {
      icon: Smartphone,
      title: "Mobile App for Tourists",
      subtitle: "Safety-first design",
      description:
        "Real-time safety scores, geofencing alerts, panic button, and live location sharing with emergency contacts.",
      badges: ["Mobile", "Real-time", "Geofencing"],
      color: "bg-secondary/10 text-secondary",
    },
    {
      icon: Brain,
      title: "AI Anomaly Detection",
      subtitle: "Intelligent monitoring",
      description:
        "Detect sudden location drop-offs, prolonged inactivity, or deviations from planned routes automatically.",
      badges: ["AI/ML", "Anomaly Detection", "Automated"],
      color: "bg-accent/10 text-accent",
    },
    {
      icon: Monitor,
      title: "Police & Tourism Dashboards",
      subtitle: "Command center",
      description:
        "Real-time heatmaps, alert management, last known locations, and automated FIR generation for authorities.",
      badges: ["Dashboard", "Real-time", "Automated FIR"],
      color: "bg-chart-4/10 text-chart-4",
    },
    {
      icon: Languages,
      title: "Multilingual & Accessibility",
      subtitle: "Inclusive design",
      description: "Support for 10+ Indian languages plus English, with voice and text emergency access for all users.",
      badges: ["10+ Languages", "Voice Support", "Accessible"],
      color: "bg-chart-5/10 text-chart-5",
    },
    {
      icon: Lock,
      title: "Data Privacy & Security",
      subtitle: "Enterprise-grade",
      description:
        "End-to-end encryption, blockchain immutability, and full compliance with data protection regulations.",
      badges: ["E2E Encryption", "Compliant", "Secure"],
      color: "bg-chart-3/10 text-chart-3",
    },
  ]

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-balance mb-6">Core Features & Capabilities</h2>
          <p className="text-xl text-muted-foreground text-balance max-w-3xl mx-auto">
            A comprehensive safety ecosystem powered by cutting-edge technology to protect tourists and enable rapid
            emergency response.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${feature.color}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{feature.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{feature.subtitle}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{feature.description}</p>
                <div className="flex flex-wrap gap-2">
                  {feature.badges.map((badge, badgeIndex) => (
                    <Badge key={badgeIndex} variant="secondary" className="text-xs">
                      {badge}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Features Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">IoT Integration (Optional)</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Smart bands or tags for tourists in high-risk areas like caves and forests, providing continuous health
              and location signals with manual SOS features.
            </p>
            <div className="flex gap-2">
              <Badge variant="outline">IoT Devices</Badge>
              <Badge variant="outline">Health Monitoring</Badge>
              <Badge variant="outline">SOS</Badge>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-secondary" />
              <h3 className="text-xl font-semibold">Automated Evidence Logging</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Comprehensive logging system that automatically captures and stores evidence for investigations, including
              location history, communication logs, and incident reports.
            </p>
            <div className="flex gap-2">
              <Badge variant="outline">Auto-logging</Badge>
              <Badge variant="outline">Evidence Chain</Badge>
              <Badge variant="outline">Investigation</Badge>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
