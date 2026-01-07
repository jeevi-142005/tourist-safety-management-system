"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MapPin, Plus, Edit, Trash2, Shield, AlertTriangle, Eye, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface GeoZone {
  id: string
  name: string
  zone_type: "safe" | "caution" | "danger" | "restricted"
  coordinates: any
  description: string
  risk_level: number
  created_at: string
}

export function GeoZoneManager() {
  const [zones, setZones] = useState<GeoZone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<GeoZone | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    zone_type: "",
    description: "",
    risk_level: 1,
    coordinates: "",
  })

  useEffect(() => {
    fetchZones()
  }, [])

  const fetchZones = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("geo_zones").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setZones(data || [])
    } catch (err) {
      console.error("Error fetching zones:", err)
      setError("Failed to load geo zones")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.zone_type || !formData.coordinates) {
      setError("Please fill in all required fields")
      return
    }

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("User not authenticated")
        return
      }

      // Parse coordinates (expecting GeoJSON format)
      let coordinates
      try {
        coordinates = JSON.parse(formData.coordinates)
      } catch {
        setError("Invalid coordinates format. Please use GeoJSON format.")
        return
      }

      const zoneData = {
        name: formData.name,
        zone_type: formData.zone_type as "safe" | "caution" | "danger" | "restricted",
        description: formData.description,
        risk_level: formData.risk_level,
        coordinates,
        created_by: user.id,
      }

      if (editingZone) {
        const { error } = await supabase.from("geo_zones").update(zoneData).eq("id", editingZone.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("geo_zones").insert(zoneData)

        if (error) throw error
      }

      await fetchZones()
      resetForm()
      setIsDialogOpen(false)
      setError(null)
    } catch (err) {
      console.error("Error saving zone:", err)
      setError(err instanceof Error ? err.message : "Failed to save zone")
    }
  }

  const handleEdit = (zone: GeoZone) => {
    setEditingZone(zone)
    setFormData({
      name: zone.name,
      zone_type: zone.zone_type,
      description: zone.description,
      risk_level: zone.risk_level,
      coordinates: JSON.stringify(zone.coordinates, null, 2),
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (zoneId: string) => {
    if (!confirm("Are you sure you want to delete this zone?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("geo_zones").delete().eq("id", zoneId)

      if (error) throw error
      await fetchZones()
    } catch (err) {
      console.error("Error deleting zone:", err)
      setError("Failed to delete zone")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      zone_type: "",
      description: "",
      risk_level: 1,
      coordinates: "",
    })
    setEditingZone(null)
    setError(null)
  }

  const getZoneColor = (zoneType: string) => {
    switch (zoneType) {
      case "safe":
        return "bg-green-100 text-green-800 border-green-200"
      case "caution":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "danger":
        return "bg-red-100 text-red-800 border-red-200"
      case "restricted":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getZoneIcon = (zoneType: string) => {
    switch (zoneType) {
      case "safe":
        return <Shield className="h-4 w-4" />
      case "caution":
        return <AlertTriangle className="h-4 w-4" />
      case "danger":
        return <AlertTriangle className="h-4 w-4" />
      case "restricted":
        return <Eye className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  const sampleCoordinates = {
    safe: `{
  "type": "Polygon",
  "coordinates": [[[77.2395, 28.6562], [77.2420, 28.6562], [77.2420, 28.6580], [77.2395, 28.6580], [77.2395, 28.6562]]]
}`,
    danger: `{
  "type": "Polygon", 
  "coordinates": [[[77.1000, 28.5000], [77.1100, 28.5000], [77.1100, 28.5100], [77.1000, 28.5100], [77.1000, 28.5000]]]
}`,
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading geo zones...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Geo-Fenced Zones Management</CardTitle>
              <CardDescription>Create and manage safety zones with automatic alerts</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Zone
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingZone ? "Edit Geo Zone" : "Create New Geo Zone"}</DialogTitle>
                  <DialogDescription>
                    Define a geographical area with safety parameters and automatic alerts
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Zone Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Red Fort Safe Zone"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zone_type">Zone Type *</Label>
                      <Select
                        value={formData.zone_type}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, zone_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select zone type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="safe">Safe Zone</SelectItem>
                          <SelectItem value="caution">Caution Zone</SelectItem>
                          <SelectItem value="danger">Danger Zone</SelectItem>
                          <SelectItem value="restricted">Restricted Zone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the zone and any safety considerations"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="risk_level">Risk Level (1-10)</Label>
                    <Input
                      id="risk_level"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.risk_level}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, risk_level: Number.parseInt(e.target.value) || 1 }))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="coordinates">Coordinates (GeoJSON Polygon) *</Label>
                    <Textarea
                      id="coordinates"
                      value={formData.coordinates}
                      onChange={(e) => setFormData((prev) => ({ ...prev, coordinates: e.target.value }))}
                      placeholder="Enter GeoJSON polygon coordinates"
                      rows={6}
                      className="font-mono text-sm"
                    />
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-gray-600">Sample coordinates:</p>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData((prev) => ({ ...prev, coordinates: sampleCoordinates.safe }))}
                        >
                          Safe Zone Sample
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData((prev) => ({ ...prev, coordinates: sampleCoordinates.danger }))}
                        >
                          Danger Zone Sample
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button type="submit" className="flex-1">
                      {editingZone ? "Update Zone" : "Create Zone"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {zones.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No geo zones created yet</p>
              <p className="text-sm text-gray-400">Create your first zone to start geo-fencing</p>
            </div>
          ) : (
            <div className="space-y-4">
              {zones.map((zone) => (
                <div key={zone.id} className={`p-4 rounded-lg border ${getZoneColor(zone.zone_type)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getZoneIcon(zone.zone_type)}
                      <div>
                        <h3 className="font-medium">{zone.name}</h3>
                        <p className="text-sm opacity-75">{zone.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {zone.zone_type.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Risk: {zone.risk_level}/10
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(zone)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(zone.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
