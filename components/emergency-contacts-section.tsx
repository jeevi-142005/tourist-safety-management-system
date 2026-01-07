"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Phone, MapPin, Search, Globe, Hospital, Shield } from "lucide-react"

export function EmergencyContactsSection() {
  const [searchCountry, setSearchCountry] = useState("")

  const emergencyContacts = [
    {
      country: "United States",
      flag: "🇺🇸",
      emergency: "911",
      police: "911",
      fire: "911",
      medical: "911",
      embassy: "+1-202-501-4444",
      tourist: "+1-800-HELP-USA",
    },
    {
      country: "United Kingdom",
      flag: "🇬🇧",
      emergency: "999",
      police: "999",
      fire: "999",
      medical: "999",
      embassy: "+44-20-7499-9000",
      tourist: "+44-845-850-2829",
    },
    {
      country: "France",
      flag: "🇫🇷",
      emergency: "112",
      police: "17",
      fire: "18",
      medical: "15",
      embassy: "+33-1-43-12-22-22",
      tourist: "+33-1-42-96-70-00",
    },
    {
      country: "Germany",
      flag: "🇩🇪",
      emergency: "112",
      police: "110",
      fire: "112",
      medical: "112",
      embassy: "+49-30-8305-0",
      tourist: "+49-30-25-00-25",
    },
    {
      country: "Japan",
      flag: "🇯🇵",
      emergency: "110/119",
      police: "110",
      fire: "119",
      medical: "119",
      embassy: "+81-3-3224-5000",
      tourist: "+81-50-3816-2787",
    },
    {
      country: "Australia",
      flag: "🇦🇺",
      emergency: "000",
      police: "000",
      fire: "000",
      medical: "000",
      embassy: "+61-2-6214-5600",
      tourist: "+61-2-9956-7766",
    },
  ]

  const filteredContacts = emergencyContacts.filter((contact) =>
    contact.country.toLowerCase().includes(searchCountry.toLowerCase()),
  )

  return (
    <section id="emergency" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Emergency Contacts</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Quick access to essential emergency numbers and contacts for major destinations worldwide
          </p>

          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by country..."
              value={searchCountry}
              onChange={(e) => setSearchCountry(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {filteredContacts.map((contact, index) => (
            <Card key={index} className="fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <span className="text-2xl">{contact.flag}</span>
                  <span>{contact.country}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-red-500 text-white rounded-full">
                      <Phone className="h-3 w-3" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Emergency</div>
                      <div className="font-semibold">{contact.emergency}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-500 text-white rounded-full">
                      <Shield className="h-3 w-3" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Police</div>
                      <div className="font-semibold">{contact.police}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-500 text-white rounded-full">
                      <Hospital className="h-3 w-3" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Medical</div>
                      <div className="font-semibold">{contact.medical}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-500 text-white rounded-full">
                      <Globe className="h-3 w-3" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Embassy</div>
                      <div className="font-semibold text-xs">{contact.embassy}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-accent" />
                    <span className="text-sm font-medium">Tourist Helpline</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{contact.tourist}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredContacts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No countries found matching your search.</p>
          </div>
        )}
      </div>
    </section>
  )
}
