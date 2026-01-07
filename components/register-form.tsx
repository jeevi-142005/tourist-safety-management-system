"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Shield, Users, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface RegisterFormProps {
  role: "tourist" | "admin"
  onBack: () => void
  onSwitchToLogin: () => void
}

export function RegisterForm({ role, onBack, onSwitchToLogin }: RegisterFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    try {
      await register(email, password, name, role)
      alert("Registration successful! Please check your email to verify your account.")
      onSwitchToLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  const Icon = role === "tourist" ? Users : Shield

  return (
    <div className="min-h-screen bg-gradient-to-br from-safety-blue/5 via-white to-safety-green/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button variant="ghost" onClick={onBack} className="mb-6 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to selection
        </Button>

        <Card className="shadow-xl border-2">
          <CardHeader className="text-center">
            <div
              className={`mx-auto mb-4 p-3 rounded-full w-fit ${
                role === "tourist" ? "bg-safety-blue/10" : "bg-safety-green/10"
              }`}
            >
              <Icon className={`h-8 w-8 ${role === "tourist" ? "text-safety-blue" : "text-safety-green"}`} />
            </div>
            <CardTitle className="text-2xl">
              {role === "tourist" ? "Tourist Registration" : "Admin Registration"}
            </CardTitle>
            <CardDescription>Create your {role === "tourist" ? "tourist safety" : "admin"} account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>}

              <Button
                type="submit"
                className={`w-full text-white ${
                  role === "tourist"
                    ? "bg-safety-blue hover:bg-safety-blue/90"
                    : "bg-safety-green hover:bg-safety-green/90"
                }`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  onClick={onSwitchToLogin}
                  className={`font-medium hover:underline ${
                    role === "tourist" ? "text-safety-blue" : "text-safety-green"
                  }`}
                >
                  Sign in
                </button>
              </p>
            </div>

            {role === "tourist" && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-xs text-blue-700">
                  Your blockchain ID will be automatically generated upon registration
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
