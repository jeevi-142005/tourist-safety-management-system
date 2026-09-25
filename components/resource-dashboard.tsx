"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import {
  Ambulance, Shield, MapPin, Phone, CheckCircle, Clock, AlertTriangle,
  Bell, LogOut, User, RefreshCw, Navigation, ChevronRight, Activity,
  Siren, Flame, Stethoscope, Users, Zap, CheckCheck, Battery, Wifi, WifiOff,
  Radio, Search, CheckCircle2, ArrowRight, Settings, LayoutDashboard,
  ExternalLink, PhoneCall
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSelector } from "@/components/language-selector"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export type ResourceType = "ambulance" | "guide" | "police" | "fire" | "hospital" | "security"

interface AssignedAlert {
  id: string
  userName: string
  type: string
  message: string
  severity: string
  status: string
  locationLat: number | null
  locationLng: number | null
  createdAt: string
  user: {
    id?: string
    name: string | null
    email: string
    phone: string | null
    emergencyContact: string | null
    emergencyPhone: string | null
  } | null
  deviceInfo?: {
    battery?: number
    isOnline?: boolean
    batteryLevel?: number
    resolvedBy?: string
    resolvedAt?: string
    assignedResourceName?: string
    assignedResourceType?: string
    assignedResourcePhone?: string
    autoTriaged?: boolean
    enRouteBy?: string
    enRouteAt?: string
    touristStatus?: string
    [key: string]: any
  }
  assignment?: {
    id: string
    status: string
    assignedAt: string
    resourceName: string
    resourceType: string
    resourcePhone?: string
    notes?: string
  } | null
}

const RESOURCE_THEME: Record<ResourceType, {
  label: string
  title: string
  icon: React.ReactNode
}> = {
  ambulance: {
    label: "Ambulance Response Unit",
    title: "Emergency Medical & Paramedic Service",
    icon: <Ambulance className="h-5 w-5" />,
  },
  police: {
    label: "Police Quick Response Team",
    title: "Law Enforcement & Tourist Protection QRT",
    icon: <Siren className="h-5 w-5" />,
  },
  security: {
    label: "Tourist Security Patrol",
    title: "Perimeter Security & Assistance Squad",
    icon: <Shield className="h-5 w-5" />,
  },
  fire: {
    label: "Fire & Disaster Rescue Squad",
    title: "SDRF Flood, Fire & Evacuation Team",
    icon: <Flame className="h-5 w-5" />,
  },
  hospital: {
    label: "Emergency Hospital Station",
    title: "Trauma Care & Clinical Admission Unit",
    icon: <Stethoscope className="h-5 w-5" />,
  },
  guide: {
    label: "Tourist Assistance Guide",
    title: "Field Guide & Wayfinding Support",
    icon: <Users className="h-5 w-5" />,
  },
}

const SEVERITY_CONFIG: Record<string, { label: string; badge: string; border: string; bg: string }> = {
  critical: {
    label: "Critical Priority",
    badge: "bg-red-50 text-red-700 border-red-200 font-semibold",
    border: "border-red-200",
    bg: "bg-red-50/20",
  },
  high: {
    label: "High Priority",
    badge: "bg-orange-50 text-orange-700 border-orange-200 font-semibold",
    border: "border-orange-200",
    bg: "bg-orange-50/20",
  },
  medium: {
    label: "Medium Priority",
    badge: "bg-amber-50 text-amber-700 border-amber-200 font-medium",
    border: "border-amber-200",
    bg: "bg-amber-50/20",
  },
  low: {
    label: "Low Priority",
    badge: "bg-slate-100 text-slate-700 border-slate-200 font-medium",
    border: "border-slate-200",
    bg: "bg-slate-50/20",
  },
}

