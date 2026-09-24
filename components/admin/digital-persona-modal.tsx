"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QRCodeSVG } from "qrcode.react"
import {
  User, Shield, MapPin, Phone, Mail, Battery, Clock, QrCode,
  AlertTriangle, Siren, Heart, CheckCircle, Brain, Calendar, ExternalLink, Activity, Sparkles
} from "lucide-react"

export interface DigitalPersonaData {
  id: string
  name: string | null
  email: string
  phone: string | null
  emergencyContact: string | null
  emergencyPhone: string | null
  blockchainId: string | null
  createdAt: string
  currentLocation: {
    latitude: number
    longitude: number
    timestamp: string
    batteryLevel: number | null
    isEmergency: boolean
  } | null
  safetyScore: number
  riskLevel: string
  activeAlertsCount: number
  activeAlerts: { id: string; type: string; severity: string; status: string; message?: string; createdAt?: string }[]
  digiId: {
    id: string
    blockchainHash: string
    documentType: string
    validUntil: string
    validFrom?: string
    qrCodeData: string | null
    isActive?: boolean
    suspendedAt?: string | null
    suspendedReason?: string | null
    emergencyContactName?: string | null
    emergencyContactPhone?: string | null
    tripStartDate?: string | null
    tripEndDate?: string | null
  } | null
  status: "safe" | "alert" | "emergency"
  anomalies?: {
    id: string
    type: string
    severity: string
    description: string
    confidence: number
    riskFactors?: string[]
    recommendations?: string[]
    resolved: boolean
    createdAt: string
  }[]
  alertHistory?: {
    id: string
    type: string
    severity: string
    message: string
    status: string
    locationLat: number | null
    locationLng: number | null
    createdAt: string
  }[]
}

interface DigitalPersonaModalProps {
  isOpen: boolean
  onClose: () => void
  persona: DigitalPersonaData | null
}

const statusBadgeColor: Record<string, string> = {
  safe: "bg-emerald-100 text-emerald-800 border-emerald-300",
  alert: "bg-amber-100 text-amber-800 border-amber-300",
  emergency: "bg-rose-100 text-rose-800 border-rose-300 animate-pulse",
}

const riskColor: Record<string, string> = {
  low: "text-emerald-600 bg-emerald-50 border-emerald-200",
  medium: "text-amber-600 bg-amber-50 border-amber-200",
  high: "text-orange-600 bg-orange-50 border-orange-200",
  critical: "text-rose-600 bg-rose-50 border-rose-200",
  unknown: "text-gray-500 bg-gray-50 border-gray-200",
}

