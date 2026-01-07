"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"

export function TravelAdvisoriesSection() {
  const advisories = [
    {
      country: "Thailand",
      flag: "🇹🇭",
      level: "low",
      levelText: "Exercise Normal Precautions",
      description: "Generally safe for tourists with standard precautions",
      lastUpdated: "2024-01-15",
      details: [
        "Monitor weather conditions during monsoon season",
        "Be aware of local customs and dress codes at temples",
        "Use reputable tour operators for activities",
      ],
    },
    {
      country: "Mexico",
      flag: "🇲🇽",
      level: "medium",
      levelText: "Exercise Increased Caution",
      description: "Some areas have increased risk due to crime",
      lastUpdated: "2024-01-10",
      details: [
        "Avoid certain areas known for drug-related violence",
        "Use hotel safes for valuables",
        "Travel in groups when possible, especially at night",
      ],
    },
    {
      country: "Egypt",
      flag: "🇪🇬",
      level: "medium",
      levelText: "Exercise Increased Caution",
      description: "Terrorism and civil unrest risks in some areas",
      lastUpdated: "2024-01-12",
      details: [
        "Avoid large gatherings and demonstrations",
        "Stay alert in tourist areas",
        "Follow guidance from local authorities",
      ],
    },
    {
      country: "Afghanistan",
      flag: "🇦🇫",
      level: "high",
      levelText: "Do Not Travel",
      description: "Extremely dangerous due to ongoing conflict",
      lastUpdated: "2024-01-08",
      details: [
        "Armed conflict and terrorism throughout the country",
        "Limited consular services available",
        "Kidnapping and hostage-taking risks",
      ],
    },
    {
      country: "Japan",
      flag: "🇯🇵",
      level: "low",
      levelText: "Exercise Normal Precautions",
      description: "Very safe destination with excellent infrastructure",
      lastUpdated: "2024-01-14",
      details: [
        "Natural disaster preparedness recommended",
        "Respect local customs and etiquette",
        "Excellent public transportation system",
      ],
    },
    {
      country: "Brazil",
      flag: "🇧🇷",
      level: "medium",
      levelText: "Exercise Increased Caution",
      description: "Crime rates vary significantly by region",
      lastUpdated: "2024-01-11",
      details: [
        "Avoid displaying expensive items",
        "Use registered taxis or rideshare services",
        "Be cautious in favelas and isolated areas",
      ],
    },
  ]

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "low":
        return <CheckCircle className="h-4 w-4" />
      case "medium":
        return <AlertCircle className="h-4 w-4" />
      case "high":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "low":
        return "bg-green-500"
      case "medium":
        return "bg-yellow-500"
      case "high":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <section id="advisories" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Travel Advisories</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Current safety levels and travel recommendations for popular destinations worldwide
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {advisories.map((advisory, index) => (
            <Card key={index} className="fade-in">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <span className="text-2xl">{advisory.flag}</span>
                    <span>{advisory.country}</span>
                  </CardTitle>
                  <Badge variant="secondary" className={`${getLevelColor(advisory.level)} text-white`}>
                    {getLevelIcon(advisory.level)}
                  </Badge>
                </div>
                <CardDescription className="font-medium">{advisory.levelText}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{advisory.description}</p>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Key Considerations:</h4>
                  <ul className="space-y-1">
                    {advisory.details.map((detail, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-accent mt-1">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-xs text-muted-foreground">
                    Updated: {new Date(advisory.lastUpdated).toLocaleDateString()}
                  </span>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-6 p-4 bg-card rounded-lg border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">Low Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">Medium Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm">High Risk</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
