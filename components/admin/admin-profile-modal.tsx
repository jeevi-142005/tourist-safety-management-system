"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Shield, User, Phone, Mail, CheckCircle2, AlertCircle, Sparkles, Building, Loader2 } from "lucide-react"

interface AdminProfileModalProps {
  isOpen: boolean
  onClose: () => void
  currentAdmin?: {
    id?: string
    name?: string
    email?: string
    role?: string
  } | null
  onProfileUpdated?: (updated: any) => void
}

export function AdminProfileModal({ isOpen, onClose, currentAdmin, onProfileUpdated }: AdminProfileModalProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(currentAdmin?.name || "System Admin")
  const [email, setEmail] = useState(currentAdmin?.email || "admin@safetour.com")
  const [phone, setPhone] = useState("")
  const [emergencyContact, setEmergencyContact] = useState("")
  const [emergencyPhone, setEmergencyPhone] = useState("")

  useEffect(() => {
    if (isOpen) {
      setSuccess(false)
      setError(null)
      fetchAdminProfile()
    }
  }, [isOpen])

  const fetchAdminProfile = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/profile")
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          setName(data.user.name || "")
          setEmail(data.user.email || "")
          setPhone(data.user.phone || "")
          setEmergencyContact(data.user.emergencyContact || "")
          setEmergencyPhone(data.user.emergencyPhone || "")
        }
      }
    } catch (err) {
      console.error("Failed to load admin profile:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          emergencyContact,
          emergencyPhone,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile")
      }

      setSuccess(true)
      onProfileUpdated?.(data.user)
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err.message || "An error occurred while saving profile")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-800 shadow-2xl rounded-2xl p-6">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Administrator Profile
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">
                  Active Duty
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Manage your commanding officer credentials and emergency contact routing
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-xs text-slate-400">Loading officer profile...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Officer profile updated successfully!</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-800 text-xs animate-in fade-in">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  Full Name / Call Sign
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Commander Jeevika Ramesh"
                  required
                  className="h-9 text-xs border-slate-200 focus:border-blue-500"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  Official Email
                </Label>
                <Input
                  value={email}
                  disabled
                  className="h-9 text-xs bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">Primary identifier linked to system auth.</span>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  Command Duty Contact Phone
                </Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 94421 99000"
                  className="h-9 text-xs border-slate-200 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <Label className="text-xs font-semibold text-slate-700 block mb-1">
                    Emergency Backup Contact
                  </Label>
                  <Input
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="e.g. Control Room Officer"
                    className="h-9 text-xs border-slate-200 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700 block mb-1">
                    Backup Phone
                  </Label>
                  <Input
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="e.g. 112 / 100"
                    className="h-9 text-xs border-slate-200 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-[11px] text-slate-600 flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Your officer profile ensures automated hazard warnings and dispatch communications display accurate authority credentials to tourists.
              </span>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={saving}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="h-9 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md shadow-blue-500/20"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  "Save Officer Profile"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
