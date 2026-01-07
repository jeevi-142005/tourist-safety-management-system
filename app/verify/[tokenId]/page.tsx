import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, CheckCircle, XCircle, Calendar, Phone, User } from "lucide-react"
import { format } from "date-fns"

async function verifyDigitalId(tokenId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/digital-id/verify/${tokenId}`, {
      cache: "no-store",
    })
    return await response.json()
  } catch (error) {
    return { valid: false, reason: "Verification failed" }
  }
}

export default async function VerifyPage({ params }: { params: { tokenId: string } }) {
  const verification = await verifyDigitalId(params.tokenId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Digital ID Verification</h1>
          <p className="text-xl text-gray-600">Blockchain-secured tourist identity verification</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div
              className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                verification.valid ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {verification.valid ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600" />
              )}
            </div>
            <CardTitle className={`text-2xl ${verification.valid ? "text-green-700" : "text-red-700"}`}>
              {verification.valid ? "Valid Digital ID" : "Invalid Digital ID"}
            </CardTitle>
            <CardDescription>
              {verification.valid ? "This tourist ID is verified and active" : verification.reason}
            </CardDescription>
          </CardHeader>

          {verification.valid && verification.digitalId && (
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <Badge variant="secondary" className="text-sm">
                  Token ID: {params.tokenId}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Tourist Name</p>
                      <p className="text-gray-900">{verification.digitalId.tourist?.full_name || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Emergency Contact</p>
                      <p className="text-gray-900">{verification.digitalId.emergencyContact?.name}</p>
                      <p className="text-sm text-gray-600">{verification.digitalId.emergencyContact?.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Trip Period</p>
                      <p className="text-gray-900">
                        {format(new Date(verification.digitalId.tripPeriod.start), "MMM dd")} -{" "}
                        {format(new Date(verification.digitalId.tripPeriod.end), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Valid Until</p>
                      <p className="text-gray-900">{format(new Date(verification.digitalId.validUntil), "PPP")}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-green-600" />
                  <div className="text-sm">
                    <p className="font-medium text-green-800">Blockchain Verified</p>
                    <p className="text-green-700">
                      This digital ID has been verified on the blockchain and is authentic.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
