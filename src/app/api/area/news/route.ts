import { NextRequest, NextResponse } from "next/server"

const NEWS_API_KEY = process.env.NEWS_API_KEY
const NEWS_API_URL = process.env.NEWS_API_URL || "https://newsapi.org/v2/everything"

interface NewsArticle {
  title: string
  description: string
  url: string
  publishedAt: string
  source: {
    name: string
  }
  content?: string
}

// Keywords for location-based news analysis
const INCIDENT_KEYWORDS = [
  'crime', 'robbery', 'theft', 'burglary', 'assault', 'violence', 'shooting',
  'flood', 'flooding', 'rain', 'storm', 'weather', 'disaster', 'emergency',
  'traffic', 'accident', 'road', 'construction', 'closure', 'strike',
  'protest', 'demonstration', 'unrest', 'security', 'police',
  'fire', 'safety', 'hazard', 'evacuation', 'power', 'outage'
]

export async function POST(request: NextRequest) {
  try {
    const { locationName, lat, lng, radius = 50 } = await request.json()

    if (!locationName || !lat || !lng) {
      return NextResponse.json(
        { error: "Location name, latitude, and longitude are required" },
        { status: 400 }
      )
    }

    if (!NEWS_API_KEY) {
      console.warn("News API key not configured, returning empty results")
      return NextResponse.json({
        articles: [],
        incidents: [],
        statistics: { totalArticles: 0, incidents: 0, recentIncidents: 0, categories: {}, sources: {} },
        searchParams: { locationName, lat, lng, radius },
        lastUpdated: new Date().toISOString()
      })
    }

    // Build search query for location-based news
    const searchQueries = [
      locationName,
      `${lat.toFixed(2)},${lng.toFixed(2)}`,
      `within ${radius}km of ${locationName}`,
      ...INCIDENT_KEYWORDS.slice(0, 5) // Add top incident keywords
    ].join(' OR ')

    const url = new URL(NEWS_API_URL)
    url.searchParams.append('q', searchQueries)
    url.searchParams.append('language', 'en')
    url.searchParams.append('sortBy', 'publishedAt')
    url.searchParams.append('pageSize', '20')
    url.searchParams.append('from', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days

    console.log(`Fetching news for: ${locationName} (${lat}, ${lng})`)
    console.log(`News API URL: ${url.toString()}`)

    const response = await fetch(url.toString(), {
      headers: {
        'X-API-Key': NEWS_API_KEY,
        'Accept': 'application/json',
        'User-Agent': 'AreaScore/1.0'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("News API error response:", errorText)
      
      if (response.status === 401) {
        console.warn("News API key invalid or expired, using fallback")
        return NextResponse.json({
          articles: [],
          incidents: [],
          statistics: { totalArticles: 0, incidents: 0, recentIncidents: 0, categories: {}, sources: {} },
          searchParams: { locationName, lat, lng, radius },
          lastUpdated: new Date().toISOString()
        })
      }
      
      throw new Error(`News API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    const articles: NewsArticle[] = data.articles || []

    // Filter for incidents and recent news
    const incidents = articles.filter(article => {
      const text = (article.title + ' ' + (article.description || '')).toLowerCase()
      return INCIDENT_KEYWORDS.some(keyword => text.includes(keyword))
    })

    // Process and categorize articles
    const processedArticles = articles.map(article => ({
      title: article.title,
      description: article.description || '',
      url: article.url,
      publishedAt: article.publishedAt,
      source: article.source.name,
      category: categorizeArticle(article),
      isIncident: INCIDENT_KEYWORDS.some(keyword => 
        (article.title + ' ' + (article.description || '')).toLowerCase().includes(keyword)
      )
    }))

    const stats = {
      totalArticles: articles.length,
      incidentCount: incidents.length,
      recentIncidents: incidents.filter(inc => 
        new Date(inc.publishedAt) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      ).length,
      categories: getCategoryCounts(processedArticles),
      sources: getSourceCounts(articles)
    }

    return NextResponse.json({
      articles: processedArticles,
      incidents: incidents.slice(0, 5), // Top 5 incidents
      statistics: stats,
      searchParams: { locationName, lat, lng, radius },
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error("News API error:", error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

function categorizeArticle(article: NewsArticle): string {
  const text = (article.title + ' ' + (article.description || '')).toLowerCase()
  
  if (text.includes('crime') || text.includes('robbery') || text.includes('theft') || text.includes('assault')) {
    return 'Crime'
  }
  if (text.includes('flood') || text.includes('rain') || text.includes('storm') || text.includes('weather')) {
    return 'Weather'
  }
  if (text.includes('traffic') || text.includes('accident') || text.includes('road') || text.includes('construction')) {
    return 'Transportation'
  }
  if (text.includes('protest') || text.includes('demonstration') || text.includes('unrest')) {
    return 'Civil Unrest'
  }
  if (text.includes('fire') || text.includes('safety') || text.includes('emergency')) {
    return 'Safety'
  }
  if (text.includes('police') || text.includes('security')) {
    return 'Security'
  }
  if (text.includes('power') || text.includes('outage') || text.includes('electricity')) {
    return 'Utilities'
  }
  
  return 'General'
}

function getCategoryCounts(articles: any[]): Record<string, number> {
  const counts: Record<string, number> = {}
  articles.forEach(article => {
    const category = article.category || 'General'
    counts[category] = (counts[category] || 0) + 1
  })
  return counts
}

function getSourceCounts(articles: NewsArticle[]): Record<string, number> {
  const counts: Record<string, number> = {}
  articles.forEach(article => {
    const source = article.source?.name || 'Unknown'
    counts[source] = (counts[source] || 0) + 1
  })
  return counts
}
