import { NextRequest, NextResponse } from "next/server"

// Define scoring weights for different factors
const SCORING_WEIGHTS = {
  amenities: 0.35,      // Schools, hospitals, shopping
  security: 0.30,       // Low crime rates, police presence
  accessibility: 0.25,  // Road access, public transport
  environment: 0.10     // Green spaces, low pollution
}

// Kenya area quality data with scores - Updated for better road access assessment
const AREA_QUALITY_DATA = [
  // Nairobi High-End Areas (Excellent)
  {
    lat: -1.2921,
    lng: 36.8219,
    name: "Nairobi CBD",
    county: "Nairobi",
    scores: {
      amenities: 0.95,
      security: 0.85,
      accessibility: 0.95, // Updated - Excellent road access
      environment: 0.70
    }
  },
  {
    lat: -1.3123,
    lng: 36.7245,
    name: "Karen",
    county: "Nairobi",
    scores: {
      amenities: 0.85,
      security: 0.95,
      accessibility: 0.85, // Updated - Good access via Langata Road, Ngong Road
      environment: 0.95
    }
  },
  {
    lat: -1.2655,
    lng: 36.7984,
    name: "Westlands",
    county: "Nairobi",
    scores: {
      amenities: 0.90,
      security: 0.85,
      accessibility: 0.95, // Updated - Excellent access via Waiyaki Way, Uhuru Highway
      environment: 0.80
    }
  },
  {
    lat: -1.2839,
    lng: 36.7850,
    name: "Kilimani",
    county: "Nairobi",
    scores: {
      amenities: 0.90,
      security: 0.85,
      accessibility: 0.90, // Updated - Very good access via major roads
      environment: 0.75
    }
  },
  {
    lat: -1.2743,
    lng: 36.7788,
    name: "Lavington",
    county: "Nairobi",
    scores: {
      amenities: 0.85,
      security: 0.90,
      accessibility: 0.85, // Updated - Good access via Lavington Road, Gitanga Road
      environment: 0.85
    }
  },
  {
    lat: -1.2345,
    lng: 36.7989,
    name: "Muthaiga",
    county: "Nairobi",
    scores: {
      amenities: 0.80,
      security: 0.95,
      accessibility: 0.80, // Updated - Good access via Thika Superhighway, Limuru Road
      environment: 0.90
    }
  },
  {
    lat: -1.2123,
    lng: 36.8345,
    name: "Runda",
    county: "Nairobi",
    scores: {
      amenities: 0.75,
      security: 0.90,
      accessibility: 0.80, // Updated - Good access via Thika Superhighway, Northern Bypass
      environment: 0.90
    }
  },

  // Nairobi Middle-Class Areas (Good)
  {
    lat: -1.2876,
    lng: 36.7734,
    name: "Kileleshwa",
    county: "Nairobi",
    scores: {
      amenities: 0.80,
      security: 0.75,
      accessibility: 0.85, // Updated - Good access via Argwings Kodhek Road
      environment: 0.70
    }
  },
  {
    lat: -1.2789,
    lng: 36.8123,
    name: "Riverside",
    county: "Nairobi",
    scores: {
      amenities: 0.85,
      security: 0.80,
      accessibility: 0.85, // Updated - Good access via Riverside Drive, Chiromo Road
      environment: 0.75
    }
  },
  {
    lat: -1.2623,
    lng: 36.8078,
    name: "Parklands",
    county: "Nairobi",
    scores: {
      amenities: 0.80,
      security: 0.80,
      accessibility: 0.85, // Updated - Good access via Limuru Road, Forest Road
      environment: 0.70
    }
  },

  // Nairobi Lower-Middle Areas (Fair to Good)
  {
    lat: -1.2967,
    lng: 36.8567,
    name: "Eastlands",
    county: "Nairobi",
    scores: {
      amenities: 0.70,
      security: 0.60,
      accessibility: 0.80, // Updated - Good access via Outering Road, Jogoo Road
      environment: 0.60
    }
  },
  {
    lat: -1.2789,
    lng: 36.8456,
    name: "Buruburu",
    county: "Nairobi",
    scores: {
      amenities: 0.75,
      security: 0.65,
      accessibility: 0.80, // Updated - Good access via Jogoo Road, Buruburu Road
      environment: 0.65
    }
  },
  {
    lat: -1.3012,
    lng: 36.8678,
    name: "Donholm",
    county: "Nairobi",
    scores: {
      amenities: 0.70,
      security: 0.60,
      accessibility: 0.75, // Updated - Good access via Outering Road, Airport Road
      environment: 0.60
    }
  },
  {
    lat: -1.2945,
    lng: 36.8789,
    name: "Umoja",
    county: "Nairobi",
    scores: {
      amenities: 0.70,
      security: 0.65,
      accessibility: 0.75, // Updated - Good access via Outering Road, Kangundo Road
      environment: 0.60
    }
  },

  // Major Cities (Good to Excellent)
  {
    lat: -4.0435,
    lng: 39.6682,
    name: "Mombasa",
    county: "Mombasa",
    scores: {
      amenities: 0.85,
      security: 0.75,
      accessibility: 0.85, // Updated - Good access via Mombasa-Nairobi highway, Digo Road
      environment: 0.85
    }
  },
  {
    lat: -0.0917,
    lng: 34.7680,
    name: "Kisumu",
    county: "Kisumu",
    scores: {
      amenities: 0.75,
      security: 0.70,
      accessibility: 0.80, // Updated - Good access via A1 highway, Kisumu-Busia highway
      environment: 0.80
    }
  },
  {
    lat: -0.3031,
    lng: 36.0699,
    name: "Nakuru",
    county: "Nakuru",
    scores: {
      amenities: 0.80,
      security: 0.75,
      accessibility: 0.85, // Updated - Excellent access via A109 highway
      environment: 0.85
    }
  },
  {
    lat: 0.5143,
    lng: 35.2694,
    name: "Eldoret",
    county: "Uasin Gishu",
    scores: {
      amenities: 0.75,
      security: 0.80,
      accessibility: 0.80, // Updated - Good access via A104 highway
      environment: 0.80
    }
  },

  // Satellite Towns (Good to Very Good)
  {
    lat: -1.0365,
    lng: 37.0785,
    name: "Thika",
    county: "Kiambu",
    scores: {
      amenities: 0.75,
      security: 0.75,
      accessibility: 0.90, // Updated - Excellent access via Thika Superhighway
      environment: 0.75
    }
  },
  {
    lat: -1.0989,
    lng: 36.6567,
    name: "Limuru",
    county: "Kiambu",
    scores: {
      amenities: 0.70,
      security: 0.80,
      accessibility: 0.85, // Updated - Very good access via A104 highway, Limuru Road
      environment: 0.80
    }
  },
  {
    lat: -1.1456,
    lng: 36.9876,
    name: "Ruiru",
    county: "Kiambu",
    scores: {
      amenities: 0.70,
      security: 0.70,
      accessibility: 0.85, // Updated - Very good access via Thika Superhighway
      environment: 0.70
    }
  },
  {
    lat: -1.4567,
    lng: 37.0234,
    name: "Athi River",
    county: "Machakos",
    scores: {
      amenities: 0.65,
      security: 0.70,
      accessibility: 0.85, // Updated - Very good access via Mombasa-Nairobi highway
      environment: 0.70
    }
  },
  {
    lat: -1.5234,
    lng: 36.9876,
    name: "Kitengela",
    county: "Kajiado",
    scores: {
      amenities: 0.60,
      security: 0.70,
      accessibility: 0.80, // Updated - Good access via Namanga Road, A104 highway
      environment: 0.75
    }
  },

  // Coastal Areas (Good to Excellent)
  {
    lat: -4.0456,
    lng: 39.6890,
    name: "Nyali",
    county: "Mombasa",
    scores: {
      amenities: 0.85,
      security: 0.80,
      accessibility: 0.80, // Updated - Good access via Nyali Bridge, Mombasa-Malindi highway
      environment: 0.90
    }
  },
  {
    lat: -4.1234,
    lng: 39.5789,
    name: "Diani",
    county: "Kwale",
    scores: {
      amenities: 0.80,
      security: 0.85,
      accessibility: 0.75, // Updated - Good access via Diani Beach Road, A14 highway
      environment: 0.95
    }
  },
  {
    lat: -3.2187,
    lng: 40.1234,
    name: "Malindi",
    county: "Kilifi",
    scores: {
      amenities: 0.75,
      security: 0.75,
      accessibility: 0.75, // Updated - Good access via Mombasa-Malindi highway
      environment: 0.85
    }
  },

  // Other Notable Towns (Fair to Good)
  {
    lat: -0.7132,
    lng: 36.4338,
    name: "Naivasha",
    county: "Nakuru",
    scores: {
      amenities: 0.70,
      security: 0.75,
      accessibility: 0.80, // Updated - Good access via A104 highway, Moi South Lake Road
      environment: 0.85
    }
  },
  {
    lat: 0.2848,
    lng: 34.7519,
    name: "Kakamega",
    county: "Kakamega",
    scores: {
      amenities: 0.65,
      security: 0.70,
      accessibility: 0.75, // Updated - Good access via A1 highway, Kakamega-Webuye road
      environment: 0.75
    }
  },
  {
    lat: 0.0470,
    lng: 37.6505,
    name: "Meru",
    county: "Meru",
    scores: {
      amenities: 0.65,
      security: 0.70,
      accessibility: 0.75, // Updated - Good access via A2 highway, Meru-Nanyuki road
      environment: 0.80
    }
  },
  {
    lat: -0.4201,
    lng: 36.9476,
    name: "Nyeri",
    county: "Nyeri",
    scores: {
      amenities: 0.65,
      security: 0.75,
      accessibility: 0.75, // Updated - Good access via A2 highway, Nyeri-Nyahururu road
      environment: 0.85
    }
  }
]

