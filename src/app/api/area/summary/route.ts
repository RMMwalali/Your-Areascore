import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { encodeGeohash, calculateDistance, radiusToBBox } from "@/lib/utils"
import { 
  buildOverpassBBOXQuery, 
  buildOverpassRoadsQuery,
  queryOverpass, 
  processOverpassResponse 
} from "@/lib/overpass"
import { AreaSummary, CategoryCount, NearestItem, Place } from "@/types"

export const dynamic = "force-dynamic"

const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS || "86400", 10)
const DEFAULT_RADII = [1000, 2000]
const SUMMARY_CATEGORIES = [
  "school", "hospital", "clinic", "pharmacy", 
  "supermarket", "market", "bus_stop"
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get("lat") || "")
    const lng = parseFloat(searchParams.get("lng") || "")
    const radiiParam = searchParams.get("radii")
    
    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: "Valid lat and lng parameters are required" },
        { status: 400 }
      )
    }

    const radii = radiiParam 
      ? radiiParam.split(",").map(r => parseInt(r, 10)).filter(r => !isNaN(r))
      : DEFAULT_RADII

    try {
      const summary = await getAreaSummary(lat, lng, radii)
      return NextResponse.json(summary)
    } catch (error) {
      console.error("Area summary error:", error)
      return NextResponse.json(
        { error: "Failed to generate area summary" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("API route error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

async function getAreaSummary(lat: number, lng: number, radii: number[]): Promise<AreaSummary> {
  const maxRadius = Math.max(...radii)
  const geohash = encodeGeohash(lat, lng, 7)
  
  const cached = await prisma.areaCache.findUnique({
    where: { geohash_radiusM: { geohash, radiusM: maxRadius } }
  })

  const now = new Date()

  if (cached && cached.expiresAt > now) {
    try {
      // Validate cached data structure
      const computed = cached.computed as any
      if (!computed || typeof computed !== 'object') {
        throw new Error('Invalid cached computed data')
      }

      const counts = Array.isArray(computed.counts) ? computed.counts : []
      const nearestItems = typeof computed.nearestItems === 'object' ? computed.nearestItems : {}
      const roads = computed.roads || null

      return {
        center: { lat, lng },
        radius: maxRadius,
        counts: counts as CategoryCount[],
        nearestItems: nearestItems as Record<string, NearestItem[]>,
        roads: roads as any,
        sources: cached.sourcesUsed as any,
        attribution: ["OpenStreetMap contributors"],
        cached: true,
        expiresAt: cached.expiresAt.toISOString()
      }
    } catch (error) {
      console.warn('Invalid cached data, fetching fresh:', error)
      // Continue to fetch fresh data
    }
  }

  const bbox = radiusToBBox(lat, lng, maxRadius)
  
  const poiQuery = buildOverpassBBOXQuery(
    bbox.minLat, bbox.minLng, bbox.maxLat, bbox.maxLng,
    SUMMARY_CATEGORIES
  )
  
  const roadsQuery = buildOverpassRoadsQuery(
    bbox.minLat, bbox.minLng, bbox.maxLat, bbox.maxLng
  )

  const [poiResponse, roadsResponse] = await Promise.allSettled([
    queryOverpass(poiQuery),
    queryOverpass(roadsQuery)
  ])

  let places: any[] = []
  let roads: any[] = []

  if (poiResponse.status === 'fulfilled' && poiResponse.value) {
    places = processOverpassResponse(poiResponse.value)
  } else {
    console.warn('POI query failed, using empty data')
  }

  if (roadsResponse.status === 'fulfilled' && roadsResponse.value) {
    roads = processOverpassResponse(roadsResponse.value)
  } else {
    console.warn('Roads query failed, using empty data')
  }

  const counts: CategoryCount[] = []
  const nearestItems: Record<string, NearestItem[]> = {}

  for (const category of SUMMARY_CATEGORIES) {
    const categoryPlaces = places.filter(p => p.category === category)
    const count = categoryPlaces.length
    counts.push({ category, count })

    const withDistance: { place: Place; distance: number }[] = categoryPlaces.map(p => ({
      place: { ...p, id: p.sourceId } as Place,
      distance: calculateDistance(lat, lng, p.lat, p.lng)
    }))
    
    withDistance.sort((a, b) => a.distance - b.distance)
    nearestItems[category] = withDistance.slice(0, 5).map(wd => ({
      place: { ...wd.place, distance: wd.distance },
      distance: wd.distance
    }))
  }

  const roadsWithDistance = roads.map(r => ({
    name: r.name || "Unnamed Road",
    type: r.subcategory || "road",
    distance: calculateDistance(lat, lng, r.lat, r.lng)
  })).sort((a, b) => a.distance - b.distance)

  const roadStats = {
    nearestRoads: roadsWithDistance.slice(0, 5),
    accessQuality: determineAccessQuality(roadsWithDistance[0]?.distance || Infinity)
  }

  const expiresAt = new Date(Date.now() + CACHE_TTL * 1000)
  
  await prisma.areaCache.upsert({
    where: { geohash_radiusM: { geohash, radiusM: maxRadius } },
    update: {
      computed: {
        counts: counts as any,
        nearestItems: nearestItems as any,
        roads: roadStats as any
      },
      sourcesUsed: { overpass: true, google: false, foursquare: false },
      expiresAt,
      updatedAt: now
    },
    create: {
      geohash,
      radiusM: maxRadius,
      centerLat: lat,
      centerLng: lng,
      computed: {
        counts: counts as any,
        nearestItems: nearestItems as any,
        roads: roadStats as any
      },
      sourcesUsed: { overpass: true, google: false, foursquare: false },
      expiresAt,
      createdAt: now,
      updatedAt: now
    }
  })

  // Validate and return fresh data
  const validCounts = Array.isArray(counts) ? counts : []
  const validNearestItems = typeof nearestItems === 'object' ? nearestItems : {}
  const validRoads = roadStats || null

  return {
    center: { lat, lng },
    radius: maxRadius,
    counts: validCounts,
    nearestItems: validNearestItems,
    roads: validRoads,
    sources: { overpass: true, google: false, foursquare: false },
    attribution: ["OpenStreetMap contributors"],
    cached: false,
    expiresAt: expiresAt.toISOString()
  }
}

// Fallback function for when everything fails
function getFallbackSummary(lat: number, lng: number, maxRadius: number): AreaSummary {
  return {
    center: { lat, lng },
    radius: maxRadius,
    counts: [],
    nearestItems: {},
    roads: undefined,
    sources: { overpass: false, google: false, foursquare: false },
    attribution: ["OpenStreetMap contributors"],
    cached: false
  }
}

function determineAccessQuality(nearestRoadDistance: number): "excellent" | "good" | "fair" | "poor" {
  if (nearestRoadDistance < 500) return "excellent"
  if (nearestRoadDistance < 1000) return "good"
  if (nearestRoadDistance < 2000) return "fair"
  return "poor"
}

