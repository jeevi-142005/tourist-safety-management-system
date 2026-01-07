import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Users, Monitor } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-balance mb-6">Ready to Transform Tourist Safety?</h2>
          <p className="text-xl text-muted-foreground text-balance max-w-3xl mx-auto">
            Join the future of smart tourism with our comprehensive safety monitoring and incident response system.
          </p>
        </div>

        {/* CTA Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Monitor className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Request Demo</h3>
              <p className="text-muted-foreground mb-6">
                See the platform in action with a personalized demonstration for your organization.
              </p>
              <Button className="w-full">Request Demo</Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Tourism Department Access</h3>
              <p className="text-muted-foreground mb-6">
                Get access to tourism management dashboards and analytics tools.
              </p>
              <Button variant="secondary" className="w-full">
                Tourism Access
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Police Access</h3>
              <p className="text-muted-foreground mb-6">
                Access emergency response dashboards and incident management tools.
              </p>
              <Button
                variant="outline"
                className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground bg-transparent"
              >
                Police Access
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main CTA */}
        <Card className="bg-gradient-to-r from-primary via-primary to-secondary text-primary-foreground">
          <CardContent className="p-12 text-center">
            <h3 className="text-3xl font-bold mb-4">Start Protecting Tourists Today</h3>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Deploy our comprehensive safety ecosystem and ensure every tourist in your region has access to
              cutting-edge protection technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="px-8 py-3 text-lg">
                Get Started Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-3 text-lg border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary bg-transparent"
              >
                Contact Sales
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">Need more information? Our team is ready to help.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm">
            <span>📧 contact@touristsafety.gov.in</span>
            <span className="hidden sm:inline">|</span>
            <span>📞 +91-1800-SAFETY (723389)</span>
            <span className="hidden sm:inline">|</span>
            <span>🌐 www.touristsafety.gov.in</span>
          </div>
        </div>
      </div>
    </section>
  )
}
