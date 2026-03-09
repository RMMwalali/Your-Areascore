"use client"

import * as React from "react"
import Map, { Marker, NavigationControl } from "react-map-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, ZoomIn, ZoomOut, Layers, Loader2, X } from "lucide-react"

interface AdvancedMapViewProps {
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
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_ACCESS_TOKEN

export function AdvancedMapView({ 
  center = KENYA_CENTER, 
  zoom = DEFAULT_ZOOM,
  markers = [],
  onMarkerClick,
  onMapClick,
  className
}: AdvancedMapViewProps) {
  // State for amenities and additional data
  const [amenities, setAmenities] = React.useState<any[]>([])
  const [floodRisk, setFloodRisk] = React.useState<any[]>([])
  const [weather, setWeather] = React.useState<any>(null)
  const [realEstate, setRealEstate] = React.useState<any[]>([])
  const [loadingAmenities, setLoadingAmenities] = React.useState(false)
  const [loadingFloodRisk, setLoadingFloodRisk] = React.useState(false)
  const [loadingWeather, setLoadingWeather] = React.useState(false)
  const [loadingRealEstate, setLoadingRealEstate] = React.useState(false)
  const [mapError, setMapError] = React.useState<string | null>(null)
  const [showLayers, setShowLayers] = React.useState({
    amenities: true,
    floodRisk: false,
    realEstate: false
  })
  const [viewState, setViewState] = React.useState({
    latitude: center.lat,
    longitude: center.lng,
    zoom
  })

  // Load weather for specific location when markers change
  React.useEffect(() => {
    if (markers.length > 0) {
      const selectedMarker = markers[markers.length - 1] // Use the last marker as selected location
      loadWeatherForLocation(selectedMarker.lat, selectedMarker.lng)
    }
  }, [markers])

  // Load weather for specific coordinates
  const loadWeatherForLocation = async (lat: number, lng: number) => {
    if (loadingWeather) return
    
    setLoadingWeather(true)
    try {
      const response = await fetch('/api/area/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ center: { lat, lng } })
      })
      
      if (response.ok) {
        const data = await response.json()
        setWeather(data.weather[0] || null)
      }
    } catch (error) {
      console.error('Failed to load weather:', error)
      setWeather(null)
    } finally {
      setLoadingWeather(false)
    }
  }

  // Load amenities when map view changes
  React.useEffect(() => {
    if (viewState.zoom > 12) {
      loadAmenities()
      loadFloodRisk()
      loadRealEstate()
    }
    loadWeatherForLocation(viewState.latitude, viewState.longitude)
  }, [viewState])

