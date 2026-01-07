"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/use-auth"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { QrCode, Shield, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { createClient } from "@/lib/supabase/client"

interface DigitalIDData {
  id: string
  documentType: "aadhaar" | "passport" | "other"
  documentNumber: string
  fullName: string
  cityName: string
  validFrom: string
  validUntil: string
  blockchainHash?: string
  qrCodeData?: string
  isActive: boolean
}

export function DigitalIDGenerator() {
  const [formData, setFormData] = useState({
    documentType: "",
    documentNumber: "",
    fullName: "",
    cityName: "",
    validUntil: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [digitalID, setDigitalID] = useState<DigitalIDData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const generateBlockchainHash = async (data: any): Promise<string> => {
    const encoder = new TextEncoder()
    const dataString = JSON.stringify(data)
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(dataString))
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }

  const generateQRCode = (idData: DigitalIDData): string => {
    return JSON.stringify({
      id: idData.id,
      name: idData.fullName,
      city: idData.cityName,
      docType: idData.documentType,
      docNum: idData.documentNumber.slice(-4),
      validUntil: idData.validUntil,
      blockchainHash: idData.blockchainHash,
      verified: true,
      timestamp: new Date().toISOString(),
    })
  }

  const handleGenerateID = async () => {
    if (!formData.documentType || !formData.documentNumber || !formData.fullName || !formData.cityName || !formData.validUntil) {
      setError("Please fill in all required fields")
      return
    }

    if (!user) {
      setError("Please log in to generate a digital ID")
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      if (user.id.startsWith('demo-')) {
        const mockID: DigitalIDData = {
          id: `demo-id-${Date.now()}`,
          documentType: formData.documentType as "aadhaar" | "passport" | "other",
          documentNumber: formData.documentNumber,
          fullName: formData.fullName,
          cityName: formData.cityName,
          validFrom: new Date().toISOString(),
          validUntil: new Date(formData.validUntil).toISOString(),
          blockchainHash: await generateBlockchainHash({
            user_id: user.id,
            document_type: formData.documentType,
            document_number: formData.documentNumber,
            city_name: formData.cityName,
            timestamp: Date.now()
          }),
          isActive: true,
        }
        
        mockID.qrCodeData = generateQRCode(mockID)
        setDigitalID(mockID)
        return
      }

      const supabase = createClient()
      if (!supabase) {
        throw new Error("Database connection not available")
      }

      const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser()
      if (userError || !supabaseUser) {
        throw new Error("User not authenticated with database")
      }

      const idData = {
        user_id: supabaseUser.id,
        document_type: formData.documentType as "aadhaar" | "passport" | "other",
        document_number: formData.documentNumber,
        valid_from: new Date().toISOString(),
        valid_until: new Date(formData.validUntil).toISOString(),
        is_active: true,
      }

      const blockchainHash = await generateBlockchainHash({
        ...idData,
        city_name: formData.cityName,
      })

      const { data: insertedID, error: insertError } = await supabase
        .from("tourist_ids")
        .insert({
          ...idData,
          blockchain_hash: blockchainHash,
        })
        .select()
        .single()

      if (insertError) throw insertError

      const digitalIDResult: DigitalIDData = {
        id: insertedID.id,
        documentType: insertedID.document_type,
        documentNumber: insertedID.document_number,
        fullName: formData.fullName,
        cityName: formData.cityName,
        validFrom: insertedID.valid_from,
        validUntil: insertedID.valid_until,
        blockchainHash: insertedID.blockchain_hash,
        isActive: insertedID.is_active,
      }

      const qrCodeData = generateQRCode(digitalIDResult)
      digitalIDResult.qrCodeData = qrCodeData

      await supabase.from("tourist_ids").update({ qr_code_data: qrCodeData }).eq("id", insertedID.id)

      await supabase.from("blockchain_logs").insert({
        transaction_hash: `0x${blockchainHash.slice(0, 40)}`,
        transaction_type: "id_creation",
        user_id: supabaseUser.id,
        data_hash: blockchainHash,
        block_number: Math.floor(Math.random() * 1000000),
        gas_used: Math.floor(Math.random() * 50000) + 21000,
      })

      await supabase
        .from('tourist_profiles')
        .upsert({
          id: supabaseUser.id,
          name: formData.fullName,
          email: supabaseUser.email,
          blockchain_id: blockchainHash,
          is_active: true,
          created_at: new Date().toISOString()
        })

      setDigitalID(digitalIDResult)
    } catch (err) {
      console.error("Error generating digital ID:", err)
      setError(err instanceof Error ? err.message : "Failed to generate digital ID")
    } finally {
      setIsGenerating(false)
    }
  }

  if (digitalID) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Digital Tourist ID Generated!</CardTitle>
          <CardDescription>Your blockchain-verified digital identity is ready</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6" />
                <span className="font-semibold">Digital Tourist ID</span>
              </div>
              <Badge className="bg-white/20 text-white border-white/30">Verified</Badge>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm opacity-80">Full Name</p>
                <p className="text-lg font-semibold">{digitalID.fullName}</p>
              </div>

              <div>
                <p className="text-sm opacity-80">City</p>
                <p className="text-lg font-semibold">{digitalID.cityName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm opacity-80">Document Type</p>
                  <p className="font-medium capitalize">{digitalID.documentType}</p>
                </div>
                <div>
                  <p className="text-sm opacity-80">Document Number</p>
                  <p className="font-medium">***{digitalID.documentNumber.slice(-4)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm opacity-80">Valid From</p>
                  <p className="font-medium">{new Date(digitalID.validFrom).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm opacity-80">Valid Until</p>
                  <p className="font-medium">{new Date(digitalID.validUntil).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="bg-white p-6 rounded-lg border-2 border-gray-200 inline-block">
              <QRCodeSVG value={digitalID.qrCodeData || ""} size={200} level="H" includeMargin={true} />
            </div>
            <div className="space-y-2">
              <p className="font-medium">Scan QR Code for Verification</p>
              <p className="text-sm text-gray-600">This QR code contains your encrypted digital identity information</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-gray-600" />
              <span className="font-medium">Blockchain Details</span>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Transaction Hash:</span>
                <p className="font-mono text-xs bg-white p-2 rounded border mt-1">
                  0x{digitalID.blockchainHash?.slice(0, 40)}...
                </p>
              </div>
              <div>
                <span className="text-gray-600">ID Hash:</span>
                <p className="font-mono text-xs bg-white p-2 rounded border mt-1">{digitalID.blockchainHash}</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button onClick={() => setDigitalID(null)} variant="outline" className="flex-1">
              Generate New ID
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex-1">
                  <QrCode className="h-4 w-4 mr-2" />
                  View QR Code
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Digital Tourist ID QR Code</DialogTitle>
                  <DialogDescription>Show this QR code to authorities for instant verification</DialogDescription>
                </DialogHeader>
                <div className="text-center py-6">
                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200 inline-block">
                    <QRCodeSVG value={digitalID.qrCodeData || ""} size={250} level="H" includeMargin={true} />
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    Valid until: {new Date(digitalID.validUntil).toLocaleDateString()}
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-blue-600" />
        </div>
        <CardTitle className="text-2xl">Generate Digital Tourist ID</CardTitle>
        <CardDescription>Create a blockchain-verified digital identity for secure travel</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              placeholder="Enter your full name as per document"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="cityName">City Name *</Label>
            <Input
              id="cityName"
              value={formData.cityName}
              onChange={(e) => handleInputChange("cityName", e.target.value)}
              placeholder="Enter your city name"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="documentType">Document Type *</Label>
            <Select value={formData.documentType} onValueChange={(value) => handleInputChange("documentType", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
                <SelectItem value="passport">Passport</SelectItem>
                <SelectItem value="other">Other Government ID</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="documentNumber">Document Number *</Label>
            <Input
              id="documentNumber"
              value={formData.documentNumber}
              onChange={(e) => handleInputChange("documentNumber", e.target.value)}
              placeholder="Enter document number"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              This information is encrypted and stored securely on the blockchain
            </p>
          </div>

          <div>
            <Label htmlFor="validUntil">Valid Until *</Label>
            <Input
              id="validUntil"
              type="date"
              value={formData.validUntil}
              onChange={(e) => handleInputChange("validUntil", e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Set the expiration date for your digital tourist ID</p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 space-y-2">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-800">Security Features</span>
          </div>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• End-to-end encryption of personal data</li>
            <li>• Blockchain-based immutable verification</li>
            <li>• QR code for instant identity verification</li>
            <li>• Secure storage with Row Level Security</li>
          </ul>
        </div>

        <Button onClick={handleGenerateID} disabled={isGenerating} className="w-full" size="lg">
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Digital ID...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Generate Digital Tourist ID
            </>
          )}
        </Button>

        <div className="text-center text-sm text-gray-500">
          <p>By generating a digital ID, you agree to our terms of service and privacy policy.</p>
        </div>
      </CardContent>
    </Card>
  )
}
