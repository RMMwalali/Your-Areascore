import { NextRequest, NextResponse } from "next/server"

// Mock weather data - in production, this would integrate with real weather APIs
const WEATHER_STATIONS: Record<string, { lat: number; lng: number; elevation: number; name: string }> = {
  nairobi: { lat: -1.2921, lng: 36.8219, elevation: 1795, name: "Nairobi" },
  mombasa: { lat: -4.0435, lng: 39.6682, elevation: 50, name: "Mombasa" },
  kisumu: { lat: -0.5167, lng: 34.2667, elevation: 1131, name: "Kisumu" },
  nakuru: { lat: -0.3031, lng: 36.0686, elevation: 1879, name: "Nakuru" },
  eldoret: { lat: 0.5143, lng: 35.2698, elevation: 2100, name: "Eldoret" },
  kitale: { lat: 1.0153, lng: 35.0031, elevation: 1900, name: "Kitale" }
}

function getWeatherForLocation(lat: number, lng: number): any {
  // Find nearest weather station
  let nearestStation: { name: string; lat: number; lng: number; elevation: number } | null = null
  let minDistance = Infinity
  
  Object.entries(WEATHER_STATIONS).forEach(([key, station]) => {
    const distance = Math.sqrt(
      Math.pow(lat - station.lat, 2) + Math.pow(lng - station.lng, 2)
    )
    if (distance < minDistance) {
      minDistance = distance
      nearestStation = { name: key, ...station }
    }
  })
  
  if (!nearestStation) return null
  
  // Generate realistic weather data based on location and elevation
  const baseTemp = 22 - (nearestStation.elevation / 200) // Temperature decreases with elevation
  const currentTemp = baseTemp + (Math.random() - 0.5) * 4 // Add some variation
  
  // Generate historical data for the past 30 days
  const historicalData = []
  const today = new Date()
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const historicalTemp = baseTemp + Math.sin(i / 5) * 3 + (Math.random() - 0.5) * 2
    const rainfall = Math.random() > 0.7 ? Math.random() * 15 : 0 // 30% chance of rain
    
    historicalData.push({
      date: date.toISOString().split('T')[0],
      temperature: Math.round(historicalTemp),
      rainfall: Math.round(rainfall * 10) / 10,
      humidity: 60 + Math.round(Math.random() * 30),
      conditions: rainfall > 0 ? 'Rainy' : (Math.random() > 0.5 ? 'Partly Cloudy' : 'Sunny')
    })
  }
  
  // Calculate averages and trends
  const avgTemp = historicalData.reduce((sum, day) => sum + day.temperature, 0) / historicalData.length
  const totalRainfall = historicalData.reduce((sum, day) => sum + day.rainfall, 0)
  const rainyDays = historicalData.filter(day => day.rainfall > 0).length
  const recentTrend = historicalData.slice(7).reduce((sum, day) => sum + day.temperature, 0) / 7 - avgTemp
  
  return {
    location: nearestStation.name,
    coordinates: { lat: nearestStation.lat, lng: nearestStation.lng },
    elevation: nearestStation.elevation,
    current: {
      temperature: Math.round(currentTemp),
      conditions: Math.random() > 0.3 ? 'Partly Cloudy' : 'Sunny',
      humidity: 65 + Math.round(Math.random() * 20),
      windSpeed: `${5 + Math.round(Math.random() * 10)} km/h`,
      pressure: `${1010 + Math.round(Math.random() * 20)} hPa`
    },
    historical: {
      daily: historicalData,
      averages: {
        temperature: Math.round(avgTemp),
        rainfall: Math.round(totalRainfall * 10) / 10,
        humidity: Math.round(historicalData.reduce((sum, day) => sum + day.humidity, 0) / historicalData.length),
        rainyDays: rainyDays,
        rainyDaysPercentage: Math.round((rainyDays / 30) * 100)
      },
      trends: {
        temperature: recentTrend > 1 ? 'Warming' : recentTrend < -1 ? 'Cooling' : 'Stable',
        rainfall: totalRainfall > 50 ? 'Above Average' : totalRainfall < 20 ? 'Below Average' : 'Normal',
        pattern: rainyDays > 15 ? 'Frequent Rain' : rainyDays < 8 ? 'Dry Period' : 'Moderate'
      }
    },
    lastUpdated: new Date().toISOString()
  }
}

export async function POST(request: NextRequest) {
  try {
    const { lat, lng } = await request.json()
    
    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      )
    }

    const weatherData = getWeatherForLocation(lat, lng)
    
    if (!weatherData) {
      return NextResponse.json(
        { error: "Weather data not available for this location" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      weather: [weatherData]
    })

  } catch (error) {
    console.error("Weather API error:", error)
    
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
