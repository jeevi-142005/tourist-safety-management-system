"use client"

import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/contexts/language-context"
import { HeroSection } from "@/components/hero-section"
import { ProblemSection } from "@/components/problem-section"
import { FeaturesSection } from "@/components/features-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { DashboardPreview } from "@/components/dashboard-preview"
import { AIFeaturesSection } from "@/components/ai-features-section"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"
import { LoginSelection } from "@/components/login-selection"
import { AdminDashboard } from "@/components/admin-dashboard"
import { TouristDashboard } from "@/components/tourist-dashboard"
import { LoadingSpinner } from "@/components/loading-spinner"

export default function HomePage() {
  const { user, loading } = useAuth()
  const { t } = useLanguage()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }

  if (!user) {
    return <LoginSelection />
  }

  if (user.role === "admin") {
    return <AdminDashboard />
  }

  if (user.role === "tourist") {
    return <TouristDashboard />
  }

  // Fallback to landing page
  return (
    <main className="min-h-screen">
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <DashboardPreview />
      <AIFeaturesSection />
      <CTASection />
      <Footer />
    </main>
  )
}
