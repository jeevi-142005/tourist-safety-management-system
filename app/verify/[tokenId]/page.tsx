import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, CheckCircle, XCircle, Calendar, Phone, User } from "lucide-react"
import { format } from "date-fns"

// Directly query the database — no internal fetch needed in server components
async function verifyDigitalId(tokenId: string) {
  try {
    const digitalId = await db.touristId.findFirst({
      where: { blockchainHash: tokenId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    if (!digitalId) {
      return { valid: false, reason: "Digital ID not found. The QR code may be invalid or the ID was deleted." }
    }

    if (!digitalId.isActive) {
      return { valid: false, reason: "This Digital ID has been deactivated by the owner." }
    }

    if (new Date(digitalId.validUntil) < new Date()) {
      return { valid: false, reason: "This Digital ID has expired." }
    }

    return {
      valid: true,
      digitalId: {
        tokenId,
        documentType: digitalId.documentType,
        validFrom: digitalId.validFrom,
        validUntil: digitalId.validUntil,
        tourist: {
          name: digitalId.user?.name ?? null,
          email: digitalId.user?.email ?? null,
          phone: digitalId.user?.phone ?? null,
        },
        emergencyContact: {
          name: digitalId.emergencyContactName ?? null,
          phone: digitalId.emergencyContactPhone ?? null,
        },
        tripPeriod: {
          start: digitalId.tripStartDate ?? null,
          end: digitalId.tripEndDate ?? null,
        },
      },
    }
  } catch (error) {
    console.error("Verification DB error:", error)
    return { valid: false, reason: "An internal error occurred during verification. Please try again." }
  }
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ tokenId: string }>
}) {
  const { tokenId } = await params
  const verification = await verifyDigitalId(tokenId)

  const tripStart = verification.digitalId?.tripPeriod?.start
  const tripEnd = verification.digitalId?.tripPeriod?.end
  const validUntil = verification.digitalId?.validUntil

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Digital ID Verification</h1>
          </div>
          <p className="text-lg text-gray-600">Blockchain-secured tourist identity verification</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <div
              className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                verification.valid ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {verification.valid ? (
                <CheckCircle className="w-10 h-10 text-green-600" />
              ) : (
                <XCircle className="w-10 h-10 text-red-600" />
              )}
            </div>
            <CardTitle className={`text-2xl ${verification.valid ? "text-green-700" : "text-red-700"}`}>
              {verification.valid ? "✓ Valid Digital ID" : "✗ Invalid Digital ID"}
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {verification.valid
                ? "This tourist ID is verified, active, and blockchain-secured."
                : verification.reason ?? "ID could not be verified."}
            </CardDescription>
          </CardHeader>

          {verification.valid && verification.digitalId && (
            <CardContent className="space-y-6 pt-0">
              {/* Token badge */}
              <div className="flex justify-center">
                <Badge variant="secondary" className="text-xs font-mono px-3 py-1">
                  Hash: {tokenId.slice(0, 20)}...
                </Badge>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* LEFT */}
                <div className="space-y-4">
                  {/* Tourist name */}
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tourist Name</p>
                      <p className="text-gray-900 font-medium">
                        {verification.digitalId.tourist?.name ?? "N/A"}
                      </p>
                      {verification.digitalId.tourist?.email && (
                        <p className="text-sm text-gray-500">{verification.digitalId.tourist.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Document type */}
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Shield className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Document Type</p>
                      <p className="text-gray-900 font-medium capitalize">
                        {verification.digitalId.documentType}
                      </p>
                    </div>
                  </div>

                  {/* Emergency contact */}
                  {(verification.digitalId.emergencyContact?.name ||
                    verification.digitalId.emergencyContact?.phone) && (
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-orange-50 rounded-lg">
                        <Phone className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Emergency Contact</p>
                        {verification.digitalId.emergencyContact?.name && (
                          <p className="text-gray-900 font-medium">
                            {verification.digitalId.emergencyContact.name}
                          </p>
                        )}
                        {verification.digitalId.emergencyContact?.phone && (
                          <p className="text-sm text-gray-600">
                            {verification.digitalId.emergencyContact.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT */}
                <div className="space-y-4">
                  {/* Valid until */}
                  {validUntil && (
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Valid Until</p>
                        <p className="text-gray-900 font-medium">
                          {format(new Date(validUntil), "dd MMM yyyy")}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Trip period */}
                  {tripStart && tripEnd && (
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-indigo-50 rounded-lg">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Trip Period</p>
                        <p className="text-gray-900 font-medium">
                          {format(new Date(tripStart), "dd MMM")} –{" "}
                          {format(new Date(tripEnd), "dd MMM yyyy")}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Issued on */}
                  {verification.digitalId.validFrom && (
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <Calendar className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Issued On</p>
                        <p className="text-gray-900 font-medium">
                          {format(new Date(verification.digitalId.validFrom), "dd MMM yyyy")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Blockchain verified footer */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-800 text-sm">Blockchain Verified</p>
                    <p className="text-green-700 text-sm mt-0.5">
                      This Digital ID is cryptographically authenticated. The SHA-256 hash matches
                      the stored blockchain record and the ID is currently active.
                    </p>
                    <p className="font-mono text-xs text-green-600 mt-2 break-all">
                      Hash: {tokenId}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          )}

          {/* Invalid state footer */}
          {!verification.valid && (
            <CardContent className="pt-0">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-sm text-red-700">
                  If you believe this is an error, please contact the tourist safety authority
                  or the ID owner for re-verification.
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
