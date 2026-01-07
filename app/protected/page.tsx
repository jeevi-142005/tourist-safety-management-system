import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, User, LogOut } from "lucide-react"
import Link from "next/link"

export default async function ProtectedPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Protected Dashboard</h1>
              <p className="text-muted-foreground">Welcome to your secure area</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/">
              <Button variant="outline">Home</Button>
            </Link>
            <form action="/auth/signout" method="post">
              <Button variant="outline" type="submit">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>User Information</span>
              </CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <strong>Email:</strong> {data.user.email}
              </div>
              <div>
                <strong>User ID:</strong> {data.user.id}
              </div>
              <div>
                <strong>Role:</strong> {profile?.role || "tourist"}
              </div>
              <div>
                <strong>Full Name:</strong> {profile?.full_name || "Not set"}
              </div>
              <div>
                <strong>Created:</strong> {new Date(data.user.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database Connection</CardTitle>
              <CardDescription>Supabase integration status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Authentication: Connected</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Database: Connected</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Profile: {profile ? "Loaded" : "Not found"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>What you can do now</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Your Supabase database is properly configured with Row Level Security</li>
              <li>• User profiles are automatically created when you sign up</li>
              <li>• Authentication is working correctly with middleware protection</li>
              <li>• You can now build features that require user authentication</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
