import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST() {
    try {
        // Find a tourist user to assign this offline SOS to
        const user = await db.user.findFirst({
            where: { role: "tourist" },
            select: { id: true, name: true },
        })

        if (!user) {
            return NextResponse.json({ error: "No tourist user found to simulate" }, { status: 400 })
        }

        // Create an EmergencyAlert in the database
        const alert = await db.emergencyAlert.create({
            data: {
                userId: user.id,
                userName: user.name || "Unknown Tourist",
                type: "sos",
                message: "🚨 [TWILIO SMS GATEWAY] OFFLINE SOS: Tourist sent SMS without internet. GPS: 11.0168, 76.9558",
                severity: "critical",
                locationLat: 11.0168,
                locationLng: 76.9558,
                status: "active",
                deviceInfo: { source: "twilio_sms_gateway", offline: true },
            },
        })

        // Also create an AdminNotification so the admin sees it immediately
        await db.adminNotification.create({
            data: {
                type: "emergency_alert",
                title: `🚨 OFFLINE SOS from ${user.name || "Tourist"}`,
                message: `Tourist sent an emergency SMS via Twilio Gateway while offline. GPS: 11.0168, 76.9558. Immediate response required.`,
                severity: "critical",
                userId: user.id,
                metadata: { alertId: alert.id, source: "twilio_sms_simulation" },
            },
        })

        return NextResponse.json({ success: true, alert })
    } catch (error) {
        console.error("Twilio simulation error:", error)
        return NextResponse.json({ error: "Failed to simulate SMS" }, { status: 500 })
    }
}
