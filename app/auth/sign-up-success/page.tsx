import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield } from "lucide-react"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Thank you for signing up!</h1>
          <p className="text-muted-foreground">Check your email to confirm</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Account Created Successfully</CardTitle>
            <CardDescription className="text-center">Please check your email to confirm your account</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              You've successfully signed up for Tourist Safety. Please check your email to confirm your account before
              signing in.
            </p>
            <Link href="/auth/login" className="text-primary hover:underline text-sm font-medium">
              Return to Sign In
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
