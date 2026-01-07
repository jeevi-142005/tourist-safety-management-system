import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, MapPin, Clock, Users } from "lucide-react"

export function ProblemSection() {
  const problems = [
    {
      icon: AlertTriangle,
      title: "Remote Area Risks",
      description:
        "Tourists often venture into remote areas with limited connectivity and emergency response capabilities.",
    },
    {
      icon: MapPin,
      title: "Missing Tracking",
      description:
        "Traditional methods lack real-time location tracking and automated alert systems for missing persons.",
    },
    {
      icon: Clock,
      title: "Delayed Response",
      description: "Manual reporting and response systems result in critical delays during emergency situations.",
    },
    {
      icon: Users,
      title: "Identity Verification",
      description: "Lack of secure, tamper-proof digital identity systems for tourists and emergency contacts.",
    },
  ]

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-balance mb-6">Why Tourist Safety Needs Innovation</h2>
          <p className="text-xl text-muted-foreground text-balance max-w-3xl mx-auto">
            In regions where tourism is a key economic driver, ensuring visitor safety is paramount. Traditional
            policing and manual tracking methods are insufficient for modern challenges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((problem, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="p-3 bg-destructive/10 rounded-full w-fit mx-auto mb-4">
                  <problem.icon className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold mb-3">{problem.title}</h3>
                <p className="text-muted-foreground text-sm">{problem.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Infographic Style Stats */}
        <div className="mt-16 bg-card rounded-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-destructive mb-2">73%</div>
              <div className="text-muted-foreground">of tourist incidents occur in remote areas</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-destructive mb-2">45min</div>
              <div className="text-muted-foreground">average response time with traditional methods</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-destructive mb-2">60%</div>
              <div className="text-muted-foreground">of cases lack proper identity verification</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
