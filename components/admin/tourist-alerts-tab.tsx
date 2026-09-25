"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertTriangle, MapPin, Clock, CheckCircle, RefreshCw,
  Siren, Heart, Shield, Activity, Search, Radio, Phone,
  Wifi, WifiOff, Zap, Filter, Sparkles, MessageSquare, Layers,
  FileText, CheckCheck, UserCheck
} from "lucide-react"
import { IncidentReportModal } from "@/components/admin/incident-report-modal"

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
  syncedAt?: string
  user: {
    name: string | null
    email: string
    phone: string | null
    emergencyContact: string | null
    emergencyPhone: string | null
    touristIds: { id: string; blockchainHash: string; documentType: string }[]
  } | null
  assignments?: any[]
}

const priorityConfig: Record<string, { label: string; badge: string; border: string; bg: string }> = {
  critical: {
    label: "Critical Priority",
    badge: "bg-red-600 text-white font-black shadow-xs",
    border: "border-red-200 bg-red-50/40",
    bg: "bg-red-500",
  },
  high: {
    label: "High Priority",
    badge: "bg-orange-500 text-white font-bold shadow-xs",
    border: "border-orange-200 bg-orange-50/30",
    bg: "bg-orange-500",
  },
  medium: {
    label: "Medium Priority",
    badge: "bg-amber-100 text-amber-900 border border-amber-300 font-semibold",
    border: "border-amber-100 bg-amber-50/20",
    bg: "bg-amber-500",
  },
  low: {
    label: "Low Priority",
    badge: "bg-blue-100 text-blue-800 border border-blue-200 font-medium",
    border: "border-blue-100 bg-blue-50/10",
    bg: "bg-blue-500",
  },
}

const statusColor: Record<string, string> = {
  active: "bg-red-500 text-white font-bold animate-pulse",
  assistance_requested: "bg-red-600 text-white animate-pulse font-extrabold",
  acknowledged: "bg-yellow-100 text-yellow-800 border border-yellow-300",
  in_progress: "bg-blue-100 text-blue-800 border border-blue-200 font-semibold",
  resolved: "bg-emerald-600 text-white font-bold shadow-xs",
}

const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  sos: { icon: <Siren className="h-4 w-4 text-red-600" />, label: "SOS / Panic", color: "text-red-700 bg-red-50 border-red-200" },
  panic: { icon: <Siren className="h-4 w-4 text-red-600" />, label: "SOS / Panic", color: "text-red-700 bg-red-50 border-red-200" },
  medical: { icon: <Heart className="h-4 w-4 text-pink-600" />, label: "Medical Emergency", color: "text-pink-700 bg-pink-50 border-pink-200" },
  emergency: { icon: <AlertTriangle className="h-4 w-4 text-orange-600" />, label: "General Emergency", color: "text-orange-700 bg-orange-50 border-orange-200" },
  security: { icon: <Shield className="h-4 w-4 text-amber-600" />, label: "Security Alert", color: "text-amber-700 bg-amber-50 border-amber-200" },
  assistance: { icon: <Activity className="h-4 w-4 text-blue-600" />, label: "Tourist Guide & Help", color: "text-blue-700 bg-blue-50 border-blue-200" },
  guide: { icon: <Activity className="h-4 w-4 text-emerald-600" />, label: "Tourist Guide Request", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
}

