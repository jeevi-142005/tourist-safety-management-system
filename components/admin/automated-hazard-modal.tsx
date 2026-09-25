"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CloudRain, AlertTriangle, Waves, Mountain, ShieldAlert,
  Wind, Sparkles, Send, CheckCircle2, Loader2, Users
} from "lucide-react"

interface AutomatedHazardModalProps {
  isOpen: boolean
  onClose: () => void
  onHazardTriggered?: () => void
}

export function AutomatedHazardModal({ isOpen, onClose, onHazardTriggered }: AutomatedHazardModalProps) {
  const [hazardType, setHazardType] = useState<string>("heavy_rain")
  const [tourists, setTourists] = useState<any[]>([])
  const [selectedTouristId, setSelectedTouristId] = useState<string>("")
  const [locationName, setLocationName] = useState("Coimbatore & Nilgiris Sector, Tamil Nadu")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setSuccess(false)
      setError(null)
      fetchTourists()
    }
  }, [isOpen])

  const fetchTourists = async () => {
    try {
      const res = await fetch("/api/admin/tourists")
      if (res.ok) {
        const data = await res.json()
        setTourists(data.tourists || [])
        if (data.tourists?.length > 0 && !selectedTouristId) {
          setSelectedTouristId(data.tourists[0].id)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const hazards = [
    {
      id: "heavy_rain",
      title: "Torrential Heavy Rain Hazard",
      icon: CloudRain,
      color: "border-blue-300 bg-blue-50/50 text-blue-900",
      badgeColor: "bg-blue-100 text-blue-800",
      description: "Severe precipitation (78mm/hr) & sudden cloudburst. Anomaly: Route submergence and ambient sensor noise spike.",
      severity: "critical",
    },
    {
      id: "flash_flood",
      title: "Flash Flood Surge Warning",
      icon: Waves,
      color: "border-cyan-300 bg-cyan-50/50 text-cyan-900",
      badgeColor: "bg-cyan-100 text-cyan-800",
      description: "Rapid water level rise & reservoir discharge buffer breach. Anomaly: Trajectory impassability detected.",
      severity: "critical",
    },
    {
      id: "landslide",
      title: "Landslide & Roadblock Advisory",
      icon: Mountain,
      color: "border-amber-300 bg-amber-50/50 text-amber-900",
      badgeColor: "bg-amber-100 text-amber-800",
      description: "Mudslide risk along ghat roadways. Anomaly: Significant route deviation & prolonged stationary stoppage.",
      severity: "high",
    },
    {
      id: "abnormal_area",
      title: "Restricted Zone Anomaly",
      icon: ShieldAlert,
      color: "border-rose-300 bg-rose-50/50 text-rose-900",
      badgeColor: "bg-rose-100 text-rose-800",
      description: "Geofence violation into non-permissible high crime perimeter. Anomaly: Night-time boundary breach.",
      severity: "high",
    },
    {
      id: "cyclone",
      title: "Cyclonic Gale Wind Warning",
      icon: Wind,
      color: "border-purple-300 bg-purple-50/50 text-purple-900",
      badgeColor: "bg-purple-100 text-purple-800",
      description: "High-velocity wind gusts (85km/h). Anomaly: Barometric drop & GPS signal degradation.",
      severity: "critical",
    },
  ]

  const handleTrigger = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch("/api/alerts/automated-hazard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedTouristId,
          hazardType,
          locationName,
          lat: 11.0159,
          lng: 76.9368,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to trigger automated hazard alert")
      }

      setSuccess(true)
      onHazardTriggered?.()
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 1800)
    } catch (err: any) {
      setError(err.message || "Failed to trigger alert")
    } finally {
      setLoading(false)
    }
  }

  const selectedHazard = hazards.find((h) => h.id === hazardType) || hazards[0]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[88vh] flex flex-col p-0 overflow-hidden bg-white border-slate-200 text-slate-800 shadow-2xl rounded-2xl">
        {/* FIXED HEADER */}
        <DialogHeader className="p-5 pb-4 border-b border-slate-100 bg-slate-50/70 shrink-0 text-left">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-rose-600 text-white rounded-xl shadow-md shadow-rose-500/20 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                Automated Hazard & Anomaly Dispatcher
                <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px] font-bold">
                  AI Auto-Triage Active
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Simulate or broadcast real-time weather disasters & restricted zone anomalies directly to tourists
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* SCROLLABLE BODY */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                Automated hazard alert dispatched to tourist! Banner activated with emergency assistance prompt.
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-800 text-xs animate-in fade-in">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Target Tourist Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              Target Tourist
            </label>
            <select
              value={selectedTouristId}
              onChange={(e) => setSelectedTouristId(e.target.value)}
              className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {tourists.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name || t.email} ({t.status?.toUpperCase() || "ACTIVE"} · Safety: {t.safetyScore || 85}/100)
                </option>
              ))}
            </select>
          </div>

          {/* Hazard & Anomaly Type Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">
              Select Abnormal Situation / Weather Disaster:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {hazards.map((h) => {
                const isSelected = hazardType === h.id
                const Icon = h.icon
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setHazardType(h.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/40 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-900">{h.title}</span>
                      </div>
                      <Badge className={`text-[9px] uppercase font-bold ${h.badgeColor}`}>
                        {h.severity}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                      {h.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Location field */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Sector / Region Description
            </label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full h-8 px-3 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Preview of Automated Actions */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] space-y-1.5">
            <div className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              Automated Workflow (What this does behind the scenes):
            </div>
            <ul className="text-slate-600 space-y-1 list-disc list-inside">
              <li>Sends situational weather & movement anomaly directly to the tourist dashboard banner.</li>
              <li>Prompts the tourist: <em>&ldquo;Do you need emergency assistance?&rdquo;</em></li>
              <li>Provides tourist with <strong>[Request Immediate SOS]</strong> and <strong>[I Am Safe]</strong> buttons.</li>
              <li>If tourist clicks SOS, system auto-dispatches nearest emergency unit immediately.</li>
            </ul>
          </div>
        </div>

        {/* FIXED FOOTER */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end space-x-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
            className="h-9 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleTrigger}
            disabled={loading}
            className="h-9 text-xs bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-semibold shadow-md shadow-rose-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Dispatching Automated Alert...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Dispatch Automated Alert Now
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
