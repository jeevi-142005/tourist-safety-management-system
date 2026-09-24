"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2, Brain, MapPin, AlertTriangle, AlertCircle,
  Download, Sparkles, ShieldCheck, FileText
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 style={{fontSize:"1.2rem",fontWeight:700,borderBottom:"1px solid #e5e7eb",paddingBottom:"4px",marginTop:"16px",marginBottom:"8px",color:"#111827"}}>{children}</h1>,
          h2: ({ children }) => <h2 style={{fontSize:"1.05rem",fontWeight:700,marginTop:"14px",marginBottom:"6px",color:"#1f2937"}}>{children}</h2>,
          h3: ({ children }) => <h3 style={{fontSize:"0.95rem",fontWeight:600,marginTop:"12px",marginBottom:"4px",color:"#374151"}}>{children}</h3>,
          h4: ({ children }) => <h4 style={{fontSize:"0.875rem",fontWeight:600,marginTop:"8px",marginBottom:"4px",color:"#4b5563"}}>{children}</h4>,
          p: ({ children }) => <p style={{fontSize:"0.875rem",lineHeight:"1.6",marginBottom:"8px",color:"#374151"}}>{children}</p>,
          ul: ({ children }) => <ul style={{paddingLeft:"20px",marginBottom:"12px",listStyleType:"disc"}}>{children}</ul>,
          ol: ({ children }) => <ol style={{paddingLeft:"20px",marginBottom:"12px",listStyleType:"decimal"}}>{children}</ol>,
          li: ({ children }) => <li style={{fontSize:"0.875rem",lineHeight:"1.6",color:"#374151",marginBottom:"4px"}}>{children}</li>,
          strong: ({ children }) => <strong style={{fontWeight:700,color:"#111827"}}>{children}</strong>,
          em: ({ children }) => <em style={{fontStyle:"italic",color:"#6b7280"}}>{children}</em>,
          hr: () => <hr style={{margin:"16px 0",borderColor:"#e5e7eb"}} />,
          blockquote: ({ children }) => <blockquote style={{borderLeft:"4px solid #fdba74",paddingLeft:"12px",fontStyle:"italic",color:"#6b7280",margin:"8px 0"}}>{children}</blockquote>,
          code: ({ children }) => <code style={{background:"#f3f4f6",borderRadius:"4px",padding:"2px 6px",fontSize:"0.8rem",fontFamily:"monospace"}}>{children}</code>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

async function exportToPDF(content: string, title: string, subtitle: string) {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  let y = margin

  doc.setFillColor(234, 88, 12)
  doc.rect(0, 0, pageWidth, 32, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(15)
  doc.setFont("helvetica", "bold")
  doc.text("Tourist Safety Management System", margin, 13)
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text("AI-Generated Report  |  Powered by Google Gemini", margin, 21)
  doc.text("Generated: " + new Date().toLocaleString(), margin, 28)
  y = 42

  doc.setTextColor(30, 30, 30)
  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  const titleLines = doc.splitTextToSize(title, contentWidth)
  titleLines.forEach((line: string) => { doc.text(line, margin, y); y += 7 })
  y += 2

  doc.setFillColor(254, 243, 199)
  doc.setDrawColor(251, 191, 36)
  doc.roundedRect(margin, y, contentWidth, 8, 2, 2, "FD")
  doc.setTextColor(146, 64, 14)
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text(subtitle, margin + 3, y + 5.5)
  y += 14

  const lines = content
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .split("\n")

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9.5)
  doc.setTextColor(40, 40, 40)

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) { y += 3; continue }
    if (/^---+$/.test(line)) {
      if (y > pageHeight - margin - 6) { doc.addPage(); y = margin }
      doc.setDrawColor(220, 220, 220)
      doc.line(margin, y, pageWidth - margin, y)
      y += 4; continue
    }
    if (/^\d+\.\s/.test(line) && line.length < 80) {
      if (y > pageHeight - margin - 10) { doc.addPage(); y = margin }
      doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(234, 88, 12)
      doc.text(line, margin, y); y += 6
      doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(40, 40, 40)
      continue
    }
    const isBullet = /^[-*•]/.test(line)
    const cleanLine = isBullet ? "  • " + line.replace(/^[-*•]\s*/, "") : line
    const indentX = isBullet ? margin + 3 : margin
    const wrapped = doc.splitTextToSize(cleanLine, contentWidth - (isBullet ? 3 : 0))
    for (const wl of wrapped) {
      if (y > pageHeight - margin - 6) { doc.addPage(); y = margin }
      doc.text(wl, indentX, y); y += 5
    }
    y += 0.5
  }

  const totalPages = (doc.internal as any).getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8); doc.setTextColor(160, 160, 160)
    doc.text("Tourist Safety Management System — Confidential AI Report", margin, pageHeight - 8)
    doc.text("Page " + i + " of " + totalPages, pageWidth - margin - 20, pageHeight - 8)
  }
  doc.save(title.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "") + "_" + Date.now() + ".pdf")
}

