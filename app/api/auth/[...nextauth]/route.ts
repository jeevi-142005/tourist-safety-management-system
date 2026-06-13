import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { db } from "@/lib/db"
import bcrypt from "bcrypt"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please provide both email and password")
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) {
          throw new Error("No account found with this email. Please sign up first.")
        }

        if (!user.passwordHash) {
          throw new Error("Account setup incomplete. Please register again.")
        }

        const isPasswordMatch = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!isPasswordMatch) {
          throw new Error("Incorrect password. Please try again.")
        }

        // Verify role matches if provided
        if (credentials.role && user.role !== credentials.role) {
          throw new Error(`This account is registered as '${user.role}', not '${credentials.role}'. Please select the correct role.`)
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role as string;
        (session.user as any).id = token.id as string;
      }
      return session
    }
  },
  pages: {
    signIn: "/",
    error: "/",
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }

