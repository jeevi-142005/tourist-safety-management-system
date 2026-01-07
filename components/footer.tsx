import { Shield, MapPin, Smartphone, Brain } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-primary rounded-lg">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">TouristSafe</span>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              AI + Blockchain + Geo-fencing powered safety ecosystem for secure tourism.
            </p>
            <div className="flex gap-2">
              <div className="p-2 bg-muted rounded-lg">
                <MapPin className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <Brain className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Digital Tourist ID
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Mobile App
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  AI Detection
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  IoT Integration
                </a>
              </li>
            </ul>
          </div>

          {/* Access */}
          <div>
            <h3 className="font-semibold mb-4">Access</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Tourism Department
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Police Portal
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Emergency Services
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  API Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Developer Tools
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Training Resources
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  System Status
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Contact Support
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Emergency Hotline
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © 2024 Smart Tourist Safety Monitoring System. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Data Protection
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Compliance
              </a>
            </div>
          </div>

          {/* Data Privacy Statement */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              <strong>Data Privacy & Security:</strong> All tourist data is protected with end-to-end encryption and
              blockchain immutability. We comply with all data protection regulations and maintain the highest standards
              of privacy and security.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
