import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/db-client/server"

export async function POST() {
    try {
        const supabase = await createServerClient()
        
        // Find a random user to assign this offline SOS to
        const { data: users } = await supabase.from('users').select('id, full_name').limit(1)
        const userId = users && users.length > 0 ? users[0].id : null

        if (!userId) {
            return NextResponse.json({ error: "No user found to simulate" }, { status: 400 })
        }

        // Create an alert
        const { data: alert, error } = await supabase.from('alerts').insert({
            user_id: userId,
            type: 'emergency',
            message: '🚨 [TWILIO SMS GATEWAY] OFFLINE SOS: Tourist sent SMS without internet. GPS: 11.0168, 76.9558',
            severity: 'critical',
            location: { lat: 11.0168, lng: 76.9558 },
            status: 'active',
            ai_analysis: 'User sent SMS via Twilio. No internet on device.'
        }).select().single()

        if (error) throw error

        // Also update user status to emergency
        await supabase.from('users').update({ status: 'emergency' }).eq('id', userId)

        return NextResponse.json({ success: true, alert })
    } catch (error) {
        console.error("Twilio simulation error:", error)
        return NextResponse.json({ error: "Failed to simulate SMS" }, { status: 500 })
    }
}
