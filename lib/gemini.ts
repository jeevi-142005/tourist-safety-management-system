import { GoogleGenerativeAI } from "@google/generative-ai"

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

if (!apiKey) {
  console.error("GOOGLE_GENERATIVE_AI_API_KEY is not set in environment variables")
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

export async function generateSafetyAdvice(location: string, situation: string) {
  if (!genAI) {
    throw new Error("Google Generative AI is not configured. Please check your API key.")
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const prompt = `You are an expert tourist safety advisor. A tourist is currently in **${location}** and is experiencing the following situation: **${situation}**.

Generate a comprehensive, well-structured safety report in Markdown format with the following sections:

### Tourist Safety in [Location] — [Situation]

**1. Immediate Safety Recommendations:**
Provide 4–6 specific, actionable bullet points the tourist should do RIGHT NOW. Be highly specific to the location and situation.

**2. Local Emergency Contacts:**
List all relevant emergency numbers:
- All-in-One Emergency (112 for India)
- Police, Ambulance, Fire
- Location-specific helpline (e.g., Kodaikanal Police Station with actual number if known)
- Tourist helpline if applicable
- Nearest hospital or medical facility name

**3. Cultural Considerations:**
List 3–4 culturally specific behaviors, local driving habits, language tips, or social norms relevant to the location that could affect safety.

**4. Prevention Tips for Similar Situations:**
List 5–6 practical preventive steps the tourist should follow in the future to avoid or better handle this type of situation (packing tips, weather preparedness, informing others, etc.).

Use proper Markdown formatting: bold headings, bullet points, horizontal rules between sections. Make it detailed, professional, and genuinely useful. Do NOT truncate — write the full response.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error: any) {
    console.error("Error generating safety advice:", error)
    
    // Provide more specific error messages
    if (error.message?.includes("API_KEY_INVALID")) {
      throw new Error("Invalid Google Gemini API key. Please check your API key.")
    } else if (error.message?.includes("QUOTA_EXCEEDED")) {
      throw new Error("API quota exceeded. Please try again later.")
    } else {
      throw new Error(`Failed to generate safety advice: ${error.message || "Unknown error"}`)
    }
  }
}

export async function analyzeTravelRisk(destination: string, travelDate: string) {
  if (!genAI) {
    throw new Error("Google Generative AI is not configured. Please check your API key.")
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const prompt = `You are a professional travel risk analyst. Generate a detailed travel risk assessment report in Markdown format for a tourist planning to visit **${destination}** on **${travelDate}**.

Structure the report exactly as follows:

---

**Travel Risk Assessment: ${destination} — ${travelDate}**

**1. Current Safety Conditions (Projected for the travel date):**
Describe general security, crime rates, terrorism threat level, common risks for tourists.

**2. Weather Patterns (for the travel date):**
Describe seasonal weather, average temperatures, precipitation chance, any weather-related risks.

**3. Local Events or Festivals (Projected for that period):**
Describe known or likely local events, cultural festivals, sporting events, or public gatherings that may impact the travel experience (crowds, cost, transport).

**4. Political Stability (Projected for the travel date):**
Describe government stability, likelihood of protests or strikes, travel advisories.

**5. Health Considerations:**
Describe healthcare quality, required or recommended vaccinations, food/water safety, any known disease risks, COVID or endemic illness status.

**6. Tourist-Specific Risks:**
List the top risks unique to tourists: pickpocketing, scams, language barriers, transportation issues, over-tourism areas, etc.

---

**Overall Risk Level: [LOW / MEDIUM / HIGH]**

Justify the overall risk level with 2–3 sentences.

---

**Specific Recommendations:**
Provide 6–8 numbered, actionable recommendations for staying safe, organized by priority.

Use proper Markdown: bold headings, bullet points, horizontal rules. Be thorough, specific, and genuinely useful. Do NOT truncate — write the full detailed response.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error: any) {
    console.error("Error analyzing travel risk:", error)
    
    if (error.message?.includes("API_KEY_INVALID")) {
      throw new Error("Invalid Google Gemini API key. Please check your API key.")
    } else if (error.message?.includes("QUOTA_EXCEEDED")) {
      throw new Error("API quota exceeded. Please try again later.")
    } else {
      throw new Error(`Failed to analyze travel risk: ${error.message || "Unknown error"}`)
    }
  }
}

export async function analyzeDeviceMetricsForAnomalies(metrics: any, location: any) {
  if (!genAI) {
    throw new Error("Google Generative AI is not configured. Please check your API key.")
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const prompt = `Act as an AI Security Guardian for a tourist.
    Analyze the following real-time device and environmental metrics:
    Metrics: ${JSON.stringify(metrics, null, 2)}
    Location: ${JSON.stringify(location, null, 2)}

    Identify any potential security anomalies or risks.
    Return ONLY a valid JSON array of anomaly objects. Do not include markdown formatting like \`\`\`json.
    Each object must exactly match this structure:
    {
      "type": "behavioral" | "location" | "device" | "environmental" | "temporal",
      "severity": "low" | "medium" | "high" | "critical",
      "confidence": number (0.0 to 1.0),
      "description": "string describing the anomaly",
      "riskFactors": ["factor 1", "factor 2"],
      "recommendations": ["recommendation 1", "recommendation 2"]
    }

    If no anomalies are detected, return an empty array [].
    Ensure the response is strictly valid JSON.`

    const result = await model.generateContent(prompt)
    const responseText = await result.response.text()
    
    // Clean up potential markdown formatting
    const cleanedText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim()
    
    if (!cleanedText || cleanedText === '[]') {
      return []
    }
    
    return JSON.parse(cleanedText)
  } catch (error: any) {
    console.error("Error analyzing device metrics:", error)
    return [] // Return empty array on failure so it doesn't crash the app
  }
}
