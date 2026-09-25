"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Ambulance, Shield, Siren, AlertTriangle, Phone, Clock,
  RefreshCw, Bot, CheckCircle, Search, Radio, ArrowRight, UserCheck, Activity,
  FileText, CheckCheck
} from "lucide-react"
import { IncidentReportModal } from "@/components/admin/incident-report-modal"

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
  } | null
  assignments?: AlertAssignment[]
}

const unitIcon: Record<string, React.ReactNode> = {
  ambulance: <Ambulance className="h-4 w-4 text-pink-600" />,
  hospital: <Ambulance className="h-4 w-4 text-pink-600" />,
  police: <Siren className="h-4 w-4 text-blue-600" />,
  security: <Shield className="h-4 w-4 text-amber-600" />,
  fire: <AlertTriangle className="h-4 w-4 text-orange-600" />,
  guide: <Activity className="h-4 w-4 text-emerald-600" />,
}

export function DispatchedResourcesTab() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [tabFilter, setTabFilter] = useState<"all" | "active" | "completed">("all")
  const [isAutoTriaging, setIsAutoTriaging] = useState(false)
  const [triageToast, setTriageToast] = useState<string | null>(null)
  const [selectedReportAlert, setSelectedReportAlert] = useState<Alert | null>(null)

  const fetchDispatches = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        includeAnomalies: "false",
        limit: "100",
      })
      const res = await fetch(`/api/admin/alerts?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.alerts || [])
      }
    } catch (e) {
      console.error("Error fetching dispatched alerts:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDispatches()
  }, [fetchDispatches])

  // Auto-refresh every 5 seconds for live status synchronization
  useEffect(() => {
    const interval = setInterval(fetchDispatches, 5000)
    return () => clearInterval(interval)
  }, [fetchDispatches])

  const handleBulkAutoTriage = async () => {
    setIsAutoTriaging(true)
    try {
      const res = await fetch("/api/admin/auto-triage", { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setTriageToast(
          data.dispatched > 0
            ? `⚡ AI auto-assigned and dispatched ${data.dispatched} emergency resource(s)!`
            : "✓ All active alerts are already assigned to emergency units."
        )
        setTimeout(() => setTriageToast(null), 5000)
        await fetchDispatches()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsAutoTriaging(false)
    }
  }

  const activeDispatches = alerts.filter(
    (a) =>
      a.status !== "resolved" &&
      ((a.assignments && a.assignments.length > 0 && a.assignments.some((asg) => asg.status !== "completed")) ||
        a.deviceInfo?.assignedResourceName)
  )

  const completedDispatches = alerts.filter(
    (a) =>
      a.status === "resolved" ||
      (a.assignments && a.assignments.length > 0 && a.assignments.every((asg) => asg.status === "completed")) ||
      Boolean(a.deviceInfo?.resolvedAt)
  )

  const displayList =
    tabFilter === "active"
      ? activeDispatches
      : tabFilter === "completed"
      ? completedDispatches
      : alerts

  const filtered = displayList.filter((a) => {
    const q = search.toLowerCase()
    const resourceNames = (a.assignments || []).map((asg) => asg.resourceName.toLowerCase()).join(" ")
    return (
      a.userName.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q) ||
      a.message.toLowerCase().includes(q) ||
      resourceNames.includes(q) ||
      (a.user?.phone && a.user.phone.includes(q))
    )
  })

  return (
    <div className="space-y-6">
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Ambulance className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Auto-Dispatched Resources</h2>
              <p className="text-xs text-gray-500">Live operational feed of emergency units, responders & completed mission reports</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={handleBulkAutoTriage}
            disabled={isAutoTriaging}
            className="text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            {isAutoTriaging ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Bot className="h-3.5 w-3.5" />}
            Auto-Dispatch Unassigned
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchDispatches}
            disabled={loading}
            className="text-xs border-gray-200 hover:bg-gray-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* TOAST BANNER */}
      {triageToast && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-semibold text-blue-900 animate-in fade-in shadow-xs">
          <Bot className="h-4 w-4 text-blue-600 shrink-0" />
          <span>{triageToast}</span>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          onClick={() => setTabFilter("all")}
          className={`border-gray-200/80 shadow-xs bg-white cursor-pointer transition-all ${
            tabFilter === "all" ? "ring-2 ring-slate-800" : ""
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Dispatches</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{alerts.length}</p>
            </div>
            <div className="p-2.5 bg-gray-100 rounded-xl text-gray-600">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setTabFilter("active")}
          className={`border-gray-200/80 shadow-xs bg-white cursor-pointer transition-all ${
            tabFilter === "active" ? "ring-2 ring-blue-600" : ""
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Active Missions</p>
              <p className="text-2xl font-bold text-blue-700 mt-0.5">{activeDispatches.length}</p>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
              <Ambulance className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setTabFilter("completed")}
          className={`border-gray-200/80 shadow-xs bg-white cursor-pointer transition-all ${
            tabFilter === "completed" ? "ring-2 ring-emerald-600" : ""
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Completed Operations</p>
              <p className="text-2xl font-bold text-emerald-700 mt-0.5">{completedDispatches.length}</p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTER TABS & SEARCH INPUT */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200/80">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setTabFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tabFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Operations ({alerts.length})
          </button>
          <button
            onClick={() => setTabFilter("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tabFilter === "active" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Active Missions ({activeDispatches.length})
          </button>
          <button
            onClick={() => setTabFilter("completed")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tabFilter === "completed" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Completed & Audited ({completedDispatches.length})
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search responder name, tourist, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9 bg-slate-50 border-slate-200"
          />
        </div>
      </div>

      {/* DISPATCHED UNITS REGISTER */}
      <Card className="border-gray-200/80 shadow-xs bg-white">
        <CardHeader className="p-4 border-b border-gray-100 bg-blue-50/40 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-gray-900">
              Emergency Resource Assignments Register ({filtered.length})
            </CardTitle>
            <p className="text-[11px] text-gray-500">Live feed of automatically matched units sent for each tourist distress signal</p>
          </div>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs font-bold">
            ⚡ Real-Time Sync Active
          </Badge>
        </CardHeader>

        <CardContent className="p-4 divide-y divide-gray-100">
          {loading ? (
            <div className="py-16 text-center text-xs text-gray-400">
              <RefreshCw className="h-7 w-7 animate-spin mx-auto text-blue-500 mb-2" />
              Loading auto-dispatched resources...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-xs text-gray-400 space-y-1.5">
              <CheckCircle className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <p className="font-semibold text-gray-700">No matching resource dispatches found.</p>
              <p className="text-[11px] text-gray-400">Try changing the tab filter or search query.</p>
            </div>
          ) : (
            filtered.map((alert) => {
              const assignments = alert.assignments || []
              const isResolved = alert.status === "resolved"

              return (
                <div key={alert.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-gray-900">{alert.userName}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                      <Badge className="bg-gray-100 text-gray-700 uppercase text-[10px] font-bold">
                        {alert.type}
                      </Badge>
                      <span className="text-xs text-gray-500 truncate max-w-sm">
                        {alert.message}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={`${isResolved ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"} text-[10px] font-bold flex items-center gap-1`}>
                        {isResolved ? "COMPLETED OPERATION" : "AUTO-ASSIGNED"}
                      </Badge>

                      {/* GENERATE REPORT ACTION BUTTON */}
                      <Button
                        size="sm"
                        onClick={() => setSelectedReportAlert(alert)}
                        className="text-xs h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 cursor-pointer shadow-2xs"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Generate Report
                      </Button>
                    </div>
                  </div>

                  {assignments.length > 0 ? (
                    assignments.map((asg) => (
                      <div key={asg.id} className={`p-4 rounded-xl border space-y-2 ${isResolved ? "bg-emerald-50/50 border-emerald-200" : "bg-blue-50/70 border-blue-100"}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-white rounded-lg shadow-xs">
                              {unitIcon[asg.resourceType.toLowerCase()] || <Ambulance className="h-4 w-4 text-blue-600" />}
                            </div>
                            <div>
                              <p className="font-bold text-xs text-slate-900">{asg.resourceName}</p>
                              <p className="text-[11px] text-slate-600 capitalize font-medium">Unit Role: {asg.resourceType}</p>
                            </div>
                          </div>

                          <Badge className={`${
                            asg.status === "completed" || isResolved
                              ? "bg-emerald-600 text-white"
                              : asg.status === "en_route"
                              ? "bg-blue-600 text-white"
                              : "bg-amber-500 text-white"
                          } text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5`}>
                            {asg.status === "completed" || isResolved ? "✓ COMPLETED" : asg.status}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center justify-between text-xs text-gray-600 pt-1 border-t border-slate-200/60">
                          {asg.resourcePhone ? (
                            <span className="flex items-center gap-1.5 text-blue-800 font-semibold font-mono">
                              <Phone className="h-3.5 w-3.5 text-blue-600" />
                              Emergency Line: {asg.resourcePhone}
                            </span>
                          ) : (
                            <span className="text-gray-500 italic">Emergency Dispatch Line Connected</span>
                          )}
                          <span className="text-[11px] text-gray-500 font-mono">
                            Dispatched: {new Date(asg.assignedAt).toLocaleString()}
                          </span>
                        </div>

                        {asg.notes && (
                          <div className="text-[11px] text-gray-700 bg-white/90 p-2 rounded-lg border border-slate-200">
                            <strong>Dispatch Log & Notes:</strong> {asg.notes}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                      <span>Assigned to {alert.deviceInfo?.assignedResourceName || "Specialist Unit"} (Direct Queue)</span>
                      <span className="font-mono text-[10px]">{new Date(alert.createdAt).toLocaleTimeString()}</span>
                    </div>
                  )}
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
