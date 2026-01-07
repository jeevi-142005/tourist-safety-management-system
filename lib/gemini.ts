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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `As a tourist safety expert, provide specific safety advice for a tourist in ${location} who is experiencing: ${situation}. 
    
    Please provide:
    1. Immediate safety recommendations
    2. Local emergency contacts if relevant
    3. Cultural considerations
    4. Prevention tips for similar situations
    
    Keep the response concise, practical, and actionable. Focus on tourist safety.`

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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `Analyze the travel risk for ${destination} on ${travelDate}. Consider:
    - Current safety conditions
    - Weather patterns
    - Local events or festivals
    - Political stability
    - Health considerations
    - Tourist-specific risks
    
    Provide a risk level (Low/Medium/High) and specific recommendations.`

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
