"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EditProfileModal } from "@/components/edit-profile-modal"
import { TouristDetailsModal } from "@/components/tourist-details-modal"
import { AlertResolutionModal } from "@/components/alert-resolution-modal"
import {
  Shield,
  Users,
  AlertTriangle,
  MapPin,
  Clock,
  LogOut,
  CheckCircle,
  Brain,
  FileText,
  HeartPulse,
  Activity,
  Settings,
  Building,
  Radio,
  Send,
  CloudLightning,
  Bell,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { AuthorityHeatmap } from "./authority-heatmap"
import { createClient } from "@/lib/db-client/client"

export function AdminDashboard() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState("police-control")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)

  // New Modals State
  const [selectedTourist, setSelectedTourist] = useState<any | null>(null)
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null)
  
  // Broadcast State
  const [broadcastMessage, setBroadcastMessage] = useState("")
  const [broadcastType, setBroadcastType] = useState("warning")
  const [isBroadcasting, setIsBroadcasting] = useState(false)

  // Real-time Data States
  const [emergencyAlerts, setEmergencyAlerts] = useState<any[]>([])
  const [medicalAlerts, setMedicalAlerts] = useState<any[]>([])
  const [touristProfiles, setTouristProfiles] = useState<any[]>([])
  const [anomalies, setAnomalies] = useState<any[]>([])

  // Data Fetching Function using dbClient
  const fetchData = async () => {
    const dbClient = createClient()
    if (!dbClient) return

    try {
      // 1. Fetch Emergency Alerts (Live SOS)
      const { data: alertsData } = await dbClient
        .from('emergency_alerts')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (alertsData) {
        setEmergencyAlerts(alertsData)
        setMedicalAlerts(alertsData.filter((a: any) => a.type === 'medical'))
      }

      // 2. Fetch Tourist Profiles
      const { data: touristsData } = await dbClient
        .from('tourist_profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (touristsData) {
        setTouristProfiles(touristsData)
      }

      // 3. Fetch AI Anomalies
      const { data: anomaliesData } = await dbClient
        .from('anomaly_patterns')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (anomaliesData) {
        setAnomalies(anomaliesData)
      }
    } catch (err) {
      console.error("Error fetching admin data:", err)
    }
  }

  // Poll for real-time updates every 5 seconds
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return
    setIsBroadcasting(true)

    try {
      const dbClient = createClient()
      if (!dbClient) return

      // In a real app, you'd insert this for specific users based on location.
      // Here we simulate a generic broadcast by inserting a system-wide user_alert.
      // We loop over all active tourists
      for (const tourist of touristProfiles.filter(t => t.is_active)) {
        await dbClient.from('user_alerts').insert({
          user_id: tourist.id,
          user_name: tourist.name,
          type: broadcastType,
          severity: 'high',
          message: `[AUTOMATED SAFETY BROADCAST]: ${broadcastMessage}`,
          status: 'active',
          created_at: new Date().toISOString()
        })
      }

      setBroadcastMessage("")
      alert(`Broadcast sent successfully to ${touristProfiles.filter(t => t.is_active).length} active tourists.`)
    } catch (err) {
      console.error("Broadcast failed", err)
    } finally {
      setIsBroadcasting(false)
    }
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] text-gray-800 overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-[#0a0f1d] text-gray-400 border-r border-gray-800 flex flex-col justify-between shrink-0 z-20">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-10">
            <div className="bg-blue-600/20 p-2 rounded-xl border border-blue-500/30">
              <Shield className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">SafeTour</h1>
              <p className="text-[10px] uppercase tracking-widest text-blue-400 font-medium">Authority Portal</p>
            </div>
          </div>
          
          <nav className="space-y-1.5">
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2 px-3">Dashboards</p>
            </div>

            <button
              onClick={() => setActiveTab("police-control")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                activeTab === "police-control" 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 border-transparent" 
                  : "text-gray-400 hover:bg-gray-800/60 hover:text-white border border-transparent"
              }`}
            >
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Police Control Room</span>
            </button>

            <button
              onClick={() => setActiveTab("tourism-dept")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                activeTab === "tourism-dept" 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 border-transparent" 
                  : "text-gray-400 hover:bg-gray-800/60 hover:text-white border border-transparent"
              }`}
            >
              <Building className="h-4 w-4" />
              <span className="text-sm font-medium">Tourism Department</span>
            </button>

            <button
              onClick={() => setActiveTab("hospital")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                activeTab === "hospital" 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 border-transparent" 
                  : "text-gray-400 hover:bg-gray-800/60 hover:text-white border border-transparent"
              }`}
            >
              <HeartPulse className="h-4 w-4" />
              <span className="text-sm font-medium">Hospital Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab("e-fir")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                activeTab === "e-fir" 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 border-transparent" 
                  : "text-gray-400 hover:bg-gray-800/60 hover:text-white border border-transparent"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">E-FIR / Reports</span>
            </button>

            <button
              onClick={() => setActiveTab("broadcast")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 mt-4 ${
                activeTab === "broadcast" 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 border-transparent" 
                  : "text-gray-400 hover:bg-gray-800/60 hover:text-white border border-transparent"
              }`}
            >
              <Radio className="h-4 w-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">Safety Broadcasts</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 relative">

        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none mix-blend-overlay"></div>
        <div className="absolute top-[-50%] left-[-10%] w-[70%] h-[70%] rounded-full bg-teal-400/20 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-50%] right-[-10%] w-[70%] h-[70%] rounded-full bg-blue-400/20 blur-[120px] pointer-events-none"></div>

        
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 z-10 sticky top-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              {activeTab === "police-control" && <><Shield className="h-5 w-5 mr-2 text-blue-400" /> Police Control Room</>}
              {activeTab === "tourism-dept" && <><Building className="h-5 w-5 mr-2 text-blue-400" /> Tourism Department</>}
              {activeTab === "hospital" && <><HeartPulse className="h-5 w-5 mr-2 text-blue-400" /> Hospital Dashboard</>}
              {activeTab === "e-fir" && <><FileText className="h-5 w-5 mr-2 text-blue-400" /> E-FIR & Incident Reports</>}
              {activeTab === "broadcast" && <><Radio className="h-5 w-5 mr-2 text-red-400" /> Automated Safety Broadcasts</>}
            </h2>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-medium text-green-600">Live Sync</span>
            </div>

            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>

            <div className="h-6 w-px bg-slate-200"></div>

            <div className="relative">
              <button 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-3 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || "A"}
                </div>
                <div className="hidden md:flex flex-col text-left mr-2">
                  <span className="text-sm font-medium text-gray-800 leading-tight">{user?.name || "Administrator"}</span>
                  <span className="text-[10px] text-gray-500 leading-tight">Authority Portal</span>
                </div>
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 shadow-sm rounded-xl shadow-2xl overflow-hidden py-1 z-50">
                  <button
                    onClick={() => {
                      setShowProfileModal(true)
                      setIsProfileDropdownOpen(false)
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2.5 text-left text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center space-x-2 px-4 py-2.5 text-left text-sm font-medium text-red-500 hover:bg-red-50/50 transition-colors border-t border-slate-100"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            
            {/* POLICE CONTROL ROOM */}
            {activeTab === "police-control" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-white/80 border-gray-200 backdrop-blur-sm">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
                        <Activity className="h-3.5 w-3.5 mr-1.5 text-blue-400" /> Live SOS Alerts
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="text-3xl font-bold text-gray-900">{emergencyAlerts.length}</div>
                      <p className="text-xs text-gray-400 mt-1">Active incidents tracking</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white/80 border-gray-200 backdrop-blur-sm">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
                        <Brain className="h-3.5 w-3.5 mr-1.5 text-purple-400" /> AI Anomalies
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="text-3xl font-bold text-gray-900">{anomalies.length}</div>
                      <p className="text-xs text-gray-400 mt-1">Criminal detection alerts</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Heatmap & Alerts Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Heatmap (Takes up 2/3) */}
                  <div className="xl:col-span-2">
                    <Card className="bg-white/80 border-gray-200 shadow-xl overflow-hidden h-full flex flex-col">
                      <CardHeader className="border-b border-gray-200/50 bg-gray-50 py-4">
                        <CardTitle className="text-sm font-semibold flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-blue-400" />
                          Geo-Fencing & Risk Zones
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-500">Live monitoring of high-risk zones and deployed teams.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-0 flex-1 min-h-[400px]">
                        <AuthorityHeatmap />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Live SOS Alerts (Takes up 1/3) */}
                  <div className="flex flex-col space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-red-400" />
                      Live SOS Feed
                    </h3>
                    <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                      {emergencyAlerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-white/30 rounded-xl border border-gray-200/50 border-dashed">
                          <CheckCircle className="h-8 w-8 mb-2 text-gray-600" />
                          <span className="text-sm">No active SOS alerts</span>
                        </div>
                      ) : (
                        emergencyAlerts.slice(0, 5).map((alert) => (
                          <div key={alert.id} className={`bg-white border rounded-xl p-4 shadow-lg relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.02] ${alert.status === 'resolved' ? 'border-green-500/20 shadow-green-900/5' : 'border-red-500/20 shadow-red-900/5'}`} onClick={() => { if(alert.status !== 'resolved') setSelectedAlert(alert) }}>
                            <div className={`absolute top-0 left-0 w-1 h-full ${alert.status === 'resolved' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center space-x-2">
                                <Badge variant="destructive" className={alert.status === 'resolved' ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20"}>{alert.status === 'resolved' ? 'RESOLVED' : 'SOS'}</Badge>
                                <span className="text-xs font-medium text-gray-900">{alert.user_name || "Unknown"}</span>
                              </div>
                              <span className="text-[10px] text-gray-400 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(alert.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mb-3">{alert.message || "Emergency assistance requested"}</p>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-gray-400 flex items-center bg-gray-800/50 px-2 py-1 rounded">
                                <MapPin className="h-3 w-3 mr-1" />
                                {alert.location_lat?.toFixed(4)}, {alert.location_lng?.toFixed(4)}
                              </span>
                              {alert.status !== 'resolved' && (
                                <Button size="sm" variant="ghost" className="h-6 text-[10px] text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 px-2 pointer-events-none">
                                  Click to Resolve
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TOURISM DEPARTMENT */}
            {activeTab === "tourism-dept" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Tourist Blockchain Registry</h2>
                    <p className="text-sm text-gray-500">Secure identity storage and travel history monitoring</p>
                  </div>
                </div>

                <Card className="bg-white border-gray-200 shadow-xl">
                  <CardHeader className="border-b border-gray-200/50 bg-gray-50">
                    <CardTitle className="text-sm font-semibold text-gray-900">Registered Tourists</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-100 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-4 font-medium">Tourist Name</th>
                            <th className="px-6 py-4 font-medium">Blockchain ID</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium">Registration Date</th>
                            <th className="px-6 py-4 font-medium text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {touristProfiles.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No registered tourists found.</td>
                            </tr>
                          ) : (
                            touristProfiles.map((profile) => (
                              <tr key={profile.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-3">
                                    <div className="h-8 w-8 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 font-medium">
                                      {profile.name?.charAt(0) || "T"}
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-800">{profile.name || "Unknown"}</div>
                                      <div className="text-[10px] text-gray-400">{profile.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 font-mono text-[10px] text-blue-400/80">
                                  {profile.blockchain_id || `BC-${profile.id.substring(0, 8).toUpperCase()}`}
                                </td>
                                <td className="px-6 py-4">
                                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                                    {profile.is_active ? 'Active' : 'Verified'}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-xs">
                                  {new Date(profile.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <Button onClick={() => setSelectedTourist(profile)} size="sm" variant="ghost" className="h-7 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                                    View Details
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* HOSPITAL DASHBOARD */}
            {activeTab === "hospital" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Medical Emergencies</h2>
                    <p className="text-sm text-gray-500">Live medical SOS and patient routing</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {medicalAlerts.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white/50 border border-gray-200/50 rounded-xl border-dashed">
                      <HeartPulse className="h-10 w-10 text-gray-600 mb-3" />
                      <h3 className="text-gray-600 font-medium">No Medical Emergencies</h3>
                      <p className="text-sm text-gray-400 mt-1">All clear across hospital zones.</p>
                    </div>
                  ) : (
                    medicalAlerts.map(alert => (
                      <Card key={alert.id} className="bg-white border-red-500/30 overflow-hidden shadow-lg shadow-red-900/10 relative">
                        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500 animate-pulse"></div>
                        <CardHeader className="pb-3 pt-5">
                          <div className="flex justify-between items-start">
                            <Badge variant="destructive" className="bg-red-500/20 text-red-400 hover:bg-red-500/30">MEDICAL SOS</Badge>
                            <span className="text-xs text-gray-400 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {Math.floor((Date.now() - new Date(alert.created_at).getTime()) / 60000)} mins ago
                            </span>
                          </div>
                          <CardTitle className="text-lg mt-3 text-gray-900">{alert.user_name || "Unknown Patient"}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="bg-red-950/30 border border-red-500/20 p-3 rounded-lg">
                            <p className="text-sm text-red-200">{alert.message || "Immediate medical attention requested."}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs border-b border-gray-200 pb-2">
                              <span className="text-gray-400">Location</span>
                              <span className="text-gray-600 font-medium font-mono">{alert.location_lat?.toFixed(4)}, {alert.location_lng?.toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between text-xs border-b border-gray-200 pb-2">
                              <span className="text-gray-400">Emergency Contact</span>
                              <span className="text-gray-600 font-medium">On File (Fetch ID)</span>
                            </div>
                            <div className="flex justify-between text-xs pb-1">
                              <span className="text-gray-400">Status</span>
                              <span className="text-yellow-400 font-medium animate-pulse">Awaiting Ambulance</span>
                            </div>
                          </div>
                          
                          <Button className="w-full bg-red-600 hover:bg-red-700 text-gray-900 mt-2">
                            Dispatch Ambulance
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* E-FIR & REPORTS */}
            {activeTab === "e-fir" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                 <div className="flex justify-between items-end mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Incident Report Generator</h2>
                    <p className="text-sm text-gray-500">Downloadable PDF reports accessible by Admin & Police</p>
                  </div>
                </div>

                <Card className="bg-white border-gray-200">
                  <CardHeader className="border-b border-gray-200/50 bg-gray-50">
                    <CardTitle className="text-sm font-semibold text-gray-900">Recent Incident Logs</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-100 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-4 font-medium">Incident ID</th>
                            <th className="px-6 py-4 font-medium">Type</th>
                            <th className="px-6 py-4 font-medium">Date & Time</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium text-right">E-FIR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {emergencyAlerts.map((alert) => (
                            <tr key={alert.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 font-mono text-[10px] text-gray-500">
                                INC-{alert.id.substring(0, 8).toUpperCase()}
                              </td>
                              <td className="px-6 py-4">
                                <span className="capitalize text-gray-800">{alert.type || 'General SOS'}</span>
                              </td>
                              <td className="px-6 py-4 text-gray-500 text-xs">
                                {new Date(alert.created_at).toLocaleString()}
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant="outline" className={alert.status === 'resolved' ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"}>
                                  {alert.status || 'Active'}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Button size="sm" variant="outline" className="h-7 text-xs border-gray-300 hover:bg-gray-100 text-gray-600">
                                  <FileText className="h-3 w-3 mr-2" />
                                  Download PDF
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  )
}