function calculateOverallScore(scores: typeof AREA_QUALITY_DATA[0]['scores']): number {
  return (
    scores.amenities * SCORING_WEIGHTS.amenities +
    scores.security * SCORING_WEIGHTS.security +
    scores.accessibility * SCORING_WEIGHTS.accessibility +
    scores.environment * SCORING_WEIGHTS.environment
  )
}

function generateHeatmapData(center: { lat: number; lng: number }, radius: number = 0.5): Array<{
  lat: number
  lng: number
  intensity: number
  name: string
  county: string
  scores: typeof AREA_QUALITY_DATA[0]['scores']
}> {
  const heatmapPoints: Array<{
    lat: number
    lng: number
    intensity: number
    name: string
    county: string
    scores: typeof AREA_QUALITY_DATA[0]['scores']
  }> = []

  // Add actual data points
  AREA_QUALITY_DATA.forEach(area => {
    const distance = calculateDistance(center, area)
    if (distance <= radius * 100) { // Convert to km
      const overallScore = calculateOverallScore(area.scores)
      heatmapPoints.push({
        lat: area.lat,
        lng: area.lng,
        intensity: overallScore,
        name: area.name,
        county: area.county,
        scores: area.scores
      })
    }
  })

  // Add interpolated points for smoother heatmap
  for (let i = 0; i < 50; i++) {
    const lat = center.lat + (Math.random() - 0.5) * radius * 2
    const lng = center.lng + (Math.random() - 0.5) * radius * 2
    
    // Find nearest actual data point and interpolate
    const nearestPoint = findNearestPoint({ lat, lng })
    if (nearestPoint) {
      const distance = calculateDistance({ lat, lng }, nearestPoint)
      const interpolatedScore = Math.max(0.3, nearestPoint.intensity - (distance * 0.1))
      
      heatmapPoints.push({
        lat,
        lng,
        intensity: interpolatedScore,
        name: `Area near ${nearestPoint.name}`,
        county: nearestPoint.county,
        scores: nearestPoint.scores
      })
    }
  }

  return heatmapPoints
}

