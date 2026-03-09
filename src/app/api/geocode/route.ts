import { NextRequest, NextResponse } from "next/server"
import { geocode } from "@/lib/geocode"

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

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown"
  
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }
  
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")
  
  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      { error: "Query parameter q is required (min 2 characters)" },
      { status: 400 }
    )
  }
  
  try {
    const results = await geocode(query)
    
    return NextResponse.json({
      results: results.map(r => ({
        label: r.label,
        lat: r.lat,
        lng: r.lng,
        type: r.type,
        county: r.county,
        town: r.town,
        bbox: r.bbox
      }))
    })
  } catch (error) {
    console.error("Geocode error:", error)
    return NextResponse.json(
      { error: "Failed to geocode address" },
      { status: 500 }
    )
  }
}

