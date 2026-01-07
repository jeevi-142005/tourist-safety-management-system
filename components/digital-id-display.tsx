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
import { Shield, QrCode, RefreshCw, AlertCircle, CheckCircle, Calendar, FileText } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { createClient } from "@/lib/supabase/client"

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
}

export function DigitalIDDisplay() {
  const [touristID, setTouristID] = useState<TouristID | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTouristID()
  }, [])

  const fetchTouristID = async () => {
    try {
      const supabase = createClient()

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error("User not authenticated")
      }

      const { data, error: fetchError } = await supabase
        .from("tourist_ids")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          // No data found
          setTouristID(null)
        } else {
          throw fetchError
        }
      } else {
        setTouristID(data)
      }
    } catch (err) {
      console.error("Error fetching tourist ID:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch digital ID")
    } finally {
      setLoading(false)
    }
  }

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date()
  }

  const getDaysUntilExpiry = (validUntil: string) => {
    const today = new Date()
    const expiry = new Date(validUntil)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading digital ID...</span>
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
        </CardContent>
      </Card>
    )
  }

  if (!touristID) {
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
      </Card>
    )
  }

  const expired = isExpired(touristID.valid_until)
  const daysUntilExpiry = getDaysUntilExpiry(touristID.valid_until)

  return (
    <div className="space-y-6">
      {/* Status Alert */}
      {expired ? (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Your digital tourist ID has expired. Please generate a new one for continued protection.
          </AlertDescription>
        </Alert>
      ) : daysUntilExpiry <= 7 ? (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Your digital tourist ID expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? "s" : ""}. Consider
            renewing it soon.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Your digital tourist ID is active and verified.
          </AlertDescription>
        </Alert>
      )}

      {/* Digital ID Card */}
      <Card className="w-full">
        <CardContent className="p-0">
          <div
            className={`bg-gradient-to-r ${expired ? "from-gray-400 to-gray-500" : "from-blue-600 to-purple-600"} rounded-t-lg p-6 text-white`}
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
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Quick Actions */}
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
                      <QRCodeSVG value={touristID.qr_code_data} size={250} level="H" includeMargin={true} />
                    </div>
                    <div className="mt-4 space-y-1">
                      <p className="text-sm font-medium">ID: {touristID.id.slice(0, 8)}...</p>
                      <p className="text-sm text-gray-600">
                        Valid until: {new Date(touristID.valid_until).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={fetchTouristID} className="flex-1 bg-transparent">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Blockchain Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Blockchain Verification</span>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Transaction Hash:</span>
                  <p className="font-mono text-xs bg-white p-2 rounded border mt-1">
                    0x{touristID.blockchain_hash.slice(0, 40)}...
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Created:</span>
                  <p className="text-xs mt-1">{new Date(touristID.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* ID Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <p className="text-xs text-blue-600 font-medium">{Math.max(0, daysUntilExpiry)} days left</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Shield className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <p className="text-xs text-green-600 font-medium">Blockchain Secured</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                <p className="text-xs text-purple-600 font-medium">{expired ? "Expired" : "Active"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
