"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, AlertTriangle, Shield, Activity, QrCode, Bell, CheckCircle, Siren, MapPin, ArrowRight, Clock, Sparkles } from "lucide-react"

interface Stats {
  totalTourists: number
  totalDigiIds: number
  activeTourists: number
  activeAlerts: number
  sosAlerts: number
  medicalAlerts: number
  expiredDigiIds: number
  unreadNotifications: number
  resolvedToday: number
  recentAlerts: RecentAlert[]
}

interface RecentAlert {
  id: string
  type: string
  message: string
  severity: string
  status: string
  userName: string
  locationLat: number | null
  locationLng: number | null
  createdAt: string
}

const severityColor: Record<string, string> = {
  critical: "bg-rose-100 text-rose-800 border-rose-300 font-bold",
  high: "bg-orange-100 text-orange-800 border-orange-300 font-semibold",
  medium: "bg-amber-100 text-amber-800 border-amber-300",
  low: "bg-blue-100 text-blue-800 border-blue-300",
}

const statusColor: Record<string, string> = {
  active: "bg-rose-500 text-white font-bold animate-pulse",
  acknowledged: "bg-amber-100 text-amber-800 border border-amber-300",
  in_progress: "bg-blue-100 text-blue-800 border border-blue-300 font-medium",
  resolved: "bg-emerald-100 text-emerald-800 border border-emerald-300",
}

