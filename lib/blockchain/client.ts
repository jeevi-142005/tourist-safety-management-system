// Blockchain client for Digital Tourist ID management
import { ethers } from "ethers"

// Tourist ID Smart Contract ABI (simplified)
const TOURIST_ID_ABI = [
  "function createTouristID(string memory _idHash, uint256 _validUntil) public returns (uint256)",
  "function getTouristID(uint256 _tokenId) public view returns (string memory, uint256, bool)",
  "function deactivateTouristID(uint256 _tokenId) public",
  "event TouristIDCreated(uint256 indexed tokenId, address indexed tourist, string idHash)",
]

class BlockchainClient {
  private provider: ethers.JsonRpcProvider
  private contract: ethers.Contract
  private wallet: ethers.Wallet

  constructor() {
    // Use Polygon Mumbai testnet for development
    this.provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL || "https://rpc-mumbai.maticvigil.com")

    // Create wallet from private key (in production, use secure key management)
    this.wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY || "0x" + "0".repeat(64), this.provider)

    // Initialize contract (deploy address would be set after deployment)
    this.contract = new ethers.Contract(
      process.env.TOURIST_ID_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000",
      TOURIST_ID_ABI,
      this.wallet,
    )
  }

  async createDigitalID(idData: {
    userId: string
    aadhaarHash: string
    passportHash: string
    validUntil: Date
  }): Promise<{ tokenId: string; transactionHash: string }> {
    try {
      // Create hash of ID data
      const idHash = ethers.keccak256(
        ethers.toUtf8Bytes(
          JSON.stringify({
            userId: idData.userId,
            aadhaar: idData.aadhaarHash,
            passport: idData.passportHash,
            timestamp: Date.now(),
          }),
        ),
      )

      // Convert date to timestamp
      const validUntilTimestamp = Math.floor(idData.validUntil.getTime() / 1000)

      // Create transaction
      const tx = await this.contract.createTouristID(idHash, validUntilTimestamp)
      const receipt = await tx.wait()

      // Extract token ID from event logs
      const event = receipt.logs.find(
        (log: any) => log.topics[0] === ethers.id("TouristIDCreated(uint256,address,string)"),
      )

      const tokenId = event ? ethers.getBigInt(event.topics[1]).toString() : "0"

      return {
        tokenId,
        transactionHash: receipt.hash,
      }
    } catch (error) {
      console.error("Blockchain ID creation failed:", error)
      throw new Error("Failed to create digital ID on blockchain")
    }
  }

  async verifyDigitalID(tokenId: string): Promise<{
    idHash: string
    validUntil: number
    isActive: boolean
  }> {
    try {
      const [idHash, validUntil, isActive] = await this.contract.getTouristID(tokenId)
      return {
        idHash,
        validUntil: Number(validUntil),
        isActive,
      }
    } catch (error) {
      console.error("Blockchain ID verification failed:", error)
      throw new Error("Failed to verify digital ID")
    }
  }

  async deactivateDigitalID(tokenId: string): Promise<string> {
    try {
      const tx = await this.contract.deactivateTouristID(tokenId)
      const receipt = await tx.wait()
      return receipt.hash
    } catch (error) {
      console.error("Blockchain ID deactivation failed:", error)
      throw new Error("Failed to deactivate digital ID")
    }
  }

  async logAlert(alertData: {
    userId: string
    alertType: string
    location: { lat: number; lng: number }
    timestamp: Date
  }): Promise<string> {
    try {
      // Create immutable log entry on blockchain
      const logHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(alertData)))

      // In a real implementation, this would call a logging contract
      // For now, we'll simulate with a transaction
      const tx = await this.wallet.sendTransaction({
        to: this.wallet.address,
        value: 0,
        data: logHash,
      })

      const receipt = await tx.wait()
      return receipt?.hash || ""
    } catch (error) {
      console.error("Blockchain alert logging failed:", error)
      throw new Error("Failed to log alert on blockchain")
    }
  }
}

export const blockchainClient = new BlockchainClient()
