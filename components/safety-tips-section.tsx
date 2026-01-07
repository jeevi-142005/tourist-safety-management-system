"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Heart, Car, Smartphone, AlertTriangle, CheckCircle } from "lucide-react"

export function SafetyTipsSection() {
  const safetyCategories = [
    {
      id: "health",
      label: "Health & Medical",
      icon: Heart,
      color: "bg-green-500",
      tips: [
        {
          title: "Travel Insurance",
          description: "Always purchase comprehensive travel insurance before departure",
          priority: "high",
        },
        {
          title: "Vaccination Requirements",
          description: "Check required vaccinations for your destination 4-6 weeks before travel",
          priority: "high",
        },
        {
          title: "Medical Kit",
          description: "Pack a basic first aid kit with essential medications",
          priority: "medium",
        },
        {
          title: "Water Safety",
          description: "Drink bottled or properly purified water in areas with questionable water quality",
          priority: "medium",
        },
      ],
    },
    {
      id: "security",
      label: "Personal Security",
      icon: Shield,
      color: "bg-blue-500",
      tips: [
        {
          title: "Document Copies",
          description: "Keep digital and physical copies of important documents separately",
          priority: "high",
        },
        {
          title: "Money Management",
          description: "Use multiple payment methods and avoid carrying large amounts of cash",
          priority: "high",
        },
        {
          title: "Accommodation Safety",
          description: "Research and book accommodations in safe neighborhoods",
          priority: "medium",
        },
        {
          title: "Personal Information",
          description: "Avoid sharing detailed travel plans with strangers",
          priority: "medium",
        },
      ],
    },
    {
      id: "transport",
      label: "Transportation",
      icon: Car,
      color: "bg-purple-500",
      tips: [
        {
          title: "Licensed Transportation",
          description: "Use only licensed taxis, rideshares, or public transportation",
          priority: "high",
        },
        {
          title: "Route Planning",
          description: "Plan your routes in advance and share them with trusted contacts",
          priority: "medium",
        },
        {
          title: "Night Travel",
          description: "Avoid traveling alone at night, especially in unfamiliar areas",
          priority: "high",
        },
        {
          title: "Vehicle Safety",
          description: "Check vehicle condition and driver credentials before boarding",
          priority: "medium",
        },
      ],
    },
    {
      id: "communication",
      label: "Communication",
      icon: Smartphone,
      color: "bg-orange-500",
      tips: [
        {
          title: "Emergency Contacts",
          description: "Save local emergency numbers and embassy contacts in your phone",
          priority: "high",
        },
        {
          title: "Check-in Schedule",
          description: "Establish regular check-in times with family or friends",
          priority: "medium",
        },
        {
          title: "Local SIM Card",
          description: "Consider getting a local SIM card or international roaming plan",
          priority: "medium",
        },
        {
          title: "Offline Maps",
          description: "Download offline maps and translation apps before traveling",
          priority: "medium",
        },
      ],
    },
  ]

  return (
    <section id="safety-tips" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Essential Safety Tips</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive safety guidelines organized by category to help you prepare for any situation
          </p>
        </div>

        <Tabs defaultValue="health" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
            {safetyCategories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                <category.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{category.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {safetyCategories.map((category) => (
            <TabsContent key={category.id} value={category.id}>
              <div className="grid md:grid-cols-2 gap-6">
                {category.tips.map((tip, index) => (
                  <Card key={index} className="fade-in">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <div className={`p-2 rounded-full ${category.color} text-white`}>
                            <category.icon className="h-4 w-4" />
                          </div>
                          {tip.title}
                        </CardTitle>
                        <Badge variant={tip.priority === "high" ? "destructive" : "secondary"}>
                          {tip.priority === "high" ? (
                            <AlertTriangle className="h-3 w-3 mr-1" />
                          ) : (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          {tip.priority}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{tip.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  )
}
