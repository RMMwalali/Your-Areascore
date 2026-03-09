import { NextRequest, NextResponse } from "next/server"
import { buildOverpassBBOXQuery, queryOverpass } from "@/lib/overpass"

const AMENITY_CATEGORIES = [
  // Education
  "school", "university", "college", "kindergarten", "library",
  
  // Healthcare
  "hospital", "clinic", "pharmacy", "doctors", "dentist", "veterinary",
  
  // Shopping & Services
  "supermarket", "market", "mall", "convenience", "grocery", "butcher", "bakery",
  "bank", "atm", "post_office", "money_transfer",
  
  // Transportation
  "bus_stop", "bus_station", "taxi", "fuel", "parking", "car_rental", "bicycle_rental",
  
  // Food & Entertainment
  "restaurant", "cafe", "fast_food", "bar", "pub", "cinema", "theatre", "nightclub",
  
  // Professional Services
  "lawyer", "accountant", "insurance", "real_estate", "coworking_space",
  
  // Government & Community
  "townhall", "police", "fire_station", "courthouse", "community_centre", "place_of_worship",
  
  // Recreation & Fitness
  "gym", "fitness_centre", "swimming_pool", "sports_centre", "park", "playground", "pitch",
  
  // Utilities & Infrastructure
  "telephone", "internet_cafe", "public_building", "toilets", "drinking_water", "waste_disposal",
  
  // Safety & Emergency
  "emergency_phone", "defibrillator", "life_ring", "fire_hydrant",
  
  // Real Estate Specific
  "estate_agent", "construction", "building_materials", "furniture",
  
  // Agriculture & Rural
  "farm", "greenhouse", "farmland", "animal_shelter", "garden_centre"
]

export async function POST(request: NextRequest) {
  try {
    const { bbox } = await request.json()
    
    if (!bbox || typeof bbox !== 'object') {
      return NextResponse.json(
        { error: "Valid bbox is required" },
        { status: 400 }
      )
    }

    const { minLat, minLng, maxLat, maxLng } = bbox
    
    if (!minLat || !minLng || !maxLat || !maxLng) {
      return NextResponse.json(
        { error: "bbox must contain minLat, minLng, maxLat, maxLng" },
        { status: 400 }
      )
    }

    // Build Overpass query for amenities
    const query = buildOverpassBBOXQuery(
      minLat, minLng, maxLat, maxLng,
      AMENITY_CATEGORIES
    )
    
    console.log('Fetching amenities with bbox:', bbox)
    
    try {
      const data = await queryOverpass(query)
      
      if (!data || !data.elements) {
        return NextResponse.json({
          amenities: [],
          bbox,
          categories: AMENITY_CATEGORIES,
          total: 0
        })
      }

      // Transform Overpass data to amenity format
      const amenities = data.elements
        .filter(element => element.type === 'node' && element.lat && element.lon)
        .map(element => ({
          id: element.id,
          lat: element.lat,
          lon: element.lon,
          name: element.tags?.name || 'Unknown',
          category: element.tags?.amenity || 'unknown',
          type: 'amenity',
          tags: element.tags || {}
        }))
        .slice(0, 100) // Limit to 100 amenities for performance

      return NextResponse.json({
        amenities,
        bbox,
        categories: AMENITY_CATEGORIES,
        total: amenities.length
      })
      
    } catch (overpassError) {
      console.error('Overpass error:', overpassError)
      return NextResponse.json({
        amenities: [],
        bbox,
        categories: AMENITY_CATEGORIES,
        total: 0,
        error: "Failed to fetch amenities from Overpass API"
      })
    }
    
  } catch (error) {
    console.error("API route error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
