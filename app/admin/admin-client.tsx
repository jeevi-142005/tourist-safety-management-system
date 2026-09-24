"use client"

import { useState, useEffect, useCallback } from "react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { OverviewTab } from "@/components/admin/overview-tab"
import { TouristsTab } from "@/components/admin/tourists-tab"
import { DigiIdsTab } from "@/components/admin/digi-ids-tab"
import { AlertsTab } from "@/components/admin/alerts-tab"
import { ResourcesTab } from "@/components/admin/resources-tab"
import { NotificationsTab } from "@/components/admin/notifications-tab"
import {
  Users, AlertTriangle, Shield, QrCode, Bell, Ambulance, LogOut, RefreshCw, LayoutDashboard, Menu, X, History, Sparkles, Plus
} from "lucide-react"

export default function AdminDashboardClient() {
  const [tourists, setTourists] = useState<Tourist[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const [activeTab, setActiveTab] = useState("tourists")

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      if (typeof window !== "undefined") {
        localStorage.removeItem("tourist-safety-user")
      }
      await signOut({ redirect: false })
      window.location.href = "/"
    } catch (error) {
      console.error("Logout error:", error)
      window.location.href = "/"
    } finally {
      setIsLoggingOut(false)
    }
  }

  const navItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "tourists", label: "Tourists", icon: Users },
    { id: "create-digi-id", label: "Create Digi ID", icon: Plus },
    { id: "digi-ids", label: "Digi IDs & QR", icon: QrCode },
    { id: "alerts", label: "Alerts", icon: AlertTriangle, badge: stats?.activeAlerts },
    { id: "resources", label: "Emergency Response", icon: Ambulance },
    { id: "notifications", label: "Notifications", icon: Bell, badge: stats?.unreadNotifications },
    { id: "history", label: "Alert History", icon: History },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-sm text-slate-400 font-medium">Loading Command Center...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* MOBILE BACKDROP */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-950 text-slate-300 flex flex-col justify-between p-4 border-r border-slate-800 transition-transform duration-200 ease-in-out shrink-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
      >
        <div className="space-y-6">
          {/* Logo / Title */}
          <div className="flex items-center justify-between px-2 py-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl text-white shadow-md shadow-blue-500/20">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-white font-bold text-sm leading-tight tracking-tight">Safety Command</h2>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-blue-400" /> Admin Module
                </span>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                      : "hover:bg-slate-900 hover:text-white text-slate-400"
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge != null && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-white text-blue-600" : "bg-rose-500 text-white"
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

        {/* Profile / Logout Footer */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center font-bold text-blue-400 text-xs">
                AD
              </div>
              <div className="leading-tight">
                <div className="text-xs font-bold text-white truncate max-w-[110px]">System Admin</div>
                <span className="text-[9px] text-emerald-400 font-medium">Command Active</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-50">
        {/* HEADER */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded-lg border border-slate-200"
              title="Open Navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {activeTab === "overview" && "Safety Management Dashboard"}
                {activeTab === "tourists" && "Digital Personas & Tourist Roster"}
                {activeTab === "digi-ids" && "Tourist Digi IDs & QR Controls"}
                {activeTab === "alerts" && "Alert & Incident Command Center"}
                {activeTab === "resources" && "Emergency Response Resources"}
                {activeTab === "notifications" && "Admin Notifications Feed"}
                {activeTab === "history" && "Alert & Safety Incident History"}
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block mt-0.5">
                Real-time safety monitoring, Digi ID verification, and rapid emergency intervention.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
              <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-emerald-700 font-medium">System Operational</span>
            </div>
            <Button onClick={fetchDashboardData} variant="outline" size="sm" className="h-8">
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="outline"
              size="sm"
              className="h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-3.5 w-3.5 mr-2" />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </header>

        {/* TAB CONTENTS */}
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
          {activeTab === "overview" && <OverviewTab stats={stats} onNavigate={(tab) => setActiveTab(tab)} />}
          {activeTab === "tourists" && <TouristsTab />}
          {activeTab === "create-digi-id" && <DigiIdsTab initialMode="create" key="create-digi-id-tab" />}
          {activeTab === "digi-ids" && <DigiIdsTab initialMode="list" key="digi-ids-tab" />}
          {activeTab === "alerts" && <AlertsTab defaultFilter="all" />}
          {activeTab === "resources" && <ResourcesTab />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "history" && <AlertsTab defaultFilter="resolved" title="Alert & Incident History" />}
        </div>
      </main>
    </div>
  )
}

