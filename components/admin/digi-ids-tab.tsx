"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { CreateDigiIdForm } from "@/components/admin/create-digi-id-form"
import { DigitalPersonaModal, type DigitalPersonaData } from "@/components/admin/digital-persona-modal"
import { QRCodeSVG } from "qrcode.react"
import { Search, QrCode, ShieldOff, ShieldCheck, Download, Eye, Plus, Sparkles, User, RefreshCw, Calendar, ArrowLeft } from "lucide-react"

interface DigiId {
  id: string
  userId: string
  documentType: string
  validFrom: string
  validUntil: string
  blockchainHash: string
  qrCodeData: string | null
  isActive: boolean
  suspendedAt: string | null
  suspendedReason: string | null
  createdAt: string
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  tripStartDate: string | null
  tripEndDate: string | null
  status: "active" | "expired" | "suspended" | "inactive"
  user: {
    id: string
    name: string | null
    email: string
    phone: string | null
    emergencyContact: string | null
    emergencyPhone: string | null
    blockchainId?: string | null
    createdAt?: string
  } | null
}

const statusBadge: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold",
  expired: "bg-amber-100 text-amber-800 border-amber-300 font-semibold",
  suspended: "bg-rose-100 text-rose-800 border-rose-300 font-semibold",
  inactive: "bg-slate-100 text-slate-600 border-slate-200",
}

