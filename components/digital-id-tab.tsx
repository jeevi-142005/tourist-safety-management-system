"use client"

import { useState, useEffect } from "react"
import { Shield, CheckCircle, QrCode, Calendar, FileText, XCircle, RefreshCw } from "lucide-react"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { QRCodeSVG } from "qrcode.react"
import Link from "next/link"

interface TouristID {
  id: string
  document_type: string
  document_number: string
  valid_from: string
  valid_until: string
  blockchain_hash: string
  qr_code_data: string
  is_active: boolean
  created_at: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  trip_start_date?: string
  trip_end_date?: string
}

// ---------------------------------------------------------------------------
// Main smart tab component
// ---------------------------------------------------------------------------
export function DigitalIDTab() {
  const [activeID, setActiveID] = useState<TouristID | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deactivating, setDeactivating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    fetchActiveID()
  }, [])

  const fetchActiveID = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/digital-id")
      if (!res.ok) {
        if (res.status === 401) {
          setError("Please log in to view your Digital ID.")
          return
        }
        throw new Error("Failed to fetch digital ID")
      }
      const result = await res.json()
      const ids: TouristID[] = result.data || []
      // Only show the most recent active ID
      const found = ids.find((t) => t.is_active) ?? null
      setActiveID(found)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivate = async () => {
    if (!activeID) return
    setDeactivating(true)
    try {
      const res = await fetch(`/api/digital-id?id=${activeID.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to deactivate")
      setActiveID(null)
      setShowCreateForm(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate")
    } finally {
      setDeactivating(false)
    }
  }

  const handleIDCreated = () => {
    setShowCreateForm(false)
    fetchActiveID()
  }

  const isExpired = (validUntil: string) => new Date(validUntil) < new Date()
  const daysLeft = (validUntil: string) => {
    const diff = new Date(validUntil).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3 animate-in fade-in duration-200">
        <div className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
        <p className="text-sm text-gray-500">Loading your Digital ID...</p>
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className="max-w-md mx-auto animate-in fade-in duration-200">
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={fetchActiveID} className="mt-3 w-full">
          <RefreshCw className="h-4 w-4 mr-2" />Retry
        </Button>
      </div>
    )
  }

  // No active ID — show creation form
  if (!activeID || showCreateForm) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="text-center max-w-xl mx-auto">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Create Your Digital Tourist ID</h2>
          <p className="text-sm text-gray-500">
            A one-time blockchain-verified identity for your trip. Once created, it shows here permanently.
          </p>
        </div>
        <DigitalIDCreatorForm onCreated={handleIDCreated} />
      </div>
    )
  }

  // Has active ID — show the card
  const expired = isExpired(activeID.valid_until)
  const days = daysLeft(activeID.valid_until)

  return (
    <div className="space-y-5 animate-in fade-in duration-200 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Your Digital Tourist ID</h2>
        <p className="text-xs text-gray-500">Blockchain-verified travel credential — stored permanently.</p>
      </div>

      {/* Status banner */}
      {expired ? (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Your ID has expired. Click <strong>Deactivate &amp; Renew</strong> to create a new one.
          </AlertDescription>
        </Alert>
      ) : days <= 7 ? (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Shield className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Expiring in <strong>{days} day{days !== 1 ? "s" : ""}</strong>. Consider renewing soon.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Your Digital ID is <strong>active</strong> and blockchain-verified. Valid for {days} more days.
          </AlertDescription>
        </Alert>
      )}

      {/* ID Card */}
      <Card className="overflow-hidden shadow-lg">
        <CardContent className="p-0">
          {/* Gradient header */}
          <div
            className={`bg-gradient-to-r ${
              expired ? "from-gray-400 to-gray-600" : "from-blue-600 to-purple-700"
            } p-6 text-white`}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6" />
                <span className="font-bold text-lg tracking-wide">Digital Tourist ID</span>
              </div>
              <Badge className={`${expired ? "bg-red-500" : "bg-white/20"} text-white border-white/30 text-xs`}>
                {expired ? "Expired" : "✓ Verified"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs opacity-70 uppercase tracking-wide">Document Type</p>
                <p className="font-semibold capitalize mt-0.5">{activeID.document_type}</p>
              </div>
              <div>
                <p className="text-xs opacity-70 uppercase tracking-wide">Document No.</p>
                <p className="font-semibold mt-0.5">***{activeID.document_number.slice(-4)}</p>
              </div>
              <div>
                <p className="text-xs opacity-70 uppercase tracking-wide">Issued On</p>
                <p className="font-semibold mt-0.5">{new Date(activeID.valid_from).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs opacity-70 uppercase tracking-wide">Valid Until</p>
                <p className="font-semibold mt-0.5">{new Date(activeID.valid_until).toLocaleDateString()}</p>
              </div>
              {activeID.trip_start_date && activeID.trip_end_date && (
                <div className="col-span-2">
                  <p className="text-xs opacity-70 uppercase tracking-wide">Trip Period</p>
                  <p className="font-semibold mt-0.5">
                    {new Date(activeID.trip_start_date).toLocaleDateString()} —{" "}
                    {new Date(activeID.trip_end_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {/* Stat pills */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Calendar className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-blue-700">{Math.max(0, days)} days</p>
                <p className="text-[10px] text-blue-500">remaining</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <Shield className="h-4 w-4 text-green-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-green-700">Secured</p>
                <p className="text-[10px] text-green-500">blockchain</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <CheckCircle className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-purple-700">{expired ? "Expired" : "Active"}</p>
                <p className="text-[10px] text-purple-500">status</p>
              </div>
            </div>

            {/* Emergency contact */}
            {activeID.emergency_contact_name && (
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                <p className="text-xs font-bold text-orange-800 mb-0.5">Emergency Contact</p>
                <p className="text-sm text-orange-700">
                  {activeID.emergency_contact_name}
                  {activeID.emergency_contact_phone && ` — ${activeID.emergency_contact_phone}`}
                </p>
              </div>
            )}

            {/* Blockchain details */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Blockchain Verification</span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Transaction Hash</p>
                <p className="font-mono text-[11px] bg-white border rounded p-2 mt-1 break-all text-gray-700">
                  0x{activeID.blockchain_hash.slice(0, 40)}...
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-xs text-gray-700 mt-0.5">{new Date(activeID.created_at).toLocaleString()}</p>
                </div>
                <Link
                  href={`/verify/${activeID.blockchain_hash}`}
                  target="_blank"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Verify →
                </Link>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="flex-1" disabled={expired}>
                    <QrCode className="h-4 w-4 mr-2" />
                    Show QR Code
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Digital Tourist ID — QR Code</DialogTitle>
                    <DialogDescription>Show this to authorities for instant verification</DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col items-center py-4 space-y-3">
                    <div className="bg-white p-5 border-2 border-gray-200 rounded-xl inline-block">
                      <QRCodeSVG value={activeID.qr_code_data || ""} size={220} level="H" includeMargin />
                    </div>
                    <p className="text-sm text-gray-500">
                      Valid until {new Date(activeID.valid_until).toLocaleDateString()}
                    </p>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                onClick={handleDeactivate}
                disabled={deactivating}
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                {deactivating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Deactivate &amp; Renew
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline creation form (called only when no active ID exists)
// ---------------------------------------------------------------------------
function DigitalIDCreatorForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    documentType: "",
    documentNumber: "",
    fullName: "",
    cityName: "",
    validUntil: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    tripStartDate: "",
    tripEndDate: "",
  })
  const [generating, setGenerating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const set = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }))
    setFormError(null)
  }

  const handleSubmit = async () => {
    if (!form.documentType || !form.documentNumber || !form.fullName || !form.validUntil) {
      setFormError("Please fill in all required fields: Full Name, Document Type, Number, and Valid Until.")
      return
    }
    setGenerating(true)
    try {
      const res = await fetch("/api/digital-id/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Creation failed")
      onCreated()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create Digital ID")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-sm">
      <CardContent className="p-6 space-y-5">
        {formError && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{formError}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="did-fullName">Full Name *</Label>
            <Input
              id="did-fullName"
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="As per your document"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="did-city">City / Destination</Label>
            <Input
              id="did-city"
              value={form.cityName}
              onChange={(e) => set("cityName", e.target.value)}
              placeholder="e.g. Coimbatore"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="did-docType">Document Type *</Label>
            <Select value={form.documentType} onValueChange={(v) => set("documentType", v)}>
              <SelectTrigger id="did-docType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
                <SelectItem value="passport">Passport</SelectItem>
                <SelectItem value="other">Other Govt. ID</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="did-docNum">Document Number *</Label>
            <Input
              id="did-docNum"
              value={form.documentNumber}
              onChange={(e) => set("documentNumber", e.target.value)}
              placeholder="ID number"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="did-validUntil">Valid Until *</Label>
            <Input
              id="did-validUntil"
              type="date"
              value={form.validUntil}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => set("validUntil", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="did-tripStart">Trip Start Date</Label>
            <Input
              id="did-tripStart"
              type="date"
              value={form.tripStartDate}
              onChange={(e) => set("tripStartDate", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="did-tripEnd">Trip End Date</Label>
            <Input
              id="did-tripEnd"
              type="date"
              value={form.tripEndDate}
              onChange={(e) => set("tripEndDate", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="did-ecName">Emergency Contact Name</Label>
            <Input
              id="did-ecName"
              value={form.emergencyContactName}
              onChange={(e) => set("emergencyContactName", e.target.value)}
              placeholder="Parent / Spouse"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="did-ecPhone">Emergency Contact Phone</Label>
            <Input
              id="did-ecPhone"
              value={form.emergencyContactPhone}
              onChange={(e) => set("emergencyContactPhone", e.target.value)}
              placeholder="+91 98765 43210"
            />
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">Security &amp; Privacy</span>
          </div>
          <ul className="text-xs text-blue-700 space-y-0.5">
            <li>• Document numbers are SHA-256 hashed before storage</li>
            <li>• A unique blockchain hash is generated and logged</li>
            <li>• Authorities can verify your ID by scanning the QR code</li>
          </ul>
        </div>

        <Button onClick={handleSubmit} disabled={generating} className="w-full" size="lg">
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Digital ID...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Generate My Digital Tourist ID
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
