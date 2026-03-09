import { NextRequest, NextResponse } from "next/server"

// Mock real estate data - in production, this would integrate with real estate APIs
const PROPERTY_TYPES = {
  residential: ["apartment", "house", "villa", "townhouse", "bungalow"],
  commercial: ["office", "shop", "warehouse", "restaurant", "hotel"],
  agricultural: ["farm", "ranch", "greenhouse", "orchard"],
  industrial: ["factory", "workshop", "storage"]
}

const PRICE_RANGES = {
  nairobi: { min: 5000000, max: 50000000, currency: "KES" },
  mombasa: { min: 3000000, max: 30000000, currency: "KES" },
  kisumu: { min: 2000000, max: 15000000, currency: "KES" },
  nakuru: { min: 1500000, max: 12000000, currency: "KES" },
  eldoret: { min: 1000000, max: 10000000, currency: "KES" },
  default: { min: 500000, max: 8000000, currency: "KES" }
}

function getCityFromCoordinates(lat: number, lng: number): string {
  // Simplified city detection based on coordinates
  if (Math.abs(lat - (-1.2921)) < 0.5 && Math.abs(lng - 36.8219) < 0.5) return "nairobi"
  if (Math.abs(lat - (-4.0435)) < 0.5 && Math.abs(lng - 39.6682) < 0.5) return "mombasa"
  if (Math.abs(lat - (-0.5167)) < 0.5 && Math.abs(lng - 34.2667) < 0.5) return "kisumu"
  if (Math.abs(lat - (-0.3031)) < 0.5 && Math.abs(lng - 36.0686) < 0.5) return "nakuru"
  if (Math.abs(lat - 0.5143) < 0.5 && Math.abs(lng - 35.2698) < 0.5) return "eldoret"
  return "default"
}

function generatePropertyData(lat: number, lng: number, count: number = 10): any[] {
  const city = getCityFromCoordinates(lat, lng)
  const priceRange = PRICE_RANGES[city] || PRICE_RANGES.default
  const properties = []
  
  for (let i = 0; i < count; i++) {
    const propertyType = Object.keys(PROPERTY_TYPES)[Math.floor(Math.random() * 4)]
    const specificType = PROPERTY_TYPES[propertyType][Math.floor(Math.random() * PROPERTY_TYPES[propertyType].length)]
    
    const price = Math.round(priceRange.min + Math.random() * (priceRange.max - priceRange.min))
    const size = Math.round(50 + Math.random() * 1000) // 50-1050 sq meters
    const bedrooms = propertyType === 'residential' ? Math.floor(Math.random() * 5) + 1 : 0
    const bathrooms = propertyType === 'residential' ? Math.floor(Math.random() * 3) + 1 : 0
    
    properties.push({
      id: `property_${Date.now()}_${i}`,
      type: propertyType,
      specificType,
      location: {
        lat: lat + (Math.random() - 0.5) * 0.01,
        lng: lng + (Math.random() - 0.5) * 0.01,
        address: `Property ${i + 1}, ${city.charAt(0).toUpperCase() + city.slice(1)} Area`,
        city,
        neighborhood: `Neighborhood ${Math.floor(Math.random() * 20) + 1}`
      },
      pricing: {
        price: price,
        pricePerSqm: Math.round(price / size),
        currency: priceRange.currency,
        priceHistory: Array.from({ length: 12 }, (_, month) => ({
          month: new Date(Date.now() - (11 - month) * 30 * 24 * 60 * 60 * 1000).toISOString(),
          price: Math.round(price * (0.9 + Math.random() * 0.3))
        }))
      },
      features: {
        size: size,
        bedrooms,
        bathrooms,
        yearBuilt: 1970 + Math.floor(Math.random() * 54),
        condition: ["excellent", "good", "fair", "needs_renovation"][Math.floor(Math.random() * 4)],
        amenities: generateAmenities(propertyType),
        utilities: ["electricity", "water", "sewage"].filter(() => Math.random() > 0.2)
      },
      scores: {
        accessibility: Math.round(60 + Math.random() * 40),
        schools: Math.round(50 + Math.random() * 50),
        healthcare: Math.round(50 + Math.random() * 50),
        shopping: Math.round(40 + Math.random() * 60),
        transportation: Math.round(50 + Math.random() * 50),
        safety: Math.round(60 + Math.random() * 40)
      },
      listing: {
        title: `${specificType.charAt(0).toUpperCase() + specificType.slice(1)} in ${city.charAt(0).toUpperCase() + city.slice(1)}`,
        description: `Beautiful ${specificType} located in ${city}. ${bedrooms > 0 ? `${bedrooms} bedrooms, ${bathrooms} bathrooms.` : ''} Size: ${size} sqm.`,
        listedDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        views: Math.floor(Math.random() * 1000),
        contacts: Math.floor(Math.random() * 50)
      }
    })
  }
  
  return properties
}

function generateAmenities(propertyType: string): string[] {
  const allAmenities = {
    residential: ["parking", "garden", "balcony", "security", "storage", "air_conditioning", "furnished"],
    commercial: ["parking", "security", "storage", "air_conditioning", "elevator", "disabled_access"],
    agricultural: ["water_source", "electricity", "storage", "access_road", "fencing"],
    industrial: ["parking", "security", "storage", "loading_dock", "electricity", "water"]
  }
  
  const amenities = allAmenities[propertyType] || allAmenities.residential
  return amenities.filter(() => Math.random() > 0.3)
}

export async function POST(request: NextRequest) {
  try {
    const { bbox, center, propertyType, maxPrice, minSize } = await request.json()
    
    if (!bbox && !center) {
      return NextResponse.json(
        { error: "Either bbox or center is required" },
        { status: 400 }
      )
    }
    
    let properties = []
    
    if (center) {
      // Generate properties around center point
      properties = generatePropertyData(center.lat, center.lng, 20)
    } else if (bbox) {
      // Generate properties across the bounding box
      const { minLat, minLng, maxLat, maxLng } = bbox
      const centerLat = (minLat + maxLat) / 2
      const centerLng = (minLng + maxLng) / 2
      properties = generatePropertyData(centerLat, centerLng, 30)
    }
    
    // Apply filters
    if (propertyType) {
      properties = properties.filter(p => p.type === propertyType)
    }
    
    if (maxPrice) {
      properties = properties.filter(p => p.pricing.price <= maxPrice)
    }
    
    if (minSize) {
      properties = properties.filter(p => p.features.size >= minSize)
    }
    
    // Calculate market statistics
    if (properties.length > 0) {
      const prices = properties.map(p => p.pricing.price)
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      
      const avgScore = properties.reduce((sum, p) => {
        const totalScore = Object.values(p.scores).reduce((s: number, score: number) => s + score, 0)
        return sum + totalScore / Object.keys(p.scores).length
      }, 0) / properties.length
      
      return NextResponse.json({
        properties: properties.slice(0, 50), // Limit to 50 properties
        marketStats: {
          averagePrice: Math.round(avgPrice),
          minPrice,
          maxPrice,
          priceRange: `${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()} KES`,
          totalListings: properties.length,
          averageScore: Math.round(avgScore),
          popularTypes: Object.keys(PROPERTY_TYPES).map(type => ({
            type,
            count: properties.filter(p => p.type === type).length
          })).sort((a, b) => b.count - a.count)
        },
        filters: { propertyType, maxPrice, minSize },
        bbox,
        lastUpdated: new Date().toISOString()
      })
    }
    
    return NextResponse.json({
      properties: [],
      marketStats: null,
      filters: { propertyType, maxPrice, minSize },
      bbox,
      lastUpdated: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("Real estate API error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
