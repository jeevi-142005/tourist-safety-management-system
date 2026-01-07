"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Shield, Globe, Phone, AlertTriangle, Map, Home } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const { t, language, setLanguage } = useLanguage()

  const navItems = [
    { href: "#home", label: "Home", icon: Home },
    { href: "#safety-tips", label: "Safety Tips", icon: Shield },
    { href: "#emergency", label: "Emergency Contacts", icon: Phone },
    { href: "#guidelines", label: "Local Guidelines", icon: Map },
    { href: "#advisories", label: "Travel Advisories", icon: AlertTriangle },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-accent" />
          <span className="text-xl font-bold text-primary">SafeTravel</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-accent transition-colors"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </a>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          {/* Language Selector */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === "en" ? "es" : "en")}
            className="hidden sm:flex items-center space-x-2"
          >
            <Globe className="h-4 w-4" />
            <span>{language.toUpperCase()}</span>
          </Button>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-4 mt-8">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 text-lg font-medium text-foreground hover:text-accent transition-colors"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </a>
                ))}
                <Button
                  variant="outline"
                  onClick={() => setLanguage(language === "en" ? "es" : "en")}
                  className="flex items-center space-x-2 justify-start"
                >
                  <Globe className="h-4 w-4" />
                  <span>Language: {language.toUpperCase()}</span>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
