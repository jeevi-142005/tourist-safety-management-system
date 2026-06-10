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
  Bell,
  MapPin
} from "lucide-react"

export function LoginSelection() {
  const { login, register } = useAuth()

  const [isLogin, setIsLogin] = useState(true)
  const [selectedRole, setSelectedRole] = useState<"tourist" | "admin">("tourist")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      await login(email, password, selectedRole)
    } catch (err) {
      console.error("[Auth] Login error:", err)
      setError(err instanceof Error ? err.message : "Login failed")
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
      await register(email, password, name, selectedRole)
      setSuccess("Registration successful! Please check your email to verify your account.")
      setIsLogin(true)
      setPassword("")
      setConfirmPassword("")
    } catch (err) {
      console.error("[Auth] Registration error:", err)
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-screen h-screen max-h-screen overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-[#f8fafc] dark:bg-slate-950 font-sans" dir="ltr">
      
      {/* Left Pane: Scenic Cover & Features */}
      <div className="h-full overflow-hidden relative hidden lg:flex lg:col-span-5 flex-col justify-between p-12 text-white bg-slate-900">
          
          <img
            src="https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?auto=format&fit=crop&q=80&w=1000"
            alt="Scenic Hiker View"
            className="absolute inset-0 w-full h-full object-cover opacity-45 mix-blend-overlay"
          />

          <div className="absolute inset-0 bg-gradient-to-b from-blue-950/60 via-slate-950/50 to-slate-950/90 z-0" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/90 rounded-xl shadow-lg shadow-blue-500/20 backdrop-blur-md">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight tracking-wide">Tourist Safety System</h2>
              <p className="text-xs text-blue-200/80">Safe Travel, Peaceful Journey</p>
            </div>
          </div>

          <div className="relative z-10 my-auto py-12 max-w-md">
            <h1 className="text-4xl font-extrabold tracking-tight mb-4 leading-tight">
              Your <span className="text-blue-400 font-black">Safety</span>,
              <br />
              Our Priority
            </h1>
            <p className="text-slate-300 text-sm mb-10 leading-relaxed font-normal">
              Advanced AI-powered safety monitoring and incident response platform for secure tourism.
            </p>

            <div className="space-y-6">
              
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-900/50 border border-blue-700/30 rounded-xl text-blue-300">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">AI-Powered Monitoring</h4>
                  <p className="text-xs text-slate-300/95 mt-0.5">Real-time threat detection and risk assessment</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-emerald-950/50 border border-emerald-700/30 rounded-xl text-emerald-300">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Instant Alerts</h4>
                  <p className="text-xs text-slate-300/95 mt-0.5">Immediate notifications and emergency response</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-purple-950/50 border border-purple-700/30 rounded-xl text-purple-300">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Secure & Reliable</h4>
                  <p className="text-xs text-slate-300/95 mt-0.5">Your data is protected with enterprise-grade security</p>
                </div>
              </div>

            </div>
          </div>

          <div className="relative z-10 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-300">
              <MapPin className="h-5 w-5 animate-bounce" />
            </div>
            <p className="text-xs font-medium text-slate-200">
              Travel with confidence. We're here to keep you safe.
            </p>
          </div>

        </div>

        {/* Right Pane: Authentication Control */}
        <div className="col-span-1 lg:col-span-7 w-full h-full overflow-y-auto flex flex-col justify-center items-center p-6 md:p-10 lg:p-12 relative bg-[#f8fafc] dark:bg-slate-950/40">

          {/* Central Auth Container */}
          <div className="w-full max-w-[440px] mx-auto my-auto flex flex-col py-6">

            {/* Main Card container */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-2xl rounded-3xl p-6 md:p-8 transition-all">
              
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                  {isLogin ? "Welcome Back" : "Create Account"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {isLogin ? "Sign in to your account to continue" : "Register your safety profile to start"}
                </p>
              </div>

              {/* Toggle Tabs */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 mb-8">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true)
                    setError("")
                    setSuccess("")
                  }}
                  className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-all ${
                    isLogin
                      ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                      : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
                  className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-all ${
                    !isLogin
                      ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                      : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Role Switcher Selector */}
              <div className="flex bg-slate-100/80 dark:bg-slate-800/50 p-1 rounded-xl w-full mb-6">
                <button
                  type="button"
                  onClick={() => setSelectedRole("tourist")}
                  className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-lg transition-all ${
                    selectedRole === "tourist"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Tourist
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("admin")}
                  className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-lg transition-all ${
                    selectedRole === "admin"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </button>
              </div>

              {/* Forms */}
              <form onSubmit={isLogin ? handleLoginSubmit : handleRegisterSubmit} className="space-y-5">
                
                {/* Full Name field (Only on signup) */}
                {!isLogin && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Email Address field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Password
                    </label>
                    {isLogin && (
                      <a href="#" className="text-xs text-blue-600 hover:underline">
                        Forgot Password?
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password field (Only on signup) */}
                {!isLogin && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Remember Me Checkbox (Only on login) */}
                {isLogin && (
                  <div className="flex items-center pt-1">
                    <input
                      id="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500/20 focus:outline-none cursor-pointer"
                    />
                    <label htmlFor="remember-me" className="ml-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                      Remember me
                    </label>
                  </div>
                )}

                {/* Feedback Notifications */}
                {error && (
                  <div className="text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-3 rounded-xl">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="text-emerald-600 dark:text-emerald-400 text-xs bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-3 rounded-xl">
                    {success}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 flex items-center justify-center font-semibold text-sm transition-all hover:shadow-lg hover:shadow-blue-500/10 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isLogin ? "Signing in..." : "Creating account..."}
                    </>
                  ) : (
                    <>
                      {isLogin ? "Sign In" : "Create Account"}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>

              </form>

              {/* Divider: "or continue with" */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 dark:text-slate-500 font-medium">
                    or continue with
                  </span>
                </div>
              </div>

              {/* Social Logins */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { }}
                  className="flex items-center justify-center py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all cursor-pointer focus:outline-none"
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.58 14.99 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.86 3c.92-2.77 3.51-4.76 6.75-4.76z" />
                    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-1.99 3.74-4.92 3.74-8.6z" />
                    <path fill="#FBBC05" d="M5.25 14.56c-.24-.72-.38-1.5-.38-2.31s.14-1.59.38-2.31l-3.86-3C.56 8.5 0 10.19 0 12s.56 3.5 1.39 5.06l3.86-3z" />
                    <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.7-2.87c-1.03.69-2.35 1.1-4.26 1.1-3.24 0-5.83-1.99-6.75-4.76l-3.86 3C3.37 20.33 7.35 23 12 23z" />
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => { }}
                  className="flex items-center justify-center py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all cursor-pointer focus:outline-none"
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M1 1h10v10H1z" />
                    <path fill="#81bc06" d="M12 1h10v10H12z" />
                    <path fill="#05a6f0" d="M1 12h10v10H1z" />
                    <path fill="#ffba08" d="M12 12h10v10H12z" />
                  </svg>
                  Microsoft
                </button>
              </div>

            </div>

            {/* Compact Demo Notice Panel below welcome card */}
            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-4 mb-2 select-none font-medium">
              Demo Access: tourist@demo.com or admin@demo.com (pass: password123)
            </p>

        </div>

      </div>
    </div>
  )
}
