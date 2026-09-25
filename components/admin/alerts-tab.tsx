"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertTriangle, MapPin, Clock, CheckCircle, RefreshCw,
  Siren, Heart, Shield, Activity, Ambulance, Search,
  Zap, Bot, Phone, Radio, ArrowRight, UserCheck
} from "lucide-react"

interface AlertAssignment {
  id: string
  resourceId: string
  resourceName: string
  resourceType: string
  resourcePhone?: string | null
  assignedAt: string
  status: string
  notes?: string | null
}

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
  deviceInfo?: any
  createdAt: string
  user: {
    name: string | null
    email: string
    phone: string | null
    emergencyContact: string | null
    emergencyPhone: string | null
    touristIds: { id: string; blockchainHash: string; documentType: string }[]
  } | null
  assignments?: AlertAssignment[]
}

const severityColor: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-blue-100 text-blue-800 border-blue-200",
}

const statusColor: Record<string, string> = {
  active: "bg-red-100 text-red-700 border-red-200",
  acknowledged: "bg-yellow-100 text-yellow-700 border-yellow-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  assistance_requested: "bg-red-600 text-white animate-pulse font-bold",
}

const typeIcon: Record<string, React.ReactNode> = {
  sos: <Siren className="h-4 w-4 text-red-600" />,
  panic: <Siren className="h-4 w-4 text-red-600" />,
  medical: <Heart className="h-4 w-4 text-pink-600" />,
  emergency: <AlertTriangle className="h-4 w-4 text-orange-600" />,
  security: <Shield className="h-4 w-4 text-yellow-600" />,
  assistance: <Activity className="h-4 w-4 text-blue-600" />,
}

