"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DigitalPersonaModal, type DigitalPersonaData } from "@/components/admin/digital-persona-modal"
import {
  Search, MapPin, Phone, Mail, Battery, Clock, QrCode,
  Shield, AlertTriangle, Eye, Send, Users, RefreshCw, Filter, Sparkles
} from "lucide-react"

interface Tourist extends DigitalPersonaData {}

const statusColor: Record<string, string> = {
  safe: "bg-emerald-100 text-emerald-800 border-emerald-300",
  alert: "bg-amber-100 text-amber-800 border-amber-300",
  emergency: "bg-rose-100 text-rose-800 border-rose-300",
}

const riskColor: Record<string, string> = {
  low: "text-emerald-600 font-semibold",
  medium: "text-amber-600 font-semibold",
  high: "text-orange-600 font-semibold",
  critical: "text-rose-600 font-bold",
  unknown: "text-gray-500",
}

export function TouristsTab() {
  const [tourists, setTourists] = useState<Tourist[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [digiIdOnly, setDigiIdOnly] = useState(false)
  const [selectedPersona, setSelectedPersona] = useState<Tourist | null>(null)
  const [sendingAlert, setSendingAlert] = useState<string | null>(null)

  const fetchTourists = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/tourists")
      if (res.ok) {
        const data = await res.json()
        setTourists(data.tourists)
      }
    } catch (e) {
      console.error("Error fetching tourists:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTourists() }, [fetchTourists])

  const handleSendAlert = async (tourist: Tourist) => {
    setSendingAlert(tourist.id)
    try {
      await fetch("/api/alerts/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: tourist.id,
          type: "admin_notification",
          message: `Safety check from Admin. Please confirm your current status.`,
          severity: "medium",
        }),
      })
    } catch (e) {
      console.error(e)
    } finally {
      setSendingAlert(null)
    }
  }

  const filtered = tourists.filter((t) => {
    const q = search.toLowerCase()
    const matchSearch =
      t.name?.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      t.blockchainId?.toLowerCase().includes(q) ||
      t.digiId?.blockchainHash?.toLowerCase().includes(q)
    const matchStatus = statusFilter === "all" || t.status === statusFilter
    const matchDigiId = !digiIdOnly || !!t.digiId
    return matchSearch && matchStatus && matchDigiId
  })

  const stats = {
    total: tourists.length,
    digiIdCount: tourists.filter((t) => !!t.digiId).length,
    safe: tourists.filter((t) => t.status === "safe").length,
    alert: tourists.filter((t) => t.status === "alert").length,
    emergency: tourists.filter((t) => t.status === "emergency").length,
  }

  return (
    <div className="space-y-4">
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Registered", value: stats.total, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Digi IDs Issued", value: stats.digiIdCount, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Safe Status", value: stats.safe, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Alert Warning", value: stats.alert, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Emergency Alert", value: stats.emergency, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((s) => (
          <Card key={s.label} className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-gray-500 font-medium">{s.label}</p>
                <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <Users className={`h-4 w-4 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Table/List */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-600" />
                Tourist Digital Personas
              </CardTitle>
              <CardDescription>
                View Digital Personas, Digi IDs, live safety metrics, and location tracks
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder="Search name, email, Digi ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 w-52 text-xs"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 px-2 border border-gray-300 rounded-md text-xs bg-white text-gray-700"
              >
                <option value="all">All Status</option>
                <option value="safe">Safe</option>
                <option value="alert">Alert</option>
                <option value="emergency">Emergency</option>
              </select>
              <button
                onClick={() => setDigiIdOnly(!digiIdOnly)}
                className={`h-8 px-3 rounded-md text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                  digiIdOnly
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-purple-700 border-purple-200 hover:bg-purple-50"
                }`}
              >
                <Filter className="h-3 w-3" />
                Digi ID Only ({stats.digiIdCount})
              </button>
              <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={fetchTourists}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-400 py-10 text-xs">Loading tourist digital personas...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-xs">
              {digiIdOnly ? "No tourists with created Digi IDs found." : "No tourists found matching criteria."}
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map((t) => (
                <div
                  key={t.id}
                  className={`border rounded-xl p-4 transition-all ${
                    t.status === "emergency"
                      ? "border-rose-300 bg-rose-50/30"
                      : t.status === "alert"
                      ? "border-amber-300 bg-amber-50/20"
                      : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Identity Info */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="h-11 w-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-sm">
                        {t.name ? t.name.substring(0, 2).toUpperCase() : "??"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-gray-900 text-sm">{t.name || "Anonymous Tourist"}</p>
                          {t.digiId ? (
                            <Badge className="text-[10px] bg-purple-100 text-purple-800 border-purple-200 font-semibold flex items-center gap-1">
                              <Shield className="h-2.5 w-2.5" /> Digi ID Linked
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-gray-400">
                              No Digi ID
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap mt-0.5">
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-gray-400" />{t.email}</span>
                          {t.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-gray-400" />{t.phone}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`text-xs px-2.5 py-0.5 ${statusColor[t.status]}`}>
                        {t.status.toUpperCase()}
                      </Badge>
                      {t.activeAlertsCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {t.activeAlertsCount} Alert{t.activeAlertsCount > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Details summary */}
                  <div className="mt-3.5 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-3 border-t border-slate-100">
                    <div>
                      <p className="text-gray-400 font-medium mb-0.5">Safety Index</p>
                      <p className={`font-bold text-sm ${riskColor[t.riskLevel]}`}>
                        {t.safetyScore}/100 <span className="text-[11px] font-normal capitalize">({t.riskLevel})</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-medium mb-0.5">GPS Location</p>
                      <p className="text-gray-700 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-emerald-600" />
                        {t.currentLocation
                          ? `${t.currentLocation.latitude.toFixed(4)}, ${t.currentLocation.longitude.toFixed(4)}`
                          : "Not Available"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-medium mb-0.5">Last Tracking Ping</p>
                      <p className="text-gray-700 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        {t.currentLocation
                          ? new Date(t.currentLocation.timestamp).toLocaleTimeString()
                          : "Never"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-medium mb-0.5">Emergency Contact</p>
                      <p className="text-gray-800 truncate">
                        {t.emergencyContact || t.digiId?.emergencyContactName || "Not Set"}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      className="h-7 px-3 text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1"
                      onClick={() => setSelectedPersona(t)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Digital Persona
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-xs text-amber-700 hover:bg-amber-50 border-amber-200"
                      disabled={sendingAlert === t.id}
                      onClick={() => handleSendAlert(t)}
                    >
                      <Send className="h-3.5 w-3.5 mr-1" />
                      Safety Check Alert
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Digital Persona Inspection Modal */}
      <DigitalPersonaModal
        isOpen={!!selectedPersona}
        onClose={() => setSelectedPersona(null)}
        persona={selectedPersona}
      />
    </div>
  )
}
