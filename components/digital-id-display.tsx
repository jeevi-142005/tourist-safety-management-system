"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Shield, QrCode, RefreshCw, AlertCircle, CheckCircle, Calendar, FileText, Plus, XCircle } from "lucide-react"
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

export function DigitalIDDisplay() {
  const [touristIDs, setTouristIDs] = useState<TouristID[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deactivating, setDeactivating] = useState<string | null>(null)

  useEffect(() => {
    fetchTouristIDs()
  }, [])

  const fetchTouristIDs = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/digital-id")
      if (!res.ok) {
        const errData = await res.json()
        if (res.status === 401) {
          setError("Please log in to view your digital IDs.")
          return
        }
        throw new Error(errData.error || "Failed to fetch digital IDs")
      }
      const result = await res.json()
      setTouristIDs(result.data || [])
    } catch (err) {
      console.error("Error fetching tourist IDs:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch digital IDs")
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivate = async (id: string) => {
    setDeactivating(id)
    try {
      const res = await fetch(`/api/digital-id?id=${id}`, { method: "DELETE" })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to deactivate ID")
      }
      setTouristIDs((prev) =>
        prev.map((tid) => (tid.id === id ? { ...tid, is_active: false } : tid))
      )
    } catch (err) {
      console.error("Deactivation error:", err)
      setError(err instanceof Error ? err.message : "Failed to deactivate ID")
    } finally {
      setDeactivating(null)
    }
  }

  const isExpired = (validUntil: string) => new Date(validUntil) < new Date()

  const getDaysUntilExpiry = (validUntil: string) => {
    const diffTime = new Date(validUntil).getTime() - new Date().getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading digital IDs...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="py-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
          <Button variant="outline" onClick={fetchTouristIDs} className="mt-4 w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const activeIDs = touristIDs.filter((t) => t.is_active)
  const inactiveIDs = touristIDs.filter((t) => !t.is_active)
  const latestActive = activeIDs[0] ?? null

  if (touristIDs.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-gray-400" />
          </div>
          <CardTitle className="text-xl text-gray-600">No Digital ID Found</CardTitle>
          <CardDescription>
            You haven't generated a digital tourist ID yet. Create one to enhance your travel security.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link href="/digital-id">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate Digital ID
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Your Digital IDs ({activeIDs.length} active)
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchTouristIDs}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Link href="/digital-id">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New ID
            </Button>
          </Link>
        </div>
      </div>

      {/* Active IDs */}
      {activeIDs.map((touristID) => {
        const expired = isExpired(touristID.valid_until)
        const daysUntilExpiry = getDaysUntilExpiry(touristID.valid_until)

        return (
          <div key={touristID.id} className="space-y-3">
            {/* Status Alert */}
            {expired ? (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  This digital ID has expired. Please generate a new one for continued protection.
                </AlertDescription>
              </Alert>
            ) : daysUntilExpiry <= 7 ? (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  This ID expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? "s" : ""}. Consider renewing it soon.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Digital tourist ID is active and blockchain-verified.
                </AlertDescription>
              </Alert>
            )}

            {/* ID Card */}
            <Card className="w-full overflow-hidden">
              <CardContent className="p-0">
                <div
                  className={`bg-gradient-to-r ${
                    expired ? "from-gray-400 to-gray-500" : "from-blue-600 to-purple-600"
                  } p-6 text-white`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-6 w-6" />
                      <span className="font-semibold">Digital Tourist ID</span>
                    </div>
                    <Badge className={`${expired ? "bg-red-500" : "bg-white/20"} text-white border-white/30`}>
                      {expired ? "Expired" : "Verified"}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm opacity-80">Document Type</p>
                        <p className="font-medium capitalize">{touristID.document_type}</p>
                      </div>
                      <div>
                        <p className="text-sm opacity-80">Document Number</p>
                        <p className="font-medium">***{touristID.document_number.slice(-4)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm opacity-80">Valid From</p>
                        <p className="font-medium">{new Date(touristID.valid_from).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm opacity-80">Valid Until</p>
                        <p className="font-medium">{new Date(touristID.valid_until).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {touristID.trip_start_date && touristID.trip_end_date && (
                      <div>
                        <p className="text-sm opacity-80">Trip Period</p>
                        <p className="font-medium">
                          {new Date(touristID.trip_start_date).toLocaleDateString()} –{" "}
                          {new Date(touristID.trip_end_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Actions */}
                  <div className="flex space-x-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="flex-1" disabled={expired}>
                          <QrCode className="h-4 w-4 mr-2" />
                          Show QR Code
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Digital Tourist ID QR Code</DialogTitle>
                          <DialogDescription>Show this QR code to authorities for instant verification</DialogDescription>
                        </DialogHeader>
                        <div className="text-center py-6">
                          <div className="bg-white p-6 rounded-lg border-2 border-gray-200 inline-block">
                            <QRCodeSVG value={touristID.qr_code_data || ""} size={250} level="H" includeMargin={true} />
                          </div>
                          <div className="mt-4 space-y-1">
                            <p className="text-sm font-medium">ID: {touristID.id.slice(0, 8)}...</p>
                            <p className="text-sm text-gray-600">
                              Valid until: {new Date(touristID.valid_until).toLocaleDateString()}
                            </p>
                            {touristID.emergency_contact_name && (
                              <p className="text-sm text-gray-600">
                                Emergency: {touristID.emergency_contact_name} ({touristID.emergency_contact_phone})
                              </p>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      onClick={() => handleDeactivate(touristID.id)}
                      disabled={deactivating === touristID.id}
                      className="flex-1 text-red-600 hover:bg-red-50 border-red-200"
                    >
                      {deactivating === touristID.id ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Deactivate
                    </Button>
                  </div>

                  {/* Emergency Contact */}
                  {touristID.emergency_contact_name && (
                    <div className="bg-orange-50 rounded-lg p-3 text-sm">
                      <p className="font-medium text-orange-800">Emergency Contact</p>
                      <p className="text-orange-700">
                        {touristID.emergency_contact_name} — {touristID.emergency_contact_phone}
                      </p>
                    </div>
                  )}

                  {/* Blockchain Details */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <span className="font-medium">Blockchain Verification</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Transaction Hash:</span>
                        <p className="font-mono text-xs bg-white p-2 rounded border mt-1 break-all">
                          0x{touristID.blockchain_hash.slice(0, 40)}...
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Created:</span>
                        <p className="text-xs mt-1">{new Date(touristID.created_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Verify URL:</span>
                        <Link
                          href={`/verify/${touristID.blockchain_hash}`}
                          target="_blank"
                          className="text-xs mt-1 text-blue-600 hover:underline block truncate"
                        >
                          /verify/{touristID.blockchain_hash.slice(0, 20)}...
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                      <p className="text-xs text-blue-600 font-medium">
                        {Math.max(0, daysUntilExpiry)} days left
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <Shield className="h-5 w-5 text-green-600 mx-auto mb-1" />
                      <p className="text-xs text-green-600 font-medium">Blockchain Secured</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                      <p className="text-xs text-purple-600 font-medium">
                        {expired ? "Expired" : "Active"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      })}

      {/* Inactive IDs section */}
      {inactiveIDs.length > 0 && (
        <div className="border-t pt-4">
          <p className="text-sm text-gray-500 mb-3">
            {inactiveIDs.length} deactivated ID{inactiveIDs.length !== 1 ? "s" : ""}
          </p>
          {inactiveIDs.map((tid) => (
            <div key={tid.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg mb-2 text-sm">
              <div>
                <span className="capitalize text-gray-600">{tid.document_type}</span>
                <span className="ml-2 text-gray-400">***{tid.document_number.slice(-4)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-gray-400">Deactivated</Badge>
                <span className="text-xs text-gray-400">{new Date(tid.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
