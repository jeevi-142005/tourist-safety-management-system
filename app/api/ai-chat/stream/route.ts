import { google } from "@ai-sdk/google"
import { streamText, convertToModelMessages } from "ai"
import type { NextRequest } from "next/server"

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response("Messages array is required", { status: 400 })
    }

    const contextInfo = context
      ? `
Location: ${context.location || "Not specified"}
Recent Alerts: ${context.alertHistory?.length || 0} alerts in history
Alert Types: ${context.alertHistory?.map((a: any) => a.type).join(", ") || "None"}
`
      : ""

    const systemPrompt = `You are a helpful AI assistant for a tourist safety system. Provide helpful, accurate, and safety-focused advice to tourists.

${contextInfo}

Provide responses that:
- Prioritize tourist safety and well-being
- Give practical, actionable advice
- Are friendly and reassuring
- Include specific tips when relevant
- Mention emergency contacts if the situation seems serious
- Use the context information when relevant

Keep responses concise but comprehensive (2-4 paragraphs max).`

    const result = streamText({
      model: google("gemini-2.0-flash-exp"),
      messages: [{ role: "system", content: systemPrompt }, ...convertToModelMessages(messages)],
      maxOutputTokens: 800,
      temperature: 0.7,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("AI streaming error:", error)

    return new Response("AI service temporarily unavailable. Please try again later.", {
      status: 500,
    })
  }
}