export function DigiIdsTab({ initialMode = "list" }: { initialMode?: "list" | "create" }) {
  const [viewMode, setViewMode] = useState<"list" | "create">(initialMode)
  const [digiIds, setDigiIds] = useState<DigiId[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedQr, setSelectedQr] = useState<DigiId | null>(null)
  const [selectedPersona, setSelectedPersona] = useState<DigitalPersonaData | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchDigiIds = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: statusFilter, search })
      const res = await fetch(`/api/admin/digi-ids?${params}`)
      if (res.ok) {
        const data = await res.json()
        setDigiIds(data.digiIds)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search])

  useEffect(() => {
    fetchDigiIds()
  }, [fetchDigiIds])

  const handleAction = async (id: string, action: "suspend" | "activate") => {
    setActionLoading(id)
    try {
      await fetch("/api/admin/digi-ids", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      })
      await fetchDigiIds()
    } finally {
      setActionLoading(null)
    }
  }

  const fetchPersonaDetails = async (userId: string) => {
    try {
      const res = await fetch("/api/admin/tourists")
      if (res.ok) {
        const data = await res.json()
        const tourist = data.tourists.find((t: any) => t.id === userId)
        if (tourist) {
          setSelectedPersona(tourist)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const downloadQr = (digiId: DigiId) => {
    const svg = document.getElementById(`qr-${digiId.id}`)
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `digi-id-${digiId.blockchainHash.slice(0, 8)}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (viewMode === "create") {
    return (
      <div className="space-y-4">
        <CreateDigiIdForm
          onCancel={() => setViewMode("list")}
          onSuccess={() => {
            fetchDigiIds()
          }}
          onViewPersona={(userId) => {
            fetchPersonaDetails(userId)
          }}
        />

        <DigitalPersonaModal
          isOpen={!!selectedPersona}
          onClose={() => setSelectedPersona(null)}
          persona={selectedPersona}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white border-slate-200 shadow-xs rounded-2xl">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <QrCode className="h-4 w-4 text-purple-600" />
                Tourist Digi IDs & QR Management
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Register tourists, generate identity tokens, and manage Digi ID validity
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={() => setViewMode("create")}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs h-8 px-3 shadow-xs flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Create Digi ID
              </Button>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search name, email, hash..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 w-48 text-xs bg-white"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 px-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="suspended">Suspended</option>
              </select>
              <Button size="sm" variant="outline" className="h-8 w-8 p-0 bg-white" onClick={fetchDigiIds}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {loading ? (
            <p className="text-center text-slate-400 py-10 text-xs font-medium">Loading Tourist Digi IDs...</p>
          ) : digiIds.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3 max-w-md mx-auto">
              <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto border border-purple-100">
                <QrCode className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Tourist Digi IDs yet</h3>
              <p className="text-xs text-slate-500">
                Create a Digi ID to register a tourist and generate their Digital Persona and QR code.
              </p>
              <Button
                onClick={() => setViewMode("create")}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs h-9 px-4 mt-2 shadow-xs"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Create Digi ID
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="text-left py-2.5 pr-4">Tourist</th>
                    <th className="text-left py-2.5 pr-4">Digi ID Token</th>
                    <th className="text-left py-2.5 pr-4">Doc Type</th>
                    <th className="text-left py-2.5 pr-4">Valid Until</th>
                    <th className="text-left py-2.5 pr-4">Status</th>
                    <th className="text-right py-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {digiIds.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {d.user?.name ? d.user.name.substring(0, 2).toUpperCase() : "??"}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{d.user?.name || "Anonymous Tourist"}</div>
                            <div className="text-[11px] text-slate-500">{d.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-mono text-[11px] text-purple-900 bg-purple-50 px-2 py-1 rounded border border-purple-100 inline-block truncate max-w-[140px]">
                          {d.blockchainHash.slice(0, 16)}...
                        </span>
                      </td>
                      <td className="py-3 pr-4 uppercase text-slate-700 font-medium">{d.documentType}</td>
                      <td className="py-3 pr-4 text-slate-600 font-medium">
                        {new Date(d.validUntil).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge className={`text-[10px] border capitalize ${statusBadge[d.status] || "bg-slate-100"}`}>
                          {d.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {d.user?.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200"
                              onClick={() => fetchPersonaDetails(d.user!.id)}
                            >
                              <User className="h-3 w-3 mr-1" />
                              Persona
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs bg-white text-slate-700 hover:bg-slate-50"
                            onClick={() => setSelectedQr(d)}
                          >
                            <Eye className="h-3 w-3 mr-1 text-slate-500" />
                            QR
                          </Button>
                          {d.status === "suspended" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                              disabled={actionLoading === d.id}
                              onClick={() => handleAction(d.id, "activate")}
                            >
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              Activate
                            </Button>
                          ) : d.status === "active" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200"
                              disabled={actionLoading === d.id}
                              onClick={() => handleAction(d.id, "suspend")}
                            >
                              <ShieldOff className="h-3 w-3 mr-1" />
                              Suspend
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Inspection Dialog */}
      <Dialog open={!!selectedQr} onOpenChange={() => setSelectedQr(null)}>
        <DialogContent className="max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Digi ID QR Token</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Scannable QR token details for tourist digital identity.
            </DialogDescription>
          </DialogHeader>
          {selectedQr && (
            <div className="space-y-4 text-center">
              <div className="inline-block p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
                <QRCodeSVG
                  id={`qr-${selectedQr.id}`}
                  value={selectedQr.qrCodeData || selectedQr.blockchainHash}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
              <div className="text-xs space-y-1.5 text-left bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tourist Name:</span>
                  <span className="font-bold text-slate-900">{selectedQr.user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <Badge className={`text-[10px] ${statusBadge[selectedQr.status]}`}>{selectedQr.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Valid Until:</span>
                  <span className="font-semibold">{new Date(selectedQr.validUntil).toLocaleDateString()}</span>
                </div>
                <div className="mt-1 pt-1 border-t border-slate-200">
                  <span className="text-slate-400 text-[10px] block">Token Blockchain Hash</span>
                  <p className="font-mono text-[11px] text-purple-900 mt-0.5 break-all">{selectedQr.blockchainHash}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full text-xs bg-white" onClick={() => downloadQr(selectedQr)}>
                <Download className="h-3.5 w-3.5 mr-2" />
                Download QR SVG
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Digital Persona Inspection Modal */}
      <DigitalPersonaModal
        isOpen={!!selectedPersona}
        onClose={() => setSelectedPersona(null)}
        persona={selectedPersona}
      />
    </div>
  )
}
