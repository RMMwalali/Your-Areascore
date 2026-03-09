import { NextRequest, NextResponse } from "next/server"

const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY
const FOURSQUARE_API_VERSION = "20240101"

// Foursquare API categories relevant for real estate and location analysis
const RELEVANT_CATEGORIES = [
  // Food & Drink
  "13065", // Restaurants
  "13032", // Cafes
  "13027", // Bars
  "13028", // Nightlife
  
  // Shops & Services
  "17000", // Grocery
  "17109", // Supermarkets
  "17105", // Shopping Malls
  "17106", // Shopping Centers
  "17107", // Department Stores
  "17108", // Big Box Stores
  "17110", // Convenience Stores
  "17111", // Pharmacies
  "17112", // Hardware Stores
  "17113", // Furniture Stores
  "17114", // Electronics Stores
  "17115", // Clothing Stores
  "17116", // Shoe Stores
  "17117", // Jewelry Stores
  "17118", // Bookstores
  "17119", // Toy Stores
  "17120", // Gift Shops
  "17121", // Florists
  "17122", // Pet Stores
  "17123", // Liquor Stores
  "17124", // Tobacco Shops
  "17125", // Opticians
  "17126", // Photo Studios
  "17127", // Print Shops
  "17128", // Shipping Centers
  
  // Travel & Transport
  "19044", // Gas Stations
  "19046", // Parking
  "19047", // Car Rental
  "19048", // Car Wash
  "19049", // Taxi
  "19050", // Bus Station
  "19051", // Train Station
  "19052", // Airport
  "19053", // Ferry
  "19054", // Boat Rental
  "19055", // Bike Rental
  
  // Arts & Entertainment
  "10000", // Arts & Entertainment
  "10027", // Concert Halls
  "10028", // Theaters
  "10029", // Stadiums
  "10030", // Arenas
  "10031", // Race Tracks
  "10032", // Theme Parks
  "10033", // Zoos
  "10034", // Aquariums
  "10035", // Museums
  "10036", // Art Galleries
  "10037", // Historic Sites
  "10038", // Monuments
  "10039", // Parks
  "10040", // Playgrounds
  "10041", // Beaches
  "10042", // Gardens
  "10043", // Fountains
  "10044", // Scenic Lookouts
  "10045", // Hiking Trails
  "10046", // Ski Resorts
  "10047", // Golf Courses
  "10048", // Tennis Courts
  "10049", // Basketball Courts
  "10050", // Soccer Fields
  "10051", // Baseball Fields
  "10052", // Football Fields
  "10053", // Hockey Rinks
  "10054", // Skate Parks
  "10055", // Rock Climbing
  "10056", // Yoga Studios
  "10057", // Dance Studios
  "10058", // Martial Arts Dojos
  "10059", // Boxing Gyms
  "10060", // Wrestling Gyms
  "10061", // Fencing Gyms
  "10062", // Archery Ranges
  "10063", // Shooting Ranges
  "10064", // Paintball
  
  // Education
  "12000", // Education
  "12057", // Colleges & Universities
  "12058", // Community Colleges
  "12059", // Trade Schools
  "12060", // Vocational Schools
  "12061", // Technical Schools
  "12062", // Art Schools
  "12063", // Music Schools
  "12064", // Dance Schools
  "12065", // Drama Schools
  "12066", // Film Schools
  "12067", // Cooking Schools
  "12068", // Language Schools
  "12069", // Driving Schools
  "12070", // Flight Schools
  "12071", // Diving Schools
  "12072", // Ski Schools
  "12073", // Surf Schools
  "12074", // Martial Arts Schools
  "12075", // Yoga Schools
  "12076", // Meditation Schools
  "12077", // Spiritual Centers
  "12078", // Religious Schools
  "12079", // Elementary Schools
  "12080", // Middle Schools
  "12081", // High Schools
  
  // Professional & Other Places
  "11000", // Professional & Other Places
  "11045", // Office Buildings
  "11046", // Co-working Spaces
  "11047", // Business Centers
  "11048", // Industrial Areas
  "11049", // Factories
  "11050", // Warehouses
  "11051", // Distribution Centers
  "11052", // Manufacturing Plants
  "11053", // Research Facilities
  "11054", // Laboratories
  "11055", // Tech Hubs
  "11056", // Incubators
  "11057", // Accelerators
  "11058", // Venture Capital
  "11059", // Law Firms
  "11060", // Accounting Firms
  "11061", // Consulting Firms
  "11062", // Marketing Agencies
  "11063", // Advertising Agencies
  "11064", // PR Firms
  "11065", // Design Studios
  "11066", // Architecture Firms
  "11067", // Engineering Firms
]

