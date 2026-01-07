import { EmergencyAlertSystem } from "@/components/emergency-alert-system"

export default function EmergencyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 py-12 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Emergency Alert System</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Immediate emergency response system with voice and text support in multiple languages. Your safety is our
            priority.
          </p>
        </div>
        <EmergencyAlertSystem />
      </div>
    </div>
  )
}