export function AlertsTab({ defaultFilter = "active", title = "Alerts & Automated Resource Dispatch" }: { defaultFilter?: string; title?: string }) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [isAutoTriaging, setIsAutoTriaging] = useState(false)
  const [triageToast, setTriageToast] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        includeAnomalies: "false", // Exclude anomaly detected alerts as requested
        limit: "50",
      })
      const res = await fetch(`/api/admin/alerts?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.alerts || [])
      }
    } catch (e) {
      console.error("Error fetching alerts:", e)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  // Auto-refresh alerts every 10s
  useEffect(() => {
    const interval = setInterval(fetchAlerts, 10000)
    return () => clearInterval(interval)
  }, [fetchAlerts])

  // Resolve alert
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

  // AI Auto-Dispatch all unassigned alerts
  const handleBulkAutoTriage = async () => {
    setIsAutoTriaging(true)
    try {
      const res = await fetch("/api/admin/auto-triage", { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setTriageToast(
          data.dispatched > 0
            ? `⚡ Auto-Dispatched ${data.dispatched} alert(s) to emergency units automatically!`
            : "✓ All alerts already assigned — system up to date."
        )
        setTimeout(() => setTriageToast(null), 5000)
        await fetchAlerts()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsAutoTriaging(false)
    }
  }

  const filtered = alerts.filter((a) => {
    const q = search.toLowerCase()
    return (
      a.userName.toLowerCase().includes(q) ||
      a.message.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q) ||
      (a.user?.phone && a.user.phone.includes(q))
    )
  })

  // Alerts with active status
  const activeAlerts = filtered.filter((a) => a.status !== "resolved")
  const resolvedAlerts = filtered.filter((a) => a.status === "resolved")

  return (
    <div className="space-y-6">
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-50 rounded-xl text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              <p className="text-xs text-gray-500">Live tourist distress signals & AI auto-dispatched emergency units (Excludes anomaly alerts)</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={handleBulkAutoTriage}
            disabled={isAutoTriaging}
            className="text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold shadow-xs flex items-center gap-1.5"
          >
            {isAutoTriaging ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Bot className="h-3.5 w-3.5" />}
            Auto-Dispatch All
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchAlerts}
            disabled={loading}
            className="text-xs border-gray-200 hover:bg-gray-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* AUTO DISPATCH TOAST BANNER */}
      {triageToast && (
        <div className="flex items-center gap-2 p-3 bg-violet-50 border border-violet-200 rounded-xl text-xs font-semibold text-violet-900 animate-in fade-in shadow-xs">
          <Bot className="h-4 w-4 text-violet-600 shrink-0" />
          <span>{triageToast}</span>
        </div>
      )}

      {/* SEARCH AND FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tourist name, alert message, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className="text-xs h-9"
          >
            All Alerts ({alerts.length})
          </Button>
          <Button
            variant={statusFilter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("active")}
            className="text-xs h-9"
          >
            Active ({alerts.filter((a) => a.status !== "resolved").length})
          </Button>
          <Button
            variant={statusFilter === "resolved" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("resolved")}
            className="text-xs h-9"
          >
            Resolved ({alerts.filter((a) => a.status === "resolved").length})
          </Button>
        </div>
      </div>

      {/* 2-COLUMN VIEW AS SPECIFIED IN HANDWRITTEN DIAGRAM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COLUMN 1: ALERTS RECEIVED FROM TOURIST (NOT ANOMALY ALERTS) */}
        <Card className="border-gray-200/80 shadow-xs bg-white flex flex-col">
          <CardHeader className="p-4 border-b border-gray-100 bg-red-50/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-100 rounded-lg text-red-700">
                  <Radio className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-gray-900">
                    Alerts Received from Tourist
                  </CardTitle>
                  <p className="text-[11px] text-gray-500">Real distress alerts sent by tourists (Not anomaly alerts)</p>
                </div>
              </div>
              <Badge className="bg-red-100 text-red-800 border-red-200 text-xs font-bold">
                {filtered.length} Total
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-4 flex-1 divide-y divide-gray-100 max-h-[700px] overflow-y-auto">
            {loading ? (
              <div className="py-12 text-center text-xs text-gray-400">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-500 mb-2" />
                Loading tourist distress alerts...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                No tourist distress alerts found.
              </div>
            ) : (
              filtered.map((alert) => {
                const isResolved = alert.status === "resolved"
                return (
                  <div key={alert.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gray-100 rounded-lg shrink-0">
                          {typeIcon[alert.type.toLowerCase()] || <AlertTriangle className="h-4 w-4 text-gray-600" />}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-gray-900">{alert.userName}</p>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400">
                            <Clock className="h-2.5 w-2.5" />
                            <span>{new Date(alert.createdAt).toLocaleString()}</span>
                            {alert.user?.phone && (
                              <span className="font-mono text-gray-600">📞 {alert.user.phone}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge className={`text-[10px] uppercase font-bold ${severityColor[alert.severity] || "bg-gray-100 text-gray-700"}`}>
                          {alert.severity}
                        </Badge>
                        <Badge className={`text-[10px] uppercase font-bold ${statusColor[alert.status] || "bg-gray-100 text-gray-700"}`}>
                          {alert.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </div>

                    <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 text-xs text-gray-700 leading-relaxed">
                      <p className="font-medium text-gray-800">{alert.message}</p>
                      {alert.locationLat && alert.locationLng && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400 font-mono">
                          <MapPin className="h-3 w-3 text-red-500" />
                          <span>GPS: {alert.locationLat.toFixed(4)}, {alert.locationLng.toFixed(4)}</span>
                        </div>
                      )}
                    </div>

                    {/* Action button */}
                    {!isResolved && (
                      <div className="flex justify-end pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(alert.id, "resolved")}
                          disabled={actionLoading === alert.id}
                          className="text-[10px] h-7 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Mark Resolved
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* COLUMN 2: ALERTS AUTO-SENT TO REQUIRED RESOURCES */}
        <Card className="border-gray-200/80 shadow-xs bg-white flex flex-col">
          <CardHeader className="p-4 border-b border-gray-100 bg-blue-50/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg text-blue-700">
                  <Ambulance className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-gray-900">
                    Auto-Dispatched Resources
                  </CardTitle>
                  <p className="text-[11px] text-gray-500">Alerts sent automatically to Required Resources in Resource dashboard</p>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs font-bold">
                Auto-Dispatch Live
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-4 flex-1 divide-y divide-gray-100 max-h-[700px] overflow-y-auto">
            {loading ? (
              <div className="py-12 text-center text-xs text-gray-400">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-500 mb-2" />
                Loading dispatched resource units...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                <Bot className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                No dispatched resources active.
              </div>
            ) : (
              filtered.map((alert) => {
                const assignments = alert.assignments || []
                const autoDispatchedInfo = alert.deviceInfo?.assignedResourceName

                return (
                  <div key={`asg-${alert.id}`} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-800">{alert.userName}</span>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <span className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold">{alert.type}</span>
                      </div>
                      <Badge className="bg-violet-50 text-violet-700 border-violet-200 text-[10px] font-bold">
                        <Bot className="h-2.5 w-2.5 mr-1" />
                        AUTO-ASSIGNED
                      </Badge>
                    </div>

                    {assignments.length > 0 ? (
                      assignments.map((asg) => (
                        <div key={asg.id} className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Ambulance className="h-4 w-4 text-blue-600" />
                              <span className="font-bold text-xs text-blue-900">{asg.resourceName}</span>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">
                              {asg.status}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-gray-600 pt-1">
                            {asg.resourcePhone ? (
                              <span className="flex items-center gap-1 text-blue-700 font-medium">
                                <Phone className="h-3 w-3 text-blue-500" />
                                {asg.resourcePhone}
                              </span>
                            ) : (
                              <span className="text-gray-400">Emergency Line Assigned</span>
                            )}
                            <span className="text-[10px] text-gray-400 font-mono">
                              {new Date(asg.assignedAt).toLocaleTimeString()}
                            </span>
                          </div>

                          {asg.notes && (
                            <p className="text-[10px] text-gray-500 italic bg-white/70 p-1.5 rounded-md border border-blue-50 mt-1">
                              {asg.notes}
                            </p>
                          )}
                        </div>
                      ))
                    ) : autoDispatchedInfo ? (
                      <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-blue-900">{autoDispatchedInfo}</span>
                          <Badge className="bg-blue-100 text-blue-800 text-[10px] font-bold">En Route</Badge>
                        </div>
                        {alert.deviceInfo?.assignedResourcePhone && (
                          <p className="text-[11px] text-blue-700 font-medium">
                            📞 {alert.deviceInfo.assignedResourcePhone}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100 flex items-center justify-between text-xs">
                        <span className="text-amber-800 font-medium text-[11px]">No unit assigned yet</span>
                        <Button
                          size="sm"
                          onClick={() => handleBulkAutoTriage()}
                          className="text-[10px] h-6 bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          Auto-Assign Now
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