async function searchFoursquarePlaces(lat: number, lng: number, radius: number = 1000) {
  if (!FOURSQUARE_API_KEY) {
    throw new Error("Foursquare API key not configured")
  }

  const url = new URL("https://api.foursquare.com/v3/places/search")
  url.searchParams.append("ll", `${lat},${lng}`)
  url.searchParams.append("radius", radius.toString())
  url.searchParams.append("categories", RELEVANT_CATEGORIES.join(","))
  url.searchParams.append("limit", "50")
  url.searchParams.append("fields", "name,location,categories,rating,price,description,photos,hours,popular_hours,tips,distance")
  url.searchParams.append("sort", "RELEVANCE")

  const response = await fetch(url.toString(), {
    headers: {
      "Authorization": FOURSQUARE_API_KEY,
      "Accept": "application/json",
      "X-Places-Api-Version": "20240101"
    }
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error("Foursquare API error:", errorData)
    throw new Error(`Foursquare API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.results || []
}

async function getPlaceDetails(placeId: string) {
  if (!FOURSQUARE_API_KEY) {
    throw new Error("Foursquare API key not configured")
  }

  const url = new URL(`https://api.foursquare.com/v3/places/${placeId}`)
  url.searchParams.append("fields", "name,location,categories,rating,price,description,photos,hours,popular_hours,tips,reviews")

  const response = await fetch(url.toString(), {
    headers: {
      "Authorization": FOURSQUARE_API_KEY,
      "Accept": "application/json",
      "X-Places-Api-Version": "20240101"
    }
  })

  if (!response.ok) {
    throw new Error(`Foursquare API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

function enrichPlaceData(place: any) {
  return {
    id: place.fsq_id,
    name: place.name,
    location: {
      lat: place.geocodes.main.latitude,
      lng: place.geocodes.main.longitude,
      address: place.location?.formatted_address || "",
      neighborhood: place.location?.neighborhood || "",
      locality: place.location?.locality || "",
      postcode: place.location?.postcode || "",
      country: place.location?.country || ""
    },
    categories: place.categories?.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon
    })) || [],
    rating: place.rating || null,
    price: place.price || null,
    description: place.description || "",
    photos: place.photos?.map((photo: any) => ({
      id: photo.id,
      prefix: photo.prefix,
      suffix: photo.suffix,
      width: photo.width,
      height: photo.height
    })) || [],
    hours: place.hours || null,
    popularHours: place.popular_hours || null,
    tips: place.tips?.map((tip: any) => ({
      id: tip.id,
      text: tip.text,
      created_at: tip.created_at,
      agree_count: tip.agree_count,
      disagree_count: tip.disagree_count
    })) || [],
    distance: place.distance || null,
    relevance: place.relevance || null,
    source: "foursquare"
  }
}

export async function POST(request: NextRequest) {
  try {
    const { lat, lng, radius = 1000, categories } = await request.json()
    
    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      )
    }

    if (!FOURSQUARE_API_KEY) {
      return NextResponse.json(
        { error: "Foursquare API key not configured" },
        { status: 500 }
      )
    }

    // Search for places
    let places = []
    try {
      places = await searchFoursquarePlaces(lat, lng, radius)
    } catch (error) {
      console.error("Foursquare API search failed:", error)
      // Return empty results instead of failing completely
      places = []
    }
    
    // Enrich place data
    const enrichedPlaces = places.map(enrichPlaceData)

    // Calculate area statistics
    const stats = {
      totalPlaces: enrichedPlaces.length,
      averageRating: enrichedPlaces.reduce((sum: number, place: any) => sum + (place.rating || 0), 0) / enrichedPlaces.length || 0,
      priceDistribution: {
        budget: enrichedPlaces.filter((p: any) => p.price === 1).length,
        moderate: enrichedPlaces.filter((p: any) => p.price === 2).length,
        expensive: enrichedPlaces.filter((p: any) => p.price === 3).length,
        veryExpensive: enrichedPlaces.filter((p: any) => p.price === 4).length
      },
      categoryDistribution: enrichedPlaces.reduce((acc: any, place: any) => {
        place.categories?.forEach((cat: any) => {
          acc[cat.name] = (acc[cat.name] || 0) + 1
        })
        return acc
      }, {}),
      topRatedPlaces: enrichedPlaces
        .filter((p: any) => p.rating)
        .sort((a: any, b: any) => b.rating - a.rating)
        .slice(0, 10)
    }

    return NextResponse.json({
      places: enrichedPlaces,
      statistics: stats,
      searchParams: { lat, lng, radius, categories },
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error("Foursquare API error:", error)
    
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

// GET endpoint for place details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const placeId = searchParams.get('id')
    
    if (!placeId) {
      return NextResponse.json(
        { error: "Place ID is required" },
        { status: 400 }
      )
    }

    if (!FOURSQUARE_API_KEY) {
      return NextResponse.json(
        { error: "Foursquare API key not configured" },
        { status: 500 }
      )
    }

    const placeDetails = await getPlaceDetails(placeId)
    const enrichedPlace = enrichPlaceData(placeDetails)

    return NextResponse.json({
      place: enrichedPlace,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error("Foursquare API error:", error)
    
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
