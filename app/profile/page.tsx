"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { NavigationMenu } from "@/components/navigation-menu"
import { User, Phone, Shield, Save, Loader2 } from "lucide-react"

interface Profile {
  id: string
  email: string
  full_name: string
  phone: string
  emergency_contact: string
  emergency_phone: string
  role: string
  blockchain_id: string
  created_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error) throw error
        setProfile(data)
      } catch (error) {
        console.error("Error fetching profile:", error)
        setMessage({ type: "error", text: "Failed to load profile" })
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          emergency_contact: profile.emergency_contact,
          emergency_phone: profile.emergency_phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (error) throw error
      setMessage({ type: "success", text: "Profile updated successfully!" })
    } catch (error) {
      console.error("Error updating profile:", error)
      setMessage({ type: "error", text: "Failed to update profile" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationMenu />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationMenu />
        <div className="max-w-4xl mx-auto p-6">
          <Alert>
            <AlertDescription>Profile not found. Please try logging in again.</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationMenu />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your account information and emergency contacts</p>
          </div>
        </div>

        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Personal Information</span>
              </CardTitle>
              <CardDescription>Your basic account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSave}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={profile.email} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profile.full_name || ""}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone || ""}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="role">Account Type</Label>
                    <Input id="role" value={profile.role} disabled className="bg-muted capitalize" />
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="w-5 h-5" />
                <span>Emergency Contacts</span>
              </CardTitle>
              <CardDescription>Important contacts for emergency situations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="emergency_contact">Emergency Contact Name</Label>
                <Input
                  id="emergency_contact"
                  value={profile.emergency_contact || ""}
                  onChange={(e) => setProfile({ ...profile, emergency_contact: e.target.value })}
                  placeholder="Enter emergency contact name"
                />
              </div>

              <div>
                <Label htmlFor="emergency_phone">Emergency Contact Phone</Label>
                <Input
                  id="emergency_phone"
                  type="tel"
                  value={profile.emergency_phone || ""}
                  onChange={(e) => setProfile({ ...profile, emergency_phone: e.target.value })}
                  placeholder="Enter emergency contact phone"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Account Security</span>
            </CardTitle>
            <CardDescription>Your account security information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Tourist ID</Label>
                <Input value={profile.blockchain_id || "Not generated"} disabled className="bg-muted font-mono" />
              </div>
              <div>
                <Label>Account Created</Label>
                <Input value={new Date(profile.created_at).toLocaleDateString()} disabled className="bg-muted" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
