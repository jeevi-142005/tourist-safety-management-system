"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FileText, Download, Loader2, Brain, Copy, Check } from "lucide-react"
import { useAIAutomation } from "@/hooks/use-ai-automation"
import type { Alert } from "@/lib/database"

interface AIIncidentReportProps {
  alert: Alert
  resolution?: string
}

export function AIIncidentReport({ alert, resolution = "Resolved by admin" }: AIIncidentReportProps) {
  const [report, setReport] = useState<string>("")
  const [isOpen, setIsOpen] = useState(false)
  const [customResolution, setCustomResolution] = useState(resolution)
  const [copied, setCopied] = useState(false)
  const { generateIncidentReport, isAnalyzing } = useAIAutomation()

  const handleGenerateReport = async () => {
    try {
      const generatedReport = await generateIncidentReport(alert, customResolution)
      setReport(generatedReport)
    } catch (error) {
      console.error("Failed to generate incident report:", error)
    }
  }

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(report)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy report:", error)
    }
  }

  const handleDownloadReport = () => {
    const blob = new Blob([report], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `incident-report-${alert.id}-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case "emergency":
        return "bg-red-100 text-red-800 border-red-200"
      case "medical":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "security":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "assistance":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-purple-600 border-purple-300 bg-transparent">
          <FileText className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <span>AI-Generated Incident Report</span>
          </DialogTitle>
          <DialogDescription>
            Automatically generate a comprehensive incident report for this resolved alert
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alert Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alert Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={getAlertTypeColor(alert.type)}>{alert.type.toUpperCase()}</Badge>
                    <span className="font-medium">{alert.touristName}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                  <p className="text-xs text-gray-500">{new Date(alert.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">Location:</span>
                      <p className="text-sm text-gray-600">
                        {alert.location
                          ? `${alert.location.lat.toFixed(4)}, ${alert.location.lng.toFixed(4)}`
                          : "Unknown"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Status:</span>
                      <Badge className="ml-2 bg-green-100 text-green-800">Resolved</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resolution Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resolution Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Resolution Summary</label>
                  <Textarea
                    value={customResolution}
                    onChange={(e) => setCustomResolution(e.target.value)}
                    placeholder="Describe how this incident was resolved..."
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleGenerateReport}
                  disabled={isAnalyzing}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Generate AI Report
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Generated Report */}
          {report && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Generated Report</CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleCopyReport} disabled={copied}>
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadReport}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800">{report}</pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