function timeAgo(dateStr: string) {
  const diff = Math.max(0, (Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export function ResourceDashboard({ resourceType }: { resourceType: ResourceType }) {
  const { user, signOut } = useAuth()
  const { t } = useLanguage()
  const theme = RESOURCE_THEME[resourceType] || RESOURCE_THEME.ambulance

  const [alerts, setAlerts] = useState<AssignedAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"incoming" | "en_route" | "completed" | "tracking" | "fleet" | "profile">("incoming")
  const [search, setSearch] = useState("")
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [unitStatus, setUnitStatus] = useState<"available" | "busy">("available")
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)

  const prevIncomingCountRef = useRef(0)

  const fetchResourceAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/resource/alerts")
      if (res.ok) {
        const data = await res.json()
        const newAlerts: AssignedAlert[] = data.alerts || []
        setAlerts(newAlerts)
        setLastRefreshed(new Date())

        // Calculate incoming count
        const incomingCount = newAlerts.filter(
          (a) =>
            a.status !== "resolved" &&
            a.assignment?.status !== "completed" &&
            a.assignment?.status !== "en_route" &&
            !a.deviceInfo?.enRouteBy
        ).length

        if (incomingCount > prevIncomingCountRef.current && prevIncomingCountRef.current > 0) {
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
            const osc = ctx.createOscillator()
            osc.frequency.setValueAtTime(750, ctx.currentTime)
            osc.connect(ctx.destination)
            osc.start()
            osc.stop(ctx.currentTime + 0.2)
          } catch {}
        }
        prevIncomingCountRef.current = incomingCount
      }
    } catch (e) {
      console.error("Failed to fetch resource alerts:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchResourceAlerts()
    const interval = setInterval(fetchResourceAlerts, 5000)
    return () => clearInterval(interval)
  }, [fetchResourceAlerts])

  // Accept Mission -> moves strictly from Incoming to En Route
  const handleAcceptMission = async (alertId: string) => {
    setProcessing(alertId)
    try {
      const res = await fetch("/api/resource/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId, action: "accept" }),
      })
      if (res.ok) {
        setActionFeedback("Mission accepted. Status set to En Route. Tourist and Admin dashboards updated.")
        setTimeout(() => setActionFeedback(null), 5000)
        setUnitStatus("busy")
        await fetchResourceAlerts()
        setActiveTab("en_route")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setProcessing(null)
    }
  }

  // Complete Mission -> moves strictly from En Route to Completed
  const handleCompleteMission = async (alertId: string) => {
    setProcessing(alertId)
    try {
      const res = await fetch("/api/resource/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertId,
          action: "complete",
          notes: `Mission completed on scene by ${user?.name || theme.label}. Tourist assisted.`,
        }),
      })
      if (res.ok) {
        setActionFeedback("Mission completed and resolved. Status synchronized across all dashboards.")
        setTimeout(() => setActionFeedback(null), 5000)
        setUnitStatus("available")
        await fetchResourceAlerts()
        setActiveTab("completed")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setProcessing(null)
    }
  }

  // ════════════════════ STRICT CATEGORY SEGREGATION ════════════════════

  // 1. Incoming Signals ONLY: Not resolved, not completed, not yet accepted/en route
  const incomingAlerts = alerts.filter((a) => {
    const isResolved = a.status === "resolved" || a.assignment?.status === "completed" || Boolean(a.deviceInfo?.resolvedAt)
    const isEnRoute =
      (a.status === "in_progress" && a.assignment?.status === "en_route") ||
      Boolean(a.deviceInfo?.enRouteBy) ||
      a.assignment?.status === "en_route"
    return !isResolved && !isEnRoute
  })

  // 2. En Route Missions ONLY: Accepted and currently active, not resolved
  const enRouteAlerts = alerts.filter((a) => {
    const isResolved = a.status === "resolved" || a.assignment?.status === "completed" || Boolean(a.deviceInfo?.resolvedAt)
    const isEnRoute =
      (a.status === "in_progress" && a.assignment?.status === "en_route") ||
      Boolean(a.deviceInfo?.enRouteBy) ||
      a.assignment?.status === "en_route"
    return !isResolved && isEnRoute
  })

  // 3. Completed & Resolved ONLY: Resolved or completed
  const completedAlerts = alerts.filter((a) => {
    return a.status === "resolved" || a.assignment?.status === "completed" || Boolean(a.deviceInfo?.resolvedAt)
  })

  // Select list for current active tab
  const currentList =
    activeTab === "incoming"
      ? incomingAlerts
      : activeTab === "en_route"
      ? enRouteAlerts
      : activeTab === "completed"
      ? completedAlerts
      : []

  const filteredAlerts = currentList.filter((a) => {
    const q = search.toLowerCase()
    return (
      a.userName.toLowerCase().includes(q) ||
      a.message.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q) ||
      (a.user?.phone && a.user.phone.includes(q))
    )
  })

  return (
    <div className="flex h-screen bg-[#f8fafc] text-gray-800 overflow-hidden font-sans">
      {/* ══════════════════ LEFT SIDEBAR (MATCHING TOURIST/ADMIN) ══════════════════ */}
      <aside className="w-64 bg-[#0a0f1d] text-gray-400 flex flex-col justify-between p-4 border-r border-gray-800 shrink-0 select-none">
        <div className="space-y-6">
          {/* Brand / Logo */}
          <div className="flex items-center space-x-3 px-2 py-2">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              {theme.icon}
            </div>
            <div>
              <h2 className="text-white font-bold text-base leading-tight">Safaris</h2>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                Resource Command
              </span>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <nav className="space-y-1">
            {[
              {
                id: "incoming",
                label: "Incoming Signals",
                icon: <Bell className="h-4 w-4" />,
                count: incomingAlerts.length,
                badgeBg: "bg-red-500",
              },
              {
                id: "en_route",
                label: "En Route Missions",
                icon: <Navigation className="h-4 w-4" />,
                count: enRouteAlerts.length,
                badgeBg: "bg-blue-500",
              },
              {
                id: "completed",
                label: "Completed & Resolved",
                icon: <CheckCircle2 className="h-4 w-4" />,
                count: completedAlerts.length,
                badgeBg: "bg-emerald-600",
              },
              { id: "tracking", label: "Live GPS & Radius", icon: <MapPin className="h-4 w-4" /> },
              { id: "fleet", label: "Emergency Fleet", icon: <Shield className="h-4 w-4" /> },
              { id: "profile", label: "Unit Profile & Settings", icon: <Settings className="h-4 w-4" /> },
            ].map((item) => {
              const isActive = activeTab === item.id

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 font-semibold"
                      : "hover:bg-gray-800/60 hover:text-white text-gray-400"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActive ? "bg-white text-blue-600" : `${item.badgeBg} text-white`
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Controls */}
        <div className="space-y-4">
          {/* Unit Status Toggle */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 text-center space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-300">Unit Status</span>
              <span className={`h-2 w-2 rounded-full ${unitStatus === "available" ? "bg-emerald-500" : "bg-amber-500"}`} />
            </div>

            <button
              onClick={() => setUnitStatus((prev) => (prev === "available" ? "busy" : "available"))}
              className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border ${
                unitStatus === "available"
                  ? "bg-emerald-950/40 text-emerald-300 border-emerald-800 hover:bg-emerald-950/60"
                  : "bg-amber-950/40 text-amber-300 border-amber-800 hover:bg-amber-950/60"
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
              <span>{unitStatus === "available" ? "Available / On Duty" : "On Mission / Busy"}</span>
            </button>
          </div>

          {/* Profile Card */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-gray-900/50 border border-gray-800">
            <div className="flex items-center space-x-3 truncate">
              <div className="h-8 w-8 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center font-bold text-blue-400 text-xs shrink-0">
                {user?.name ? user.name.substring(0, 2).toUpperCase() : "RU"}
              </div>
              <div className="leading-tight truncate">
                <div className="text-xs font-semibold text-white truncate max-w-[110px]">
                  {user?.name || theme.label}
                </div>
                <span className="text-[9px] text-gray-400 capitalize">
                  {resourceType}
                </span>
              </div>
            </div>
            <button
              onClick={signOut}
              className="text-gray-500 hover:text-red-400 p-1.5 rounded-md hover:bg-gray-800 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ══════════════════ MAIN CONTENT AREA ══════════════════ */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#f8fafc]">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {theme.label}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Emergency Response Operations & Dispatch
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <LanguageSelector variant="dropdown" />

            <Badge
              variant="outline"
              className={`flex items-center space-x-1.5 py-1 px-2.5 rounded-full font-medium text-xs ${
                unitStatus === "available"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  unitStatus === "available" ? "bg-emerald-500" : "bg-amber-500"
                }`}
              ></span>
              <span>{unitStatus === "available" ? "Unit Ready" : "On Call"}</span>
            </Badge>

            <button
              onClick={() => setActiveTab("incoming")}
              className="relative p-2 bg-gray-50 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              title="View Incoming Signals"
            >
              <Bell className="h-4 w-4" />
              {incomingAlerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="h-8 w-8 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center bg-blue-50 font-semibold text-xs text-blue-600 hover:ring-2 hover:ring-blue-500/20 focus:outline-none cursor-pointer"
              >
                {user?.name ? user.name.substring(0, 2).toUpperCase() : "RU"}
              </button>

              {isProfileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-35 bg-transparent"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-40 animate-in fade-in duration-100">
                    <div className="px-3 py-1.5 border-b border-gray-100">
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Responder Profile</p>
                      <p className="text-xs font-semibold text-gray-800 truncate">{user?.name || theme.label}</p>
                      <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab("profile")
                        setIsProfileDropdownOpen(false)
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      <span>Unit Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        signOut()
                        setIsProfileDropdownOpen(false)
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors border-t border-gray-100 cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ══════════════════ TAB CONTENT ══════════════════ */}
        <div className="p-6 space-y-6">
          {/* Action Feedback Banner */}
          {actionFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center justify-between animate-in fade-in">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{actionFeedback}</span>
              </div>
              <button
                onClick={() => setActionFeedback(null)}
                className="text-emerald-600 hover:text-emerald-900 font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* ────────── SECTION: INCOMING / EN_ROUTE / COMPLETED ────────── */}
          {(activeTab === "incoming" || activeTab === "en_route" || activeTab === "completed") && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Summary Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  onClick={() => setActiveTab("incoming")}
                  className={`p-4 bg-white rounded-xl border transition-all cursor-pointer ${
                    activeTab === "incoming" ? "border-blue-600 ring-1 ring-blue-600" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Incoming Signals</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{incomingAlerts.length}</p>
                    </div>
                    <div className="p-2.5 bg-red-50 text-red-600 rounded-lg border border-red-100">
                      <Bell className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("en_route")}
                  className={`p-4 bg-white rounded-xl border transition-all cursor-pointer ${
                    activeTab === "en_route" ? "border-blue-600 ring-1 ring-blue-600" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">En Route Missions</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{enRouteAlerts.length}</p>
                    </div>
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                      <Navigation className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("completed")}
                  className={`p-4 bg-white rounded-xl border transition-all cursor-pointer ${
                    activeTab === "completed" ? "border-blue-600 ring-1 ring-blue-600" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Completed Tasks</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{completedAlerts.length}</p>
                    </div>
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                      <CheckCheck className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls: Search and Refresh */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">
                      {activeTab === "incoming" && "Incoming Distress Signals"}
                      {activeTab === "en_route" && "En Route & Active Missions"}
                      {activeTab === "completed" && "Completed Incident History"}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {activeTab === "incoming" && "Unassigned and pending distress signals requiring response."}
                      {activeTab === "en_route" && "Active response missions currently in progress."}
                      {activeTab === "completed" && "Archived incidents resolved on scene."}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-400 font-mono hidden sm:inline">
                      Last sync: {lastRefreshed.toLocaleTimeString()}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchResourceAlerts}
                      disabled={loading}
                      className="text-xs border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer h-8"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
                      Refresh
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by tourist name, message, phone or type..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 text-xs h-9 bg-gray-50 border-gray-200"
                  />
                </div>
              </div>

              {/* Alert List */}
              {loading ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 space-y-2">
                  <RefreshCw className="h-6 w-6 text-blue-600 animate-spin mx-auto" />
                  <p className="text-xs font-medium">Loading emergency records...</p>
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center space-y-2">
                  <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                    {activeTab === "incoming" ? (
                      <Bell className="h-5 w-5" />
                    ) : activeTab === "en_route" ? (
                      <Navigation className="h-5 w-5" />
                    ) : (
                      <CheckCircle className="h-5 w-5" />
                    )}
                  </div>
                  <h3 className="font-semibold text-sm text-gray-800">
                    {activeTab === "incoming" && "No Incoming Signals"}
                    {activeTab === "en_route" && "No En Route Missions"}
                    {activeTab === "completed" && "No Completed Records"}
                  </h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    {activeTab === "incoming" && "No active distress calls at this moment. Unit is on standby."}
                    {activeTab === "en_route" && "You currently have no missions in progress. Accept an alert from Incoming Signals to begin."}
                    {activeTab === "completed" && "Completed missions will be catalogued here."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAlerts.map((alert) => {
                    const sev = SEVERITY_CONFIG[alert.severity?.toLowerCase()] || SEVERITY_CONFIG.medium
                    const isProcessingThis = processing === alert.id
                    const mapsUrl =
                      alert.locationLat && alert.locationLng
                        ? `https://www.google.com/maps?q=${alert.locationLat},${alert.locationLng}`
                        : null

                    return (
                      <div
                        key={alert.id}
                        className={`bg-white rounded-xl border p-4 space-y-3 transition-shadow hover:shadow-xs ${sev.border}`}
                      >
                        {/* Header Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center space-x-2.5">
                            <div className="p-2 bg-gray-100 rounded-lg text-gray-700">
                              {theme.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-gray-900">{alert.userName}</span>
                                <Badge variant="outline" className={`text-[10px] ${sev.badge}`}>
                                  {sev.label}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] uppercase font-mono text-gray-600 bg-gray-50 border-gray-200">
                                  {alert.type}
                                </Badge>
                                {activeTab === "en_route" && (
                                  <Badge className="bg-blue-600 text-white text-[10px] font-semibold">
                                    En Route
                                  </Badge>
                                )}
                                {activeTab === "completed" && (
                                  <Badge className="bg-emerald-600 text-white text-[10px] font-semibold">
                                    Resolved
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                Triggered {timeAgo(alert.createdAt)} · {new Date(alert.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {alert.deviceInfo?.isOnline !== false ? (
                              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-medium">
                                <Wifi className="h-3 w-3" /> Online
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-medium">
                                <WifiOff className="h-3 w-3" /> SMS Mode
                              </span>
                            )}

                            {alert.deviceInfo?.batteryLevel !== undefined && (
                              <span className="flex items-center gap-1 text-gray-600 font-mono text-[10px] bg-gray-100 px-2 py-0.5 rounded">
                                <Battery className="h-3 w-3 text-gray-400" />
                                {alert.deviceInfo.batteryLevel}%
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Incident Message */}
                        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-800 leading-relaxed">
                          {alert.message}
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {alert.user?.phone ? (
                            <a
                              href={`tel:${alert.user.phone}`}
                              className="flex items-center gap-2 p-2 bg-blue-50/50 border border-blue-100 rounded-lg text-blue-900 hover:bg-blue-50 transition-colors"
                            >
                              <Phone className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                              <div className="truncate">
                                <span className="text-[10px] text-blue-600 block uppercase font-medium">Direct Phone</span>
                                <span className="font-mono font-semibold text-xs">{alert.user.phone}</span>
                              </div>
                            </a>
                          ) : (
                            <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
                              <Phone className="h-3.5 w-3.5 text-gray-400" />
                              <span className="text-[11px]">No direct phone</span>
                            </div>
                          )}

                          {alert.user?.emergencyPhone ? (
                            <a
                              href={`tel:${alert.user.emergencyPhone}`}
                              className="flex items-center gap-2 p-2 bg-red-50/50 border border-red-100 rounded-lg text-red-900 hover:bg-red-50 transition-colors"
                            >
                              <Phone className="h-3.5 w-3.5 text-red-600 shrink-0" />
                              <div className="truncate">
                                <span className="text-[10px] text-red-600 block uppercase font-medium">Emergency Contact</span>
                                <span className="font-mono font-semibold text-xs">{alert.user.emergencyPhone}</span>
                              </div>
                            </a>
                          ) : alert.user?.email ? (
                            <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                              <User className="h-3.5 w-3.5 text-gray-400" />
                              <span className="truncate text-xs">{alert.user.email}</span>
                            </div>
                          ) : null}

                          {alert.locationLat && alert.locationLng ? (
                            <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-emerald-50/50 border border-emerald-100 rounded-lg">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                <div>
                                  <span className="text-[10px] text-emerald-700 font-medium block uppercase">GPS Coordinates</span>
                                  <span className="font-mono font-semibold text-xs text-gray-900">
                                    {Number(alert.locationLat).toFixed(5)}, {Number(alert.locationLng).toFixed(5)}
                                  </span>
                                </div>
                              </div>

                              {mapsUrl && (
                                <a
                                  href={mapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded transition-colors"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Google Maps
                                </a>
                              )}
                            </div>
                          ) : (
                            <div className="sm:col-span-2 flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 text-xs">
                              <MapPin className="h-3.5 w-3.5 text-gray-400" />
                              <span>No GPS coordinates available</span>
                            </div>
                          )}
                        </div>

                        {/* Resolved Metadata */}
                        {activeTab === "completed" && alert.deviceInfo?.resolvedBy && (
                          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
                            <span className="font-medium">
                              Resolved by <strong>{alert.deviceInfo.resolvedBy}</strong>
                              {alert.deviceInfo.resolvedAt ? ` at ${new Date(alert.deviceInfo.resolvedAt).toLocaleTimeString()}` : ""}
                            </span>
                            <span className="text-[10px] bg-white border border-emerald-200 px-2 py-0.5 rounded text-emerald-700 font-semibold">
                              Audit Synced
                            </span>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {activeTab === "incoming" && (
                          <div className="pt-2 border-t border-gray-100 flex justify-end">
                            <Button
                              onClick={() => handleAcceptMission(alert.id)}
                              disabled={isProcessingThis}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8 px-4 cursor-pointer"
                            >
                              {isProcessingThis ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                              ) : (
                                <Navigation className="h-3.5 w-3.5 mr-1.5" />
                              )}
                              Accept Mission
                            </Button>
                          </div>
                        )}

                        {activeTab === "en_route" && (
                          <div className="pt-2 border-t border-gray-100 flex justify-end">
                            <Button
                              onClick={() => handleCompleteMission(alert.id)}
                              disabled={isProcessingThis}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 px-4 cursor-pointer"
                            >
                              {isProcessingThis ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                              ) : (
                                <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
                              )}
                              Mark as Completed
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ────────── SECTION: LIVE GPS & RADIUS TRACKING ────────── */}
          {activeTab === "tracking" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <Card className="border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-gray-900">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    Response Radius & Incident Coverage
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Live tracking of active missions and responder beacon
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-80 w-full rounded-xl bg-slate-900 relative overflow-hidden flex items-center justify-center border border-slate-800">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.12)_0,transparent_70%)]" />
                    <div className="absolute h-56 w-56 rounded-full border border-blue-500/20" />
                    <div className="absolute h-36 w-36 rounded-full border border-blue-500/30" />

                    <div className="relative z-10 flex flex-col items-center">
                      <div className="p-2.5 bg-blue-600 rounded-full text-white shadow-md">
                        {theme.icon}
                      </div>
                      <Badge className="mt-2 bg-blue-600 text-white text-[10px] font-medium">
                        {theme.label} (Current GPS)
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">11.0168° N, 76.9558° E</span>
                    </div>

                    {enRouteAlerts.slice(0, 3).map((m, idx) => (
                      <div
                        key={m.id}
                        className="absolute z-10 flex flex-col items-center"
                        style={{
                          top: `${25 + idx * 25}%`,
                          left: `${25 + idx * 25}%`,
                        }}
                      >
                        <div className="p-1.5 bg-red-600 rounded-full text-white shadow">
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-[9px] bg-slate-900 text-white px-1.5 py-0.5 rounded border border-gray-700 font-medium mt-0.5">
                          {m.userName}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                      <p className="font-medium text-gray-500 text-[10px] uppercase">Active Incidents</p>
                      <p className="text-lg font-bold text-gray-900 mt-0.5">{alerts.length}</p>
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                      <p className="font-medium text-gray-500 text-[10px] uppercase">Response Radius</p>
                      <p className="text-lg font-bold text-blue-600 mt-0.5">15 km</p>
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                      <p className="font-medium text-gray-500 text-[10px] uppercase">Average ETA</p>
                      <p className="text-lg font-bold text-emerald-600 mt-0.5">4.2 min</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ────────── SECTION: FLEET ────────── */}
          {activeTab === "fleet" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <Card className="border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-gray-900">
                    <Shield className="h-4 w-4 text-blue-600" />
                    City Emergency Response Units
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Interconnected municipal emergency response resources
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { name: "Coimbatore City Hospital - Ambulance 1", type: "ambulance", phone: "+91 94421 10800", status: "Active", icon: <Ambulance className="h-4 w-4 text-rose-600" /> },
                      { name: "Central Police Station - Tourist QRT", type: "police", phone: "+91 94421 10000", status: "Active", icon: <Siren className="h-4 w-4 text-blue-600" /> },
                      { name: "SDRF Flood & Storm Squad", type: "fire", phone: "+91 94421 10100", status: "Standby", icon: <Flame className="h-4 w-4 text-orange-600" /> },
                      { name: "Tourist Assistance Patrol 4", type: "security", phone: "+91 94421 10900", status: "Active", icon: <Shield className="h-4 w-4 text-amber-600" /> },
                      { name: "Apollo Emergency Station", type: "hospital", phone: "+91 94421 10200", status: "Active", icon: <Stethoscope className="h-4 w-4 text-purple-600" /> },
                      { name: "Tourist Field Guide Wing 2", type: "guide", phone: "+91 94421 10700", status: "On Duty", icon: <Users className="h-4 w-4 text-emerald-600" /> },
                    ].map((unit, idx) => (
                      <div key={idx} className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {unit.icon}
                            <span className="font-semibold text-xs text-gray-900">{unit.name}</span>
                          </div>
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                            {unit.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                          <span className="font-mono">{unit.phone}</span>
                          <span className="capitalize text-gray-600">{unit.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ────────── SECTION: PROFILE & SETTINGS ────────── */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in duration-150 max-w-2xl">
              <Card className="border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-gray-900">
                    <Settings className="h-4 w-4 text-blue-600" />
                    Unit Identification & Terminal Settings
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Registered responder credentials linked to Command Center
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3.5 p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-base">
                      {user?.name ? user.name.substring(0, 2).toUpperCase() : "RU"}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">{user?.name || theme.label}</h3>
                      <p className="text-xs text-gray-500 font-mono">{user?.email}</p>
                      <Badge variant="outline" className="mt-1 text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
                        Verified Unit ({resourceType})
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-gray-400 font-medium text-[10px] uppercase block">Role</span>
                      <span className="font-semibold text-gray-800 capitalize">{resourceType}</span>
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-gray-400 font-medium text-[10px] uppercase block">Frequency</span>
                      <span className="font-semibold text-gray-800">VHF 108.4 MHz</span>
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-gray-400 font-medium text-[10px] uppercase block">Auto-Triage</span>
                      <span className="font-semibold text-emerald-700">Connected</span>
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-gray-400 font-medium text-[10px] uppercase block">Sync Mode</span>
                      <span className="font-semibold text-blue-700">Real-Time</span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={signOut}
                      className="text-xs text-red-600 border-red-200 hover:bg-red-50 cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5 mr-1" />
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default ResourceDashboard
