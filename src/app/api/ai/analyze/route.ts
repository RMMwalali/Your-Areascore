import { NextRequest, NextResponse } from 'next/server'

interface LocationData {
  name: string
  coordinates: { lat: number; lng: number }
  amenities?: any[]
  foursquarePlaces?: any[]
  floodRisk?: any
  realEstate?: any[]
  weather?: any
  newsData?: any
}

interface AISummary {
  overview: {
    name: string
    score: number
    verdict: string
    strength: string
    risk: string
  }
  categories: {
    safety: { score: number; explanation: string }
    floodResilience: { score: number; explanation: string }
    amenities: { score: number; explanation: string }
    economic: { score: number; explanation: string }
    other: { score: number; explanation: string }
  }
  insights: string[]
  recentNews: string[]
  pros: string[]
  cons: string[]
  recommendation: string
  dataFreshness: string
}

// AI service configuration - prioritize Mistral
const MISTRAL_API_URL = process.env.MISTRAL_API_URL || "https://api.mistral.ai/v1/chat/completions"
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY
const GROQ_API_URL = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions"
const GROQ_API_KEY = process.env.GROQ_API_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

function buildAnalysisPrompt(data: LocationData): string {
  const { name, coordinates, amenities, foursquarePlaces, floodRisk, realEstate, weather, newsData } = data
  
  const safeNumber = (v: any): number | null => {
    const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN
    return Number.isFinite(n) ? n : null
  }

  const isObject = (v: any): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v)

  const normalizedAmenities = Array.isArray(amenities) ? amenities : []
  const normalizedFoursquare = Array.isArray(foursquarePlaces) ? foursquarePlaces : []
  const normalizedRealEstate = Array.isArray(realEstate) ? realEstate : []
  const normalizedFloodRisk = isObject(floodRisk) ? floodRisk : Array.isArray(floodRisk) ? floodRisk[0] : null

  const weatherObj = isObject(weather) ? weather : null
  const tempCFromWeather = (() => {
    const t = safeNumber(weatherObj?.current?.temperature)
    if (t !== null) return t
    const kelvin = safeNumber(weatherObj?.main?.temp)
    if (kelvin !== null) return Math.round(kelvin - 273.15)
    return null
  })()

  const weatherCondition =
    (typeof weatherObj?.current?.conditions === 'string' && weatherObj.current.conditions) ||
    (typeof weatherObj?.weather?.[0]?.description === 'string' && weatherObj.weather[0].description) ||
    null

  const weatherHumidity = safeNumber(weatherObj?.current?.humidity) ?? safeNumber(weatherObj?.main?.humidity)

  const rentValues = normalizedRealEstate
    .map((p: any) => safeNumber(p?.rent) ?? safeNumber(p?.price) ?? safeNumber(p?.monthlyRent))
    .filter((v): v is number => typeof v === 'number')

  const avgRent = rentValues.length ? Math.round(rentValues.reduce((a, b) => a + b, 0) / rentValues.length) : null
  const minRent = rentValues.length ? Math.min(...rentValues) : null
  const maxRent = rentValues.length ? Math.max(...rentValues) : null

  const incidents = Array.isArray(newsData?.incidents) ? newsData.incidents : []

  // Build comprehensive context
  const context = {
    location: {
      name,
      coordinates: `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`
    },
    amenities: {
      count: normalizedAmenities.length,
      breakdown: normalizedAmenities
        .slice(0, 8)
        .map((a: any) => `${a?.name || 'Unnamed'} (${a?.category || a?.type || 'unknown'})`)
    },
    foursquare: {
      count: normalizedFoursquare.length,
      topRated: normalizedFoursquare
        .slice(0, 6)
        .map((p: any) => `${p?.name || 'Unknown'} (${p?.rating ?? p?.score ?? 'N/A'})`)
    },
    floodRisk: {
      risk: normalizedFloodRisk?.risk_level || normalizedFloodRisk?.riskLevel || 'Unknown',
      elevation: normalizedFloodRisk?.elevation ?? 'Unknown',
      drainage: normalizedFloodRisk?.drainage_quality || normalizedFloodRisk?.drainage || 'Unknown'
    },
    realEstate: {
      count: normalizedRealEstate.length,
      avgRent: avgRent ?? 'Unknown',
      priceRange: minRent !== null && maxRent !== null ? `${minRent.toLocaleString()} - ${maxRent.toLocaleString()}` : 'No data'
    },
    weather: {
      temp: tempCFromWeather !== null ? `${tempCFromWeather}°C` : 'Unknown',
      condition: weatherCondition || 'Unknown',
      humidity: weatherHumidity !== null ? `${weatherHumidity}%` : 'Unknown'
    },
    news: {
      totalArticles: newsData?.statistics?.totalArticles || 0,
      incidents: incidents.length,
      recentIncidents: newsData?.statistics?.recentIncidents || 0,
      topIncidents: incidents
        .slice(0, 5)
        .map((inc: any) => `${inc?.title || 'Incident'} (${inc?.source?.name || 'Unknown source'}, ${inc?.publishedAt ? new Date(inc.publishedAt).toLocaleDateString() : 'Unknown date'})`),
      categories: newsData?.statistics?.categories || {}
    }
  }

  return `Analyze this location for livability assessment:

LOCATION: ${context.location.name} (${context.location.coordinates})

AMENITIES DATA:
- Total amenities: ${context.amenities.count}
- Sample: ${context.amenities.breakdown.join(', ')}

FOURSQUARE PLACES:
- Total places: ${context.foursquare.count}
- Top rated: ${context.foursquare.topRated.join(', ')}

FLOOD RISK ASSESSMENT:
- Risk level: ${context.floodRisk.risk}
- Elevation: ${context.floodRisk.elevation}
- Drainage quality: ${context.floodRisk.drainage}

REAL ESTATE MARKET:
- Available properties: ${context.realEstate.count}
- Average rent: ${context.realEstate.avgRent.toLocaleString()} KSh/month
- Price range: ${context.realEstate.priceRange}

CURRENT WEATHER:
- Temperature: ${context.weather.temp}
- Conditions: ${context.weather.condition}
- Humidity: ${context.weather.humidity}

RECENT NEWS & INCIDENTS:
- Total news articles: ${context.news.totalArticles}
- Incidents reported: ${context.news.incidents}
- Recent incidents (last 3 days): ${context.news.recentIncidents}
- Top incidents: ${context.news.topIncidents.join('; ')}
- News categories: ${Object.entries(context.news.categories).map(([cat, count]) => `${cat}: ${count}`).join(', ')}

Generate a comprehensive livability analysis incorporating all data sources, especially recent news incidents that may affect safety, accessibility, or quality of life. Focus on providing actionable insights based on current conditions.`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('AI analyze request received:', body)
    
    const locationData: LocationData = body.lat && body.lng && body.locationName
      ? { name: body.locationName, coordinates: { lat: body.lat, lng: body.lng } }
      : (body as LocationData)
    
    console.log('Final location data for analysis:', locationData)

    let summary: AISummary

    if (MISTRAL_API_KEY) {
      try {
        summary = await callMistralAI(locationData)
        return NextResponse.json({ summary })
      } catch (error) {
        console.warn('Mistral AI call failed, falling back:', error)
      }
    }

    if (GROQ_API_KEY) {
      try {
        summary = await callGroqAI(locationData)
        return NextResponse.json({ summary })
      } catch (error) {
        console.warn('Groq AI call failed, falling back:', error)
      }
    }

    summary = generateTemplateSummary(locationData)
    console.log('Generated summary:', summary)
    
    return NextResponse.json({ summary })

  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Analysis failed', message: 'Unable to generate location summary', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

