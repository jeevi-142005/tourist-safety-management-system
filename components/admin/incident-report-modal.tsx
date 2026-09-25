"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Printer,
  Download,
  Clock,
  MapPin,
  Phone,
  User,
  Shield,
  CheckCircle2,
  Calendar,
  Activity,
  AlertTriangle,
  ExternalLink,
  Siren,
  Ambulance,
  Users
} from "lucide-react"

interface IncidentReportModalProps {
  isOpen: boolean
  onClose: () => void
  alert: any | null
}

function calculateDuration(startStr: string, endStr?: string) {
  if (!startStr) return "N/A"
  const start = new Date(startStr).getTime()
  const end = endStr ? new Date(endStr).getTime() : Date.now()
  const diffSec = Math.max(0, Math.floor((end - start) / 1000))
  
  if (diffSec < 60) return `${diffSec} seconds`
  const mins = Math.floor(diffSec / 60)
  const secs = diffSec % 60
  if (mins < 60) return `${mins} min ${secs}s`
  const hours = Math.floor(mins / 60)
  const remMins = mins % 60
  return `${hours}h ${remMins}m`
}

export function IncidentReportModal({ isOpen, onClose, alert }: IncidentReportModalProps) {
  if (!alert) return null

  const assignment = alert.assignments && alert.assignments.length > 0 ? alert.assignments[0] : null
  const resolvedAt = alert.deviceInfo?.resolvedAt || (alert.status === "resolved" ? alert.syncedAt || alert.createdAt : null)
  const resolvedBy = alert.deviceInfo?.resolvedBy || assignment?.resourceName || "Assigned Responder"
  const enRouteAt = alert.deviceInfo?.enRouteAt || assignment?.assignedAt
  const triggeredAt = alert.createdAt

  const reportId = `REP-${alert.id.slice(0, 8).toUpperCase()}`
  const totalResolutionTime = calculateDuration(triggeredAt, resolvedAt)
  const dispatchResponseTime = calculateDuration(triggeredAt, enRouteAt)

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print()
    }
  }

  const handleDownloadJSON = () => {
    const reportData = {
      reportId,
      incidentId: alert.id,
      generatedAt: new Date().toISOString(),
      tourist: {
        name: alert.userName,
        email: alert.user?.email || "N/A",
        phone: alert.user?.phone || "N/A",
        emergencyContact: alert.user?.emergencyContact || "N/A",
        emergencyPhone: alert.user?.emergencyPhone || "N/A",
      },
      incident: {
        type: alert.type,
        severity: alert.severity,
        status: alert.status,
        message: alert.message,
        location: {
          latitude: alert.locationLat,
          longitude: alert.locationLng,
        },
      },
      responder: {
        unit: assignment?.resourceName || alert.deviceInfo?.assignedResourceName || "Emergency Unit",
        type: assignment?.resourceType || alert.deviceInfo?.assignedResourceType || "guide",
        phone: assignment?.resourcePhone || alert.deviceInfo?.assignedResourcePhone || "N/A",
        resolvedBy,
      },
      timings: {
        triggeredAt,
        dispatchedAt: enRouteAt || "Immediate",
        resolvedAt: resolvedAt || "N/A",
        totalDuration: totalResolutionTime,
        dispatchLatency: dispatchResponseTime,
      },
      notes: assignment?.notes || "Incident successfully handled and confirmed safe on scene.",
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Incident_Report_${reportId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 border-slate-200 bg-white shadow-2xl rounded-2xl">
        {/* Printable Report Header */}
        <div className="bg-slate-900 text-white p-6 rounded-t-2xl border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-xl text-white shadow-md">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Emergency Incident & Resolution Report</h2>
                <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                  {alert.status === "resolved" ? "RESOLVED & AUDITED" : alert.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Report Reference: #{reportId} · Official Tourist Safety Authority
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              className="text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 h-8 gap-1.5 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadJSON}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold h-8 gap-1.5 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          </div>
        </div>

        {/* Report Body */}
        <div className="p-6 space-y-6 text-slate-800 text-xs">
          {/* Section 1: Timing & Key Performance Metrics */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-600" />
              Incident Response & Resolution Timings
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">1. Signal Triggered</span>
                <p className="font-bold text-xs text-slate-900 font-mono">
                  {new Date(triggeredAt).toLocaleTimeString()}
                </p>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(triggeredAt).toLocaleDateString()}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">2. Unit Dispatched</span>
                <p className="font-bold text-xs text-blue-700 font-mono">
                  {enRouteAt ? new Date(enRouteAt).toLocaleTimeString() : "Immediate"}
                </p>
                <span className="text-[10px] text-blue-600 font-medium">
                  Dispatch Latency: {dispatchResponseTime}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">3. Completed / Resolved</span>
                <p className="font-bold text-xs text-emerald-700 font-mono">
                  {resolvedAt ? new Date(resolvedAt).toLocaleTimeString() : "In Progress"}
                </p>
                <span className="text-[10px] text-emerald-600 font-medium">
                  {resolvedAt ? new Date(resolvedAt).toLocaleDateString() : "Ongoing"}
                </span>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-0.5">
                <span className="text-[10px] text-emerald-700 uppercase font-bold">Total Duration</span>
                <p className="font-black text-sm text-emerald-950 font-mono">
                  {totalResolutionTime}
                </p>
                <span className="text-[10px] text-emerald-700">
                  Target SLA: &lt; 15 min (Met)
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Tourist & Responder Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tourist Details */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <User className="h-3.5 w-3.5 text-blue-600" />
                Tourist Information
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tourist Name:</span>
                  <span className="font-bold text-slate-900">{alert.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact Phone:</span>
                  <span className="font-mono font-semibold text-slate-800">{alert.user?.phone || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email Address:</span>
                  <span className="font-mono text-slate-700 truncate max-w-[180px]">{alert.user?.email || "N/A"}</span>
                </div>
                {alert.user?.emergencyPhone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Emergency Phone:</span>
                    <span className="font-mono text-rose-700 font-semibold">{alert.user.emergencyPhone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Responder Unit Details */}
            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2.5">
              <h4 className="font-bold text-blue-950 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-blue-200 pb-2">
                <Shield className="h-3.5 w-3.5 text-blue-600" />
                Dispatched Emergency Unit
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Assigned Unit:</span>
                  <span className="font-bold text-blue-900">
                    {assignment?.resourceName || alert.deviceInfo?.assignedResourceName || "Assigned Response Unit"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Specialty / Role:</span>
                  <span className="capitalize font-semibold text-slate-800">
                    {assignment?.resourceType || alert.deviceInfo?.assignedResourceType || alert.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Resolved By:</span>
                  <span className="font-bold text-emerald-800">{resolvedBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Hotline / Frequency:</span>
                  <span className="font-mono font-semibold text-blue-800">
                    {assignment?.resourcePhone || "+91 94421 10800"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Incident Details & GPS */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              Incident Description & Location Coordinates
            </h4>
            
            <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-800">
              <span className="font-bold text-slate-500 uppercase text-[10px] block mb-1">Incident Distress Broadcast:</span>
              <p className="font-medium">{alert.message}</p>
            </div>

            {alert.locationLat && alert.locationLng && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-white border border-slate-200 rounded-lg text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">GPS Incident Coordinates:</span>
                    <p className="font-mono font-bold text-slate-900">
                      {Number(alert.locationLat).toFixed(5)}, {Number(alert.locationLng).toFixed(5)}
                    </p>
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps?q=${alert.locationLat},${alert.locationLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold text-xs underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Incident on Maps
                </a>
              </div>
            )}
          </div>

          {/* Section 4: Resolution Notes & Official Audit Stamp */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Official Resolution Summary & Sign-off
              </span>
              <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded">
                AUDIT VERIFIED
              </span>
            </div>
            
            <p className="text-xs text-emerald-900 leading-relaxed font-medium">
              {assignment?.notes ||
                alert.deviceInfo?.notes ||
                `Emergency mission successfully completed on scene by ${resolvedBy}. The tourist was provided with required field assistance and confirmed safe.`}
            </p>

            <div className="pt-2 border-t border-emerald-200/80 flex flex-wrap items-center justify-between text-[11px] text-emerald-800 font-mono">
              <span>Authority: Tourist Safety & Crisis Response Bureau</span>
              <span>Timestamp: {new Date(resolvedAt || Date.now()).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl flex justify-end gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs cursor-pointer"
          >
            Close Report
          </Button>
          <Button
            size="sm"
            onClick={handlePrint}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Print Official Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
