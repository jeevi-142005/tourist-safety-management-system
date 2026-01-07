"use client"

import { useEffect } from "react"

export function ServiceWorkerProvider() {
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
