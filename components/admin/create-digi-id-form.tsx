"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { QRCodeSVG } from "qrcode.react"
import {
  User, Shield, Mail, Phone, Calendar, QrCode, CheckCircle,
  Download, Printer, Eye, Sparkles, ArrowLeft, AlertCircle
} from "lucide-react"

interface CreateDigiIdFormProps {
  onSuccess?: (createdData: any) => void
  onCancel?: () => void
  onViewPersona?: (userId: string) => void
}

export function CreateDigiIdForm({ onSuccess, onCancel, onViewPersona }: CreateDigiIdFormProps) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    documentType: "passport",
    documentNumber: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    tripStartDate: new Date().toISOString().split("T")[0],
    tripEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<any | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/admin/digi-ids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to create Digi ID")
      }

      setSuccessData(data)
      if (onSuccess) {
        onSuccess(data)
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const downloadQr = () => {
    if (!successData) return
    const svg = document.getElementById("created-qr-svg")
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `digi-id-${successData.blockchainHash?.slice(0, 8)}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

  if (successData) {
    const digi = successData.digitalId
    const user = digi?.user

    return (
      <Card className="bg-white border-slate-200 shadow-md rounded-2xl max-w-2xl mx-auto">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-t-2xl p-6 text-center">
          <div className="mx-auto h-12 w-12 bg-white/20 backdrop-blur-xs rounded-full flex items-center justify-center mb-2">
            <CheckCircle className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-xl font-bold text-white">DIGI ID CREATED SUCCESSFULLY</CardTitle>
          <CardDescription className="text-emerald-100 text-xs mt-1">
            Digital Identity Token & QR Code generated and linked to Tourist Persona
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* QR Canvas */}
            <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="inline-block p-3 bg-white border border-slate-200 rounded-xl shadow-xs mb-3">
                <QRCodeSVG
                  id="created-qr-svg"
                  value={successData.qrCodeData || successData.blockchainHash}
                  size={180}
                  level="H"
                  includeMargin
                />
              </div>
              <p className="text-[11px] text-slate-500 font-mono break-all">
                Hash: {successData.blockchainHash?.slice(0, 24)}...
              </p>
            </div>

            {/* Tourist Details Summary */}
            <div className="space-y-3 text-xs">
              <div className="pb-2 border-b border-slate-100">
                <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">Tourist Name</span>
                <p className="text-sm font-bold text-slate-900">{user?.name || form.fullName}</p>
                <p className="text-slate-500">{user?.email || form.email}</p>
              </div>

              <div className="pb-2 border-b border-slate-100">
                <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">Digi ID Token</span>
                <p className="font-mono text-slate-800 font-semibold truncate">{digi?.blockchainHash || successData.blockchainHash}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">Status</span>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                    ACTIVE
                  </Badge>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">Valid Until</span>
                  <p className="font-semibold text-slate-800">{new Date(digi?.validUntil || form.tripEndDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-2 flex-wrap pt-4 border-t border-slate-100">
            {onViewPersona && (
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs"
                onClick={() => onViewPersona(user?.id || digi?.userId)}
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                View Digital Persona
              </Button>
            )}
            <Button size="sm" variant="outline" className="text-xs bg-white" onClick={downloadQr}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download QR
            </Button>
            <Button size="sm" variant="outline" className="text-xs bg-white" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Print QR
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="text-xs"
              onClick={() => {
                setSuccessData(null)
                setForm({
                  fullName: "",
                  email: "",
                  phone: "",
                  documentType: "passport",
                  documentNumber: "",
                  emergencyContactName: "",
                  emergencyContactPhone: "",
                  tripStartDate: new Date().toISOString().split("T")[0],
                  tripEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                })
              }}
            >
              + Create Another Digi ID
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-slate-200 shadow-sm rounded-2xl max-w-3xl mx-auto">
      <CardHeader className="pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            {onCancel && (
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onCancel}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <QrCode className="h-4 w-4 text-purple-600" />
              Create Tourist Digi ID
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Register tourist, generate secure Digi ID identity token, QR code, and Digital Persona
          </CardDescription>
        </div>
        <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] font-semibold flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Admin Creation
        </Badge>
      </CardHeader>

      <CardContent className="p-6">
        {error && (
          <div className="p-3 mb-5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: TOURIST INFORMATION */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <User className="h-3.5 w-3.5 text-blue-600" /> 1. Tourist Profile Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name *</label>
                <Input
                  required
                  placeholder="e.g. John Doe"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address *</label>
                <Input
                  required
                  type="email"
                  placeholder="e.g. tourist@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number</label>
                <Input
                  placeholder="e.g. +1 555 0192"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: IDENTITY INFORMATION */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <Shield className="h-3.5 w-3.5 text-purple-600" /> 2. Identity Verification Document
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Document Type *</label>
                <select
                  value={form.documentType}
                  onChange={(e) => setForm({ ...form, documentType: e.target.value })}
                  className="w-full h-9 px-3 border border-slate-300 rounded-xl text-xs bg-white text-slate-800"
                >
                  <option value="passport">Passport</option>
                  <option value="aadhaar">Aadhaar Card</option>
                  <option value="other">Driver's License / Other Gov ID</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Document Number *</label>
                <Input
                  required
                  placeholder={form.documentType === "aadhaar" ? "12-digit Aadhaar Number" : "Passport / ID Number"}
                  value={form.documentNumber}
                  onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
                  className="h-9 text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Document numbers are SHA-256 encrypted. Only last 4 digits stored for token verification.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3: EMERGENCY CONTACT */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <Phone className="h-3.5 w-3.5 text-rose-600" /> 3. Emergency Contact Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Emergency Contact Name</label>
                <Input
                  placeholder="Contact person name"
                  value={form.emergencyContactName}
                  onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Emergency Phone Number</label>
                <Input
                  placeholder="Emergency phone number"
                  value={form.emergencyContactPhone}
                  onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: TRAVEL INFORMATION */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <Calendar className="h-3.5 w-3.5 text-emerald-600" /> 4. Trip Duration & Validity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Trip Start Date</label>
                <Input
                  type="date"
                  value={form.tripStartDate}
                  onChange={(e) => setForm({ ...form, tripStartDate: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Trip End Date (Digi ID Expiry) *</label>
                <Input
                  required
                  type="date"
                  value={form.tripEndDate}
                  onChange={(e) => setForm({ ...form, tripEndDate: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            {onCancel && (
              <Button type="button" variant="outline" size="sm" onClick={onCancel} className="text-xs bg-white">
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs h-9 px-5 shadow-sm"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                  Generating Digi ID & QR...
                </div>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-1.5" />
                  Create Digi ID & Digital Persona
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
