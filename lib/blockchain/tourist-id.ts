import { ethers } from "ethers"

// Tourist ID NFT Contract ABI (simplified)
const TOURIST_ID_ABI = [
  "function mintTouristID(address to, string memory tokenURI) public returns (uint256)",
  "function tokenURI(uint256 tokenId) public view returns (string memory)",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function balanceOf(address owner) public view returns (uint256)",
  "event TouristIDMinted(address indexed to, uint256 indexed tokenId, string tokenURI)",
]

export interface TouristIDMetadata {
  name: string
  description: string
  image: string
  attributes: {
    trait_type: string
    value: string | number
  }[]
  tourist_data: {
    full_name: string
    email: string
    phone: string
    emergency_contact: string
    emergency_phone: string
    registration_date: string
    safety_level: string
  }
}

export class TouristIDBlockchain {
  private provider: ethers.JsonRpcProvider
  private contract: ethers.Contract
  private wallet: ethers.Wallet

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL!)
    this.wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY!, this.provider)
    this.contract = new ethers.Contract(process.env.TOURIST_ID_CONTRACT_ADDRESS!, TOURIST_ID_ABI, this.wallet)
  }

  async mintTouristID(
    userAddress: string,
    touristData: TouristIDMetadata["tourist_data"],
  ): Promise<{ tokenId: string; transactionHash: string; metadata: TouristIDMetadata }> {
    try {
      // Generate unique token ID
      const tokenId = Date.now().toString()

      // Create metadata
      const metadata: TouristIDMetadata = {
        name: `Tourist ID #${tokenId}`,
        description: `Digital Tourist Identity for ${touristData.full_name}`,
        image: `${process.env.NEXT_PUBLIC_APP_URL}/api/tourist-id/image/${tokenId}`,
        attributes: [
          { trait_type: "Registration Date", value: touristData.registration_date },
          { trait_type: "Safety Level", value: touristData.safety_level },
          { trait_type: "Emergency Contact Available", value: touristData.emergency_contact ? "Yes" : "No" },
          { trait_type: "Verification Status", value: "Verified" },
        ],
        tourist_data: touristData,
      }

      // Upload metadata to IPFS or store in database
      const metadataURI = await this.storeMetadata(tokenId, metadata)

      // Mint the NFT
      const transaction = await this.contract.mintTouristID(userAddress, metadataURI)
      const receipt = await transaction.wait()

      return {
        tokenId,
        transactionHash: receipt.hash,
        metadata,
      }
    } catch (error) {
      console.error("Error minting tourist ID:", error)
      throw new Error("Failed to mint tourist ID NFT")
    }
  }

  private async storeMetadata(tokenId: string, metadata: TouristIDMetadata): Promise<string> {
    // For now, we'll store metadata in our database and return a URI
    // In production, you might want to use IPFS
    return `${process.env.NEXT_PUBLIC_APP_URL}/api/tourist-id/metadata/${tokenId}`
  }

  async getTouristID(tokenId: string): Promise<TouristIDMetadata | null> {
    try {
      const tokenURI = await this.contract.tokenURI(tokenId)
      const response = await fetch(tokenURI)
      return await response.json()
    } catch (error) {
      console.error("Error fetching tourist ID:", error)
      return null
    }
  }

  async verifyOwnership(tokenId: string, userAddress: string): Promise<boolean> {
    try {
      const owner = await this.contract.ownerOf(tokenId)
      return owner.toLowerCase() === userAddress.toLowerCase()
    } catch (error) {
      console.error("Error verifying ownership:", error)
      return false
    }
  }
}
