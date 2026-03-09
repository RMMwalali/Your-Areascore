import { NextRequest, NextResponse } from "next/server"

export interface GeocodeResult {
  label: string
  lat: number
  lng: number
  type: string
  county: string
  town: string
}

export interface NominatimResult {
  place_id: number
  lat: string
  lng: string
  display_name: string
  class: string
  type: string
  importance: string
  bbox: {
    minLat: number
    minLng: number
    maxLat: number
    maxLng: number
  }
}

// Fallback locations for when geocoding fails
const fallbackLocations: GeocodeResult[] = [
  // International Cities
  {
    label: "New York, USA",
    lat: 40.7128,
    lng: -74.0060,
    type: "city",
    county: "New York",
    town: "New York"
  },
  {
    label: "London, UK",
    lat: 51.5074,
    lng: -0.1278,
    type: "city",
    county: "London",
    town: "London"
  },
  {
    label: "Tokyo, Japan",
    lat: 35.6762,
    lng: 139.6503,
    type: "city",
    county: "Tokyo",
    town: "Tokyo"
  },
  {
    label: "Paris, France",
    lat: 48.8566,
    lng: 2.3522,
    type: "city",
    county: "Paris",
    town: "Paris"
  },
  // Major Kenya Cities
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
  },
  {
    label: "Kitale, Kenya",
    lat: 1.0153,
    lng: 35.0031,
    type: "city",
    county: "Trans Nzoia",
    town: "Kitale"
  },
  {
    label: "Thika, Kenya",
    lat: -1.0499,
    lng: 37.0714,
    type: "city",
    county: "Kiambu",
    town: "Thika"
  },
  {
    label: "Malindi, Kenya",
    lat: -3.5992,
    lng: 40.1241,
    type: "city",
    county: "Kilifi",
    town: "Malindi"
  },
  {
    label: "Lamu, Kenya",
    lat: -2.2748,
    lng: 40.9021,
    type: "city",
    county: "Lamu",
    town: "Lamu"
  },
  {
    label: "Machakos, Kenya",
    lat: -1.5177,
    lng: 37.2634,
    type: "city",
    county: "Machakos",
    town: "Machakos"
  },
  {
    label: "Voi, Kenya",
    lat: -3.3985,
    lng: 38.5581,
    type: "city",
    county: "Taita Taveta",
    town: "Voi"
  },
  {
    label: "Wajir, Kenya",
    lat: -1.7461,
    lng: 40.0536,
    type: "city",
    county: "Wajir",
    town: "Wajir"
  },
  {
    label: "Garissa, Kenya",
    lat: -0.4528,
    lng: 39.6460,
    type: "city",
    county: "Garissa",
    town: "Garissa"
  },
  {
    label: "Isiolo, Kenya",
    lat: 0.3548,
    lng: 37.5822,
    type: "city",
    county: "Isiolo",
    town: "Isiolo"
  },
  {
    label: "Kakamega, Kenya",
    lat: 0.2831,
    lng: 34.8058,
    type: "city",
    county: "Kakamega",
    town: "Kakamega"
  },
  {
    label: "Kericho, Kenya",
    lat: -0.3678,
    lng: 35.2831,
    type: "city",
    county: "Kericho",
    town: "Kericho"
  },
  {
    label: "Kitale, Kenya",
    lat: 1.0153,
    lng: 35.0031,
    type: "city",
    county: "Trans Nzoia",
    town: "Kitale"
  },
  {
    label: "Eldoret, Kenya",
    lat: 0.5143,
    lng: 35.2694,
    type: "city",
    county: "Uasin Gishu",
    town: "Eldoret"
  },
  {
    label: "Kitale, Kenya",
    lat: 1.0153,
    lng: 35.0031,
    type: "city",
    county: "Trans Nzoia",
    town: "Kitale"
  },
  {
    label: "Thika, Kenya",
    lat: -1.0499,
    lng: 37.0714,
    type: "city",
    county: "Kiambu",
    town: "Thika"
  },
  {
    label: "Malindi, Kenya",
    lat: -3.5992,
    lng: 40.1241,
    type: "city",
    county: "Kilifi",
    town: "Malindi"
  },
  {
    label: "Lamu, Kenya",
    lat: -2.2748,
    lng: 40.9021,
    type: "city",
    county: "Lamu",
    town: "Lamu"
  },
  {
    label: "Machakos, Kenya",
    lat: -1.5177,
    lng: 37.2634,
    type: "city",
    county: "Machakos",
    town: "Machakos"
  },
  {
    label: "Voi, Kenya",
    lat: -3.3985,
    lng: 38.5581,
    type: "city",
    county: "Taita Taveta",
    town: "Voi"
  },
  {
    label: "Wajir, Kenya",
    lat: -1.7461,
    lng: 40.0536,
    type: "city",
    county: "Wajir",
    town: "Wajir"
  },
  {
    label: "Garissa, Kenya",
    lat: -0.4528,
    lng: 39.6460,
    type: "city",
    county: "Garissa",
    town: "Garissa"
  },
  {
    label: "Isiolo, Kenya",
    lat: 0.3548,
    lng: 37.5822,
    type: "city",
    county: "Isiolo",
    town: "Isiolo"
  },
  {
    label: "Kakamega, Kenya",
    lat: 0.2831,
    lng: 34.8058,
    type: "city",
    county: "Kakamega",
    town: "Kakamega"
  },
  {
    label: "Kericho, Kenya",
    lat: -0.3678,
    lng: 35.2831,
    type: "city",
    county: "Kericho",
    town: "Kericho"
  },
  {
    label: "Kitale, Kenya",
    lat: 1.0153,
    lng: 35.0031,
    type: "city",
    county: "Trans Nzoia",
    town: "Kitale"
  },
  {
    label: "Eldoret, Kenya",
    lat: 0.5143,
    lng: 35.2694,
    type: "city",
    county: "Uasin Gishu",
    town: "Eldoret"
  },
  {
    label: "Kitale, Kenya",
    lat: 1.0153,
    lng: 35.0031,
    type: "city",
    county: "Trans Nzoia",
    town: "Kitale"
  }
]

export async function GET(request: NextRequest) {
  try {
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
