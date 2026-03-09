import { NextRequest, NextResponse } from "next/server"

// Mock flood risk data - in production, this would integrate with real flood APIs
const FLOOD_RISK_ZONES = {
  // High risk areas in Kenya (simplified for demo)
  high_risk: [
    { lat: -1.2921, lng: 36.8219, risk: 0.9, area: "Nairobi CBD" },
    { lat: -1.285, lng: 36.825, risk: 0.85, area: "Industrial Area" },
    { lat: -4.0435, lng: 39.6682, risk: 0.8, area: "Mombasa Old Town" },
    { lat: -0.5167, lng: 34.2667, risk: 0.75, area: "Kisumu" }
  ],
  medium_risk: [
    { lat: -1.03, lng: 37.07, risk: 0.5, area: "Thika" },
    { lat: -0.2833, lng: 35.3667, risk: 0.45, area: "Eldoret" },
    { lat: -1.0, lng: 37.0, risk: 0.4, area: "Nakuru" }
  ],
  low_risk: [
    { lat: -0.4167, lng: 37.1833, risk: 0.2, area: "Meru" },
    { lat: -0.5333, lng: 35.2833, risk: 0.15, area: "Kitale" },
    { lat: -0.6833, lng: 34.7667, risk: 0.1, area: "Kakamega" }
  ]
}

function calculateFloodRisk(lat: number, lng: number): number {
  // Calculate distance-based flood risk from known zones
  let maxRisk = 0
  
  Object.values(FLOOD_RISK_ZONES).flat().forEach(zone => {
    const distance = Math.sqrt(
      Math.pow(lat - zone.lat, 2) + Math.pow(lng - zone.lng, 2)
    )
    // Risk decreases with distance
    const riskAtLocation = zone.risk * Math.exp(-distance * 50)
    maxRisk = Math.max(maxRisk, riskAtLocation)
  })
  
  // Add some random variation for realism
  const variation = (Math.random() - 0.5) * 0.1
  return Math.max(0, Math.min(1, maxRisk + variation))
}

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
    
    // Generate flood risk points in the bounding box
    const floodRiskPoints = []
    const gridSize = 0.01 // ~1km grid
    
    for (let lat = minLat; lat <= maxLat; lat += gridSize) {
      for (let lng = minLng; lng <= maxLng; lng += gridSize) {
        const risk = calculateFloodRisk(lat, lng)
        
        if (risk > 0.1) { // Only include areas with some risk
          floodRiskPoints.push({
            lat: lat,
            lng: lng,
            risk: risk,
            riskLevel: risk > 0.7 ? 'high' : risk > 0.4 ? 'medium' : 'low',
            description: getFloodDescription(risk)
          })
        }
      }
    }
    
    // Calculate overall area statistics
    const avgRisk = floodRiskPoints.reduce((sum, point) => sum + point.risk, 0) / floodRiskPoints.length
    const highRiskCount = floodRiskPoints.filter(p => p.risk > 0.7).length
    const mediumRiskCount = floodRiskPoints.filter(p => p.risk > 0.4 && p.risk <= 0.7).length
    
    return NextResponse.json({
      floodRisk: floodRiskPoints.slice(0, 100), // Limit to 100 points
      statistics: {
        averageRisk: avgRisk,
        highRiskAreas: highRiskCount,
        mediumRiskAreas: mediumRiskCount,
        lowRiskAreas: floodRiskPoints.length - highRiskCount - mediumRiskCount,
        totalAssessed: floodRiskPoints.length
      },
      bbox,
      lastUpdated: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("Flood risk API error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

function getFloodDescription(risk: number): string {
  if (risk > 0.7) {
    return "High flood risk area. Prone to seasonal flooding. Consider elevation and drainage."
  } else if (risk > 0.4) {
    return "Moderate flood risk. May experience occasional flooding during heavy rains."
  } else if (risk > 0.1) {
    return "Low flood risk. Some water accumulation possible during extreme weather."
  } else {
    return "Very low flood risk. Generally safe from flooding."
  }
}
