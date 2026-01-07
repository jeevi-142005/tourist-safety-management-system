import { DigitalIDGenerator } from "@/components/digital-id-generator"

export default function DigitalIdPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Digital Tourist ID Generator</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Create a secure, blockchain-verified digital identity for your trip. This ID ensures your safety and enables
            quick verification by authorities.
          </p>
        </div>
        <DigitalIDGenerator />
      </div>
    </div>
  )
}