function findNearestPoint(point: { lat: number; lng: number }): { lat: number; lng: number; intensity: number; name: string; county: string; scores: typeof AREA_QUALITY_DATA[0]['scores'] } | null {
  let nearest: { lat: number; lng: number; intensity: number; name: string; county: string; scores: typeof AREA_QUALITY_DATA[0]['scores'] } | null = null
  let minDistance = Infinity
  
  AREA_QUALITY_DATA.forEach(area => {
    const distance = calculateDistance(point, area)
    if (distance < minDistance) {
      minDistance = distance
      nearest = {
        lat: area.lat,
        lng: area.lng,
        name: area.name,
        county: area.county,
        scores: area.scores,
        intensity: calculateOverallScore(area.scores)
      }
    }
  })
  
  return nearest
}

function calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
  const R = 6371 // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180
  const dLon = (point2.lng - point1.lng) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { center, radius = 0.5 } = body

    if (!center || !center.lat || !center.lng) {
      return NextResponse.json(
        { error: "Center coordinates (lat, lng) are required" },
        { status: 400 }
      )
    }

    const heatmapData = generateHeatmapData(center, radius)

    return NextResponse.json({
      heatmap: heatmapData,
      metadata: {
        center,
        radius,
        totalPoints: heatmapData.length,
        scoringWeights: SCORING_WEIGHTS,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("Heatmap generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate heatmap data" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get("lat") || "0")
  const lng = parseFloat(searchParams.get("lng") || "0")
  const radius = parseFloat(searchParams.get("radius") || "0.5")

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: "Valid lat and lng parameters are required" },
      { status: 400 }
    )
  }

  try {
    const heatmapData = generateHeatmapData({ lat, lng }, radius)

    return NextResponse.json({
      heatmap: heatmapData,
      metadata: {
        center: { lat, lng },
        radius,
        totalPoints: heatmapData.length,
        scoringWeights: SCORING_WEIGHTS,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("Heatmap generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate heatmap data" },
      { status: 500 }
    )
  }
}
