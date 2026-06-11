"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Mail, User as UserIcon, Calendar, HeartPulse, FileText, CheckCircle, Clock } from "lucide-react"

interface TouristDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  tourist: any
}

export function TouristDetailsModal({ isOpen, onClose, tourist }: TouristDetailsModalProps) {
  if (!isOpen || !tourist) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200 p-4">
      <Card className="w-full max-w-2xl bg-white border-slate-200 shadow-2xl">
        <CardHeader className="border-b border-slate-200 bg-slate-50">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 font-bold text-xl border border-blue-500/20">
                {tourist.name?.charAt(0) || "T"}
              </div>
              <div>
                <CardTitle className="text-xl text-slate-900">{tourist.name || "Unknown Tourist"}</CardTitle>
                <CardDescription className="font-mono text-xs text-blue-400 mt-1">
                  Blockchain ID: {tourist.blockchain_id || `BC-${tourist.id.substring(0, 8).toUpperCase()}`}
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className={tourist.is_active ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-gray-500/10 text-slate-500 border-gray-500/20"}>
              {tourist.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* Contact Information */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
              <UserIcon className="h-3.5 w-3.5 mr-2" /> Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-[10px] text-slate-400">Email Address</p>
                  <p className="text-sm text-slate-800">{tourist.email || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-[10px] text-slate-400">Phone Number</p>
                  <p className="text-sm text-slate-800">{tourist.phone || "+1 (555) 123-4567"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Information */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
              <HeartPulse className="h-3.5 w-3.5 mr-2" /> Emergency Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-red-950/10 p-4 rounded-xl border border-red-900/20">
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] text-slate-400">Emergency Contact Name</span>
                <span className="text-sm text-slate-800">{tourist.emergency_contact || "Jane Doe (Spouse)"}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] text-slate-400">Emergency Phone</span>
                <span className="text-sm text-slate-800">{tourist.emergency_phone || "+1 (555) 987-6543"}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] text-slate-400">Blood Type & Medical Conditions</span>
                <span className="text-sm text-slate-800">{tourist.medical_info || "O-Positive, No known allergies"}</span>
              </div>
            </div>
          </div>

          {/* Travel & Visa Information */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
              <FileText className="h-3.5 w-3.5 mr-2" /> Travel Documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] text-slate-400">Passport / ID Number</span>
                <span className="text-sm text-slate-800 font-mono">{tourist.passport_id || "P123456789"}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] text-slate-400">Nationality</span>
                <span className="text-sm text-slate-800">{tourist.nationality || "United States"}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] text-slate-400">Visa Status</span>
                <span className="text-sm text-green-400 flex items-center"><CheckCircle className="h-3 w-3 mr-1" /> {tourist.visa_type || "Tourist E-Visa (Valid)"}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] text-slate-400">Registration Date</span>
                <span className="text-sm text-slate-800 flex items-center"><Calendar className="h-3 w-3 mr-1" /> {new Date(tourist.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Last Known Location */}
          <div className="bg-blue-900/10 p-4 rounded-xl border border-blue-900/30 flex justify-between items-center">
            <div>
              <p className="text-[10px] text-blue-400/70 font-semibold uppercase tracking-wider">Last Known Location Tracking</p>
              <div className="flex items-center space-x-2 mt-1">
                <MapPin className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-slate-800 font-mono">11.0159° N, 76.9368° E</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-blue-400/70 font-semibold uppercase tracking-wider">Timestamp</p>
              <div className="flex items-center space-x-2 mt-1 text-slate-500">
                <Clock className="h-3 w-3" />
                <span className="text-xs">Just now</span>
              </div>
            </div>
          </div>

        </CardContent>
        <CardFooter className="border-t border-slate-200 bg-slate-50 flex justify-end p-4">
          <Button onClick={onClose} variant="outline" className="border-slate-300 hover:bg-slate-100 text-slate-600">
            Close Details
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
