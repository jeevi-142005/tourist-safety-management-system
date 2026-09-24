"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Phone, MapPin, Ambulance } from "lucide-react"

interface Resource {
  id: string
  name: string
  type: string
  phone: string | null
  email: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  isAvailable: boolean
  notes: string | null
  createdAt: string
}

const typeColor: Record<string, string> = {
  hospital: "bg-red-50 text-red-700 border-red-200",
  ambulance: "bg-orange-50 text-orange-700 border-orange-200",
  police: "bg-blue-50 text-blue-700 border-blue-200",
  fire: "bg-yellow-50 text-yellow-700 border-yellow-200",
  security: "bg-purple-50 text-purple-700 border-purple-200",
}

const emptyForm = { name: "", type: "hospital", phone: "", email: "", address: "", latitude: "", longitude: "", notes: "" }

export function ResourcesTab() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState<"add" | "edit" | null>(null)
  const [editing, setEditing] = useState<Resource | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchResources = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/resources")
      if (res.ok) {
        const data = await res.json()
        setResources(data.resources)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchResources() }, [fetchResources])

  const openAdd = () => {
    setForm(emptyForm)
    setEditing(null)
    setDialog("add")
  }

  const openEdit = (r: Resource) => {
    setForm({
      name: r.name,
      type: r.type,
      phone: r.phone || "",
      email: r.email || "",
      address: r.address || "",
      latitude: r.latitude != null ? String(r.latitude) : "",
      longitude: r.longitude != null ? String(r.longitude) : "",
      notes: r.notes || "",
    })
    setEditing(r)
    setDialog("edit")
  }

  const handleSave = async () => {
    if (!form.name || !form.type) return
    setSaving(true)
    try {
      if (dialog === "add") {
        await fetch("/api/admin/resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      } else if (editing) {
        await fetch("/api/admin/resources", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...form }),
        })
      }
      setDialog(null)
      await fetchResources()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await fetch(`/api/admin/resources?id=${id}`, { method: "DELETE" })
      await fetchResources()
    } finally {
      setDeletingId(null)
    }
  }

  const toggleAvailability = async (r: Resource) => {
    await fetch("/api/admin/resources", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id, isAvailable: !r.isAvailable }),
    })
    await fetchResources()
  }

  const available = resources.filter((r) => r.isAvailable).length

  return (
    <div className="space-y-4">
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Ambulance className="h-4 w-4 text-blue-500" />
                Emergency Resources
              </CardTitle>
              <CardDescription>
                {available} of {resources.length} resources available
              </CardDescription>
            </div>
            <Button size="sm" onClick={openAdd} className="h-8">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Resource
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-400 py-8 text-sm">Loading...</p>
          ) : resources.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">No resources added yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="text-left py-2 pr-4">Name</th>
                    <th className="text-left py-2 pr-4">Type</th>
                    <th className="text-left py-2 pr-4">Contact</th>
                    <th className="text-left py-2 pr-4">Location</th>
                    <th className="text-left py-2 pr-4">Status</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {resources.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-gray-800">{r.name}</p>
                        {r.notes && <p className="text-xs text-gray-400 truncate max-w-[160px]">{r.notes}</p>}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge className={`text-xs capitalize border ${typeColor[r.type] || "bg-gray-100 text-gray-700"}`}>
                          {r.type}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {r.phone && (
                          <span className="flex items-center gap-1 text-xs">
                            <Phone className="h-3 w-3" />{r.phone}
                          </span>
                        )}
                        {r.email && <p className="text-xs text-gray-400">{r.email}</p>}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {r.address ? (
                          <span className="flex items-center gap-1 text-xs">
                            <MapPin className="h-3 w-3" />{r.address}
                          </span>
                        ) : r.latitude != null ? (
                          <span className="text-xs font-mono">{r.latitude.toFixed(4)}, {r.longitude?.toFixed(4)}</span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <button
                          onClick={() => toggleAvailability(r)}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border transition-colors ${
                            r.isAvailable
                              ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {r.isAvailable ? "Available" : "Unavailable"}
                        </button>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600"
                            onClick={() => openEdit(r)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-gray-500 hover:text-red-600"
                            disabled={deletingId === r.id}
                            onClick={() => handleDelete(r.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog === "add" ? "Add Emergency Resource" : "Edit Resource"}</DialogTitle>
            <DialogDescription className="sr-only">
              Form to configure emergency responder unit details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1">Name *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="City Hospital" className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Type *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full h-8 px-2 border border-gray-300 rounded-md text-sm bg-white"
                >
                  <option value="hospital">Hospital</option>
                  <option value="ambulance">Ambulance</option>
                  <option value="police">Police</option>
                  <option value="fire">Fire Station</option>
                  <option value="security">Security</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Phone</label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555 000" className="h-8 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1">Address</label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main St" className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Latitude</label>
                <Input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="11.0159" className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Longitude</label>
                <Input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="76.9368" className="h-8 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1">Notes</label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" className="h-8 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button className="flex-1" disabled={saving || !form.name} onClick={handleSave}>
                {saving ? "Saving..." : dialog === "add" ? "Add Resource" : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
