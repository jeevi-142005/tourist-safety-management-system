"use client"

import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { AuthProvider } from "@/hooks/use-auth"
import { Suspense, useEffect } from "react"
import { LanguageProvider } from "@/contexts/language-context"
import "./globals.css"

// Service Worker Provider Component
function ServiceWorkerProvider() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Emergency Alert Service Worker registered:', registration)
        })
        .catch((error) => {
          console.error('Emergency Alert Service Worker registration failed:', error)
        })
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('Notification permission:', permission)
      })
    }

    // Setup emergency broadcast channel
    if (typeof window !== 'undefined') {
      window.emergencyBroadcast = new BroadcastChannel('emergency-alerts')
      
      window.emergencyBroadcast.onmessage = (event) => {
        console.log('Emergency broadcast received:', event.data)
        
        // Forward to admin dashboard if open
        if (window.location.pathname.includes('/admin')) {
          window.dispatchEvent(new CustomEvent('emergency-alert', {
            detail: event.data
          }))
        }
      }
    }

    return () => {
      if (typeof window !== 'undefined' && window.emergencyBroadcast) {
        window.emergencyBroadcast.close()
      }
    }
  }, [])

  return null
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <head>
        <title>Tourist Safety System</title>
        <meta name="description" content="Advanced tourist safety monitoring and emergency response system" />
        <meta name="generator" content="v0.app" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body>
        <Suspense fallback={null}>
          <LanguageProvider>
            <AuthProvider>
              <ServiceWorkerProvider />
              {children}
            </AuthProvider>
          </LanguageProvider>
        </Suspense>
      </body>
    </html>
  )
}
