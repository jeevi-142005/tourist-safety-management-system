"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, CheckCheck, RefreshCw } from "lucide-react"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  severity: string
  isRead: boolean
  createdAt: string
  readAt: string | null
  user: { name: string | null; email: string } | null
}

const severityColor: Record<string, string> = {
  critical: "border-l-red-500 bg-red-50/30",
  error: "border-l-red-400 bg-red-50/20",
  warning: "border-l-yellow-500 bg-yellow-50/20",
  info: "border-l-blue-400 bg-blue-50/10",
}

const severityBadge: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  error: "bg-red-100 text-red-700",
  warning: "bg-yellow-100 text-yellow-700",
  info: "bg-blue-100 text-blue-700",
}

export function NotificationsTab() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [markingAll, setMarkingAll] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const markRead = async (id: string) => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch (e) {
      console.error(e)
    }
  }

  const markAllRead = async () => {
    setMarkingAll(true)
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })))
      setUnreadCount(0)
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-indigo-500" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white text-[10px] px-1.5">{unreadCount}</Badge>
              )}
            </CardTitle>
            <CardDescription>System alerts and admin notifications</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                disabled={markingAll}
                onClick={markAllRead}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Mark All Read
              </Button>
            )}
            <Button size="sm" variant="outline" className="h-8" onClick={fetchNotifications}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-gray-400 py-8 text-sm">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No notifications</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`border-l-4 rounded-r-lg p-3 transition-opacity ${
                  severityColor[n.severity] || "border-l-gray-300 bg-gray-50/20"
                } ${n.isRead ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-semibold text-sm text-gray-900">{n.title}</span>
                      <Badge className={`text-[10px] ${severityBadge[n.severity] || "bg-gray-100 text-gray-600"}`}>
                        {n.severity}
                      </Badge>
                      {!n.isRead && (
                        <span className="h-2 w-2 bg-blue-500 rounded-full shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{n.message}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                      {n.user && <span>· {n.user.name || n.user.email}</span>}
                      {n.isRead && n.readAt && <span>· Read {new Date(n.readAt).toLocaleString()}</span>}
                    </div>
                  </div>
                  {!n.isRead && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-blue-600 hover:bg-blue-50 shrink-0"
                      onClick={() => markRead(n.id)}
                    >
                      Mark Read
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
