"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertTriangle, MapPin, Clock, CheckCircle, RefreshCw,
  Siren, Heart, Shield, Activity, Ambulance, Search,
} from "lucide-react"

interface Alert {
  id: string
  userId: string
  userName: string
  type: string
  message: string
  severity: string
  status: string
  locationLat: number | null
  locationLng: number | null
  createdAt: string
  user: {
    name: string | null
    email: string
    phone: string | null
    emergencyContact: string | null
    emergencyPhone: string | null
    touristIds: { id: string; blockchainHash: string; documentType: string }[]
  } | null
}

interface Resource {
  id: string
  name: string
  type: string
  phone: string | null
  isAvailable: boolean
}

const severityColor: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-blue-100 text-blue-800 border-blue-200",
}

const statusColor: Record<string, string> = {
  active: "bg-red-100 text-red-700",
  acknowledged: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
}

const typeIcon: Record<string, React.ReactNode> = {
  sos: <Siren className="h-4 w-4 text-red-600" />,
  panic: <Siren className="h-4 w-4 text-red-600" />,
  medical: <Heart className="h-4 w-4 text-pink-600" />,
  emergency: <AlertTriangle className="h-4 w-4 text-orange-600" />,
  security: <Shield className="h-4 w-4 text-yellow-600" />,
  assistance: <Activity className="h-4 w-4 text-blue-600" />,
}

export function AlertsTab({ defaultFilter = "active", title = "Alert & Emergency Command Center" }: { defaultFilter?: string; title?: string }) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState(defaultFilter)
  const [typeFilter, setTypeFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [assignDialog, setAssignDialog] = useState<Alert | null>(null)
  const [detailAlert, setDetailAlert] = useState<Alert | null>(null)
  const [selectedResource, setSelectedResource] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        type: typeFilter,
        severity: severityFilter,
        page: String(page),
        limit: "20",
      })
      const res = await fetch(`/api/admin/alerts?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.alerts)
        setTotalPages(data.pages)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, typeFilter, severityFilter, page])

  const fetchResources = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/resources")
      if (res.ok) {
        const data = await res.json()
        setResources(data.resources)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => { fetchAlerts() }, [fetchAlerts])
  useEffect(() => { fetchResources() }, [fetchResources])

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(id)
    try {
      await fetch("/api/admin/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })
      await fetchAlerts()
    } finally {
      setActionLoading(null)
    }
  }

  const assignResource = async () => {
    if (!assignDialog || !selectedResource) return
    setActionLoading(assignDialog.id)
    try {
      await fetch("/api/admin/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: assignDialog.id, resourceId: selectedResource, status: "in_progress" }),
      })
      setAssignDialog(null)
      setSelectedResource("")
      await fetchAlerts()
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = alerts.filter((a) => {
    const q = search.toLowerCase()
    return (
      a.userName.toLowerCase().includes(q) ||
      a.message.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q)
    )
  })

  const activeCount = alerts.filter((a) => a.status === "active").length
  const sosCount = alerts.filter((a) => ["sos", "panic"].includes(a.type)).length
  const medicalCount = alerts.filter((a) => a.type === "medical").length

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-white border-red-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Active Alerts</p>
              <p className="text-2xl font-bold text-red-600">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-orange-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg"><Siren className="h-5 w-5 text-orange-600" /></div>
            <div>
              <p className="text-xs text-gray-500">SOS / Panic</p>
              <p className="text-2xl font-bold text-orange-600">{sosCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-pink-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-pink-50 rounded-lg"><Heart className="h-5 w-5 text-pink-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Medical</p>
              <p className="text-2xl font-bold text-pink-600">{medicalCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Alert Center
              </CardTitle>
              <CardDescription>Monitor and respond to all tourist alerts</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder="Search alerts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 w-44 text-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                className="h-8 px-2 border border-gray-300 rounded-md text-sm bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
                className="h-8 px-2 border border-gray-300 rounded-md text-sm bg-white"
              >
                <option value="all">All Types</option>
                <option value="sos">SOS / Panic</option>
                <option value="medical">Medical</option>
                <option value="emergency">Emergency</option>
                <option value="security">Security</option>
              </select>
              <select
                value={severityFilter}
                onChange={(e) => { setSeverityFilter(e.target.value); setPage(1) }}
                className="h-8 px-2 border border-gray-300 rounded-md text-sm bg-white"
              >
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <Button size="sm" variant="outline" className="h-8" onClick={fetchAlerts}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-400 py-8 text-sm">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">No alerts found</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((alert) => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 ${
                    alert.status === "active" && ["critical", "high"].includes(alert.severity)
                      ? "border-red-200 bg-red-50/30"
                      : "border-gray-100 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        {typeIcon[alert.type] ?? <AlertTriangle className="h-4 w-4 text-gray-500" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm text-gray-900 uppercase">{alert.type}</span>
                          <Badge className={`text-[10px] border ${severityColor[alert.severity] || "bg-gray-100 text-gray-700"}`}>
                            {alert.severity}
                          </Badge>
                          <Badge className={`text-[10px] ${statusColor[alert.status] || "bg-gray-100 text-gray-600"}`}>
                            {alert.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">{alert.message}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                          <span className="font-medium text-gray-700">{alert.userName}</span>
                          {alert.user?.email && <span>{alert.user.email}</span>}
                          {alert.locationLat && alert.locationLng && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {alert.locationLat.toFixed(4)}, {alert.locationLng.toFixed(4)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(alert.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {alert.user?.emergencyContact && (
                          <p className="text-xs text-gray-400 mt-1">
                            Emergency: {alert.user.emergencyContact} {alert.user.emergencyPhone && `· ${alert.user.emergencyPhone}`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {alert.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs text-yellow-600 hover:bg-yellow-50"
                          disabled={actionLoading === alert.id}
                          onClick={() => updateStatus(alert.id, "acknowledged")}
                        >
                          Acknowledge
                        </Button>
                      )}
                      {["active", "acknowledged"].includes(alert.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs text-blue-600 hover:bg-blue-50"
                          disabled={actionLoading === alert.id}
                          onClick={() => setAssignDialog(alert)}
                        >
                          <Ambulance className="h-3 w-3 mr-1" />
                          Assign
                        </Button>
                      )}
                      {alert.status !== "resolved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs text-green-600 hover:bg-green-50"
                          disabled={actionLoading === alert.id}
                          onClick={() => updateStatus(alert.id, "resolved")}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Prev
              </Button>
              <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
              <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resource Assignment Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={() => { setAssignDialog(null); setSelectedResource("") }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Emergency Resource</DialogTitle>
          </DialogHeader>
          {assignDialog && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-medium">{assignDialog.userName}</p>
                <p className="text-gray-500 text-xs mt-0.5">{assignDialog.type} · {assignDialog.severity}</p>
                <p className="text-gray-600 text-xs mt-1">{assignDialog.message}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Select Resource</label>
                <select
                  value={selectedResource}
                  onChange={(e) => setSelectedResource(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm bg-white"
                >
                  <option value="">Choose a resource...</option>
                  {resources.filter((r) => r.isAvailable).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.type}){r.phone ? ` · ${r.phone}` : ""}
                    </option>
                  ))}
                </select>
                {resources.filter((r) => r.isAvailable).length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">No available resources. Add resources in the Resources tab.</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  disabled={!selectedResource || actionLoading === assignDialog.id}
                  onClick={assignResource}
                >
                  Assign & Set In Progress
                </Button>
                <Button variant="outline" onClick={() => { setAssignDialog(null); setSelectedResource("") }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
