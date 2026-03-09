"use client"

import * as React from "react"
import Map, { Marker, NavigationControl, MapRef, Popup } from "react-map-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { MapPin, Navigation, ZoomIn, ZoomOut, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ModernMapViewProps {
  center?: { lat: number; lng: number }
  zoom?: number
  markers?: Array<{
    id: string
    lat: number
    lng: number
    label?: string
    type?: "default" | "listing" | "amenity"
    category?: string
    name?: string
  }>
  onMarkerClick?: (id: string, marker: any) => void
  onMapClick?: (lat: number, lng: number) => void
  className?: string
  showControls?: boolean
}

const KENYA_CENTER = { lat: -0.0236, lng: 37.9062 }
const DEFAULT_ZOOM = 6

export function ModernMapView({ 
  center = KENYA_CENTER, 
  zoom = DEFAULT_ZOOM,
  markers = [],
  onMarkerClick,
  onMapClick,
  className,
  showControls = true
}: ModernMapViewProps) {
  const mapRef = React.useRef<MapRef>(null)
  const [viewState, setViewState] = React.useState({
    latitude: center.lat,
    longitude: center.lng,
    zoom
  })
  const [selectedMarker, setSelectedMarker] = React.useState<any>(null)
  const [mapStyle, setMapStyle] = React.useState(0)
  const [mapError, setMapError] = React.useState<string | null>(null)

  const mapStyles = [
    "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
    "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
  ]

  const handleMapClick = (e: any) => {
    if (onMapClick && e.lngLat) {
      onMapClick(e.lngLat.lat, e.lngLat.lng)
    }
    // Close popup when clicking on map
    setSelectedMarker(null)
  }

  const handleMarkerClick = (marker: any, e: any) => {
    e.originalEvent.stopPropagation()
    setSelectedMarker(marker)
    onMarkerClick?.(marker.id, marker)
  }

  const zoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn()
    }
  }

  const zoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut()
    }
  }

  const resetView = () => {
    setViewState({
      latitude: center.lat,
      longitude: center.lng,
      zoom
    })
  }

  const cycleMapStyle = () => {
    setMapStyle((prev) => (prev + 1) % mapStyles.length)
  }

  const getMarkerColor = (type?: string) => {
    switch (type) {
      case "listing": return "bg-emerald-600"
      case "amenity": return "bg-blue-600"
      default: return "bg-red-600"
    }
  }

  const getMarkerIcon = (category?: string) => {
    switch (category) {
      case "school": return "🎓"
      case "hospital":
      case "clinic":
      case "pharmacy": return "🏥"
      case "supermarket":
      case "market": return "🛒"
      case "bus_stop":
      case "bus_station": return "🚌"
      default: return "📍"
    }
  }

  return (
    <div className={`relative ${className}`}>
      {mapError ? (
        <div className="h-full bg-gray-100 flex items-center justify-center rounded-lg">
          <div className="text-center p-6">
            <p className="text-red-600 font-medium mb-2">Map Error</p>
            <p className="text-sm text-gray-600 mb-4">{mapError}</p>
            <Button onClick={() => setMapError(null)} size="sm">
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <Map
          ref={mapRef}
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          onClick={handleMapClick}
          onError={() => setMapError('Failed to load map. Please try again.')}
          mapStyle={mapStyles[mapStyle]}
          attributionControl={false}
          className="rounded-lg overflow-hidden"
        >
        {/* Custom Controls */}
        {showControls && (
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button
              size="sm"
              onClick={zoomIn}
              className="bg-white shadow-lg hover:bg-gray-50 text-gray-700 border"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={zoomOut}
              className="bg-white shadow-lg hover:bg-gray-50 text-gray-700 border"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={resetView}
              className="bg-white shadow-lg hover:bg-gray-50 text-gray-700 border"
            >
              <Navigation className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={cycleMapStyle}
              className="bg-white shadow-lg hover:bg-gray-50 text-gray-700 border"
            >
              <Layers className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Markers */}
        {markers.map(marker => (
          <Marker
            key={marker.id}
            latitude={marker.lat}
            longitude={marker.lng}
            anchor="bottom"
            onClick={(e) => handleMarkerClick(marker, e)}
          >
            <div 
              className={`
                w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer
                ${getMarkerColor(marker.type)}
                hover:scale-110 transition-all duration-200 shadow-lg
                ${selectedMarker?.id === marker.id ? 'ring-4 ring-white ring-opacity-50' : ''}
              `}
            >
              {marker.label || getMarkerIcon(marker.category)}
            </div>
          </Marker>
        ))}

        {/* Popup for selected marker */}
        {selectedMarker && (
          <Popup
            latitude={selectedMarker.lat}
            longitude={selectedMarker.lng}
            anchor="bottom"
            onClose={() => setSelectedMarker(null)}
            closeButton={false}
            className="rounded-lg"
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">
                    {getMarkerIcon(selectedMarker.category)}
                  </span>
                  <div>
                    <p className="font-semibold text-sm">{selectedMarker.name}</p>
                    <Badge variant="secondary" className="text-xs">
                      {selectedMarker.category}
                    </Badge>
                  </div>
                </div>
                {selectedMarker.type === "listing" && (
                  <Button size="sm" className="w-full mt-2">
                    View Details
                  </Button>
                )}
              </CardContent>
            </Card>
          </Popup>
        )}
      </Map>
      )}
      
      {/* Attribution */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs text-gray-600">
        Map data: OpenStreetMap contributors
      </div>

      {/* Map Style Indicator */}
      <div className="absolute bottom-4 right-4 flex gap-1">
        {mapStyles.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full ${
              index === mapStyle ? "bg-emerald-600" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export default ModernMapView
