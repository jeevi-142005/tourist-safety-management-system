"use client"

import { Shield, CheckCircle, QrCode, Calendar, FileText, User, Phone, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { QRCodeSVG } from "qrcode.react"

interface VerifiedIdData {
  tokenId: string
  blockchainHash: string
  documentType: string
  documentNumber: string
  validFrom: string
  validUntil: string
  isActive: boolean
  createdAt: string
  qrCodeData?: string | null
  tourist: {
    name: string | null
    email: string | null
    phone: string | null
  }
  emergencyContact: {
    name: string | null
    phone: string | null
  }
  tripPeriod: {
    start: string | null
    end: string | null
  }
}

interface DigitalIDTabProps {
  verifiedIdData?: VerifiedIdData | null
}

// ---------------------------------------------------------------------------
// Main smart tab component
// ---------------------------------------------------------------------------
export function DigitalIDTab({ verifiedIdData }: DigitalIDTabProps) {
  if (!verifiedIdData) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="text-center max-w-xl mx-auto">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">No Digital Tourist ID Found</h2>
          <p className="text-sm text-gray-500">
            A one-time blockchain-verified identity for your trip can only be created by an Admin.
            Please wait until the Admin generates your ID and provides you with the QR code or ID number.
          </p>
        </div>
      </div>
    )
  }

  const daysLeft = Math.ceil(
    (new Date(verifiedIdData.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  const expired = daysLeft <= 0
  const docTypeLabel =
    verifiedIdData.documentType === "aadhaar"
      ? "Aadhaar Card"
      : verifiedIdData.documentType === "passport"
      ? "Passport"
      : verifiedIdData.documentType || "Government ID"

  const qrValue = verifiedIdData.qrCodeData || verifiedIdData.blockchainHash || verifiedIdData.tokenId

  return (
    <div className="space-y-5 animate-in fade-in duration-200 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Your Digital Tourist ID</h2>
        <p className="text-xs text-gray-500">Blockchain-verified travel credential â€” issued by Admin.</p>
      </div>

      {/* Status banner */}
      {expired ? (
        <Alert className="border-red-200 bg-red-50">
          <Shield className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Your Digital ID has <strong>expired</strong>. Please contact the Admin for renewal.
          </AlertDescription>
        </Alert>
      ) : daysLeft <= 7 ? (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Your ID is expiring in <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong>. Contact Admin to renew.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Your Digital ID is <strong>active</strong> and blockchain-verified. Valid for {daysLeft} more days.
          </AlertDescription>
        </Alert>
      )}

      {/* ID Card */}
      <Card className="overflow-hidden shadow-lg border-0">
        <CardContent className="p-0">
          {/* Gradient header */}
          <div className={`bg-gradient-to-r ${expired ? "from-gray-400 to-gray-600" : "from-blue-600 to-purple-700"} p-6 text-white`}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6" />
                <span className="font-bold text-lg tracking-wide">Digital Tourist ID</span>
              </div>
              <Badge className={`${expired ? "bg-red-500" : "bg-white/20"} text-white border-white/30 text-xs`}>
                {expired ? "Expired" : "âœ“ Admin Verified"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs opacity-70 uppercase tracking-wide">Tourist Name</p>
                <p className="font-semibold mt-0.5">{verifiedIdData.tourist.name || "â€”"}</p>
              </div>
              <div>
                <p className="text-xs opacity-70 uppercase tracking-wide">Document Type</p>
                <p className="font-semibold capitalize mt-0.5">{docTypeLabel}</p>
              </div>
              <div>
                <p className="text-xs opacity-70 uppercase tracking-wide">Document No.</p>
                <p className="font-semibold mt-0.5">***{verifiedIdData.documentNumber?.slice(-4)}</p>
              </div>
              <div>
                <p className="text-xs opacity-70 uppercase tracking-wide">ID Token</p>
                <p className="font-mono text-[11px] mt-0.5 opacity-80 truncate">{verifiedIdData.tokenId}</p>
              </div>
              <div>
                <p className="text-xs opacity-70 uppercase tracking-wide">Valid From</p>
                <p className="font-semibold mt-0.5">{new Date(verifiedIdData.validFrom).toLocaleDateString("en-IN")}</p>
              </div>
              <div>
                <p className="text-xs opacity-70 uppercase tracking-wide">Valid Until</p>
                <p className="font-semibold mt-0.5">{new Date(verifiedIdData.validUntil).toLocaleDateString("en-IN")}</p>
              </div>
              {verifiedIdData.tripPeriod.start && verifiedIdData.tripPeriod.end && (
                <div className="col-span-2">
                  <p className="text-xs opacity-70 uppercase tracking-wide">Trip Period</p>
                  <p className="font-semibold mt-0.5">
                    {new Date(verifiedIdData.tripPeriod.start).toLocaleDateString("en-IN")} â€”{" "}
                    {new Date(verifiedIdData.tripPeriod.end).toLocaleDateString("en-IN")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 bg-white">
            {/* Stat pills */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Calendar className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-blue-700">{Math.max(0, daysLeft)} days</p>
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

            {/* Tourist details */}
            <Card className="border border-gray-100 shadow-none">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Tourist Details
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-400 font-medium">Full Name</p>
                  <p className="text-gray-800 font-semibold mt-0.5">{verifiedIdData.tourist.name || "â€”"}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium">Email</p>
                  <p className="text-gray-800 font-semibold mt-0.5 truncate">{verifiedIdData.tourist.email || "â€”"}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium">Phone</p>
                  <p className="text-gray-800 font-semibold mt-0.5">{verifiedIdData.tourist.phone || "â€”"}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium">Document Type</p>
                  <p className="text-gray-800 font-semibold mt-0.5">{docTypeLabel}</p>
                </div>
              </CardContent>
            </Card>

            {/* Emergency contact */}
            {(verifiedIdData.emergencyContact.name || verifiedIdData.emergencyContact.phone) && (
              <Card className="border border-orange-100 shadow-none bg-orange-50/50">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs font-bold text-orange-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-orange-500 font-medium">Name</p>
                    <p className="text-orange-900 font-semibold mt-0.5">{verifiedIdData.emergencyContact.name || "â€”"}</p>
                  </div>
                  <div>
                    <p className="text-orange-500 font-medium">Phone</p>
                    <p className="text-orange-900 font-semibold mt-0.5">{verifiedIdData.emergencyContact.phone || "â€”"}</p>
                  </div>
                </CardContent>
              </Card>
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
                  0x{verifiedIdData.blockchainHash?.slice(0, 40)}...
                </p>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-xs text-gray-500">Issued On</p>
                  <p className="text-xs text-gray-700 mt-0.5">{new Date(verifiedIdData.createdAt).toLocaleString("en-IN")}</p>
                </div>
                <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px]">
                  Admin Created
                </Badge>
              </div>
            </div>

            {/* Read-only notice */}
            <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-100">
              <Shield className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
              <span>This ID was created by an Administrator and cannot be modified by the tourist. Contact your admin for any changes.</span>
            </div>

            {/* QR Code Action */}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={expired}>
                  <QrCode className="h-4 w-4 mr-2" />
                  Show QR Code
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Digital Tourist ID â€” QR Code</DialogTitle>
                  <DialogDescription>Show this to authorities for instant verification</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center py-4 space-y-3">
                  <div className="bg-white p-5 border-2 border-gray-200 rounded-xl inline-block">
                    <QRCodeSVG value={qrValue} size={220} level="H" includeMargin />
                  </div>
                  <p className="text-sm text-gray-500">
                    Valid until {new Date(verifiedIdData.validUntil).toLocaleDateString("en-IN")}
                  </p>
                  <p className="text-xs text-gray-400 text-center font-mono break-all px-2">
                    Token: {verifiedIdData.tokenId}
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

