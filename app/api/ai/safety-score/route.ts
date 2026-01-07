import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    //p the AI Safety Score & Anomaly Detection system using Gemini AI:

<CodeProject id="touristsafetywebsite" taskNameActive="Building AI safety system" taskNameComplete="Built AI safety system">

\`\`\`typescript file="app/api/ai/safety-score/route.ts"
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function POST(request: NextRequest) {\
  try {\
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {\
        cookies: {\
          get(name: string) {\
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
\
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {\
      return NextResponse.json({ error: 'Unauthorized\' }, { status: 401 });
    }

    // Get user's location history\
    const { data: locationHistory } = await supabase
      .from('location_tracks')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp\', { ascending: false })
      .limit(100);

    // Get user's alert history\
    const { data: alertHistory } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at\', { ascending: false })
      .limit(50);

    // Get geo zones for context\
    const { data: geoZones } = await supabase
      .from('geo_zones')
      .select('*');

    // Prepare data for AI analysis
    const analysisData = {\
      locationHistory: locationHistory?.slice(0, 20) || [],
      alertHistory: alertHistory?.slice(0, 10) || [],
      geoZones: geoZones || [],
      timeframe: '7 days'
    };

    // Use Gemini AI to calculate safety score\
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `
    Analyze the following tourist safety data and calculate a safety score (0-100) with detailed reasoning:

    Location History (last 20 points):
    ${JSON.stringify(analysisData.locationHistory, null, 2)}

    Alert History (last 10 alerts):
    ${JSON.stringify(analysisData.alertHistory, null, 2)}

    Geo Zones (risk areas):
    ${JSON.stringify(analysisData.geoZones, null, 2)}

    Please analyze:
    1. Travel patterns and route safety
    2. Time spent in high-risk areas
    3. Frequency of alerts and incidents
    4. Adherence to planned routes
    5. Overall risk exposure

    Return a JSON response with:
    {\
      "safetyScore\": number (0-100),
      "riskLevel": "low" | "medium" | "high" | "critical",
      "factors": {\
        "routeSafety\": number,
        "riskExposure": number,
        "alertFrequency": number,
        "behaviorPattern": number
      },
      "recommendations": [string array],
      "summary": "detailed explanation"
    }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();

    // Parse AI response
    let aiAnalysis;
    try {\
      aiAnalysis = JSON.parse(analysisText);
    } catch (error) {
      // Fallback calculation if AI response is not valid JSON\
      aiAnalysis = calculateFallbackSafetyScore(analysisData);
    }

    // Store safety score in database\
    const { data: safetyScore, error } = await supabase
      .from('safety_scores')
      .insert({\
        user_id: user.id,
        score: aiAnalysis.safetyScore,
        factors: aiAnalysis.factors
      })
      .select()
      .single();

    if (error) {\
      console.error('Safety score storage error:\', error);
    }

    return NextResponse.json({\
      safetyScore: aiAnalysis.safetyScore,
      riskLevel: aiAnalysis.riskLevel,
      factors: aiAnalysis.factors,
      recommendations: aiAnalysis.recommendations,
      summary: aiAnalysis.summary,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {\
    console.error('Safety score calculation error:\', error);\
    return NextResponse.json({ error: 'Failed to calculate safety score\' }, { status: 500 });
  }
}

function calculateFallbackSafetyScore(data: any) {
  let baseScore = 100;
  
  // Reduce score based on alerts
  const alertPenalty = Math.min(data.alertHistory.length * 5, 30);
  baseScore -= alertPenalty;
  
  // Reduce score based on high-risk area visits
  const highRiskVisits = data.locationHistory.filter((loc: any) => 
    data.geoZones.some((zone: any) => zone.zone_type === 'high_risk')
  ).length;
  const riskPenalty = Math.min(highRiskVisits * 2, 20);
  baseScore -= riskPenalty;
  
  const finalScore = Math.max(0, baseScore);
  
  return {
    safetyScore: finalScore,
    riskLevel: finalScore > 80 ? 'low' : finalScore > 60 ? 'medium' : finalScore > 40 ? 'high' : 'critical',
    factors: {
      routeSafety: Math.max(0, 100 - riskPenalty),
      riskExposure: Math.max(0, 100 - riskPenalty * 2),
      alertFrequency: Math.max(0, 100 - alertPenalty),
      behaviorPattern: 75
    },
    recommendations: [
      'Avoid high-risk areas when possible',
      'Keep emergency contacts updated',
      'Follow planned routes'
    ],
    summary: 'Safety score calculated based on location history and alert patterns.'
  };
}
