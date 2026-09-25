"use client"

import React, { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import {
  Shield,
  Users,
  ArrowRight,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  Radio,
  Ambulance,
  Compass
} from "lucide-react"

export function LoginSelection() {
  const { login, register } = useAuth()

  const [isLogin, setIsLogin] = useState(true)
  const [selectedRole, setSelectedRole] = useState<string>("tourist")
  const [resourceType, setResourceType] = useState<string>("guide")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleQuickFill = (demoEmail: string, role: string, subType?: string) => {
    setEmail(demoEmail)
    setPassword("password123")
    setSelectedRole(role)
    if (subType) {
      setResourceType(subType)
    }
    setError("")
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const actualRole = selectedRole === "resource" ? resourceType : selectedRole
      await login(email, password, actualRole)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

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
      const actualRole = selectedRole === "resource" ? resourceType : selectedRole
      await register(email, password, name, actualRole)
      setSuccess("Account created successfully! Redirecting...")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-screen h-screen min-h-screen bg-white grid grid-cols-1 lg:grid-cols-12 font-sans overflow-y-auto lg:overflow-hidden" dir="ltr">
      
      {/* ══════════════ LEFT PANE: FULL-HEIGHT SCENIC BRANDING (5 COLS) ══════════════ */}
      <div className="hidden lg:flex lg:col-span-5 relative bg-slate-950 text-white flex-col justify-between p-10 lg:p-14 overflow-hidden h-full">
        <img
          src="https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?auto=format&fit=crop&q=80&w=1200"
          alt="Scenic Travel"
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/80 via-slate-950/70 to-slate-950/95 z-0" />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20 text-white">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight tracking-wide">Safaris Safety</h2>
            <p className="text-xs text-blue-200">Incident & Tourism Safety Platform</p>
          </div>
        </div>

        {/* Center Hero Feature Text */}
        <div className="relative z-10 my-auto py-6 max-w-md space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            1-to-1 Smart Emergency Dispatch
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Secure Tourism, <br />
            <span className="text-blue-400 font-black">Connected Protection.</span>
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed font-normal">
            Real-time incident detection, instant 1-to-1 tourist guide and paramedic auto-triage, and unified crisis response.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Direct Tourist Distress Signals to Dedicated Guides</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>1-to-1 Load Balancing (One alert per available responder)</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Real-Time Status Synchronization Across All 3 Dashboards</span>
            </div>
          </div>
        </div>

        {/* Bottom Status Card */}
        <div className="relative z-10 bg-white/10 border border-white/10 p-3.5 rounded-xl backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Radio className="h-4 w-4 text-emerald-400 animate-pulse shrink-0" />
            <span className="text-xs text-slate-200 font-medium">Command Dispatch Active</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">24/7 Monitored</span>
        </div>
      </div>

      {/* ══════════════ RIGHT PANE: FULL-HEIGHT AUTHENTICATION FORM (7 COLS) ══════════════ */}
      <div className="col-span-1 lg:col-span-7 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-16 bg-[#f8fafc] h-full overflow-y-auto">
        <div className="w-full max-w-md space-y-6 my-auto">
          
          {/* Header */}
          <div className="text-center space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {isLogin ? "Welcome to Safaris" : "Create Account"}
            </h2>
            <p className="text-xs text-slate-500">
              {isLogin ? "Sign in to access your specialized dashboard" : "Register your profile for safety monitoring"}
            </p>
          </div>

          {/* Sign In / Register Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true)
                setError("")
                setSuccess("")
              }}
              className={`flex-1 pb-3 text-xs sm:text-sm font-bold border-b-2 text-center transition-all cursor-pointer ${
                isLogin
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false)
                setError("")
                setSuccess("")
              }}
              className={`flex-1 pb-3 text-xs sm:text-sm font-bold border-b-2 text-center transition-all cursor-pointer ${
                !isLogin
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Role Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
              Select Your Portal Role
            </label>
            <div className="grid grid-cols-3 gap-2 bg-slate-200/70 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedRole("tourist")}
                className={`flex items-center justify-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedRole === "tourist"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Users className="h-3.5 w-3.5 mr-1.5" />
                Tourist
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("admin")}
                className={`flex items-center justify-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedRole === "admin"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Shield className="h-3.5 w-3.5 mr-1.5" />
                Admin
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("resource")}
                className={`flex items-center justify-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedRole === "resource"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Ambulance className="h-3.5 w-3.5 mr-1.5" />
                Resource
              </button>
            </div>
          </div>

          {/* Resource Specialty Selection (if Resource role selected) */}
          {selectedRole === "resource" && (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <label className="text-[11px] font-semibold text-slate-600 block">
                Resource Specialty
              </label>
              <div className="relative">
                <select
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value)}
                  className="w-full pl-3.5 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer shadow-2xs"
                >
                  <option value="guide">Tourist Guide</option>
                  <option value="ambulance">Ambulance Response Unit</option>
                  <option value="police">Police QRT</option>
                  <option value="fire">Fire & Disaster Rescue</option>
                  <option value="security">Security Patrol</option>
                  <option value="hospital">Hospital Station</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={isLogin ? handleLoginSubmit : handleRegisterSubmit} className="space-y-3.5">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                </div>
              </div>
            )}

            {/* Error / Success feedback */}
            {error && (
              <div className="text-red-700 text-xs bg-red-50 border border-red-200 p-2.5 rounded-xl font-medium">
                {error}
              </div>
            )}

            {success && (
              <div className="text-emerald-700 text-xs bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl font-medium">
                {success}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 flex items-center justify-center font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-500/20 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                <>
                  {isLogin ? "Sign In to Dashboard" : "Register Account"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* One-Click Demo Access Panel */}
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider text-center">
              One-Click Demo Access
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill("tourist@demo.com", "tourist")}
                className="p-2 bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl text-left transition-colors cursor-pointer shadow-2xs"
              >
                <span className="font-bold text-slate-800 block text-xs">Tourist</span>
                <span className="text-[10px] text-slate-400 font-mono">tourist@demo.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("admin@safetour.com", "admin")}
                className="p-2 bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl text-left transition-colors cursor-pointer shadow-2xs"
              >
                <span className="font-bold text-slate-800 block text-xs">Admin</span>
                <span className="text-[10px] text-slate-400 font-mono">admin@safetour.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("guide1@demo.com", "resource", "guide")}
                className="p-2 bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl text-left transition-colors cursor-pointer shadow-2xs"
              >
                <span className="font-bold text-slate-800 block text-xs">Tourist Guide 1</span>
                <span className="text-[10px] text-slate-400 font-mono">guide1@demo.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("guide2@demo.com", "resource", "guide")}
                className="p-2 bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl text-left transition-colors cursor-pointer shadow-2xs"
              >
                <span className="font-bold text-slate-800 block text-xs">Tourist Guide 2</span>
                <span className="text-[10px] text-slate-400 font-mono">guide2@demo.com</span>
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}

export default LoginSelection
