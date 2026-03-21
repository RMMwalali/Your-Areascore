import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { encodeGeohash, calculateDistance, radiusToBBox } from "@/lib/utils"
import { 
  buildOverpassBBOXQuery, 
  buildOverpassRoadsQuery,
  queryOverpass, 
  processOverpassResponse 
} from "@/lib/overpass"

const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS || "86400", 10)
const DEFAULT_RADIUS = 5000
const SUMMARY_CATEGORIES = [
  "school", "hospital", "clinic", "pharmacy", 
  "supermarket", "market", "bus_stop", "bus_station"
]

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { searchParams } = new URL(request.url)
  const radius = parseInt(searchParams.get("radius") || String(DEFAULT_RADIUS), 10)

  try {
    const listing = await prisma.listing.findUnique({
      where: { slug: params.slug, status: "PUBLISHED" },
      select: { lat: true, lng: true }
    })

    if (!listing || !listing.lat || !listing.lng) {
      return NextResponse.json(
        { error: "Listing not found or has no coordinates" },
        { status: 404 }
      )
    }

    const geohash = encodeGeohash(listing.lat, listing.lng, 7)
    const cached = await prisma.areaCache.findUnique({
      where: { geohash_radiusM: { geohash, radiusM: radius } }
    })

    const now = new Date()

    if (cached && cached.expiresAt > now) {
      const computed =
        cached.computed && typeof cached.computed === "object" && !Array.isArray(cached.computed)
          ? (cached.computed as Record<string, unknown>)
          : {}

      return NextResponse.json({
        ...computed,
        cached: true,
        expiresAt: cached.expiresAt.toISOString()
      })
    }

    const bbox = radiusToBBox(listing.lat, listing.lng, radius)
    
    const poiQuery = buildOverpassBBOXQuery(
      bbox.minLat, bbox.minLng, bbox.maxLat, bbox.maxLng,
      SUMMARY_CATEGORIES
    )
    
    const roadsQuery = buildOverpassRoadsQuery(
      bbox.minLat, bbox.minLng, bbox.maxLat, bbox.maxLng
    )

    const [poiResponse, roadsResponse] = await Promise.all([
      queryOverpass(poiQuery),
      queryOverpass(roadsQuery)
    ])

    const places = processOverpassResponse(poiResponse)
    const roads = processOverpassResponse(roadsResponse)

    const counts = SUMMARY_CATEGORIES.map(category => ({
      category,
      count: places.filter(p => p.category === category).length
    }))

    const nearestItems: Record<string, any[]> = {}
    for (const category of SUMMARY_CATEGORIES) {
      const categoryPlaces = places.filter(p => p.category === category)
      const withDistance = categoryPlaces.map(p => ({
        place: { ...p, id: p.sourceId },
        distance: calculateDistance(listing.lat!, listing.lng!, p.lat, p.lng)
      }))
      withDistance.sort((a, b) => a.distance - b.distance)
      nearestItems[category] = withDistance.slice(0, 5)
    }

    const roadsWithDistance = roads.map(r => ({
      name: r.name || "Unnamed Road",
      type: r.subcategory || "road",
      distance: calculateDistance(listing.lat!, listing.lng!, r.lat, r.lng)
    })).sort((a, b) => a.distance - b.distance)

    const roadStats = {
      nearestRoads: roadsWithDistance.slice(0, 5),
      accessQuality: roadsWithDistance[0]?.distance < 500 ? "excellent" :
                     roadsWithDistance[0]?.distance < 1000 ? "good" :
                     roadsWithDistance[0]?.distance < 2000 ? "fair" : "poor"
    }

    const result = {
      counts,
      nearestItems,
      roads: roadStats,
      sources: { overpass: true, google: false, foursquare: false },
      attribution: ["OpenStreetMap contributors"]
    }

    const expiresAt = new Date(Date.now() + CACHE_TTL * 1000)
    
    await prisma.areaCache.upsert({
      where: { geohash_radiusM: { geohash, radiusM: radius } },
      update: {
        computed: result,
        sourcesUsed: { overpass: true, google: false, foursquare: false },
        expiresAt,
        updatedAt: now
      },
      create: {
        geohash,
        radiusM: radius,
        centerLat: listing.lat,
        centerLng: listing.lng,
        computed: result,
        sourcesUsed: { overpass: true, google: false, foursquare: false },
        expiresAt,
        createdAt: now,
        updatedAt: now
      }
    })

    return NextResponse.json({
      ...result,
      cached: false,
      expiresAt: expiresAt.toISOString()
    })
  } catch (error) {
    console.error("Nearby amenities error:", error)
    return NextResponse.json(
      { error: "Failed to fetch nearby amenities" },
      { status: 500 }
    )
  }
}
