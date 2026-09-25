"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSelector } from "@/components/language-selector"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { OverviewTab } from "@/components/admin/overview-tab"
import { TouristsTab } from "@/components/admin/tourists-tab"
import { DigiIdsTab } from "@/components/admin/digi-ids-tab"
import { AlertsTab } from "@/components/admin/alerts-tab"
import { TouristAlertsTab } from "@/components/admin/tourist-alerts-tab"
import { DispatchedResourcesTab } from "@/components/admin/dispatched-resources-tab"
import { ResourcesTab } from "@/components/admin/resources-tab"
import { NotificationsTab } from "@/components/admin/notifications-tab"
import { ReportsTab } from "@/components/admin/reports-tab"
import { AdminProfileModal } from "@/components/admin/admin-profile-modal"
import { AutomatedHazardModal } from "@/components/admin/automated-hazard-modal"
import {
  Users, AlertTriangle, Shield, QrCode, Bell, Ambulance, LogOut,
  RefreshCw, LayoutDashboard, Menu, X, History, Sparkles, Plus,
  MessageSquare, Settings, User, Zap, CloudRain, Bot, CheckCircle, FileText, Search, Radio
} from "lucide-react"

interface DashboardStats {
  activeTourists: number
  activeAlerts: number
  criticalAlerts: number
  resolvedToday: number
  systemUptime: number
  avgResponseTime: number
  geoZones: number
  blockchainTransactions: number
  aiEfficiency: number
  threatDetectionAccuracy: number
  unreadNotifications?: number
}

