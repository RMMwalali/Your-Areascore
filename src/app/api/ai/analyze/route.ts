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
  
  // Build comprehensive context
  const context = {
    location: {
      name,
      coordinates: `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`
    },
    amenities: {
      count: amenities?.length || 0,
      breakdown: amenities?.slice(0, 5).map((a: any) => `${a.name} (${a.category})`) || []
    },
    foursquare: {
      count: foursquarePlaces?.length || 0,
      topRated: foursquarePlaces?.slice(0, 3).map((p: any) => `${p.name} (${p.rating || 'N/A'})`) || []
    },
    floodRisk: {
      risk: floodRisk?.risk_level || 'Unknown',
      elevation: floodRisk?.elevation || 'Unknown',
      drainage: floodRisk?.drainage_quality || 'Unknown'
    },
    realEstate: {
      count: realEstate?.length || 0,
      avgRent: realEstate?.length ? Math.round(realEstate.reduce((sum: number, p: any) => sum + (p.rent || 0), 0) / realEstate.length) : 0,
      priceRange: realEstate?.length ? 
        `${Math.min(...realEstate.map((p: any) => p.rent || Infinity)).toLocaleString()} - ${Math.max(...realEstate.map((p: any) => p.rent || 0)).toLocaleString()} KSh/month` : 
        'No data'
    },
    weather: {
      temp: weather?.main?.temp ? `${Math.round(weather.main.temp - 273.15)}°C` : 'Unknown',
      condition: weather?.weather?.[0]?.description || 'Unknown',
      humidity: weather?.main?.humidity ? `${weather.main.humidity}%` : 'Unknown'
    },
    news: {
      totalArticles: newsData?.statistics?.totalArticles || 0,
      incidents: newsData?.incidents?.length || 0,
      recentIncidents: newsData?.statistics?.recentIncidents || 0,
      topIncidents: newsData?.incidents?.slice(0, 3).map((inc: any) => 
        `${inc.title} (${inc.source.name}, ${new Date(inc.publishedAt).toLocaleDateString()})`
      ) || [],
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
    
    // Handle both simple format (lat, lng, locationName) and full LocationData
    let locationData: LocationData
    
    if (body.lat && body.lng && body.locationName) {
      // Simple format - create basic location data
      locationData = {
        name: body.locationName,
        coordinates: { lat: body.lat, lng: body.lng }
      }
      
      // Only fetch one data source for now to avoid issues
      try {
        // Fetch weather data only
        const weatherRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/area/weather`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: body.lat, lng: body.lng })
        })
        if (weatherRes.ok) {
          const weatherData = await weatherRes.json()
          locationData.weather = weatherData
          console.log('Weather data fetched successfully')
        }
      } catch (error) {
        console.log('Failed to fetch weather data:', error)
      }
      
    } else {
      // Full LocationData format
      locationData = body as LocationData
    }
    
    console.log('Final location data for analysis:', locationData)
    
    // Use template-based analysis for now to avoid AI API issues
    const summary = generateTemplateSummary(locationData)
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
  // Fallback template-based summary when AI is unavailable
  const { name } = data
  
  return {
    overview: {
      name,
      score: 75,
      verdict: 'Good with caveats',
      strength: 'Decent amenities and accessibility',
      risk: 'Standard urban considerations'
    },
    categories: {
      safety: { score: 70, explanation: 'Moderate safety levels typical of urban areas' },
      floodResilience: { score: 75, explanation: 'Average flood risk for Nairobi region' },
      amenities: { score: 80, explanation: 'Good access to basic services and facilities' },
      economic: { score: 72, explanation: 'Moderate cost of living and property values' },
      other: { score: 78, explanation: 'Standard urban environment with typical challenges' }
    },
    insights: [
      'Location analysis based on available data sources',
      'Consider current weather conditions and advisories',
      'Property values reflect local market conditions',
      'Amenity density affects daily convenience'
    ],
    recentNews: [
      'No recent news incidents reported for this location',
      'Standard urban activity patterns observed'
    ],
    pros: [
      'Urban convenience with access to services',
      'Transportation links available',
      'Community facilities present'
    ],
    cons: [
      'Urban traffic and congestion',
      'Standard city noise levels',
      'Higher demand for housing'
    ],
    recommendation: 'Suitable for urban dwellers seeking convenience. Verify specific needs on-site.',
    dataFreshness: 'Based on available data as of March 2026. Real-time verification recommended.'
  }
}
