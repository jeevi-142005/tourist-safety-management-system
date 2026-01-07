import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, CreditCard, Smartphone, Brain, Monitor, AlertCircle } from "lucide-react"

export function HowItWorksSection() {
  const steps = [
    {
      icon: CreditCard,
      title: "Tourist ID Generation",
      description: "Secure blockchain-based digital ID created at entry points with KYC verification and trip details.",
      step: "01",
    },
    {
      icon: Smartphone,
      title: "Mobile App Tracking",
      description: "Real-time location monitoring with safety scores, geofencing alerts, and emergency features.",
      step: "02",
    },
    {
      icon: Brain,
      title: "AI Anomaly Detection",
      description: "Intelligent monitoring detects unusual patterns, inactivity, or route deviations automatically.",
      step: "03",
    },
    {
      icon: Monitor,
      title: "Dashboard Alerts",
      description: "Police and tourism departments receive real-time alerts with location data and incident details.",
      step: "04",
    },
    {
      icon: AlertCircle,
      title: "Emergency Response",
      description: "Automated FIR generation and coordinated response from nearest emergency units.",
      step: "05",
    },
  ]

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-balance mb-6">How It Works</h2>
          <p className="text-xl text-muted-foreground text-balance max-w-3xl mx-auto">
            A seamless flow from tourist registration to emergency response, powered by AI and blockchain technology.
          </p>
        </div>

        {/* Desktop Flow */}
        <div className="hidden lg:flex items-center justify-between mb-16">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className="text-center">
                <div className="relative">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4 mx-auto">
                    <step.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-xs font-bold text-secondary-foreground">
                    {step.step}
                  </div>
                </div>
                <h3 className="font-semibold text-sm mb-2 max-w-32">{step.title}</h3>
              </div>
              {index < steps.length - 1 && <ArrowRight className="w-6 h-6 text-muted-foreground mx-4" />}
            </div>
          ))}
        </div>

        {/* Mobile/Tablet Cards */}
        <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {steps.map((step, index) => (
            <Card key={index} className="relative">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <step.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-secondary rounded-full flex items-center justify-center text-xs font-bold text-secondary-foreground">
                      {step.step}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm">{step.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Flow Diagram */}
        <Card className="p-8">
          <h3 className="text-2xl font-bold text-center mb-8">Complete System Flow</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-10 h-10 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Registration Phase</h4>
              <p className="text-sm text-muted-foreground">
                Tourist arrives → KYC verification → Digital ID creation → App installation → Safety briefing
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-10 h-10 text-secondary" />
              </div>
              <h4 className="font-semibold mb-2">Monitoring Phase</h4>
              <p className="text-sm text-muted-foreground">
                Real-time tracking → AI analysis → Pattern recognition → Risk assessment → Predictive alerts
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-accent" />
              </div>
              <h4 className="font-semibold mb-2">Response Phase</h4>
              <p className="text-sm text-muted-foreground">
                Incident detection → Alert dispatch → Resource allocation → Emergency response → Follow-up
              </p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