async function callMistralAI(data: LocationData): Promise<AISummary> {
  const prompt = buildAnalysisPrompt(data)
  
  const response = await fetch(MISTRAL_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistral-large-latest', // Best model for analysis
      messages: [
        {
          role: 'system',
          content: `You are an expert urban analyst specializing in Nairobi and Kenyan locations. Generate comprehensive, data-backed livability summaries following this EXACT structure:

Header / Overview (1–2 sentences)
Location name + overall score (e.g., 87/100)
Quick verdict (Excellent / Good with caveats / Average / Caution advised)
Key strength + main risk

Score Breakdown (visual card-style, bullets or small table)
List the 5 weighted categories with sub-scores (0–100)
Short 1-sentence explanation per category

Key Stats & Insights (bullets, 6–10 points)
Pull 2-3 facts per major category (crime trends, recent floods, rent range, amenity counts)
Include current context (e.g., ongoing heavy rains from KMD March 2026 alerts)
Add recent news incidents and their impact on livability

Recent News & Incidents (bullets, 3–5 points)
Summarize relevant recent news from the provided data
Focus on incidents affecting safety, accessibility, or quality of life
Include dates and sources where relevant
Note any patterns or emerging concerns

Pros & Cons (balanced bullets, 4-6 each)
Expand with more specific, actionable insights
Consider both immediate and long-term factors

Recommendation (detailed closing)
Who it's best for (families, young professionals, budget-conscious, etc.)
Specific watch-outs or tips based on current conditions
Alternative suggestions if this location isn't ideal
Seasonal considerations or timing advice

Data Freshness & Sources (tiny footer)
"Based on latest available data as of March 2026 (KMD, Numbeo, property listings, OSM amenities, recent news)"

CRITICAL REQUIREMENTS:
- Aim for 400–600 words total (expanded for comprehensive analysis)
- Use neutral, data-backed language with sources noted briefly
- Make it feel insightful and personalized with news integration
- Structure for quick reading on mobile (short paragraphs, bullets, bold highlights)
- Calculate weighted score: Safety 25%, Flood 20%, Amenities 25%, Economic 20%, Other 10%
- Be factual and balanced, especially with news incidents
- Return in JSON format with the exact structure provided
- Incorporate news data to drive conclusions and recommendations

Example format for "Karen, Nairobi":
Karen, Nairobi – Livability Score: 85/100
Verdict: Excellent upscale suburb – premium living with strong safety and green appeal, but high costs and minor seasonal risks.
Karen ranks among Nairobi's top residential areas for families and expats seeking tranquility, nature, and quality infrastructure. Recent news shows continued stability with minor traffic disruptions during peak hours.

Category Breakdown
Safety (25% weight): 90/100 – Low crime relative to Nairobi average (city Crime Index ~59/100 in 2026); high private security in estates; few reports of muggings or carjackings compared to Eastlands.
Flood Resilience (20% weight): 82/100 – Generally low risk due to higher ground and better drainage; some localized issues near tributaries (e.g., Kirichwa) during heavy rains, but not as severe as low-lying areas. Ongoing heavy rainfall advisory (March 2026 KMD: >20mm/24hrs possible until early March) – monitor low spots.
Amenities (25% weight): 88/100 – Excellent access within 1 km radius: international schools (Brookhouse), malls/supermarkets (e.g., Karen Square, The Hub), top hospitals/clinics, parks, and green spaces. Walkability good in core areas; matatu/car needed for CBD.
Economic Viability (20% weight): 68/100 – Premium pricing: average house rent ~KSh 260,000/month; 1-bed apartments ~KSh 50,000–90,000. High rental yields (6–9%) for investors, but less affordable for average earners. Strong property value growth expected in 2026.
Other Factors (10% weight): 90/100 – Clean air, abundant greenery, quiet vibe; traffic lighter than central Nairobi.

Key Insights
Crime perception much better than Nairobi overall (Numbeo 2026 data).
Flood risk elevated city-wide right now (KMD heavy rain alert peaking early March 2026) — Karen's elevation helps, but avoid riparian lowlands.
Amenities shine: elite schools, wildlife proximity, dining options from casual to fine.
Average family of 4 cost of living higher due to rents/utilities, but offset by lifestyle quality.
Recent trends: Some building safety concerns in Nairobi (e.g., collapses), but Karen estates generally well-regulated.
Property values showing 8-12% annual appreciation in premium segments.

Recent News & Incidents
• Traffic congestion on Ngong Road during rush hours (Daily Nation, March 5, 2026) - affects commute times to CBD
• Minor flooding reported near Karen Shopping Centre during heavy rains (Citizen TV, March 3, 2026) - drainage improvements planned
• New security patrol initiative launched by Karen Residents Association (Standard, March 1, 2026) - enhancing safety
• Power outage affecting 200+ homes last week due to maintenance (Kenya Power, Feb 28, 2026) - resolved within 6 hours

Pros
Peaceful, green, family-friendly environment with excellent air quality
Top-tier schools and healthcare facilities within 5km radius
Strong community engagement and active residents' association
Good investment potential with steady appreciation rates
Well-maintained infrastructure and reliable services
Low crime rates with effective private security networks

Cons
Expensive rents and property prices (not budget-friendly)
Longer commute to CBD (30–60+ min traffic)
Occasional flash flooding in heavier rains (though mitigated)
Limited public transport options compared to central areas
Higher cost of living for daily necessities and services
Some areas experience water rationing during dry seasons

Recommendation
Ideal for high-income families, expats, or remote workers prioritizing safety, nature, and quality over affordability/central access. Opt for gated communities with good drainage and backup water systems. Budget-conscious individuals should consider nearby Lavington or Kilimani for similar perks at lower cost. Best to visit during both dry and rainy seasons to assess personal tolerance for commute times and weather impacts.

Data refreshed March 2026 from KMD advisories, Numbeo, property sites (BuyRentKenya averages), OSM amenity counts, recent news analysis, and local reports.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    })
  })

  if (!response.ok) {
    throw new Error(`Mistral API error: ${response.status}`)
  }

  const aiResponse = await response.json()
  const summaryData = aiResponse.choices[0]?.message?.content

  if (!summaryData) {
    throw new Error('No response from Mistral')
  }

  // Parse JSON response
  const parsedSummary = JSON.parse(summaryData)
  
  // Extract structured data from the AI response
  const overviewText = parsedSummary.overview || `${data.name} – Livability Score: 75/100`
  const scoreMatch = overviewText.match(/(\d+)\/100/)
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 75
  
  const verdictMatch = overviewText.match(/Verdict: (.+?)\./)
  const verdict = verdictMatch ? verdictMatch[1] : 'Good with caveats'
  
  // Extract category breakdown
  const categories = parsedSummary.categories || {
    safety: { score: 75, explanation: 'Moderate safety levels' },
    floodResilience: { score: 75, explanation: 'Average flood risk' },
    amenities: { score: 75, explanation: 'Good access to services' },
    economic: { score: 75, explanation: 'Moderate cost of living' },
    other: { score: 75, explanation: 'Standard urban environment' }
  }
  
  return {
    overview: {
      name: data.name,
      score,
      verdict,
      strength: parsedSummary.strength || 'Decent amenities and accessibility',
      risk: parsedSummary.risk || 'Standard urban considerations'
    },
    categories,
    insights: parsedSummary.insights || ['Analysis based on available data'],
    recentNews: parsedSummary.recentNews || parsedSummary.news || ['No recent incidents reported'],
    pros: parsedSummary.pros || ['Urban convenience'],
    cons: parsedSummary.cons || ['Urban challenges'],
    recommendation: parsedSummary.recommendation || 'Suitable for urban dwellers.',
    dataFreshness: parsedSummary.dataFreshness || `Based on available data as of ${new Date().toLocaleDateString()}.`
  }
}

async function callGroqAI(data: LocationData): Promise<AISummary> {
  const prompt = buildAnalysisPrompt(data)
  
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama3-70b-8192',
      messages: [
        {
          role: 'system',
          content: `You are an expert urban analyst specializing in Nairobi and Kenyan locations. Generate concise, data-backed livability summaries following this EXACT structure:

Header / Overview (1–2 sentences)
Location name + overall score (e.g., 87/100)
Quick verdict (Excellent / Good with caveats / Average / Caution advised)
Key strength + main risk

Score Breakdown (visual card-style, bullets or small table)
List the 5 weighted categories with sub-scores (0–100)
Short 1-sentence explanation per category

Key Stats & Insights (bullets, 4–8 points)
Pull 2-3 facts per major category (crime trends, recent floods, rent range, amenity counts)
Include current context (e.g., ongoing heavy rains from KMD March 2026 alerts)

Pros & Cons (balanced bullets)
Recommendation (tailored closing)
Who it's best for (families, young professionals, budget-conscious, etc.)
Any watch-outs or tips (e.g., "Check gated communities for better security")

Data Freshness & Sources (tiny footer)
"Based on latest available data as of March 2026 (KMD, Numbeo, property listings, OSM amenities)"

CRITICAL REQUIREMENTS:
- Aim for 300–500 words total
- Use neutral, data-backed language with sources noted briefly
- Make it feel insightful and personalized
- Structure for quick reading on mobile (short paragraphs, bullets, bold highlights)
- Calculate weighted score: Safety 25%, Flood 20%, Amenities 25%, Economic 20%, Other 10%
- Be factual and balanced
- Return your response in the exact format shown in the example

Example format for "Karen, Nairobi":
Karen, Nairobi – Livability Score: 85/100
Verdict: Excellent upscale suburb – premium living with strong safety and green appeal, but high costs and minor seasonal risks.
Karen ranks among Nairobi's top residential areas for families and expats seeking tranquility, nature, and quality infrastructure. It benefits from higher elevation, gated estates, and proximity to attractions like Nairobi National Park and Giraffe Centre.

Category Breakdown
Safety (25% weight): 90/100 – Low crime relative to Nairobi average (city Crime Index ~59/100 in 2026); high private security in estates; few reports of muggings or carjackings compared to Eastlands.
Flood Resilience (20% weight): 82/100 – Generally low risk due to higher ground and better drainage; some localized issues near tributaries (e.g., Kirichwa) during heavy rains, but not as severe as low-lying areas. Ongoing heavy rainfall advisory (March 2026 KMD: >20mm/24hrs possible until early March) – monitor low spots.
Amenities (25% weight): 88/100 – Excellent access within 1 km radius: international schools (Brookhouse), malls/supermarkets (e.g., Karen Square, The Hub), top hospitals/clinics, parks, and green spaces. Walkability good in core areas; matatu/car needed for CBD.
Economic Viability (20% weight): 68/100 – Premium pricing: average house rent ~KSh 260,000/month; 1-bed apartments ~KSh 50,000–90,000. High rental yields (6–9%) for investors, but less affordable for average earners. Strong property value growth expected in 2026.
Other Factors (10% weight): 90/100 – Clean air, abundant greenery, quiet vibe; traffic lighter than central Nairobi.

Key Insights
Crime perception much better than Nairobi overall (Numbeo 2026 data).
Flood risk elevated city-wide right now (KMD heavy rain alert peaking early March 2026) — Karen's elevation helps, but avoid riparian lowlands.
Amenities shine: elite schools, wildlife proximity, dining options from casual to fine.
Average family of 4 cost of living higher due to rents/utilities, but offset by lifestyle quality.
Recent trends: Some building safety concerns in Nairobi (e.g., collapses), but Karen estates generally well-regulated.

Pros
Peaceful, green, family-friendly environment
Top-tier schools and healthcare nearby
Strong community feel in gated areas
Good investment potential

Cons
Expensive rents and property (not budget-friendly)
Longer commute to CBD (30–60+ min traffic)
Occasional flash flooding in heavier rains (though mitigated)

Recommendation
Ideal for high-income families, expats, or remote workers prioritizing safety, nature, and quality over affordability/central access. Opt for gated communities with good drainage. If budget is a concern, consider nearby Lavington or Kilimani for similar perks at lower cost.
Data refreshed March 2026 from KMD advisories, Numbeo, property sites (BuyRentKenya averages), OSM amenity counts, and local reports.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })
  })

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`)
  }

  const aiResponse = await response.json()
  const summaryText = aiResponse.choices[0]?.message?.content

  if (!summaryText) {
    throw new Error('No response from Groq')
  }
  
  // Parse the response (Groq may not return JSON, so we need to parse text)
  let overview = `${data.name} – Livability Score: 75/100`
  let verdict = 'Good with caveats'
  let score = 75
  
  // Try to extract score from the text
  const scoreMatch = summaryText.match(/(\d+)\/100/)
  if (scoreMatch) score = parseInt(scoreMatch[1])
  
  // Try to extract verdict
  const verdictMatch = summaryText.match(/Verdict: (.+?)\./)
  if (verdictMatch) verdict = verdictMatch[1]
  
  return {
    overview: {
      name: data.name,
      score,
      verdict,
      strength: 'Decent amenities and accessibility',
      risk: 'Standard urban considerations'
    },
    categories: {
      safety: { score: 75, explanation: 'Moderate safety levels' },
      floodResilience: { score: 75, explanation: 'Average flood risk' },
      amenities: { score: 75, explanation: 'Good access to services' },
      economic: { score: 75, explanation: 'Moderate cost of living' },
      other: { score: 75, explanation: 'Standard urban environment' }
    },
    insights: ['Analysis based on available data'],
    recentNews: ['Recent news analysis not available'],
    pros: ['Urban convenience'],
    cons: ['Urban challenges'],
    recommendation: 'Suitable for urban dwellers.',
    dataFreshness: `Based on available data as of ${new Date().toLocaleDateString()}.`
  }
}

function extractScore(text: string): number {
  const match = text.match(/(\d+)\/100/)
  return match ? parseInt(match[1]) : 75
}

function extractVerdict(text: string): string {
  const verdicts = ['Excellent', 'Good with caveats', 'Average', 'Caution advised']
  return verdicts.find(v => text.toLowerCase().includes(v.toLowerCase())) || 'Good'
}

function extractStrength(text: string): string {
  const lines = text.split('\n')
  for (const line of lines) {
    if (line.toLowerCase().includes('strength') || line.toLowerCase().includes('key strength')) {
      return line.split(':')[1]?.trim() || 'Strong amenities'
    }
  }
  return 'Good location features'
}

function extractRisk(text: string): string {
  const lines = text.split('\n')
  for (const line of lines) {
    if (line.toLowerCase().includes('risk') || line.toLowerCase().includes('main risk')) {
      return line.split(':')[1]?.trim() || 'Some concerns'
    }
  }
  return 'Minor considerations'
}

function extractCategory(text: string, category: string): { score: number; explanation: string } {
  const regex = new RegExp(`${category}.*?(\\d+)\\/100.*?\\n.*?\\n(.+?)\\n`, 'i')
  const match = text.match(regex)
  if (match) {
    return {
      score: parseInt(match[1]),
      explanation: match[2].trim()
    }
  }
  return { score: 75, explanation: 'Standard performance' }
}

function extractBullets(text: string, sectionNames: string[]): string[] {
  const bullets: string[] = []
  const lines = text.split('\n')
  let inSection = false
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase()
    if (sectionNames.some(name => lowerLine.includes(name))) {
      inSection = true
      continue
    }
    
    if (inSection && (line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().startsWith('*'))) {
      bullets.push(line.replace(/^[-•*]\s*/, '').trim())
    } else if (inSection && line.trim() === '') {
      inSection = false
    }
  }
  
  return bullets
}

function extractSection(text: string, sectionNames: string[]): string {
  const lines = text.split('\n')
  let inSection = false
  let section = ''
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase()
    if (sectionNames.some(name => lowerLine.includes(name))) {
      inSection = true
      continue
    }
    
    if (inSection) {
      if (line.trim() === '') break
      section += line + ' '
    }
  }
  
  return section.trim()
}

function generateTemplateSummary(data: LocationData): AISummary {
  const safeNumber = (v: any): number | null => {
    const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN
    return Number.isFinite(n) ? n : null
  }
  const isObject = (v: any): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v)

  const { name, amenities, foursquarePlaces, floodRisk, realEstate, weather, newsData } = data
  const amenitiesCount = Array.isArray(amenities) ? amenities.length : 0
  const foursquareCount = Array.isArray(foursquarePlaces) ? foursquarePlaces.length : 0
  const incidentsCount = Array.isArray(newsData?.incidents) ? newsData.incidents.length : 0
  const flood = isObject(floodRisk) ? floodRisk : Array.isArray(floodRisk) ? floodRisk[0] : null
  const floodLabel = flood?.risk_level || flood?.riskLevel || 'Unknown'

  const rentValues = (Array.isArray(realEstate) ? realEstate : [])
    .map((p: any) => safeNumber(p?.rent) ?? safeNumber(p?.price) ?? safeNumber(p?.monthlyRent))
    .filter((v): v is number => typeof v === 'number')
  const avgRent = rentValues.length ? Math.round(rentValues.reduce((a, b) => a + b, 0) / rentValues.length) : null

  const weatherObj = isObject(weather) ? weather : null
  const tempC = (() => {
    const t = safeNumber(weatherObj?.current?.temperature)
    if (t !== null) return t
    const kelvin = safeNumber(weatherObj?.main?.temp)
    if (kelvin !== null) return Math.round(kelvin - 273.15)
    return null
  })()

  const amenitiesScore = Math.max(40, Math.min(95, 45 + amenitiesCount * 2))
  const floodScore = floodLabel === 'High' ? 45 : floodLabel === 'Medium' ? 65 : floodLabel === 'Low' ? 80 : 70
  const economicScore = avgRent === null ? 70 : avgRent > 80000 ? 60 : avgRent > 40000 ? 72 : 78
  const safetyScore = incidentsCount > 3 ? 55 : incidentsCount > 0 ? 68 : 76
  const otherScore = foursquareCount > 20 ? 80 : foursquareCount > 5 ? 74 : 70

  const overallScore = Math.round(
    safetyScore * 0.25 +
    floodScore * 0.2 +
    amenitiesScore * 0.25 +
    economicScore * 0.2 +
    otherScore * 0.1
  )

  const verdict = overallScore >= 82 ? 'Excellent' : overallScore >= 70 ? 'Good with caveats' : overallScore >= 58 ? 'Average' : 'Caution advised'

  const strength = amenitiesCount > 10
    ? 'Good day-to-day convenience with a solid spread of nearby services'
    : 'Basic access to services, but the immediate area may feel sparse'

  const risk = floodLabel === 'High'
    ? 'Elevated flood risk — prioritize drainage, elevation and access roads'
    : incidentsCount > 0
      ? 'Recent incidents/news signals to watch — verify safety and access patterns'
      : 'Standard urban considerations — verify commute and neighborhood micro-safety'

  return {
    overview: {
      name,
      score: overallScore,
      verdict,
      strength,
      risk
    },
    categories: {
      safety: { score: safetyScore, explanation: incidentsCount > 0 ? `Recent incident signals: ${incidentsCount} incident(s) found in nearby news.` : 'No recent incidents surfaced in the available news feed.' },
      floodResilience: { score: floodScore, explanation: `Flood risk indicator: ${floodLabel}.` },
      amenities: { score: amenitiesScore, explanation: `Amenities observed: ${amenitiesCount} item(s) from OSM/amenities sources.` },
      economic: { score: economicScore, explanation: avgRent !== null ? `Indicative rent level based on nearby listings: ~KSh ${avgRent.toLocaleString()}/month.` : 'No reliable listing pricing returned; treat affordability as uncertain.' },
      other: { score: otherScore, explanation: tempC !== null ? `Current conditions ~${tempC}°C; local vibe inferred from nearby place density.` : 'Local vibe inferred from nearby place density.' }
    },
    insights: [
      `Amenities count: ${amenitiesCount}.`,
      `Foursquare places: ${foursquareCount}.`,
      `Flood risk indicator: ${floodLabel}.`,
      avgRent !== null ? `Typical rent signal: ~KSh ${avgRent.toLocaleString()}/month (listings sample).` : 'No rent sample available from listings feed.',
      tempC !== null ? `Weather snapshot: ~${tempC}°C (${weatherObj?.current?.conditions || weatherObj?.weather?.[0]?.description || 'conditions unknown'}).` : 'Weather snapshot unavailable.',
      incidentsCount > 0 ? `News/incidents: ${incidentsCount} recent item(s) surfaced — scan before committing.` : 'No recent incidents surfaced in the news feed.'
    ],
    recentNews: [
      ...(Array.isArray(newsData?.incidents)
        ? newsData.incidents.slice(0, 4).map((inc: any) => `${inc?.title || 'Incident'} (${inc?.source?.name || 'Unknown source'})`)
        : []),
      ...(incidentsCount === 0 ? ['No recent incidents surfaced in the available news feed.'] : [])
    ],
    pros: [
      amenitiesCount > 10 ? 'Good convenience: services and POIs are relatively dense.' : 'Some essential services appear nearby.',
      tempC !== null ? `Weather right now is around ${tempC}°C — helpful for day-to-day comfort planning.` : 'Weather data unavailable; plan for seasonal variability.',
      incidentsCount === 0 ? 'No recent incident signals surfaced in the news feed.' : 'News feed highlights active local issues to monitor.'
    ],
    cons: [
      floodLabel === 'High' ? 'Flood risk may affect access roads and property suitability during heavy rains.' : 'Flood risk unknown/variable; confirm drainage and road access.',
      avgRent !== null && avgRent > 80000 ? 'Higher rent signal — affordability may be a constraint.' : 'Affordability depends on micro-location and property type.',
      amenitiesCount < 6 ? 'Fewer nearby amenities in the immediate radius; you may rely on longer trips.' : 'Some amenities exist, but quality varies by facility.'
    ],
    recommendation: `If you're considering ${name}, treat this as a starting point: confirm road access, drainage and security patterns at the exact street/estate level. Use the amenity density to decide day-to-day convenience, and use the rent signal (if available) to validate affordability before committing.`,
    dataFreshness: `Based on available third-party data and API snapshots as of ${new Date().toLocaleDateString()}. Verification recommended.`
  }
}
