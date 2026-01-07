"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Users, ArrowRight } from "lucide-react"
import { LoginForm } from "./login-form"
import { RegisterForm } from "./register-form"

export function LoginSelection() {
  const [selectedRole, setSelectedRole] = useState<"tourist" | "admin" | null>(null)
  const [isLogin, setIsLogin] = useState(true)

  if (selectedRole) {
    return isLogin ? (
      <LoginForm
        role={selectedRole}
        onBack={() => setSelectedRole(null)}
        onSwitchToRegister={() => setIsLogin(false)}
      />
    ) : (
      <RegisterForm role={selectedRole} onBack={() => setSelectedRole(null)} onSwitchToLogin={() => setIsLogin(true)} />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-safety-blue/5 via-white to-safety-green/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Shield className="h-16 w-16 text-safety-blue mr-4" />
            <h1 className="text-4xl font-bold text-gray-900">Tourist Safety System</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Advanced AI-powered safety monitoring and incident response platform for secure tourism
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <Card
            className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-safety-blue/50"
            onClick={() => setSelectedRole("tourist")}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-safety-blue/10 rounded-full w-fit group-hover:bg-safety-blue/20 transition-colors">
                <Users className="h-12 w-12 text-safety-blue" />
              </div>
              <CardTitle className="text-2xl text-gray-900">Tourist Access</CardTitle>
              <CardDescription className="text-gray-600">
                Access your safety dashboard, emergency alerts, and blockchain ID
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <ArrowRight className="h-4 w-4 mr-2 text-safety-green" />
                  Emergency alert system
                </div>
                <div className="flex items-center">
                  <ArrowRight className="h-4 w-4 mr-2 text-safety-green" />
                  Real-time location tracking
                </div>
                <div className="flex items-center">
                  <ArrowRight className="h-4 w-4 mr-2 text-safety-green" />
                  Blockchain identity verification
                </div>
                <div className="flex items-center">
                  <ArrowRight className="h-4 w-4 mr-2 text-safety-green" />
                  Safety recommendations
                </div>
              </div>
              <Button className="w-full bg-safety-blue hover:bg-safety-blue/90 text-white group-hover:bg-safety-blue/90">
                Continue as Tourist
              </Button>
            </CardContent>
          </Card>

          <Card
            className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-safety-green/50"
            onClick={() => setSelectedRole("admin")}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-safety-green/10 rounded-full w-fit group-hover:bg-safety-green/20 transition-colors">
                <Shield className="h-12 w-12 text-safety-green" />
              </div>
              <CardTitle className="text-2xl text-gray-900">Admin Access</CardTitle>
              <CardDescription className="text-gray-600">
                Monitor tourists, manage alerts, and oversee safety operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <ArrowRight className="h-4 w-4 mr-2 text-safety-blue" />
                  Real-time tourist monitoring
                </div>
                <div className="flex items-center">
                  <ArrowRight className="h-4 w-4 mr-2 text-safety-blue" />
                  Alert management system
                </div>
                <div className="flex items-center">
                  <ArrowRight className="h-4 w-4 mr-2 text-safety-blue" />
                  Analytics and reporting
                </div>
                <div className="flex items-center">
                  <ArrowRight className="h-4 w-4 mr-2 text-safety-blue" />
                  Emergency response coordination
                </div>
              </div>
              <Button className="w-full bg-safety-green hover:bg-safety-green/90 text-white group-hover:bg-safety-green/90">
                Continue as Admin
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-500">Secure • Reliable • AI-Powered</p>
        </div>
      </div>
    </div>
  )
}
