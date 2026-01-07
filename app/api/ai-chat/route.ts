import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import type { NextRequest } from "next/server"

export const maxDuration = 30

function hasGoogleAPIKey(): boolean {
  return !!(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY)
}

function getIntelligentResponse(message: string, context?: any): string {
  const lowerMessage = message.toLowerCase()

  // Emergency responses
  if (lowerMessage.includes("emergency") || lowerMessage.includes("help") || lowerMessage.includes("urgent")) {
    return `🚨 For immediate emergencies, please contact local emergency services (911, 112, or your local emergency number) or use the emergency alert button in the app.

If this is not a life-threatening emergency, I can help you with:
- Safety tips for your current location
- Emergency contact information
- General travel safety advice
- Guidance on using the safety features in this app

What specific safety concern can I assist you with?`
  }

  // Safety tips requests
  if (lowerMessage.includes("safe") || lowerMessage.includes("tip") || lowerMessage.includes("advice")) {
    return `Here are essential safety tips for tourists:

🔒 **Personal Security:**
- Keep valuables secure and avoid displaying expensive items
- Stay in well-lit, populated areas, especially at night
- Trust your instincts - if something feels wrong, leave the area

📱 **Communication:**
- Keep your phone charged and carry a backup power source
- Share your location with trusted contacts
- Save local emergency numbers in your phone

🗺️ **Location Awareness:**
- Research your destination beforehand
- Keep copies of important documents
- Know the location of your embassy or consulate

Is there a specific safety topic you'd like more information about?`
  }

  // Location-specific help
  if (lowerMessage.includes("location") || lowerMessage.includes("where") || lowerMessage.includes("area")) {
    return `For location-specific safety information:

📍 **Current Location Safety:**
- Check local news and safety alerts
- Ask your hotel/accommodation about area safety
- Use official transportation services
- Avoid isolated areas, especially after dark

🚨 **If you feel unsafe:**
- Move to a public, well-lit area immediately
- Contact local authorities if needed
- Use the emergency alert feature in this app
- Call a trusted contact to inform them of your situation

${context?.location ? `Based on your location context, I recommend staying aware of your surroundings and following local safety guidelines.` : "Share your location with the app for more specific safety recommendations."}`
  }

  // Medical help
  if (lowerMessage.includes("medical") || lowerMessage.includes("doctor") || lowerMessage.includes("hospital")) {
    return `🏥 **Medical Assistance:**

**For medical emergencies:** Call local emergency services immediately.

**For non-emergency medical needs:**
- Locate the nearest hospital or clinic
- Contact your travel insurance provider
- Keep a list of your medications and allergies
- Know basic medical phrases in the local language

**Preparation tips:**
- Carry a basic first aid kit
- Have emergency medical information easily accessible
- Know your blood type and any medical conditions
- Keep emergency contacts updated

Do you need help finding medical facilities in your area?`
  }

  // Default helpful response
  return `I'm your AI safety assistant! While I'm currently running in offline mode, I can still help you with:

🛡️ **Safety Guidance:**
- Personal security tips
- Emergency procedures
- Travel safety best practices
- Local safety awareness

🚨 **Emergency Support:**
- Emergency contact information
- How to use safety features in this app
- When and how to contact authorities

📱 **App Features:**
- How to send emergency alerts
- Location sharing with trusted contacts
- Safety check-in procedures

${context?.alertHistory?.length ? `I see you have ${context.alertHistory.length} alerts in your history. ` : ""}What specific safety topic can I help you with today?`
}

export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json()

    if (!message || typeof message !== "string") {
      return Response.json({ error: "Message is required" }, { status: 400 })
    }

    if (!hasGoogleAPIKey()) {
      console.log("[v0] No Google API key found, using intelligent fallback response")
      const response = getIntelligentResponse(message, context)
      return Response.json({ response })
    }

    const contextInfo = context
      ? `\nLocation: ${context.location || "Not specified"}\nRecent Alerts: ${context.alertHistory?.length || 0} alerts in history\nAlert Types: ${context.alertHistory?.map((a: any) => a.type).join(", ") || "None"}\n`
      : ""

    const { text } = await generateText({
      model: google("gemini-2.0-flash-exp"),
      prompt: `You are a helpful AI assistant for a tourist safety system. Provide helpful, accurate, and safety-focused advice to tourists.

${contextInfo}

Tourist Question: ${message}

Provide a helpful response that:
- Prioritizes tourist safety and well-being
- Gives practical, actionable advice
- Is friendly and reassuring
- Includes specific tips when relevant
- Mentions emergency contacts if the situation seems serious
- Uses the context information when relevant

Keep responses concise but comprehensive (2-4 paragraphs max).`,
      maxOutputTokens: 800,
      temperature: 0.7,
    })

    return Response.json({ response: text })
  } catch (error) {
    console.error("AI chat error:", error)

    const { message, context } = await req.json()
    const fallbackResponse = getIntelligentResponse(message, context)

    return Response.json({ response: fallbackResponse })
  }
}
