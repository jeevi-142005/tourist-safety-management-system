import { GeminiAISafetyDashboard } from "@/components/gemini-ai-safety-dashboard"

export default function AISafetyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-balance mb-4">AI Safety Command Center</h1>
        <p className="text-xl text-muted-foreground text-balance">
          Advanced Gemini AI-powered comprehensive safety analysis and threat detection system
        </p>
      </div>

      <GeminiAISafetyDashboard />
    </div>
  )
}
