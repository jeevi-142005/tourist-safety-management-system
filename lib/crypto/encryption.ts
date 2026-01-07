// Encryption utilities for sensitive data using Web Crypto API
const ALGORITHM = "AES-GCM"
const KEY_LENGTH = 32
const IV_LENGTH = 12 // GCM uses 12 bytes for IV

class EncryptionService {
  private key: CryptoKey | null = null

  async initializeKey(): Promise<void> {
    if (this.key) return

    // In production, use a secure key management service
    const keyString = process.env.ENCRYPTION_KEY || "default-key-for-development-only-change-in-production"

    // Create key material from string
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(keyString.padEnd(32, "0").slice(0, 32)),
      { name: "PBKDF2" },
      false,
      ["deriveKey"],
    )

    // Derive actual encryption key
    this.key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: new TextEncoder().encode("tourist-safety-salt"),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: ALGORITHM, length: 256 },
      false,
      ["encrypt", "decrypt"],
    )
  }

  async encrypt(text: string): Promise<string> {
    try {
      await this.initializeKey()
      if (!this.key) throw new Error("Key not initialized")

      const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
      const encodedText = new TextEncoder().encode(text)

      const encrypted = await crypto.subtle.encrypt(
        {
          name: ALGORITHM,
          iv: iv,
          additionalData: new TextEncoder().encode("tourist-safety-system"),
        },
        this.key,
        encodedText,
      )

      // Combine iv and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength)
      combined.set(iv)
      combined.set(new Uint8Array(encrypted), iv.length)

      return Array.from(combined)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    } catch (error) {
      console.error("Encryption failed:", error)
      throw new Error("Failed to encrypt data")
    }
  }

  async decrypt(encryptedData: string): Promise<string> {
    try {
      await this.initializeKey()
      if (!this.key) throw new Error("Key not initialized")

      // Convert hex string back to bytes
      const combined = new Uint8Array(encryptedData.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) || [])

      const iv = combined.slice(0, IV_LENGTH)
      const encrypted = combined.slice(IV_LENGTH)

      const decrypted = await crypto.subtle.decrypt(
        {
          name: ALGORITHM,
          iv: iv,
          additionalData: new TextEncoder().encode("tourist-safety-system"),
        },
        this.key,
        encrypted,
      )

      return new TextDecoder().decode(decrypted)
    } catch (error) {
      console.error("Decryption failed:", error)
      throw new Error("Failed to decrypt data")
    }
  }

  async hashSensitiveData(data: string): Promise<string> {
    const encodedData = new TextEncoder().encode(data)
    const hashBuffer = await crypto.subtle.digest("SHA-256", encodedData)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }

  generateSecureToken(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  }
}

export const encryptionService = new EncryptionService()
