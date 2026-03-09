import { NextRequest, NextResponse } from "next/server"

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 60
const RATE_WINDOW = 60000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW })
    return true
  }
  
  if (record.count >= RATE_LIMIT) {
    return false
  }
  
  record.count++
  return true
}

// Fallback locations for when geocoding fails
const fallbackLocations = [
  {
    label: "Nairobi, Kenya",
    lat: -1.2921,
    lng: 36.8219,
    type: "city",
    county: "Nairobi",
    town: "Nairobi"
  },
  {
    label: "Mombasa, Kenya",
    lat: -4.0435,
    lng: 39.6682,
    type: "city",
    county: "Mombasa",
    town: "Mombasa"
  },
  {
    label: "Kisumu, Kenya",
    lat: -0.0917,
    lng: 34.7680,
    type: "city",
    county: "Kisumu",
    town: "Kisumu"
  },
  {
    label: "Nakuru, Kenya",
    lat: -0.3031,
    lng: 36.0699,
    type: "city",
    county: "Nakuru",
    town: "Nakuru"
  },
  {
    label: "Eldoret, Kenya",
    lat: 0.5143,
    lng: 35.2694,
    type: "city",
    county: "Uasin Gishu",
    town: "Eldoret"
  }
]

export async function GET(request: NextRequest) {
  try {
    const ip = request.ip || 'unknown'
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      )
    }

    // Filter by query if provided
    if (query) {
      const lowerQuery = query.toLowerCase()
      const filteredLocations = fallbackLocations.filter(loc => 
        loc.label.toLowerCase().includes(lowerQuery) ||
        loc.town?.toLowerCase().includes(lowerQuery) ||
        loc.county?.toLowerCase().includes(lowerQuery)
      )
      return NextResponse.json({ results: filteredLocations })
    }

    return NextResponse.json({
      results: fallbackLocations
    })

  } catch (error) {
    console.error("Geocode error:", error)
    
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

export async function POST(request: NextRequest) {
  try {
    const ip = request.ip || 'unknown'
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      )
    }

    const { query } = await request.json()
    
    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      )
    }

    // Filter by query if provided
    if (query) {
      const lowerQuery = query.toLowerCase()
      const filteredLocations = fallbackLocations.filter(loc => 
        loc.label.toLowerCase().includes(lowerQuery) ||
        loc.town?.toLowerCase().includes(lowerQuery) ||
        loc.county?.toLowerCase().includes(lowerQuery)
      )
      return NextResponse.json({ results: filteredLocations })
    }

    return NextResponse.json({
      results: fallbackLocations
    })

  } catch (error) {
    console.error("Geocode error:", error)
    
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
