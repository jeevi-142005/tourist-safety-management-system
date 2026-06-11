"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, ShieldAlert, Send, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/db-client/client"

interface AlertResolutionModalProps {
  isOpen: boolean
  onClose: () => void
  alert: any
  onResolved: () => void
}

export function AlertResolutionModal({ isOpen, onClose, alert, onResolved }: AlertResolutionModalProps) {
  const [resolutionMessage, setResolutionMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !alert) return null

  const handleResolve = async () => {
    if (!resolutionMessage.trim()) return
    setIsSubmitting(true)

    try {
      const dbClient = createClient()
      if (!dbClient) return

      // 1. Mark emergency alert as resolved
      await dbClient.from('emergency_alerts')
        .update({ status: 'resolved' })
        .eq('id', alert.id)

      // 2. Send notification to tourist
      await dbClient.from('user_alerts').insert({
        user_id: alert.user_id,
        user_name: alert.user_name,
        type: 'info',
        severity: 'low',
        message: `Admin Update on your SOS: ${resolutionMessage}`,
        status: 'active',
        created_at: new Date().toISOString()
      })

      onResolved()
      onClose()
    } catch (err) {
      console.error("Failed to resolve alert", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200 p-4">
      <Card className="w-full max-w-lg bg-white border-slate-200 shadow-2xl">
        <CardHeader className="border-b border-slate-200 bg-red-950/20">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-900">Resolve SOS Alert</CardTitle>
                <CardDescription className="text-xs text-red-400 mt-0.5">
                  Action required for {alert.user_name || "Tourist"}
                </CardDescription>
              </div>
            </div>
            <Badge variant="destructive" className="bg-red-500/10 text-red-400 border-red-500/20">
              ACTIVE
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Alert Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <p className="text-sm text-slate-800 italic border-l-2 border-red-500 pl-3">
              "{alert.message || "Emergency assistance requested"}"
            </p>
            <div className="flex justify-between text-xs text-slate-500 mt-4">
              <span className="flex items-center bg-gray-800/50 px-2 py-1 rounded">
                <MapPin className="h-3 w-3 mr-1" />
                {alert.location_lat?.toFixed(4)}, {alert.location_lng?.toFixed(4)}
              </span>
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(alert.created_at).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Resolution Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center">
              <Send className="h-3.5 w-3.5 mr-2" /> Message to Tourist
            </label>
            <textarea
              value={resolutionMessage}
              onChange={(e) => setResolutionMessage(e.target.value)}
              placeholder="e.g. Police are on the way. Please stay hidden and remain calm."
              className="w-full h-24 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
            <p className="text-[10px] text-slate-400">This message will be instantly sent to the tourist's app dashboard.</p>
          </div>
        </CardContent>

        <CardFooter className="border-t border-slate-200 bg-slate-50 flex justify-end space-x-3 p-4">
          <Button onClick={onClose} variant="ghost" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100">
            Cancel
          </Button>
          <Button 
            onClick={handleResolve} 
            disabled={!resolutionMessage.trim() || isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-slate-900"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {isSubmitting ? "Resolving..." : "Mark as Resolved & Send"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