export function DigitalPersonaModal({ isOpen, onClose, persona }: DigitalPersonaModalProps) {
  const [activeTab, setActiveTab] = useState("overview")

  if (!persona) return null

  const digiIdValid = persona.digiId && new Date(persona.digiId.validUntil) >= new Date() && !persona.digiId.suspendedAt

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-slate-50 border-gray-200">
        <DialogDescription className="sr-only">
          Digital Persona safety profile and identity information for {persona.name || "Tourist"}.
        </DialogDescription>
        {/* HEADER BANNER */}
        <div className="bg-slate-900 text-white p-6 border-b border-slate-800 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center font-bold text-xl text-white shadow-lg shrink-0">
                {persona.name ? persona.name.substring(0, 2).toUpperCase() : "??"}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-xl font-bold text-white">{persona.name || "Anonymous Tourist"}</DialogTitle>
                  <Badge className={`text-xs px-2.5 py-0.5 font-semibold ${statusBadgeColor[persona.status]}`}>
                    {persona.status.toUpperCase()}
                  </Badge>
                  {persona.digiId ? (
                    <Badge className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/40 flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Digi ID Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-gray-400 border-gray-700">
                      No Digi ID
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{persona.email}</span>
                  {persona.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{persona.phone}</span>}
                  <span className="flex items-center gap-1"><QrCode className="h-3 w-3" />{persona.blockchainId || "ID Pending"}</span>
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Safety Score</p>
              <div className="text-2xl font-black text-white flex items-center justify-end gap-1">
                <span>{persona.safetyScore}</span>
                <span className="text-xs text-slate-400 font-normal">/100</span>
              </div>
              <Badge className={`text-[10px] uppercase font-bold mt-0.5 border ${riskColor[persona.riskLevel]}`}>
                {persona.riskLevel} risk
              </Badge>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-white border-b border-gray-200 px-6 pt-2">
            <TabsList className="bg-transparent h-10 p-0 space-x-6">
              {[
                { id: "overview", label: "Overview", icon: User },
                { id: "digi-id", label: "Digi ID & QR", icon: QrCode },
                { id: "safety-risk", label: "Safety & Risk", icon: Sparkles },
                { id: "location", label: "Location Tracking", icon: MapPin },
                { id: "anomalies", label: "Anomalies", icon: Brain },
                { id: "alerts", label: `Alerts (${persona.activeAlertsCount})`, icon: AlertTriangle },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-1 py-2 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5"
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="p-6">
            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-4 m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Profile Information */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-blue-600" /> Personal Profile
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-gray-500">Full Name</span>
                      <span className="font-semibold text-gray-900">{persona.name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-gray-500">Email Address</span>
                      <span className="font-medium text-gray-800">{persona.email}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-gray-500">Phone Number</span>
                      <span className="font-medium text-gray-800">{persona.phone || "—"}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500">Registered On</span>
                      <span className="font-medium text-gray-800">{new Date(persona.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Emergency Contacts */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-rose-600" /> Emergency Contacts
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-gray-500">Primary Contact Name</span>
                      <span className="font-semibold text-gray-900">{persona.emergencyContact || persona.digiId?.emergencyContactName || "—"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-gray-500">Emergency Phone</span>
                      <span className="font-semibold text-rose-600">{persona.emergencyPhone || persona.digiId?.emergencyContactPhone || "—"}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500">Digi ID Linked Contact</span>
                      <span className="font-medium text-gray-800">{persona.digiId?.emergencyContactName ? `${persona.digiId.emergencyContactName} (${persona.digiId.emergencyContactPhone || "No phone"})` : "Synced"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Summary Banner */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-indigo-600" /> Real-time Status Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-gray-400 block mb-1">Latest Location</span>
                    <span className="font-semibold text-gray-800 block">
                      {persona.currentLocation ? `${persona.currentLocation.latitude.toFixed(4)}, ${persona.currentLocation.longitude.toFixed(4)}` : "Unavailable"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-gray-400 block mb-1">Battery Status</span>
                    <span className="font-semibold text-gray-800 block flex items-center gap-1">
                      <Battery className="h-3.5 w-3.5 text-emerald-600" />
                      {persona.currentLocation?.batteryLevel != null ? `${persona.currentLocation.batteryLevel}%` : "Unknown"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-gray-400 block mb-1">Digi ID Status</span>
                    <span className="font-semibold block capitalize text-purple-700">
                      {persona.digiId ? (digiIdValid ? "Active & Verified" : "Expired / Suspended") : "Not Issued"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-gray-400 block mb-1">Active Alerts</span>
                    <span className={`font-bold block ${persona.activeAlertsCount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {persona.activeAlertsCount} Active
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* DIGI ID & QR TAB */}
            <TabsContent value="digi-id" className="space-y-4 m-0">
              {persona.digiId ? (
                <div className="bg-white p-6 rounded-xl border border-purple-100 shadow-sm space-y-6">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* QR Preview */}
                    <div className="p-4 bg-white border-2 border-purple-200 rounded-xl shadow-md flex flex-col items-center">
                      <QRCodeSVG
                        value={persona.digiId.qrCodeData || persona.digiId.blockchainHash}
                        size={160}
                        level="H"
                        includeMargin
                      />
                      <span className="text-[10px] font-mono text-purple-700 font-bold mt-2 uppercase tracking-wide">
                        {persona.digiId.documentType} ID Token
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium">Document Type:</span>
                        <Badge className="capitalize bg-purple-100 text-purple-800">{persona.digiId.documentType}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium">Validity Period:</span>
                        <span className="font-medium text-gray-800">
                          {persona.digiId.validFrom ? new Date(persona.digiId.validFrom).toLocaleDateString() : "Issued"} - {new Date(persona.digiId.validUntil).toLocaleDateString()}
                        </span>
                      </div>
                      {persona.digiId.tripStartDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 font-medium">Trip Window:</span>
                          <span className="font-medium text-gray-800">
                            {new Date(persona.digiId.tripStartDate).toLocaleDateString()} to {persona.digiId.tripEndDate ? new Date(persona.digiId.tripEndDate).toLocaleDateString() : "Open"}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500 font-medium block mb-1">Blockchain Hash:</span>
                        <p className="font-mono text-[11px] bg-slate-50 p-2 rounded border border-slate-200 break-all text-slate-700">
                          {persona.digiId.blockchainHash}
                        </p>
                      </div>
                      <div className="pt-2 flex gap-2">
                        <a
                          href={`/verify/${persona.digiId.blockchainHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-md font-semibold text-xs hover:bg-purple-700 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Public Verification Portal
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-xl border border-gray-200 text-center space-y-3">
                  <Shield className="h-10 w-10 text-gray-300 mx-auto" />
                  <p className="text-sm font-semibold text-gray-700">No Digital ID Generated Yet</p>
                  <p className="text-xs text-gray-400 max-w-md mx-auto">
                    This tourist has not created a Digital Tourist ID yet. Once generated, their tokenized verification record and QR code will appear here.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* SAFETY & RISK TAB */}
            <TabsContent value="safety-risk" className="space-y-4 m-0">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Safety & Risk Assessment</h3>
                    <p className="text-xs text-gray-500">AI-computed safety metrics and travel advice</p>
                  </div>
                  <Badge className={`text-xs font-bold px-3 py-1 ${riskColor[persona.riskLevel]}`}>
                    {persona.riskLevel.toUpperCase()} RISK
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-slate-600 block uppercase tracking-wider">Calculated Score</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-blue-600">{persona.safetyScore}</span>
                      <span className="text-xs text-gray-500">/ 100 Safety Index</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed mt-2">
                      Score evaluated based on location stability, geofence compliance, device battery, and real-time behavioral metrics.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-slate-600 block uppercase tracking-wider">Automated Safety Advice</span>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {persona.riskLevel === "low"
                        ? "Tourist is in a safe zone with normal movement parameters. Standard precautions recommended."
                        : persona.riskLevel === "medium"
                        ? "Moderate caution advised. Tourist should maintain charged phone and stay near main tourist routes."
                        : "Elevated risk detected! Ensure emergency contacts and local security personnel are notified if anomalies persist."}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* LOCATION TAB */}
            <TabsContent value="location" className="space-y-4 m-0">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-600" /> GPS Location Tracking
                  </h3>
                  {persona.currentLocation && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Last updated {new Date(persona.currentLocation.timestamp).toLocaleString()}
                    </span>
                  )}
                </div>

                {persona.currentLocation ? (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <span className="text-gray-400 block mb-0.5 font-medium">Latitude</span>
                        <span className="font-mono font-bold text-slate-800 text-sm">{persona.currentLocation.latitude.toFixed(6)}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <span className="text-gray-400 block mb-0.5 font-medium">Longitude</span>
                        <span className="font-mono font-bold text-slate-800 text-sm">{persona.currentLocation.longitude.toFixed(6)}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <span className="text-gray-400 block mb-0.5 font-medium">Emergency Flag</span>
                        <span className={`font-bold ${persona.currentLocation.isEmergency ? "text-rose-600" : "text-emerald-600"}`}>
                          {persona.currentLocation.isEmergency ? "YES (EMERGENCY)" : "NO"}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-emerald-900">Map View Available</p>
                        <p className="text-emerald-700 text-xs mt-0.5">Track location live in the Live Tracking module.</p>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${persona.currentLocation.latitude},${persona.currentLocation.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded text-xs flex items-center gap-1 hover:bg-emerald-700 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Open in Google Maps
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-center py-6 text-gray-400 text-xs">No location track data available yet.</p>
                )}
              </div>
            </TabsContent>

            {/* ANOMALIES TAB */}
            <TabsContent value="anomalies" className="space-y-4 m-0">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-600" /> AI-Detected Safety & Anomaly Patterns
                </h3>

                {persona.anomalies && persona.anomalies.length > 0 ? (
                  <div className="space-y-3">
                    {persona.anomalies.map((anom) => (
                      <div key={anom.id} className="p-3 rounded-lg border border-purple-100 bg-purple-50/30 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-purple-200 text-purple-900 uppercase font-semibold text-[10px]">{anom.type}</Badge>
                            <span className="font-semibold text-slate-800">{anom.description}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px]">{anom.severity}</Badge>
                        </div>
                        <p className="text-gray-500 text-[11px]">Detected: {new Date(anom.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                    No safety anomalies detected for this tourist.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ALERTS TAB */}
            <TabsContent value="alerts" className="space-y-4 m-0">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600" /> Active & Historical Alerts
                </h3>

                {persona.activeAlerts && persona.activeAlerts.length > 0 ? (
                  <div className="space-y-2">
                    {persona.activeAlerts.map((alt) => (
                      <div key={alt.id} className="p-3 rounded-lg border border-rose-200 bg-rose-50/40 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold uppercase text-rose-800">{alt.type}</span>
                            <Badge className="bg-rose-100 text-rose-700 text-[10px]">{alt.severity}</Badge>
                            <Badge className="bg-amber-100 text-amber-800 text-[10px]">{alt.status}</Badge>
                          </div>
                          {alt.message && <p className="text-gray-700 mt-1">{alt.message}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-6 text-slate-400 text-xs">No active alerts for this tourist.</p>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