export function TouristAlertsTab() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  
  // CATEGORY & FILTER STATES
  const [statusFilter, setStatusFilter] = useState("all") // all | active | resolved
  const [priorityFilter, setPriorityFilter] = useState("all") // all | critical | high | medium | low
  const [connectionFilter, setConnectionFilter] = useState("all") // all | offline | online
  const [typeFilter, setTypeFilter] = useState("all")
  
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedReportAlert, setSelectedReportAlert] = useState<Alert | null>(null)

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        includeAnomalies: "false",
        limit: "100",
      })
      const res = await fetch(`/api/admin/alerts?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.alerts || [])
      }
    } catch (e) {
      console.error("Error fetching tourist alerts:", e)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  // Auto-refresh every 5 seconds for live status sync
  useEffect(() => {
    const interval = setInterval(fetchAlerts, 5000)
    return () => clearInterval(interval)
  }, [fetchAlerts])

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

  // Helper to check if alert was offline/SMS generated
  const isOfflineAlert = (alert: Alert) => {
    return Boolean(
      alert.deviceInfo?.offline ||
      alert.deviceInfo?.viaSMS ||
      alert.deviceInfo?.queuedAt ||
      alert.message?.toLowerCase().includes("offline") ||
      alert.message?.toLowerCase().includes("sms") ||
      alert.message?.toLowerCase().includes("twilio")
    )
  }

  // MULTI-CATEGORY FILTER LOGIC
  const filtered = alerts.filter((a) => {
    const q = search.toLowerCase()
    const matchesSearch =
      a.userName.toLowerCase().includes(q) ||
      a.message.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q) ||
      (a.user?.phone && a.user.phone.includes(q)) ||
      (a.user?.email && a.user.email.toLowerCase().includes(q))

    if (!matchesSearch) return false

    // Priority filter
    if (priorityFilter !== "all" && a.severity.toLowerCase() !== priorityFilter.toLowerCase()) {
      return false
    }

    // Connection mode filter
    if (connectionFilter === "offline" && !isOfflineAlert(a)) return false
    if (connectionFilter === "online" && isOfflineAlert(a)) return false

    // Alert type category filter
    if (typeFilter !== "all") {
      if (typeFilter === "sos" && !["sos", "panic"].includes(a.type.toLowerCase())) return false
      if (typeFilter !== "sos" && a.type.toLowerCase() !== typeFilter.toLowerCase()) return false
    }

    return true
  })

  // Category counts
  const totalCount = alerts.length
  const criticalCount = alerts.filter((a) => a.severity === "critical").length
  const highCount = alerts.filter((a) => a.severity === "high").length
  const offlineCount = alerts.filter((a) => isOfflineAlert(a)).length
  const onlineCount = alerts.filter((a) => !isOfflineAlert(a)).length
  const activeCount = alerts.filter((a) => a.status !== "resolved").length
  const resolvedCount = alerts.filter((a) => a.status === "resolved").length

  return (
    <div className="space-y-6">
      {/* HEADER WITH REFRESH & TITLE */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-red-50 rounded-xl text-red-600 border border-red-100">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Alerts Received from Tourist</h2>
              <p className="text-xs text-gray-500">
                Categorized distress signals & completed emergency incident records
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAlerts}
            disabled={loading}
            className="text-xs border-gray-200 hover:bg-gray-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
            Refresh Feed
          </Button>
        </div>
      </div>

      {/* CATEGORY SUMMARY KPI CHIPS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* All Alerts */}
        <button
          onClick={() => {
            setPriorityFilter("all")
            setConnectionFilter("all")
            setStatusFilter("all")
          }}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            priorityFilter === "all" && connectionFilter === "all" && statusFilter === "all"
              ? "bg-gray-900 text-white border-gray-900 shadow-sm"
              : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
          }`}
        >
          <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">All Alerts</p>
          <p className="text-xl font-extrabold mt-0.5">{totalCount}</p>
        </button>

        {/* Critical Priority */}
        <button
          onClick={() => setPriorityFilter(priorityFilter === "critical" ? "all" : "critical")}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            priorityFilter === "critical"
              ? "bg-red-600 text-white border-red-600 shadow-sm"
              : "bg-red-50/50 text-red-900 border-red-200 hover:bg-red-100/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">Critical</p>
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
          </div>
          <p className="text-xl font-extrabold mt-0.5">{criticalCount}</p>
        </button>

        {/* High Priority */}
        <button
          onClick={() => setPriorityFilter(priorityFilter === "high" ? "all" : "high")}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            priorityFilter === "high"
              ? "bg-orange-600 text-white border-orange-600 shadow-sm"
              : "bg-orange-50/50 text-orange-900 border-orange-200 hover:bg-orange-100/50"
          }`}
        >
          <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">High Priority</p>
          <p className="text-xl font-extrabold mt-0.5">{highCount}</p>
        </button>

        {/* Offline / SMS Alerts */}
        <button
          onClick={() => setConnectionFilter(connectionFilter === "offline" ? "all" : "offline")}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            connectionFilter === "offline"
              ? "bg-purple-700 text-white border-purple-700 shadow-sm"
              : "bg-purple-50/50 text-purple-900 border-purple-200 hover:bg-purple-100/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">Offline / SMS</p>
            <WifiOff className="h-3 w-3 opacity-70" />
          </div>
          <p className="text-xl font-extrabold mt-0.5">{offlineCount}</p>
        </button>

        {/* Online Live Alerts */}
        <button
          onClick={() => setConnectionFilter(connectionFilter === "online" ? "all" : "online")}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            connectionFilter === "online"
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-blue-50/50 text-blue-900 border-blue-200 hover:bg-blue-100/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">Online Live</p>
            <Wifi className="h-3 w-3 opacity-70" />
          </div>
          <p className="text-xl font-extrabold mt-0.5">{onlineCount}</p>
        </button>

        {/* Completed & Resolved Chip */}
        <button
          onClick={() => {
            setStatusFilter(statusFilter === "resolved" ? "all" : "resolved")
          }}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === "resolved"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
              : "bg-emerald-50/60 text-emerald-900 border-emerald-200 hover:bg-emerald-100/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">Completed</p>
            <CheckCheck className="h-3 w-3 text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold mt-0.5">{resolvedCount}</p>
        </button>
      </div>

      {/* FILTER SEARCH TOOLBAR */}
      <Card className="border-gray-200/80 shadow-xs bg-white">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
              <Filter className="h-3.5 w-3.5 text-blue-600" />
              <span>Filter by Categories & Parameters:</span>
            </div>
            {(priorityFilter !== "all" || connectionFilter !== "all" || typeFilter !== "all" || statusFilter !== "all" || search) && (
              <button
                onClick={() => {
                  setPriorityFilter("all")
                  setConnectionFilter("all")
                  setTypeFilter("all")
                  setStatusFilter("all")
                  setSearch("")
                }}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
              >
                Reset All Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search name, text, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs h-9 bg-white"
              />
            </div>

            {/* Category 1: Priority Level */}
            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full text-xs h-9 border border-gray-200 rounded-lg px-3 bg-white text-gray-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">⚡ All Priority Levels</option>
                <option value="critical">🔴 Critical Priority Only</option>
                <option value="high">🟠 High Priority Only</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="low">🔵 Low Priority</option>
              </select>
            </div>

            {/* Category 2: Connection Mode */}
            <div>
              <select
                value={connectionFilter}
                onChange={(e) => setConnectionFilter(e.target.value)}
                className="w-full text-xs h-9 border border-gray-200 rounded-lg px-3 bg-white text-gray-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">📡 All Connection Modes</option>
                <option value="offline">📡 Offline Alert (SMS / Mesh / Queued)</option>
                <option value="online">🌐 Online Live Alert (Web / App)</option>
              </select>
            </div>

            {/* Category 3: Alert Type */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full text-xs h-9 border border-gray-200 rounded-lg px-3 bg-white text-gray-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">🚨 All Alert Types</option>
                <option value="sos">🚨 SOS & Panic Signals</option>
                <option value="medical">🩺 Medical Emergencies</option>
                <option value="security">🛡️ Security & Threats</option>
                <option value="emergency">⚠️ General Emergencies</option>
                <option value="assistance">🤝 Tourist Guide & Assistance</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FULL-WIDTH ALERTS REGISTER */}
      <Card className="border-gray-200/80 shadow-xs bg-white">
        <CardHeader className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-row items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span>Tourist Distress Signals Register</span>
              <Badge variant="outline" className="text-[11px] font-bold bg-white text-gray-700">
                {filtered.length} Displayed
              </Badge>
            </CardTitle>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Live feed of categorized tourist distress calls, responder dispatches & verified resolution reports
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className="text-xs h-7 px-2.5 cursor-pointer"
            >
              All
            </Button>
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("active")}
              className="text-xs h-7 px-2.5 cursor-pointer"
            >
              Active ({activeCount})
            </Button>
            <Button
              variant={statusFilter === "resolved" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("resolved")}
              className="text-xs h-7 px-2.5 cursor-pointer"
            >
              Completed ({resolvedCount})
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 divide-y divide-gray-100">
          {loading ? (
            <div className="py-16 text-center text-xs text-gray-400">
              <RefreshCw className="h-7 w-7 animate-spin mx-auto text-blue-500 mb-2" />
              Loading categorized alerts received from tourists...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-xs text-gray-400 space-y-1.5">
              <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="font-semibold text-gray-700">No alerts found matching the selected categories</p>
              <p className="text-[11px] text-gray-400">Try changing the priority, connection mode, or search filters.</p>
            </div>
          ) : (
            filtered.map((alert) => {
              const isResolved = alert.status === "resolved"
              const offline = isOfflineAlert(alert)
              const pConfig = priorityConfig[alert.severity.toLowerCase()] || priorityConfig.medium
              const tConfig = typeConfig[alert.type.toLowerCase()] || {
                icon: <AlertTriangle className="h-4 w-4 text-gray-600" />,
                label: alert.type.toUpperCase(),
                color: "text-gray-700 bg-gray-50 border-gray-200",
              }

              return (
                <div key={alert.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                  {/* TOP ROW: TOURIST INFO, CATEGORY CHIPS, PRIORITY & STATUS */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-gray-100 rounded-xl shrink-0 shadow-xs">
                        {tConfig.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm text-gray-900">{alert.userName}</p>
                          
                          <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.2 border ${tConfig.color}`}>
                            {tConfig.label}
                          </Badge>

                          {offline ? (
                            <Badge className="bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-bold flex items-center gap-1 shadow-2xs">
                              <WifiOff className="h-2.5 w-2.5 text-purple-700" />
                              📡 OFFLINE / SMS SYNC
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              🌐 ONLINE LIVE
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1 text-gray-400">
                            <Clock className="h-3 w-3" />
                            {new Date(alert.createdAt).toLocaleString()}
                          </span>
                          {alert.user?.phone && (
                            <span className="flex items-center gap-1 font-mono text-blue-700 font-semibold">
                              <Phone className="h-3 w-3 text-blue-500" />
                              {alert.user.phone}
                            </span>
                          )}
                          {alert.user?.emergencyPhone && (
                            <span className="flex items-center gap-1 font-mono text-rose-700 font-medium">
                              <Phone className="h-3 w-3 text-rose-500" />
                              Emergency Line: {alert.user.emergencyPhone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`text-[11px] uppercase tracking-wide ${pConfig.badge}`}>
                        {alert.severity} PRIORITY
                      </Badge>
                      <Badge className={`text-[10px] uppercase font-bold ${statusColor[alert.status] || "bg-gray-100 text-gray-700"}`}>
                        {alert.status === "resolved" ? "✓ COMPLETED" : alert.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>

                  {/* INCIDENT MESSAGE & LOCATION BOX */}
                  <div className={`p-3.5 rounded-xl border text-xs text-gray-800 space-y-2 ${pConfig.border}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900 leading-relaxed">{alert.message}</p>
                      {offline && alert.deviceInfo?.queuedAt && (
                        <span className="text-[10px] text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md font-mono shrink-0">
                          Queued Offline: {new Date(alert.deviceInfo.queuedAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>

                    {alert.locationLat && alert.locationLng && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 font-mono pt-1.5 border-t border-gray-200/60 gap-1">
                        <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                          <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0" />
                          <span>Coordinates: {Number(alert.locationLat).toFixed(5)}, {Number(alert.locationLng).toFixed(5)}</span>
                        </div>
                        {alert.deviceInfo?.resolvedBy && (
                          <span className="text-emerald-700 font-sans font-semibold text-[11px]">
                            Resolved by {alert.deviceInfo.resolvedBy}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ACTION BAR: GENERATE REPORT FOR COMPLETED OR RESOLVE BUTTON */}
                  <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                    <span className="text-[11px] text-gray-400 font-medium">
                      {isResolved
                        ? `Operation Completed & Logged (${new Date(alert.deviceInfo?.resolvedAt || alert.createdAt).toLocaleTimeString()})`
                        : alert.status === "in_progress"
                        ? "Emergency unit currently dispatched / En Route"
                        : "Action pending response confirmation"}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* GENERATE INCIDENT REPORT BUTTON */}
                      <Button
                        size="sm"
                        onClick={() => setSelectedReportAlert(alert)}
                        className={`text-xs h-7 px-3 gap-1.5 cursor-pointer font-bold ${
                          isResolved
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Generate Report</span>
                      </Button>

                      {!isResolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(alert.id, "resolved")}
                          disabled={actionLoading === alert.id}
                          className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 cursor-pointer h-7"
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* INCIDENT REPORT MODAL */}
      <IncidentReportModal
        isOpen={!!selectedReportAlert}
        onClose={() => setSelectedReportAlert(null)}
        alert={selectedReportAlert}
      />
    </div>
  )
}
