"use client"

import * as React from "react"
import Map, { Marker, NavigationControl, ScaleControl, FullscreenControl } from "react-map-gl"
import mapboxgl from "mapbox-gl"
import { Button } from "@/components/ui/button"
import { LocationSummary } from "@/components/location-summary"
import { useFastDataLoading } from "@/hooks/use-fast-data-loading"
import { 
  MapPin, 
  Navigation, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Loader2, 
  X, 
  Settings, 
  Info, 
  Star, 
  Clock, 
  DollarSign, 
  AlertTriangle,
  Brain,
  History
} from "lucide-react"

interface AdvancedStyledMapViewProps {
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
  onMapStyleChange?: (style: string) => void
  mapStyle?: string
  selectedLayers?: string[]
  onLayerChange?: (layer: string, enabled: boolean) => void
}

const KENYA_CENTER = { lat: -0.0236, lng: 37.9062 }
const DEFAULT_ZOOM = 6
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_ACCESS_TOKEN

// Custom map styles for different purposes
const MAP_STYLES = {
  default: "mapbox://styles/mapbox/streets-v12",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  light: "mapbox://styles/mapbox/light-v11",
  dark: "mapbox://styles/mapbox/dark-v11",
  outdoors: "mapbox://styles/mapbox/outdoors-v12"
}