export function OverviewTab({ stats, onNavigate }: { stats: Stats | null; onNavigate?: (tab: string) => void }) {
  if (!stats) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse p-4">
              <div className="h-4 w-20 bg-slate-200 rounded mb-3" />
              <div className="h-6 w-12 bg-slate-300 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const urgentAlerts = (stats.recentAlerts || []).filter(
    (a: any) => a.status === "active" || a.severity === "critical" || a.severity === "high"
  )

  const cards = [
    { label: "Digi ID Tourists", value: stats.totalDigiIds, icon: QrCode, color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
    { label: "Active Tourists", value: stats.activeTourists, icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
    { label: "Active Alerts", value: stats.activeAlerts, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
    { label: "Emergency Alerts", value: stats.sosAlerts, icon: Siren, color: "text-rose-600", bg: "bg-rose-50 border-rose-100" },
    { label: "Medical Alerts", value: stats.medicalAlerts, icon: Shield, color: "text-pink-600", bg: "bg-pink-50 border-pink-100" },
    { label: "Unresolved Alerts", value: stats.activeAlerts, icon: Clock, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
  ]

  return (
    <div className="space-y-6">
      {/* URGENT DANGER COMMAND BANNER */}
      {urgentAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-rose-950 text-white rounded-2xl p-5 shadow-lg border border-rose-800/60 relative overflow-hidden">
          <div className="flex items-start justify-between gap-4 flex-wrap relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500 animate-ping" />
                <Badge className="bg-rose-500 text-white font-bold text-xs uppercase tracking-wide">
                  Immediate Intervention Required ({urgentAlerts.length})
                </Badge>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                Active Danger / SOS Alerts Detected
              </h2>
              <p className="text-xs text-rose-200">
                Tourists in high-risk conditions require rapid emergency resource dispatch and status confirmation.
              </p>
            </div>
            {onNavigate && (
              <Button
                onClick={() => onNavigate("alerts")}
                className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-4 py-2 shadow-md shrink-0"
              >
                Go to Alert Command Center
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 relative z-10">
            {urgentAlerts.slice(0, 2).map((alert) => (
              <div
                key={alert.id}
                className="bg-slate-900/90 backdrop-blur-xs border border-rose-500/40 rounded-xl p-3.5 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{alert.userName}</span>
                    <Badge className={`text-[10px] ${severityColor[alert.severity] || "bg-gray-100"}`}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <span className="text-[10px] text-rose-300 uppercase font-semibold">{alert.type}</span>
                  </div>
                  <p className="text-slate-300 line-clamp-1">{alert.message}</p>
                  {alert.locationLat && alert.locationLng && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                      <MapPin className="h-3 w-3 text-rose-400 shrink-0" />
                      <span>{alert.locationLat.toFixed(4)}, {alert.locationLng.toFixed(4)}</span>
                    </div>
                  )}
                </div>
                {onNavigate && (
                  <Button
                    size="sm"
                    onClick={() => onNavigate("alerts")}
                    className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-[11px] h-7 shrink-0"
                  >
                    Respond
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className={`bg-white border shadow-xs hover:shadow-md transition-shadow rounded-xl ${c.bg}`}>
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{c.label}</p>
                  <p className={`text-2xl font-black mt-0.5 ${c.color}`}>{c.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${c.bg} border shrink-0`}>
                  <c.icon className={`h-5 w-5 ${c.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.expiredDigiIds > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span><strong>{stats.expiredDigiIds}</strong> Digi ID(s) have expired. Review status or initiate token renewal.</span>
          </div>
          {onNavigate && (
            <Button size="sm" variant="outline" className="h-7 text-xs bg-white text-amber-800 border-amber-300" onClick={() => onNavigate("digi-ids")}>
              Review Digi IDs
            </Button>
          )}
        </div>
      )}

      {/* DASHBOARD MAIN SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RECENT ALERTS LIST */}
        <Card className="lg:col-span-2 bg-white border-slate-200 shadow-xs rounded-2xl">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                Live Incident & Alert Feed
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Recent safety alerts across active Digi ID holders
              </CardDescription>
            </div>
            {onNavigate && (
              <Button size="sm" variant="ghost" className="text-xs text-blue-600 hover:text-blue-700" onClick={() => onNavigate("alerts")}>
                View All Alerts <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-4">
            {(stats.recentAlerts || []).length === 0 ? (
              <div className="text-center py-10 text-slate-400 space-y-2">
                <CheckCircle className="h-8 w-8 mx-auto text-emerald-500/60" />
                <p className="text-xs font-medium">All clear! No active alerts or safety warnings.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {(stats.recentAlerts || []).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-3 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900">{alert.userName}</span>
                        <Badge className={`text-[10px] px-2 py-0.5 ${severityColor[alert.severity] || "bg-slate-100"}`}>
                          {alert.severity}
                        </Badge>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">— {alert.type}</span>
                      </div>
                      <p className="text-xs text-slate-600 truncate">{alert.message}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        <span>{new Date(alert.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        {alert.locationLat && (
                          <span className="flex items-center gap-0.5 font-mono">
                            <MapPin className="h-2.5 w-2.5" />
                            {alert.locationLat.toFixed(3)}, {alert.locationLng?.toFixed(3)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge className={`text-[10px] shrink-0 capitalize ${statusColor[alert.status] || "bg-slate-100"}`}>
                      {alert.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* RIGHT SIDEBAR: SAFETY DISTRIBUTION & QUICK STATS */}
        <div className="space-y-6">
          <Card className="bg-white border-slate-200 shadow-xs rounded-2xl">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500" />
                Tourist Safety Status
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">Live network safety breakdown</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-3 w-3 bg-emerald-500 rounded-full" />
                  <span className="text-xs font-semibold text-emerald-900">Safe Tourists</span>
                </div>
                <span className="text-sm font-bold text-emerald-700">{Math.max(0, stats.activeTourists - stats.activeAlerts)}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-3 w-3 bg-amber-500 rounded-full" />
                  <span className="text-xs font-semibold text-amber-900">Safety Risk / Caution</span>
                </div>
                <span className="text-sm font-bold text-amber-700">{stats.activeAlerts}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-3 w-3 bg-rose-500 rounded-full animate-pulse" />
                  <span className="text-xs font-semibold text-rose-900">Emergency & SOS</span>
                </div>
                <span className="text-sm font-bold text-rose-700">{stats.sosAlerts}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-xs rounded-2xl">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-indigo-500" />
                  Recent System Feed
                </CardTitle>
              </div>
              {onNavigate && (
                <Button size="sm" variant="ghost" className="text-[11px] text-indigo-600 h-6 px-1.5" onClick={() => onNavigate("notifications")}>
                  Feed
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-xs text-slate-500 space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800">AI Safety Sentinel active</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Monitoring location anomalies & geofence violations.</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800">{stats.resolvedToday} incidents resolved today</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Emergency resources dispatched successfully.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

