"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QrCode, Download, RefreshCw, Shield, AlertTriangle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface QRCodeData {
  tourist_id: string
  blockchain_id: string
  full_name: string
  emergency_contact: string
  emergency_phone: string
  verification_hash: string
  generated_at: string
  expires_at: string
}

export function QRCodeDisplay() {
  const { user } = useAuth()
  const [qrCodeImage, setQRCodeImage] = useState<string | null>(null)
  const [qrCodeData, setQRCodeData] = useState<QRCodeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadExistingQRCode()
    }
  }, [user])

  const loadExistingQRCode = async () => {
    try {
      const response = await fetch("/api/profile")
      if (response.ok) {
        const data = await response.json()
        if (data.qr_code_data) {
          const parsedQRData = JSON.parse(data.qr_code_data)
          setQRCodeData(parsedQRData)
          // Generate QR image from data
          generateQRImage(parsedQRData)
        }
      }
    } catch (error) {
      console.error("Error loading QR code:", error)
    }
  }

  const generateQRImage = async (data: QRCodeData) => {
    try {
      const QRCode = (await import("qrcode")).default
      const qrImage = await QRCode.toDataURL(JSON.stringify(data), {
        errorCorrectionLevel: "H",
        type: "image/png",
        quality: 0.92,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        width: 512,
      })
      setQRCodeImage(qrImage)
    } catch (error) {
      console.error("Error generating QR image:", error)
    }
  }

  const generateNewQRCode = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/blockchain/mint-tourist-id", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate QR code")
      }

      const data = await response.json()
      setQRCodeImage(data.qrCodeImage)
      setQRCodeData(data.qrCodeData)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to generate QR code")
    } finally {
      setLoading(false)
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeImage) return

    const link = document.createElement("a")
    link.download = `tourist-id-${qrCodeData?.blockchain_id || "qr-code"}.png`
    link.href = qrCodeImage
    link.click()
  }

  const isExpired = qrCodeData ? new Date(qrCodeData.expires_at) < new Date() : false

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <QrCode className="h-6 w-6" />
          <span>Tourist ID QR Code</span>
        </CardTitle>
        <CardDescription>Your unique digital identity for tourist safety services</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        {qrCodeImage ? (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={qrCodeImage || "/placeholder.svg"}
                alt="Tourist ID QR Code"
                className="w-full max-w-xs mx-auto rounded-lg border-2 border-gray-200"
              />
              {isExpired && (
                <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center rounded-lg">
                  <Badge variant="destructive" className="text-white">
                    EXPIRED
                  </Badge>
                </div>
              )}
            </div>

            {qrCodeData && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Blockchain ID:</span>
                  <span className="font-mono text-xs">{qrCodeData.blockchain_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Generated:</span>
                  <span>{new Date(qrCodeData.generated_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Expires:</span>
                  <span className={isExpired ? "text-red-600" : "text-green-600"}>
                    {new Date(qrCodeData.expires_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Status:</span>
                  <Badge variant={isExpired ? "destructive" : "default"} className="flex items-center space-x-1">
                    <Shield className="h-3 w-3" />
                    <span>{isExpired ? "Expired" : "Valid"}</span>
                  </Badge>
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <Button onClick={downloadQRCode} variant="outline" className="flex-1 bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button onClick={generateNewQRCode} variant="outline" disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
              <QrCode className="h-12 w-12 text-gray-400" />
            </div>
            <Button onClick={generateNewQRCode} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate Tourist ID
                </>
              )}
            </Button>
          </div>
        )}

        <div className="text-xs text-gray-500 text-center">
          This QR code contains your encrypted tourist information and can be used by authorities for identification and
          emergency assistance.
        </div>
      </CardContent>
    </Card>
  )
}