export default function AdminDashboardClient() {
  const { user, signOut } = useAuth()
  const { t } = useLanguage()

  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  const [activeTab, setActiveTab] = useState("create-blockchain-id")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isSimulatingSMS, setIsSimulatingSMS] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [hazardModalOpen, setHazardModalOpen] = useState(false)
  
  // Auto-Triage Engine state
  const [triageStatus, setTriageStatus] = useState<{ unassignedAlerts: number; assistanceRequested: number; needsAutoTriage: boolean } | null>(null)
  const [isAutoTriaging, setIsAutoTriaging] = useState(false)
  const [lastTriageResult, setLastTriageResult] = useState<string | null>(null)
  const triageToastRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats")
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch auto-triage status (unassigned alerts count)
  const fetchTriageStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auto-triage")
      if (res.ok) {
        const data = await res.json()
        setTriageStatus(data)
      }
    } catch (error) {
      console.error("Error fetching triage status:", error)
    }
  }, [])

  // 1-Click Auto-Triage: dispatch all unassigned alerts automatically
  const handleAutoTriageAll = useCallback(async () => {
    setIsAutoTriaging(true)
    try {
      const res = await fetch("/api/admin/auto-triage", { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setLastTriageResult(
          data.dispatched > 0
            ? `✅ Auto-dispatched ${data.dispatched} alert(s) to emergency units!`
            : "✓ All alerts already assigned. System up to date."
        )
        await Promise.all([fetchDashboardData(), fetchTriageStatus()])
        if (triageToastRef.current) clearTimeout(triageToastRef.current)
        triageToastRef.current = setTimeout(() => setLastTriageResult(null), 6000)
      }
    } catch (error) {
      console.error("Auto-triage error:", error)
    } finally {
      setIsAutoTriaging(false)
    }
  }, [fetchDashboardData, fetchTriageStatus])

  useEffect(() => {
    fetchDashboardData()
    fetchTriageStatus()
    const statsInterval = setInterval(fetchDashboardData, 15000)
    // Auto-triage poll every 30 seconds — automatically dispatches unassigned alerts
    const triageInterval = setInterval(async () => {
      await fetchTriageStatus()
      // Auto-run triage if there are unassigned alerts (fully automatic, zero admin action)
      const res = await fetch("/api/admin/auto-triage")
      if (res.ok) {
        const status = await res.json()
        if (status.needsAutoTriage) {
          const triageRes = await fetch("/api/admin/auto-triage", { method: "POST" })
          if (triageRes.ok) {
            const result = await triageRes.json()
            if (result.dispatched > 0) {
              setLastTriageResult(`⚡ AI Auto-dispatched ${result.dispatched} new alert(s) automatically!`)
              fetchDashboardData()
              if (triageToastRef.current) clearTimeout(triageToastRef.current)
              triageToastRef.current = setTimeout(() => setLastTriageResult(null), 6000)
            }
          }
        }
      }
      fetchTriageStatus()
    }, 30000)
    return () => {
      clearInterval(statsInterval)
      clearInterval(triageInterval)
    }
  }, [fetchDashboardData, fetchTriageStatus])

  const simulateTwilioSMS = async () => {
    try {
      setIsSimulatingSMS(true)
      const res = await fetch("/api/admin/simulate-twilio", { method: "POST" })
      if (res.ok) {
        await fetchDashboardData()
        alert("Twilio SMS Webhook simulated successfully. Alert created.")
      } else {
        alert("Simulation failed.")
      }
    } catch (error) {
      console.error("Simulation error:", error)
    } finally {
      setIsSimulatingSMS(false)
    }
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await signOut()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Admin Command Center Navigation
  const navItems = [
    { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
    { id: "create-blockchain-id", label: "Create Blockchain ID", icon: Plus },
    { id: "list-ids", label: "List of IDs (Search)", icon: QrCode },
    { id: "tourist-alerts", label: "Tourist Alerts", icon: Radio, badge: stats?.activeAlerts },
    { id: "dispatched-resources", label: "Auto Dispatches", icon: Ambulance },
    { id: "resources", label: "Emergency Units", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell, badge: stats?.unreadNotifications },
    { id: "reports", label: "Generate Reports", icon: FileText },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] flex items-center justify-center text-white font-sans">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-sm text-gray-400 font-medium">Loading Safaris Admin Command Center...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] text-gray-800 overflow-hidden font-sans">
      {/* MOBILE BACKDROP */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR (Themed identically to Tourist Dashboard) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-[#0a0f1d] text-gray-400 flex flex-col justify-between p-4 border-r border-gray-800 transition-transform duration-200 ease-in-out shrink-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="space-y-6">
          {/* Logo / Header */}
          <div className="flex items-center justify-between px-2 py-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/20">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-white font-bold text-base leading-tight">Safaris Admin</h2>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-blue-400" /> Command Active
                </span>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-gray-400 hover:text-white p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 text-left group ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
                      : "hover:bg-gray-850 hover:text-white text-gray-400"
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                        isActive ? "bg-white/15 text-white" : "bg-gray-900 text-gray-400 group-hover:text-white"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge != null && item.badge > 0 && (
                    <span
                      className={`ml-2 shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? "bg-white text-blue-700 font-extrabold" : "bg-red-500 text-white shadow-xs"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Lower Automation Card & Profile Footer */}
        <div className="space-y-4">
          {/* Automated Hazard & Disaster Alert Trigger Card */}
          <div className="bg-gradient-to-br from-blue-950/60 to-indigo-950/40 border border-blue-500/30 rounded-xl p-3.5 text-center space-y-2.5 shadow-lg shadow-blue-950/20">
            <div className="flex items-center justify-center space-x-1.5 text-white font-bold text-xs tracking-wide">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>AI Hazard Automation</span>
            </div>
            <p className="text-[10px] text-blue-200/90 leading-tight">
              Auto-detects rain, flood surges, and abnormal zones with zero manual typing.
            </p>
            <Button
              size="sm"
              onClick={() => setHazardModalOpen(true)}
              className="w-full h-8 text-[11px] font-semibold bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white shadow-md shadow-rose-900/30"
            >
              <CloudRain className="h-3.5 w-3.5 mr-1" />
              Simulate Hazard Alert
            </Button>
          </div>

          {/* Profile Badge (Identical to Tourist Dashboard) */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-gray-900/50 border border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center font-bold text-blue-400 text-sm">
                {user?.name ? user.name.substring(0, 2).toUpperCase() : "AD"}
              </div>
              <div className="leading-tight">
                <div className="text-xs font-semibold text-white truncate max-w-[110px]">
                  {user?.name || "System Admin"}
                </div>
                <span className="text-[9px] text-emerald-400 font-medium">Command Active</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-gray-500 hover:text-red-400 p-1.5 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#f8fafc]">
        {/* HEADER (Themed identically to Tourist Dashboard) */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-gray-600 hover:text-gray-900 p-1.5 rounded-lg border border-gray-200"
              title="Open Navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">
                {activeTab === "overview" && "Admin Command Center 👋"}
                {activeTab === "tourists" && "Tourist Personas & Roster 👋"}
                {activeTab === "create-digi-id" && "Issue Tourist Digi ID 👋"}
                {activeTab === "digi-ids" && "Tourist Digi IDs & QR Verification 👋"}
                {activeTab === "alerts" && "Incident & Hazard Command Center 👋"}
                {activeTab === "resources" && "Emergency Response Units 👋"}
                {activeTab === "notifications" && "Administrative Notifications 👋"}
                {activeTab === "history" && "Alert & Safety Incident History 👋"}
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block mt-0.5">
                Real-time safety monitoring, automated disaster triage, and rapid emergency intervention.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Language Selector (identical to tourist dashboard) */}
            <LanguageSelector variant="dropdown" />

            {/* Auto-Triage Toast Notification */}
            {lastTriageResult && (
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-[11px] font-semibold animate-in fade-in">
                <CheckCircle className="h-3 w-3 text-emerald-600 shrink-0" />
                <span className="max-w-[200px] truncate">{lastTriageResult}</span>
              </div>
            )}

            {/* System Operational Pulse Pill / Triage Alert */}
            {triageStatus?.needsAutoTriage ? (
              <Badge className="bg-amber-50 border border-amber-300 text-amber-800 flex items-center space-x-1.5 py-1 px-2.5 rounded-full font-medium text-xs">
                <span className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-ping"></span>
                <span>{triageStatus.unassignedAlerts + triageStatus.assistanceRequested} Needs Dispatch</span>
              </Badge>
            ) : (
              <Badge className="bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center space-x-1.5 py-1 px-2.5 rounded-full font-medium text-xs">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span>System Operational</span>
              </Badge>
            )}

            {/* 1-Click Auto Dispatch All Button */}
            <Button
              onClick={handleAutoTriageAll}
              disabled={isAutoTriaging}
              size="sm"
              className="h-8 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white hidden lg:flex text-xs font-semibold shadow-xs"
              title="Auto-dispatch all unassigned active alerts to best available emergency units"
            >
              <Bot className="h-3.5 w-3.5 mr-1.5" />
              {isAutoTriaging ? "Dispatching..." : "Auto-Dispatch All"}
            </Button>

            {/* Quick Offline SMS Simulation Button */}
            <Button
              onClick={simulateTwilioSMS}
              disabled={isSimulatingSMS}
              variant="outline"
              size="sm"
              className="h-8 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800 hidden lg:flex text-xs font-semibold"
              title="Simulates receiving an offline SMS from a tourist without internet via Twilio"
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              {isSimulatingSMS ? "Simulating..." : "Simulate SMS"}
            </Button>

            {/* Refresh Button */}
            <Button onClick={() => { fetchDashboardData(); fetchTriageStatus(); }} variant="outline" size="sm" className="h-8 px-2.5">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>

            {/* Notifications Alert Bell (identical to tourist dashboard) */}
            <button
              onClick={() => setActiveTab("notifications")}
              className="relative p-2 bg-gray-50 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {stats?.unreadNotifications != null && stats.unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* User Avatar with Dropdown (Identical to Tourist Dashboard) */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="h-8 w-8 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center bg-blue-100 font-semibold text-xs text-blue-600 hover:ring-2 hover:ring-blue-500/20 focus:outline-none"
              >
                {user?.name ? user.name.substring(0, 2).toUpperCase() : "AD"}
              </button>

              {isProfileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-35 bg-transparent"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-40 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Officer Profile</p>
                      <p className="text-xs font-semibold text-gray-800 truncate">{user?.name || "System Admin"}</p>
                      <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setShowProfileModal(true)
                        setIsProfileDropdownOpen(false)
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      <span>Officer Settings & Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setHazardModalOpen(true)
                        setIsProfileDropdownOpen(false)
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left text-xs font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Dispatch Auto-Hazard Alert</span>
                    </button>

                    <button
                      onClick={() => {
                        handleLogout()
                        setIsProfileDropdownOpen(false)
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors border-t border-gray-100"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* TAB CONTENTS */}
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
          {activeTab === "overview" && (
            <OverviewTab
              stats={stats}
              onNavigate={(tab) => {
                if (tab === "alerts" || tab === "tourist-alerts") setActiveTab("tourist-alerts")
                else if (tab === "digi-ids" || tab === "list-ids") setActiveTab("list-ids")
                else setActiveTab(tab)
              }}
            />
          )}
          {activeTab === "create-blockchain-id" && <DigiIdsTab initialMode="create" key="create-blockchain-id-tab" />}
          {activeTab === "list-ids" && <DigiIdsTab initialMode="list" key="list-ids-tab" />}
          {activeTab === "tourist-alerts" && <TouristAlertsTab />}
          {activeTab === "dispatched-resources" && <DispatchedResourcesTab />}
          {activeTab === "resources" && <ResourcesTab />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "reports" && <ReportsTab />}
        </div>
      </main>

      {/* Admin Profile Modal */}
      <AdminProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentAdmin={user}
        onProfileUpdated={() => fetchDashboardData()}
      />

      {/* Automated Hazard Modal */}
      <AutomatedHazardModal
        isOpen={hazardModalOpen}
        onClose={() => setHazardModalOpen(false)}
        onHazardTriggered={() => {
          fetchDashboardData()
          setActiveTab("alerts")
        }}
      />
    </div>
  )
}
