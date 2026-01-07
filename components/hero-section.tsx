import { Button } from "@/components/ui/button"
import { Shield, MapPin, Smartphone } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-muted overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 border-2 border-primary rounded-full"></div>
        <div className="absolute top-40 right-32 w-24 h-24 border-2 border-secondary rounded-full"></div>
        <div className="absolute bottom-32 left-1/4 w-16 h-16 border-2 border-accent rounded-full"></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 border-2 border-primary rounded-full"></div>
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Icon Group */}
          <div className="flex justify-center items-center gap-4 mb-8">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div className="p-3 bg-secondary/10 rounded-full">
              <MapPin className="w-8 h-8 text-secondary" />
            </div>
            <div className="p-3 bg-accent/10 rounded-full">
              <Smartphone className="w-8 h-8 text-accent" />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6 bg-gradient-to-r from-primary via-foreground to-secondary bg-clip-text text-transparent">
            Smart Tourist Safety Monitoring & Incident Response System
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground text-balance mb-8 max-w-3xl mx-auto">
            AI + Blockchain + Geo-fencing powered safety ecosystem for secure tourism
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="px-8 py-3 text-lg">
              Get Started
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-3 text-lg bg-transparent">
              Learn More
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">Real-time Monitoring</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-2">10+</div>
              <div className="text-muted-foreground">Language Support</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">AI</div>
              <div className="text-muted-foreground">Powered Detection</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
