import QRCode from "qrcode"
import { createHash } from "crypto"

export interface QRCodeData {
  tourist_id: string
  blockchain_id: string
  full_name: string
  emergency_contact: string
  emergency_phone: string
  verification_hash: string
  generated_at: string
  expires_at: string
}

export class QRCodeGenerator {
  static async generateTouristQR(
    touristId: string,
    blockchainId: string,
    touristData: {
      full_name: string
      emergency_contact: string
      emergency_phone: string
    },
  ): Promise<{ qrCodeData: QRCodeData; qrCodeImage: string }> {
    try {
      // Create QR code data
      const qrCodeData: QRCodeData = {
        tourist_id: touristId,
        blockchain_id: blockchainId,
        full_name: touristData.full_name,
        emergency_contact: touristData.emergency_contact,
        emergency_phone: touristData.emergency_phone,
        verification_hash: this.generateVerificationHash(touristId, blockchainId),
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      }

      // Generate QR code image
      const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrCodeData), {
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

      return { qrCodeData, qrCodeImage }
    } catch (error) {
      console.error("Error generating QR code:", error)
      throw new Error("Failed to generate QR code")
    }
  }

  static generateVerificationHash(touristId: string, blockchainId: string): string {
    const data = `${touristId}:${blockchainId}:${process.env.ENCRYPTION_KEY}`
    return createHash("sha256").update(data).digest("hex")
  }

  static verifyQRCode(qrCodeData: QRCodeData): boolean {
    try {
      const expectedHash = this.generateVerificationHash(qrCodeData.tourist_id, qrCodeData.blockchain_id)

      // Check if hash matches
      if (qrCodeData.verification_hash !== expectedHash) {
        return false
      }

      // Check if not expired
      const expiresAt = new Date(qrCodeData.expires_at)
      if (expiresAt < new Date()) {
        return false
      }

      return true
    } catch (error) {
      console.error("Error verifying QR code:", error)
      return false
    }
  }

  static async generateEmergencyQR(
    touristId: string,
    emergencyData: {
      alert_type: string
      location: { lat: number; lng: number }
      message: string
      timestamp: string
    },
  ): Promise<string> {
    try {
      const emergencyQRData = {
        type: "emergency",
        tourist_id: touristId,
        ...emergencyData,
        verification_hash: this.generateVerificationHash(touristId, emergencyData.timestamp),
      }

      return await QRCode.toDataURL(JSON.stringify(emergencyQRData), {
        errorCorrectionLevel: "H",
        type: "image/png",
        quality: 0.92,
        margin: 1,
        color: {
          dark: "#DC2626", // Red for emergency
          light: "#FFFFFF",
        },
        width: 256,
      })
    } catch (error) {
      console.error("Error generating emergency QR code:", error)
      throw new Error("Failed to generate emergency QR code")
    }
  }
}
