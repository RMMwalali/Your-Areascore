"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, ZoomIn, ZoomOut, Layers, Loader2, X } from "lucide-react"

// Pure MapLibre implementation - no Mapbox dependencies
let maplibregl: any = null

// Dynamic import for MapLibre to handle loading errors
if (typeof window !== 'undefined') {
  try {
    maplibregl = require("maplibre-gl")
  } catch (error) {
    console.error('Failed to import MapLibre GL:', error)
  }
}

interface SimpleMapViewProps {
  center?: { lat: number; lng: number }
  zoom?: number
  markers?: Array<{
    id: string
    lat: number
    lng: number
    label?: string
    type?: "default" | "listing" | "amenity"
    category?: string
  }>
  onMarkerClick?: (marker: any) => void
  onMapClick?: (lat: number, lng: number) => void
  className?: string
}

const KENYA_CENTER = { lat: -0.0236, lng: 37.9062 }
const DEFAULT_ZOOM = 6

export function SimpleMapView({ 
  center = KENYA_CENTER, 
  zoom = DEFAULT_ZOOM,
  markers = [],
  onMarkerClick,
  onMapClick,
  className
}: SimpleMapViewProps) {
  // State for amenities and additional data
  const [amenities, setAmenities] = React.useState<any[]>([])
  const [floodRisk, setFloodRisk] = React.useState<any[]>([])
  const [weather, setWeather] = React.useState<any>(null)
  const [realEstate, setRealEstate] = React.useState<any[]>([])
  const [loadingAmenities, setLoadingAmenities] = React.useState(false)
  const [loadingFloodRisk, setLoadingFloodRisk] = React.useState(false)
  const [loadingWeather, setLoadingWeather] = React.useState(false)
  const [loadingRealEstate, setLoadingRealEstate] = React.useState(false)
  const [map, setMap] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [mapError, setMapError] = React.useState<string | null>(null)
  const [showLayers, setShowLayers] = React.useState({
    amenities: true,
    floodRisk: false,
    realEstate: false
  })
  const mapContainerRef = React.useRef<HTMLDivElement>(null)
  
  // If MapLibre failed to import, show fallback
  if (!maplibregl) {
    console.log('MapLibre GL not available, showing fallback')
    return (
      <div className={`relative ${className}`} style={{ minHeight: '400px', width: '100%' }}>
        <div className="absolute inset-0 bg-blue-50 flex flex-col items-center justify-center">
          <div className="text-center max-w-md p-6">
            <div className="text-blue-500 mb-4">
              <MapPin className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Simple Map View</h3>
            <p className="text-gray-600 mb-4">
              Interactive map unavailable. Showing basic location.
            </p>
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-sm font-medium mb-2">
                {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
              </p>
              <p className="text-xs text-gray-500 mb-3">Kenya Region</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Try Interactive Map
              </button>
            </div>
            {markers.length > 0 && (
              <div className="mt-4 text-xs text-gray-500">
                {markers.length} location(s) marked
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Initialize map
  React.useEffect(() => {
    if (!mapContainerRef.current || map) return

    const mapInstance = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [center.lng, center.lat],
      zoom: zoom,
      attributionControl: false
    })

    mapInstance.on('load', () => {
      console.log('MapLibre loaded successfully')
      setIsLoading(false)
      setMapError(null)
      setMap(mapInstance)
    })

    mapInstance.on('error', (error: any) => {
      console.error('MapLibre error:', error)
      setIsLoading(false)
      setMapError('Map failed to load')
    })

    mapInstance.on('click', (e: any) => {
      if (onMapClick) {
        onMapClick(e.lngLat.lat, e.lngLat.lng)
      }
    })

    // Add controls
    mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right')

    return () => {
      mapInstance.remove()
    }
  }, [center, zoom])

  // Update markers when they change
  React.useEffect(() => {
    if (!map) return

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.maplibregl-marker')
    existingMarkers.forEach(marker => marker.remove())

    // Add user markers
    markers.forEach(marker => {
      const markerEl = document.createElement('div')
      markerEl.className = 'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer bg-blue-500'
      markerEl.textContent = marker.label || '📍'
      markerEl.onclick = () => {
        if (onMarkerClick) onMarkerClick(marker)
      }

      new maplibregl.Marker(markerEl)
        .setLngLat([marker.lng, marker.lat])
        .addTo(map)
    })

    // Add amenities markers
    if (showLayers.amenities) {
      amenities.forEach(amenity => {
        const markerEl = document.createElement('div')
        markerEl.className = 'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer bg-green-500'
        markerEl.textContent = getMarkerIcon(amenity.category)
        markerEl.onclick = () => {
          if (onMarkerClick) onMarkerClick({...amenity, type: 'amenity'})
        }

        new maplibregl.Marker(markerEl)
          .setLngLat([amenity.lon, amenity.lat])
          .addTo(map)
      })
    }

    // Add flood risk markers
    if (showLayers.floodRisk) {
      floodRisk.forEach(risk => {
        const markerEl = document.createElement('div')
        const riskColor = risk.risk > 0.7 ? 'bg-red-500' : risk.risk > 0.4 ? 'bg-yellow-500' : 'bg-orange-500'
        markerEl.className = `w-6 h-6 rounded-full flex items-center justify-center text-white text-xs cursor-pointer ${riskColor}`
        markerEl.textContent = '🌊'
        markerEl.title = `Flood Risk: ${risk.riskLevel} (${(risk.risk * 100).toFixed(1)}%)`
        markerEl.onclick = () => {
          if (onMarkerClick) onMarkerClick({...risk, type: 'flood_risk'})
        }

        new maplibregl.Marker(markerEl)
          .setLngLat([risk.lng, risk.lat])
          .addTo(map)
      })
    }

    // Add real estate markers
    if (showLayers.realEstate) {
      realEstate.slice(0, 20).forEach(property => {
        const markerEl = document.createElement('div')
        markerEl.className = 'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer bg-purple-500'
        markerEl.textContent = '🏠'
        markerEl.title = `${property.specificType} - KES ${property.pricing.price.toLocaleString()}`
        markerEl.onclick = () => {
          if (onMarkerClick) onMarkerClick({...property, type: 'real_estate'})
        }

        new maplibregl.Marker(markerEl)
          .setLngLat([property.location.lng, property.location.lat])
          .addTo(map)
      })
    }
  }, [map, markers, amenities, floodRisk, realEstate, showLayers])

  // Load amenities when map is ready and view changes
  React.useEffect(() => {
    if (!map) return
    
    const loadAmenities = async () => {
      if (loadingAmenities) return
      
      setLoadingAmenities(true)
      try {
        const center = map.getCenter()
        const bbox = {
          minLat: center.lat - 0.01,
          minLng: center.lng - 0.01,
          maxLat: center.lat + 0.01,
          maxLng: center.lng + 0.01
        }
        
        const response = await fetch('/api/area/amenities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bbox })
        })
        
        if (response.ok) {
          const data = await response.json()
          setAmenities(data.amenities || [])
        }
      } catch (error) {
        console.error('Failed to load amenities:', error)
      } finally {
        setLoadingAmenities(false)
      }
    }

    const loadFloodRisk = async () => {
      if (loadingFloodRisk) return
      
      setLoadingFloodRisk(true)
      try {
        const center = map.getCenter()
        const bbox = {
          minLat: center.lat - 0.02,
          minLng: center.lng - 0.02,
          maxLat: center.lat + 0.02,
          maxLng: center.lng + 0.02
        }
        
        const response = await fetch('/api/area/flood-risk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bbox })
        })
        
        if (response.ok) {
          const data = await response.json()
          setFloodRisk(data.floodRisk || [])
        }
      } catch (error) {
        console.error('Failed to load flood risk:', error)
      } finally {
        setLoadingFloodRisk(false)
      }
    }

    const loadWeather = async () => {
      if (loadingWeather) return
      
      setLoadingWeather(true)
      try {
        const center = map.getCenter()
        
        const response = await fetch('/api/area/weather', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ center: { lat: center.lat, lng: center.lng } })
        })
        
        if (response.ok) {
          const data = await response.json()
          setWeather(data.weather[0] || null)
        }
      } catch (error) {
        console.error('Failed to load weather:', error)
      } finally {
        setLoadingWeather(false)
      }
    }

    const loadRealEstate = async () => {
      if (loadingRealEstate) return
      
      setLoadingRealEstate(true)
      try {
        const center = map.getCenter()
        
        const response = await fetch('/api/area/real-estate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ center: { lat: center.lat, lng: center.lng } })
        })
        
        if (response.ok) {
          const data = await response.json()
          setRealEstate(data.properties || [])
        }
      } catch (error) {
        console.error('Failed to load real estate:', error)
      } finally {
        setLoadingRealEstate(false)
      }
    }

    const onZoomEnd = () => {
      if (map.getZoom() > 12) {
        loadAmenities()
        loadFloodRisk()
        loadRealEstate()
      }
      loadWeather()
    }

    const onMoveEnd = () => {
      if (map.getZoom() > 12) {
        loadAmenities()
        loadFloodRisk()
        loadRealEstate()
      }
      loadWeather()
    }

    // Initial load
    onZoomEnd()

    map.on('zoomend', onZoomEnd)
    map.on('moveend', onMoveEnd)
    
    return () => {
      map.off('zoomend', onZoomEnd)
      map.off('moveend', onMoveEnd)
    }
  }, [map, loadingAmenities, loadingFloodRisk, loadingWeather, loadingRealEstate])

  return (
    <div className={`relative ${className}`} style={{ 
      minHeight: '400px', 
      width: '100%', 
      height: '400px',
      position: 'relative',
      backgroundColor: '#f0f0f0',
      border: '1px solid #ddd'
    }}>
      {/* Layer Control Panel */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10 max-w-xs">
        <h4 className="font-semibold text-sm mb-2">Data Layers</h4>
        <div className="space-y-2">
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={showLayers.amenities}
              onChange={(e) => setShowLayers(prev => ({ ...prev, amenities: e.target.checked }))}
              className="mr-2"
            />
            <span>🏢 Amenities</span>
          </label>
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={showLayers.floodRisk}
              onChange={(e) => setShowLayers(prev => ({ ...prev, floodRisk: e.target.checked }))}
              className="mr-2"
            />
            <span>🌊 Flood Risk</span>
          </label>
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={showLayers.realEstate}
              onChange={(e) => setShowLayers(prev => ({ ...prev, realEstate: e.target.checked }))}
              className="mr-2"
            />
            <span>🏠 Real Estate</span>
          </label>
        </div>
        
        {/* Weather Display */}
        {weather && (
          <div className="mt-3 pt-3 border-t">
            <h4 className="font-semibold text-sm mb-1">Weather</h4>
            <div className="text-xs space-y-1">
              <p>{weather.current.conditions}</p>
              <p>{weather.current.temperature}</p>
              <p>{weather.current.humidity}</p>
            </div>
          </div>
        )}
        
        {/* Loading Indicators */}
        {(loadingAmenities || loadingFloodRisk || loadingWeather || loadingRealEstate) && (
          <div className="mt-2 text-xs text-gray-500">
            Loading data...
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center z-10" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {mapError && (
        <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center z-10">
          <div className="text-center max-w-md p-6">
            <div className="text-red-500 mb-4">
              <X className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Map Loading Error</h3>
            <p className="text-gray-600 mb-4">{mapError}</p>
            <Button onClick={() => window.location.reload()} className="mb-2">
              Retry Loading Map
            </Button>
            <p className="text-xs text-gray-500">
              This may be due to network issues or browser compatibility.
            </p>
          </div>
        </div>
      )}

      {/* MapLibre Container */}
      <div 
        ref={mapContainerRef}
        className="w-full h-full" 
        style={{ 
          height: '400px', 
          width: '100%', 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      />
    </div>
  )
}

function getMarkerIcon(category: string): string {
  switch (category) {
    // Education
    case "school": return "🏫"
    case "university": return "🎓"
    case "college": return "📚"
    case "kindergarten": return "🧸"
    case "library": return "📖"
    
    // Healthcare
    case "hospital": return "🏥"
    case "clinic": return "🏥"
    case "pharmacy": return "💊"
    case "doctors": return "👨‍⚕️"
    case "dentist": return "🦷"
    case "veterinary": return "🐾"
    
    // Shopping & Services
    case "supermarket": return "🛒"
    case "market": return "🏪"
    case "mall": return "🛍️"
    case "convenience": return "🏪"
    case "grocery": return "🥬"
    case "butcher": return "🥩"
    case "bakery": return "🥖"
    case "bank": return "🏦"
    case "atm": return "💳"
    case "post_office": return "📮"
    case "money_transfer": return "💸"
    
    // Transportation
    case "bus_stop": return "🚌"
    case "bus_station": return "🚏"
    case "taxi": return "🚕"
    case "fuel": return "⛽"
    case "parking": return "🅿️"
    case "car_rental": return "🚗"
    case "bicycle_rental": return "🚲"
    
    // Food & Entertainment
    case "restaurant": return "🍽️"
    case "cafe": return "☕"
    case "fast_food": return "🍔"
    case "bar": return "🍺"
    case "pub": return "🍺"
    case "cinema": return "🎬"
    case "theatre": return "🎭"
    case "nightclub": return "🕺"
    
    // Professional Services
    case "lawyer": return "⚖️"
    case "accountant": return "🧮"
    // Government & Community
    case "townhall": return "🏛️"
    case "police": return "👮"
    case "fire_station": return "🚒"
    case "courthouse": return "⚖️"
    case "community_centre": return "🏘️"
    case "place_of_worship": return "⛪"
    
    // ... (rest of the code remains the same)
    // Recreation & Fitness
    case "gym": return "🏋️"
    case "fitness_centre": return "🏋️"
    case "swimming_pool": return "🏊"
    case "sports_centre": return "⚽"
    case "park": return "🌳"
    case "playground": return "🎠"
    case "pitch": return "⚽"
    
    // Utilities & Infrastructure
    case "telephone": return "☎️"
    case "internet_cafe": return "💻"
    case "public_building": return "🏢"
    case "toilets": return "🚻"
    case "drinking_water": return "💧"
    case "waste_disposal": return "🗑️"
    
    // Safety & Emergency
    case "emergency_phone": return "📞"
    case "defibrillator": return "❤️"
    case "life_ring": return "⭕"
    case "fire_hydrant": return "🚰"
    
    // Real Estate Specific
    case "estate_agent": return "🏠"
    case "construction": return "🔨"
    case "building_materials": return "🧱"
    case "furniture": return "🪑"
    
    // Agriculture & Rural
    case "farm": return "🚜"
    case "greenhouse": return "🌿"
    case "farmland": return "🌾"
    case "animal_shelter": return "🐄"
    case "garden_centre": return "🌻"
    
    default: return "📍"
  }
}

export default SimpleMapView
