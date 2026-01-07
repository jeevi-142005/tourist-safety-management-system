import { AuthorityDashboard } from "@/components/authority-dashboard"

export default function AuthorityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 py-12 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Authority Command Center</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real-time monitoring dashboard for police and tourism departments. Track tourist locations, manage alerts,
            and coordinate emergency responses.
          </p>
        </div>
        <AuthorityDashboard />
      </div>
    </div>
  )
}