export function AISafetyAdvisor() {
  const [location, setLocation] = useState("")
  const [situation, setSituation] = useState("")
  const [destination, setDestination] = useState("")
  const [travelDate, setTravelDate] = useState("")
  const [advice, setAdvice] = useState("")
  const [riskAnalysis, setRiskAnalysis] = useState("")
  const [loadingAdvice, setLoadingAdvice] = useState(false)
  const [loadingRisk, setLoadingRisk] = useState(false)
  const [exportingAdvice, setExportingAdvice] = useState(false)
  const [exportingRisk, setExportingRisk] = useState(false)
  const [error, setError] = useState("")

  const getSafetyAdvice = async () => {
    if (!location || !situation) return
    setLoadingAdvice(true); setError("")
    try {
      const response = await fetch("/api/safety-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, situation }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to get safety advice")
      if (data.advice) setAdvice(data.advice)
    } catch (err: any) {
      setError(err.message || "Failed to get AI advice. Please try again.")
    } finally {
      setLoadingAdvice(false)
    }
  }

  const analyzeTravelRisk = async () => {
    if (!destination || !travelDate) return
    setLoadingRisk(true); setError("")
    try {
      const response = await fetch("/api/travel-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, travelDate }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to analyze travel risk")
      if (data.riskAnalysis) setRiskAnalysis(data.riskAnalysis)
    } catch (err: any) {
      setError(err.message || "Failed to analyze travel risk. Please try again.")
    } finally {
      setLoadingRisk(false)
    }
  }

  const handleExportAdvice = async () => {
    setExportingAdvice(true)
    await exportToPDF(advice, "Safety Advice — " + location, "Situation: " + situation)
    setExportingAdvice(false)
  }

  const handleExportRisk = async () => {
    setExportingRisk(true)
    const dateLabel = travelDate ? new Date(travelDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : travelDate
    await exportToPDF(riskAnalysis, "Travel Risk Analysis — " + destination, "Travel Date: " + dateLabel)
    setExportingRisk(false)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
          <Brain className="w-8 h-8 text-primary" />
          AI Safety Advisor
        </h2>
        <p className="text-muted-foreground">
          Get personalized safety advice and travel risk analysis powered by Google Gemini AI
        </p>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50 mb-6">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Safety Advice */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Get AI Safety Advice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Current Location</label>
                <Input
                  id="safety-location"
                  placeholder="e.g., Kodaikanal, Tamil Nadu"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Situation Description</label>
                <Textarea
                  id="safety-situation"
                  placeholder="Describe your current situation or safety concern..."
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                id="get-safety-advice-btn"
                onClick={getSafetyAdvice}
                disabled={!location || !situation || loadingAdvice}
                className="w-full"
              >
                {loadingAdvice
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Getting AI Advice...</>
                  : <><Sparkles className="w-4 h-4 mr-2" />Get AI Safety Advice</>}
              </Button>
            </CardContent>
          </Card>

          {advice && (
            <Card className="border-orange-200 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-orange-500" />
                    <span className="font-semibold text-base">Safety Report</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                      <Sparkles className="w-3 h-3 mr-1" />Gemini AI Generated
                    </Badge>
                    <Button
                      id="export-advice-pdf-btn"
                      size="sm"
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                      onClick={handleExportAdvice}
                      disabled={exportingAdvice}
                    >
                      {exportingAdvice
                        ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Exporting...</>
                        : <><Download className="w-3 h-3 mr-1" />Export PDF</>}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {location}
                  <span className="mx-1">·</span>
                  <FileText className="w-3 h-3" /> {situation}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-100 max-h-[600px] overflow-y-auto">
                  <MarkdownContent content={advice} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Travel Risk Analysis */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                Travel Risk Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Destination</label>
                <Input
                  id="risk-destination"
                  placeholder="e.g., Paris, France"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Travel Date</label>
                <Input
                  id="risk-travel-date"
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                />
              </div>
              <Button
                id="analyze-risk-btn"
                onClick={analyzeTravelRisk}
                disabled={!destination || !travelDate || loadingRisk}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loadingRisk
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing with AI...</>
                  : <><Brain className="w-4 h-4 mr-2" />Analyze Travel Risk with AI</>}
              </Button>
            </CardContent>
          </Card>

          {riskAnalysis && (
            <Card className="border-blue-200 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold text-base">Risk Assessment Report</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      <Sparkles className="w-3 h-3 mr-1" />Gemini AI Analysis
                    </Badge>
                    <Button
                      id="export-risk-pdf-btn"
                      size="sm"
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      onClick={handleExportRisk}
                      disabled={exportingRisk}
                    >
                      {exportingRisk
                        ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Exporting...</>
                        : <><Download className="w-3 h-3 mr-1" />Export PDF</>}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {destination}
                  <span className="mx-1">·</span>
                  <FileText className="w-3 h-3" />
                  {travelDate && new Date(travelDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 max-h-[600px] overflow-y-auto">
                  <MarkdownContent content={riskAnalysis} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
