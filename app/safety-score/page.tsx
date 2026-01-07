import { SafetyScoreDashboard } from "@/components/safety-score-dashboard"

export default function SafetyScorePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Safety Score Analysis</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Advanced AI-powered safety assessment based on your travel patterns, location history, and risk exposure
            analysis.
          </p>
        </div>
        <SafetyScoreDashboard />
      </div>
    </div>
  )
}