  const loadAmenities = async () => {
    if (loadingAmenities) return
    
    setLoadingAmenities(true)
    try {
      const bbox = {
        minLat: viewState.latitude - 0.01,
        minLng: viewState.longitude - 0.01,
        maxLat: viewState.latitude + 0.01,
        maxLng: viewState.longitude + 0.01
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
      const bbox = {
        minLat: viewState.latitude - 0.02,
        minLng: viewState.longitude - 0.02,
        maxLat: viewState.latitude + 0.02,
        maxLng: viewState.longitude + 0.02
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

  const loadRealEstate = async () => {
    if (loadingRealEstate) return
    
    setLoadingRealEstate(true)
    try {
      const response = await fetch('/api/area/real-estate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ center: { lat: viewState.latitude, lng: viewState.longitude } })
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

  const handleMapError = (error: any) => {
    console.error('Mapbox error:', error)
    setMapError('Mapbox failed to load. Try switching to fallback map.')
  }

  const handleMapLoad = () => {
    console.log('Mapbox loaded successfully')
    setMapError(null)
  }

  const handleMarkerClick = (marker: any, event: any) => {
    event.originalEvent.stopPropagation()
    if (onMarkerClick) onMarkerClick(marker)
    // Load weather for clicked location
    loadWeatherForLocation(marker.lat || marker.location?.lat, marker.lng || marker.location?.lng)
  }

  const handleMapClick = (event: any) => {
    if (onMapClick && event.lngLat) {
      onMapClick(event.lngLat.lat, event.lngLat.lng)
    }
    // Load weather for clicked location
    loadWeatherForLocation(event.lngLat.lat, event.lngLat.lng)
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
      case "insurance": return "🛡️"
      case "real_estate": return "🏢"
      case "coworking_space": return "💼"
      
      // Government & Community
      case "townhall": return "🏛️"
      case "police": return "👮"
      case "fire_station": return "🚒"
      case "courthouse": return "⚖️"
      case "community_centre": return "🏘️"
      case "place_of_worship": return "⛪"
      
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

  function getMarkerColor(type?: string): string {
    switch (type) {
      case "listing": return "bg-orange-500 hover:bg-orange-600"
      case "amenity": return "bg-green-500 hover:bg-green-600"
      case "flood_risk": return "bg-red-500 hover:bg-red-600"
      case "real_estate": return "bg-purple-500 hover:bg-purple-600"
      default: return "bg-blue-500 hover:bg-blue-600"
    }
  }

  if (!MAPBOX_TOKEN) {
    return (
      <div className={`relative ${className}`} style={{ minHeight: '400px', width: '100%' }}>
        <div className="absolute inset-0 bg-red-50 flex flex-col items-center justify-center">
          <div className="text-center max-w-md p-6">
            <div className="text-red-500 mb-4">
              <X className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Mapbox Token Missing</h3>
            <p className="text-gray-600 mb-4">
              Mapbox access token is not configured. Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your environment variables.
            </p>
          </div>
        </div>
      </div>
    )
  }

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
              <p><strong>Location:</strong> {weather.location}</p>
              <p><strong>Conditions:</strong> {weather.current.conditions}</p>
              <p><strong>Temperature:</strong> {weather.current.temperature}</p>
              <p><strong>Humidity:</strong> {weather.current.humidity}</p>
              <p><strong>Wind:</strong> {weather.current.windSpeed}</p>
              <p><strong>Elevation:</strong> {weather.elevation}m</p>
            </div>
          </div>
        )}
        
        {/* Loading Indicators */}
        {(loadingAmenities || loadingFloodRisk || loadingWeather || loadingRealEstate) && (
          <div className="mt-2 text-xs text-gray-500">
            {loadingWeather && "Loading weather... "}
            {loadingAmenities && "Loading amenities... "}
            {loadingFloodRisk && "Loading flood risk... "}
            {loadingRealEstate && "Loading real estate..."}
          </div>
        )}
      </div>

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
          </div>
        </div>
      )}

      {/* Mapbox Map */}
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleMapClick}
        onError={handleMapError}
        onLoad={handleMapLoad}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" />

        {/* User markers */}
        {markers.map(marker => (
          <Marker
            key={marker.id}
            latitude={marker.lat}
            longitude={marker.lng}
            anchor="bottom"
            onClick={(e) => handleMarkerClick(marker, e)}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer ${getMarkerColor(marker.type)}`}>
              {marker.label || '📍'}
            </div>
          </Marker>
        ))}

        {/* Amenities markers */}
        {showLayers.amenities && amenities.map(amenity => (
          <Marker
            key={`amenity-${amenity.id}`}
            latitude={amenity.lat}
            longitude={amenity.lon}
            anchor="bottom"
            onClick={(e) => handleMarkerClick({...amenity, type: 'amenity'}, e)}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer ${getMarkerColor('amenity')}`}>
              {getMarkerIcon(amenity.category)}
            </div>
          </Marker>
        ))}

        {/* Flood risk markers */}
        {showLayers.floodRisk && floodRisk.map(risk => (
          <Marker
            key={`flood-${risk.lat}-${risk.lng}`}
            latitude={risk.lat}
            longitude={risk.lng}
            anchor="bottom"
            onClick={(e) => handleMarkerClick({...risk, type: 'flood_risk'}, e)}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs cursor-pointer ${risk.risk > 0.7 ? 'bg-red-500' : risk.risk > 0.4 ? 'bg-yellow-500' : 'bg-orange-500'}`}>
              🌊
            </div>
          </Marker>
        ))}

        {/* Real estate markers */}
        {showLayers.realEstate && realEstate.slice(0, 20).map(property => (
          <Marker
            key={`property-${property.id}`}
            latitude={property.location.lat}
            longitude={property.location.lng}
            anchor="bottom"
            onClick={(e) => handleMarkerClick({...property, type: 'real_estate'}, e)}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer ${getMarkerColor('real_estate')}`}>
              🏠
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  )
}

export default AdvancedMapView
