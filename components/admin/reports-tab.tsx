"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FileText, Download, Printer, RefreshCw, Calendar,
  CheckCircle, Clock, Heart, Siren, Shield, Activity, MapPin, Search
} from "lucide-react"

interface ResolvedAlert {
  id: string
  userId: string
  userName: string
  userEmail?: string
  userPhone?: string
  type: string
  message: string
  severity: string
  status: string
  locationLat: number | null
  locationLng: number | null
  createdAt: string
  deviceInfo?: any
  assignments: {
    id: string
    resourceName: string
    resourceType: string
    resourcePhone?: string | null
    assignedAt: string
    status: string
    notes?: string | null
  }[]
}

interface ReportSummary {
  totalResolved: number
  byType: Record<string, number>
  bySeverity: Record<string, number>
  generatedAt: string
  generatedBy: string
}

export function ReportsTab() {
  const [alerts, setAlerts] = useState<ResolvedAlert[]>([])
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const fetchReportData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (typeFilter !== "all") params.append("type", typeFilter)
      if (fromDate) params.append("from", fromDate)
      if (toDate) params.append("to", toDate)

      const res = await fetch(`/api/admin/reports?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.alerts || [])
        setSummary(data.summary || null)
      }
    } catch (e) {
      console.error("Failed to load reports:", e)
    } finally {
      setLoading(false)
    }
  }, [typeFilter, fromDate, toDate])

  useEffect(() => {
    fetchReportData()
  }, [fetchReportData])

  const filteredAlerts = alerts.filter((a) => {
    const q = search.toLowerCase()
    return (
      a.userName.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q) ||
      a.message.toLowerCase().includes(q) ||
      (a.userEmail && a.userEmail.toLowerCase().includes(q))
    )
  })

  const handleExportCSV = () => {
    if (alerts.length === 0) return

    const headers = ["Alert ID", "Tourist Name", "Contact", "Type", "Severity", "Message", "Dispatched Resource", "Created At", "Status"]
    const rows = alerts.map((a) => [
      a.id,
      `"${a.userName}"`,
      `"${a.userPhone || a.userEmail || "N/A"}"`,
      a.type,
      a.severity,
      `"${a.message.replace(/"/g, '""')}"`,
      `"${a.assignments.map((asg) => asg.resourceName).join(", ") || "Auto-Resolved"}"`,
      a.createdAt,
      a.status,
    ])

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `tourist_resolved_alerts_report_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "medical":
        return <Heart className="h-4 w-4 text-pink-600" />
      case "sos":
      case "panic":
        return <Siren className="h-4 w-4 text-red-600" />
      case "security":
        return <Shield className="h-4 w-4 text-amber-600" />
      default:
        return <Activity className="h-4 w-4 text-blue-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER WITH CONTROLS & EXPORT BUTTONS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Resolved Alerts Incident Reports</h2>
              <p className="text-xs text-gray-500">Official audit reports for tourist emergency signals & resolved responses</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReportData}
            disabled={loading}
            className="text-xs border-gray-200 hover:bg-gray-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={alerts.length === 0}
            className="text-xs border-emerald-300 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>

          <Button
            size="sm"
            onClick={handlePrint}
            disabled={alerts.length === 0}
            className="text-xs bg-gray-900 hover:bg-gray-800 text-white"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Print Report
          </Button>
        </div>
      </div>

      {/* SUMMARY METRICS CARDS */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-gray-200/80 shadow-xs bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Resolved</p>
                  <p className="text-2xl font-bold text-emerald-700 mt-0.5">{summary.totalResolved}</p>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200/80 shadow-xs bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Medical Resolved</p>
                  <p className="text-2xl font-bold text-pink-700 mt-0.5">{summary.byType["medical"] || 0}</p>
                </div>
                <div className="p-2.5 bg-pink-50 rounded-xl text-pink-600">
                  <Heart className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200/80 shadow-xs bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">SOS / Panic Resolved</p>
                  <p className="text-2xl font-bold text-red-700 mt-0.5">{(summary.byType["sos"] || 0) + (summary.byType["panic"] || 0)}</p>
                </div>
                <div className="p-2.5 bg-red-50 rounded-xl text-red-600">
                  <Siren className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200/80 shadow-xs bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Security Resolved</p>
                  <p className="text-2xl font-bold text-amber-700 mt-0.5">{summary.byType["security"] || 0}</p>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                  <Shield className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* FILTER BAR */}
      <Card className="border-gray-200/80 shadow-xs bg-white">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tourist name, message..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full text-xs h-9 border border-gray-200 rounded-lg px-3 bg-white text-gray-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Alert Types</option>
                <option value="medical">Medical Emergencies</option>
                <option value="sos">SOS / Panic Signals</option>
                <option value="security">Security Alerts</option>
                <option value="emergency">General Emergencies</option>
              </select>
            </div>

            <div>
              <Input
                type="date"
                placeholder="From Date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div>
              <Input
                type="date"
                placeholder="To Date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RESOLVED INCIDENTS TABLE */}
      <Card className="border-gray-200/80 shadow-xs bg-white overflow-hidden">
        <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-gray-800">Resolved Alerts Register ({filteredAlerts.length})</CardTitle>
            <span className="text-[11px] text-gray-400">Excludes automated anomaly alerts</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-xs text-gray-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-500 mb-2" />
              Generating resolved incident report data...
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              No resolved alerts found matching current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Tourist & Contact</th>
                    <th className="py-3 px-4">Alert Type</th>
                    <th className="py-3 px-4">Incident Message</th>
                    <th className="py-3 px-4">Dispatched Unit</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAlerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-900">{alert.userName}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{alert.userPhone || alert.userEmail || "No contact"}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {getTypeIcon(alert.type)}
                          <span className="font-semibold uppercase text-gray-700 tracking-wide">{alert.type}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-gray-700 truncate">{alert.message}</p>
                        {alert.locationLat && alert.locationLng && (
                          <span className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5">
                            <MapPin className="h-2.5 w-2.5" />
                            {alert.locationLat.toFixed(4)}, {alert.locationLng.toFixed(4)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {alert.assignments && alert.assignments.length > 0 ? (
                          alert.assignments.map((asg) => (
                            <div key={asg.id} className="text-[11px]">
                              <span className="font-bold text-blue-700">{asg.resourceName}</span>
                              {asg.resourcePhone && (
                                <span className="text-gray-400 block text-[10px]">{asg.resourcePhone}</span>
                              )}
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">Auto-Resolved Safe</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span>{new Date(alert.createdAt).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                          ✓ RESOLVED
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
