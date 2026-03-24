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

type GeocodeResult = {
  label: string
  lat: number
  lng: number
  type: string
  county?: string
  town?: string
}

async function nominatimSearch(query: string): Promise<GeocodeResult[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.searchParams.set("format", "jsonv2")
  url.searchParams.set("q", query)
  url.searchParams.set("countrycodes", "ke")
  url.searchParams.set("addressdetails", "1")
  url.searchParams.set("limit", "10")

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "areascore/1.0 (geocoding; contact: admin@areascore.ke)"
      },
      signal: controller.signal
    })

    if (!res.ok) return []
    const data = (await res.json()) as any[]
    if (!Array.isArray(data)) return []

    return data
      .map((item) => {
        const address = item.address || {}
        const town =
          address.city ||
          address.town ||
          address.village ||
          address.suburb ||
          address.neighbourhood ||
          address.hamlet ||
          address.road
        const county = address.county || address.state || address.region

        return {
          label: item.display_name || query,
          lat: Number(item.lat),
          lng: Number(item.lon),
          type: String(item.type || item.class || "place"),
          county: county ? String(county) : undefined,
          town: town ? String(town) : undefined
        } satisfies GeocodeResult
      })
      .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng))
  } catch {
    return []
  } finally {
    clearTimeout(timeout)
  }
}

function fallbackSearch(query: string): typeof fallbackLocations {
  const lowerQuery = query.toLowerCase()
  return fallbackLocations.filter((loc) =>
    loc.label.toLowerCase().includes(lowerQuery) ||
    loc.town?.toLowerCase().includes(lowerQuery) ||
    loc.county?.toLowerCase().includes(lowerQuery)
  )
}

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

    const trimmed = query.trim()
    const nominatimResults = await nominatimSearch(trimmed)
    if (nominatimResults.length > 0) {
      return NextResponse.json({ results: nominatimResults })
    }

    return NextResponse.json({ results: fallbackSearch(trimmed) })

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

    const trimmed = String(query).trim()
    const nominatimResults = await nominatimSearch(trimmed)
    if (nominatimResults.length > 0) {
      return NextResponse.json({ results: nominatimResults })
    }

    return NextResponse.json({ results: fallbackSearch(trimmed) })

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