export function AdvancedStyledMapView({ 
  center = KENYA_CENTER, 
  zoom = DEFAULT_ZOOM,
  markers = [],
  onMarkerClick,
  onMapClick,
  className,
  onMapStyleChange,
  mapStyle: externalMapStyle,
  selectedLayers = [],
  onLayerChange
}: AdvancedStyledMapViewProps) {
  // Fast data loading hook
  const { preloadArea } = useFastDataLoading()
  
  // State for amenities and additional data
  const [amenities, setAmenities] = React.useState<any[]>([])
  const [foursquarePlaces, setFoursquarePlaces] = React.useState<any[]>([])
  const [floodRisk, setFloodRisk] = React.useState<any[]>([])
  const [weather, setWeather] = React.useState<any>(null)
  const [realEstate, setRealEstate] = React.useState<any[]>([])
  const [loadingData, setLoadingData] = React.useState(false)
  
  // AI Analysis State
  const [aiSummary, setAiSummary] = React.useState<any>(null)
  const [loadingAnalysis, setLoadingAnalysis] = React.useState(false)
  const [analysisError, setAnalysisError] = React.useState<string | null>(null)
  const [showAnalysis, setShowAnalysis] = React.useState(false)
  const [sessionHistory, setSessionHistory] = React.useState<any[]>([])
  const [showHistory, setShowHistory] = React.useState(false)
  
  const [mapError, setMapError] = React.useState<string | null>(null)
  const mapStyle = externalMapStyle || MAP_STYLES.satellite
  const [weatherCardDismissed, setWeatherCardDismissed] = React.useState(false)
  const [heatmapData, setHeatmapData] = React.useState<any[]>([])
  const [loadingHeatmap, setLoadingHeatmap] = React.useState(false)
  const mapRef = React.useRef<any>(null)
  const [viewState, setViewState] = React.useState({
    latitude: center.lat,
    longitude: center.lng,
    zoom,
    pitch: 60,
    bearing: -30
  })

  // Helper function to check if layer is enabled
  const isLayerEnabled = (layerId: string) => selectedLayers.includes(layerId)

  // Load weather for specific location when markers change
  React.useEffect(() => {
    if (markers.length > 0) {
      const selectedMarker = markers[markers.length - 1]
      loadWeatherForLocation(selectedMarker.lat, selectedMarker.lng)
    }
  }, [markers])

  // Load heatmap data when heatmap layer is enabled or center changes
  React.useEffect(() => {
    console.log('Heatmap useEffect triggered')
    console.log('Is heatmap enabled:', isLayerEnabled('heatmap'))
    console.log('Center changed:', center)
    
    if (isLayerEnabled('heatmap')) {
      console.log('Loading heatmap data...')
      loadHeatmapData()
    }
  }, [selectedLayers.includes('heatmap'), center])

  // Add manual trigger for testing
  React.useEffect(() => {
    // Add a global function for testing
    if (typeof window !== 'undefined') {
      (window as any).testHeatmap = () => {
        console.log('Manual heatmap trigger')
        loadHeatmapData()
      }
    }
  }, [])

  // Update heatmap when data changes or layer is toggled
  React.useEffect(() => {
    // We'll handle heatmap in the Map component's onLoad
    if (isLayerEnabled('heatmap') && heatmapData.length === 0) {
      loadHeatmapData()
    }
  }, [selectedLayers.includes('heatmap'), center])

  // Update heatmap when data is available
  React.useEffect(() => {
    console.log('Heatmap data changed:', heatmapData.length, 'items')
    console.log('Map ref available:', !!mapRef.current)
    console.log('Heatmap layer enabled:', isLayerEnabled('heatmap'))
    
    if (heatmapData.length > 0 && mapRef.current && isLayerEnabled('heatmap')) {
      console.log('Calling addHeatmapLayerToMap')
      addHeatmapLayerToMap()
    }
  }, [heatmapData, isLayerEnabled('heatmap')])

  // Add heatmap layer to the current map instance
  const addHeatmapLayerToMap = () => {
    console.log('=== ADDING HEATMAP LAYER ===')
    console.log('Map ref:', mapRef.current)
    console.log('Heatmap data length:', heatmapData.length)
    
    if (!mapRef.current) {
      console.error('No map ref available')
      return
    }
    
    if (heatmapData.length === 0) {
      console.error('No heatmap data available')
      return
    }

    // Get the Mapbox map instance from react-map-gl
    const map = mapRef.current
    let mapboxMap = null
    
    // The map ref contains the event object, the actual map is in target
    if (map.target && typeof map.target.addLayer === 'function') {
      mapboxMap = map.target
      console.log('Got map via event target')
    } else if (map.getMap && typeof map.getMap === 'function') {
      mapboxMap = map.getMap()
      console.log('Got map via getMap()')
    } else if (map._map) {
      mapboxMap = map._map
      console.log('Got map via _map property')
    } else if (map.map) {
      mapboxMap = map.map
      console.log('Got map via map property')
    } else if (typeof map.addLayer === 'function') {
      mapboxMap = map
      console.log('Map itself has addLayer method')
    }

    console.log('MapboxMap instance:', mapboxMap)
    console.log('Has addLayer:', typeof mapboxMap?.addLayer === 'function')

    if (!mapboxMap || typeof mapboxMap.addLayer !== 'function') {
      console.error('Could not access Mapbox map instance')
      console.log('Map ref type:', typeof map)
      console.log('Map ref keys:', Object.getOwnPropertyNames(map))
      if (map.target) {
        console.log('Target type:', typeof map.target)
        console.log('Target keys:', Object.getOwnPropertyNames(map.target))
      }
      return
    }

    try {
      // Remove existing layers if they exist
      if (mapboxMap.getLayer('best-places-heatmap')) {
        mapboxMap.removeLayer('best-places-heatmap')
      }
      if (mapboxMap.getLayer('best-places-points')) {
        mapboxMap.removeLayer('best-places-points')
      }
      if (mapboxMap.getSource('heatmap-source')) {
        mapboxMap.removeSource('heatmap-source')
      }

      // Convert heatmap data to GeoJSON format
      const geojsonData = {
        type: 'FeatureCollection',
        features: heatmapData.map((point, index) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [point.lng, point.lat]
          },
          properties: {
            intensity: point.intensity,
            name: point.name,
            county: point.county,
            scores: point.scores,
            // Use intensity as magnitude for the heatmap
            mag: point.intensity * 10 // Scale to 0-10 range like earthquake magnitude
          }
        }))
      }

      console.log('GeoJSON features count:', geojsonData.features.length)

      // Add source
      mapboxMap.addSource('heatmap-source', {
        type: 'geojson',
        data: geojsonData
      })
      console.log('Added heatmap source')

      // Add heatmap layer with the beautiful blue-to-red gradient design
      mapboxMap.addLayer({
        id: 'best-places-heatmap',
        type: 'heatmap',
        source: 'heatmap-source',
        maxzoom: 15,
        paint: {
          // Increase the heatmap weight based on intensity score
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'mag'],
            0,
            0,
            10,
            1
          ],
          // Increase the heatmap intensity by zoom level
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0,
            1,
            15,
            3
          ],
          // Beautiful blue-to-red color ramp from the design
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(33,102,172,0)',
            0.2,
            'rgb(103,169,207)',
            0.4,
            'rgb(209,229,240)',
            0.6,
            'rgb(253,219,199)',
            0.8,
            'rgb(239,138,98)',
            1,
            'rgb(178,24,43)'
          ],
          // Adjust the heatmap radius by zoom level
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0,
            5,
            15,
            40
          ],
          // Transition from heatmap to circle layer by zoom level
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12,
            1,
            15,
            0.5
          ]
        }
      })
      console.log('Added heatmap layer successfully')

      // Add circle layer for high zoom levels
      mapboxMap.addLayer({
        id: 'best-places-points',
        type: 'circle',
        source: 'heatmap-source',
        minzoom: 12,
        paint: {
          // Size circle radius by intensity and zoom level
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12,
            ['interpolate', ['linear'], ['get', 'mag'], 0, 3, 10, 8],
            18,
            ['interpolate', ['linear'], ['get', 'mag'], 0, 6, 10, 20]
          ],
          'circle-emissive-strength': 0.75,
          // Color circle by intensity using the same gradient
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'mag'],
            0,
            'rgba(33,102,172,0)',
            2,
            'rgb(103,169,207)',
            4,
            'rgb(209,229,240)',
            6,
            'rgb(253,219,199)',
            8,
            'rgb(239,138,98)',
            10,
            'rgb(178,24,43)'
          ],
          'circle-stroke-color': 'white',
          'circle-stroke-width': 1,
          // Transition from heatmap to circle layer by zoom level
          'circle-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12,
            0,
            13,
            0.8
          ]
        }
      })
      console.log('Added circle layer successfully')

    } catch (error) {
      console.error('Error adding heatmap layer:', error)
    }
  }

  // Load heatmap data for current view
  const loadHeatmapData = async () => {
    console.log('=== LOADING HEATMAP DATA ===')
    setLoadingHeatmap(true)
    try {
      const response = await fetch('/api/area/heatmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          center: center,
          radius: 0.8 // 80km radius for good coverage
        })
      })
      
      console.log('Heatmap API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Heatmap API response data:', data)
        console.log('Heatmap data length:', data.heatmap?.length || 0)
        
        if (data.heatmap && data.heatmap.length > 0) {
          console.log('Sample heatmap point:', data.heatmap[0])
          setHeatmapData(data.heatmap || [])
        } else {
          console.warn('No heatmap data in response')
        }
      } else {
        console.error('Failed to load heatmap data, status:', response.status)
        const errorText = await response.text()
        console.error('Error response:', errorText)
      }
    } catch (error) {
      console.error('Heatmap loading error:', error)
    } finally {
      setLoadingHeatmap(false)
    }
  }

  // Load all data concurrently when map view changes
  React.useEffect(() => {
    if (viewState.zoom > 12) {
      loadAllAreaData()
    } else {
      loadWeatherForLocation(viewState.latitude, viewState.longitude)
    }
  }, [viewState])

  // Optimized concurrent data loading
  const loadAllAreaData = async () => {
    if (loadingData) return
    
    setLoadingData(true)
    try {
      console.log('Loading all area data concurrently...')
      const data = await preloadArea(viewState.latitude, viewState.longitude, 1000)
      
      // Update all states at once for better performance
      setAmenities(data.amenities)
      setFoursquarePlaces(data.foursquarePlaces)
      setFloodRisk(data.floodRisk)
      setRealEstate(data.realEstate)
      setWeather(data.weather)
      
      console.log('Data loaded:', {
        amenities: data.amenities.length,
        foursquare: data.foursquarePlaces.length,
        floodRisk: data.floodRisk.length,
        realEstate: data.realEstate.length,
        weather: data.weather ? 'loaded' : 'none'
      })
    } catch (error) {
      console.error('Failed to load area data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const loadWeatherForLocation = async (lat: number, lng: number) => {
    try {
      const response = await fetch('/api/area/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      })
      
      if (response.ok) {
        const data = await response.json()
        setWeather(data.weather[0] || null)
      }
    } catch (error) {
      console.error('Failed to load weather:', error)
      setWeather(null)
    }
  }

  // Trigger AI analysis when data is loaded and markers exist
  React.useEffect(() => {
    if (markers.length > 0 && !loadingData && amenities.length > 0) {
      // Auto-trigger analysis when all data is loaded
      const timer = setTimeout(() => {
        loadAIAnalysis()
      }, 1000) // Small delay to ensure all data is settled
      
      return () => clearTimeout(timer)
    }
  }, [markers.length, loadingData, amenities.length])

  const loadAIAnalysis = async () => {
    if (!markers.length) return
    
    setLoadingAnalysis(true)
    setAnalysisError(null)
    
    try {
      const locationName = markers[markers.length - 1].label || 'Selected Location'
      
      const analysisData = {
        name: locationName,
        coordinates: { lat: viewState.latitude, lng: viewState.longitude },
        amenities,
        foursquarePlaces,
        floodRisk: floodRisk[0] || null,
        realEstate,
        weather
      }
      
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisData)
      })
      
      if (response.ok) {
        const summary = await response.json()
        setAiSummary(summary)
        setShowAnalysis(true)
        
        // Add to session history
        const historyItem = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          location: locationName,
          coordinates: { lat: viewState.latitude, lng: viewState.longitude },
          summary: summary
        }
        setSessionHistory(prev => [historyItem, ...prev.slice(0, 9)]) // Keep last 10
      } else {
        throw new Error('Analysis failed')
      }
    } catch (error) {
      console.error('Failed to load AI analysis:', error)
      setAnalysisError('Unable to generate analysis. Please try again.')
    } finally {
      setLoadingAnalysis(false)
    }
  }

  const retryAnalysis = () => {
    loadAIAnalysis()
  }

  const handleMapError = (error: any) => {
    console.error('Mapbox error:', error)
    setMapError('Mapbox failed to load. Try switching to fallback map.')
  }

  const handleMapLoad = (map: any) => {
    console.log('Mapbox loaded successfully')
    setMapError(null)
    mapRef.current = map.target || map

    // Add 3D terrain - the terrain is now handled by the Map component's terrain prop
    console.log('Map loaded with 3D terrain support')

    // Load initial data using the new concurrent loading system
    if (viewState.zoom > 12) {
      loadAllAreaData()
    } else {
      loadWeatherForLocation(viewState.latitude, viewState.longitude)
    }

    console.log('Map loaded, heatmap layer will be added when data is ready')
  }

  const handleMarkerClick = (marker: any, event: any) => {
    event.originalEvent.stopPropagation()
    if (onMarkerClick) onMarkerClick(marker)
    loadWeatherForLocation(marker.lat || marker.location?.lat, marker.lng || marker.location?.lng)
  }

  const handleMapClick = (event: any) => {
    if (onMapClick && event.lngLat) {
      onMapClick(event.lngLat.lat, event.lngLat.lng)
    }
    loadWeatherForLocation(event.lngLat.lat, event.lngLat.lng)
  }

  function getMarkerIcon(category: string): string {
    switch (category) {
      // Education
      case "school": return "EDU"
      case "university": return "UNI"
      case "college": return "COL"
      case "kindergarten": return "KID"
      case "library": return "LIB"
      
      // Healthcare
      case "hospital": return "HOSP"
      case "clinic": return "CLIN"
      case "pharmacy": return "RX"
      case "doctors": return "DOC"
      case "dentist": return "DEN"
      case "veterinary": return "VET"
      
      // Shopping & Services
      case "supermarket": return "MKT"
      case "market": return "MKT"
      case "mall": return "MALL"
      case "convenience": return "CVS"
      case "grocery": return "GRY"
      case "butcher": return "MEAT"
      case "bakery": return "BAK"
      case "bank": return "BANK"
      case "atm": return "ATM"
      case "post_office": return "POST"
      case "money_transfer": return "$"
      
      // Transportation
      case "bus_stop": return "BUS"
      case "bus_station": return "BUS"
      case "taxi": return "TAXI"
      case "fuel": return "GAS"
      case "parking": return "P"
      case "car_rental": return "CAR"
      case "bicycle_rental": return "BIKE"
      
      // Food & Entertainment
      case "restaurant": return "FOOD"
      case "cafe": return "CAF"
      case "fast_food": return "FF"
      case "bar": return "BAR"
      case "pub": return "PUB"
      case "cinema": return "CIN"
      case "theatre": return "THE"
      case "nightclub": return "NIGHT"
      
      // Professional Services
      case "lawyer": return "LAW"
      case "accountant": return "ACC"
      case "insurance": return "INS"
      case "real_estate": return "RE"
      case "coworking_space": return "WORK"
      
      // Government & Community
      case "townhall": return "GOV"
      case "police": return "POL"
      case "fire_station": return "FIRE"
      case "courthouse": return "CRT"
      case "community_centre": return "COMM"
      case "place_of_worship": return "WOR"
      
      // Recreation & Fitness
      case "gym": return "GYM"
      case "fitness_centre": return "FIT"
      case "swimming_pool": return "POOL"
      case "sports_centre": return "SPORT"
      case "park": return "PARK"
      case "playground": return "PLAY"
      case "pitch": return "FIELD"
      
      // Utilities & Infrastructure
      case "telephone": return "TEL"
      case "internet_cafe": return "NET"
      case "public_building": return "PUB"
      case "toilets": return "WC"
      case "drinking_water": return "H2O"
      case "waste_disposal": return "WASTE"
      
      // Safety & Emergency
      case "emergency_phone": return "911"
      case "defibrillator": return "AED"
      case "life_ring": return "SAFE"
      case "fire_hydrant": return "HYD"
      
      // Real Estate Specific
      case "estate_agent": return "AGENT"
      case "construction": return "BUILD"
      case "building_materials": return "MAT"
      case "furniture": return "FURN"
      
      // Agriculture & Rural
      case "farm": return "FARM"
      case "greenhouse": return "GREEN"
      case "farmland": return "LAND"
      case "animal_shelter": return "ANIM"
      case "garden_centre": return "GARD"
      
      default: return "LOC"
    }
  }

  function getMarkerColor(type: string): string {
    switch (type) {
      case "listing": return "bg-orange-500 hover:bg-orange-600"
      case "amenity": return "bg-green-500 hover:bg-green-600"
      case "foursquare": return "bg-purple-500 hover:bg-purple-600"
      case "flood_risk": return "bg-red-500 hover:bg-red-600"
      case "real_estate": return "bg-indigo-500 hover:bg-indigo-600"
      default: return "bg-blue-500 hover:bg-blue-600"
    }
  }

  function getHeatmapColor(intensity: number): string {
    // Intensity ranges from 0 to 1
    if (intensity >= 0.8) return '#ff0000' // Red - Excellent
    if (intensity >= 0.6) return '#ff4500' // Orange Red - Very Good
    if (intensity >= 0.4) return '#ffa500' // Orange - Good
    if (intensity >= 0.2) return '#ffff00' // Yellow - Fair
    return '#00ff00' // Green - Poor (but still shows as green for visibility)
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
              Mapbox access token is not configured.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ minHeight: '400px', width: '100%' }}>
      {/* Error State */}
      {mapError && (
        <div className="absolute top-4 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 z-10">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-700">{mapError}</p>
          </div>
        </div>
      )}

      {/* Enhanced Mapbox Map */}
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleMapClick}
        onError={handleMapError}
        onLoad={handleMapLoad}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={mapStyle}
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
        pitch={60}
        bearing={-30}
        terrain={{
          source: 'mapbox-dem',
          exaggeration: 2.5
        }}
      >
        <NavigationControl position="top-right" showCompass={true} />
        <ScaleControl position="bottom-left" maxWidth={100} unit="metric" />
        <FullscreenControl position="top-right" />

        {/* Weather Card - Bottom Right */}
        {weather && !weatherCardDismissed && (
          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-3 z-10 max-w-xs border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-sm flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Weather
              </h4>
              <button
                onClick={() => setWeatherCardDismissed(true)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="text-xs space-y-1">
              <p><strong>{weather.location}</strong></p>
              <p>{weather.current.conditions}</p>
              <p>{weather.current.temperature} • {weather.current.humidity}</p>
              <p>Wind: {weather.current.windSpeed}</p>
              <p>Elevation: {weather.elevation}m</p>
            </div>
          </div>
        )}

        {/* Weather Restore Button - Bottom Right (when dismissed) */}
        {weather && weatherCardDismissed && (
          <button
            onClick={() => setWeatherCardDismissed(false)}
            className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2 z-10 border border-gray-200 hover:bg-white transition-colors"
            title="Show Weather"
          >
            <Clock className="h-4 w-4 text-gray-600" />
          </button>
        )}

        {/* User markers - show all markers */}
        {markers.map(marker => (
          <Marker
            key={marker.id}
            latitude={marker.lat}
            longitude={marker.lng}
            anchor="bottom"
            onClick={(e) => handleMarkerClick(marker, e)}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer shadow-lg transform hover:scale-110 transition-transform bg-red-500 hover:bg-red-600">
              📍
            </div>
          </Marker>
        ))}

        </Map>

        {/* AI Analysis Sidebar */}
        {showAnalysis && (
          <div className="absolute top-4 left-4 w-96 max-h-[calc(100vh-2rem)] overflow-y-auto bg-white/95 backdrop-blur-sm rounded-xl shadow-xl z-10 border border-gray-200">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-blue-600" />
                  AI Analysis
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                    title="View History"
                  >
                    <History className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setShowAnalysis(false)}
                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              {showHistory ? (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-700">Session History</h4>
                  {sessionHistory.length === 0 ? (
                    <p className="text-sm text-gray-500">No previous analyses</p>
                  ) : (
                    sessionHistory.map(item => (
                      <div
                        key={item.id}
                        className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setAiSummary(item.summary)
                          setShowHistory(false)
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{item.location}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(item.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-lg font-bold text-blue-600">
                            {item.summary.overview.score}/100
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <LocationSummary
                  summary={aiSummary}
                  loading={loadingAnalysis}
                  error={analysisError || undefined}
                  onRetry={retryAnalysis}
                />
              )}
            </div>
          </div>
        )}

        {/* AI Analysis Toggle Button */}
        {!showAnalysis && markers.length > 0 && (
          <button
            onClick={() => setShowAnalysis(true)}
            className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 z-10 border border-gray-200 hover:bg-white transition-colors flex items-center space-x-2"
            title="Show AI Analysis"
          >
            <Brain className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium">AI Analysis</span>
            {loadingAnalysis && <Loader2 className="h-4 w-4 animate-spin" />}
          </button>
        )}
    </div>
  )
}

export default AdvancedStyledMapView
