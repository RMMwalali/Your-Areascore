"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, ZoomIn, ZoomOut, Layers, Loader2, X } from "lucide-react"

// Import both map implementations
import AdvancedStyledMapView from "./map-advanced-styled"
import SimpleMapView from "./map-simple"

interface SmartMapViewProps {
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
  onLayersToggle?: () => void
  showLayers?: boolean
  selectedLayers?: string[]
  onLayerChange?: (layer: string, enabled: boolean) => void
}

export function SmartMapView({ 
  center, 
  zoom,
  markers,
  onMarkerClick,
  onMapClick,
  className,
  onMapStyleChange,
  mapStyle,
  onLayersToggle,
  showLayers,
  selectedLayers,
  onLayerChange
}: SmartMapViewProps) {
  const [mapImplementation, setMapImplementation] = React.useState<'mapbox' | 'maplibre'>('mapbox')
  const [mapboxError, setMapboxError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    // Check if Mapbox token is available
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_ACCESS_TOKEN
    
    if (!mapboxToken) {
      console.log('No Mapbox token found, using MapLibre fallback')
      setMapImplementation('maplibre')
      setIsLoading(false)
      return
    }

    // Try to load Mapbox first
    const timer = setTimeout(() => {
      if (mapboxError) {
        console.log('Mapbox failed, switching to MapLibre fallback')
        setMapImplementation('maplibre')
        setIsLoading(false)
      } else {
        setIsLoading(false)
      }
    }, 5000) // 5 second timeout for Mapbox

    return () => clearTimeout(timer)
  }, [mapboxError])

  const handleMapboxError = (error: string) => {
    console.error('Mapbox error detected:', error)
    setMapboxError(error)
  }

  if (isLoading) {
    return (
      <div className={`relative ${className}`} style={{ minHeight: '400px', width: '100%' }}>
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ minHeight: '400px', width: '100%' }}>
      {/* Map Implementation */}
      {mapImplementation === 'mapbox' ? (
        <AdvancedStyledMapView
          center={center}
          zoom={zoom}
          markers={markers}
          onMarkerClick={onMarkerClick}
          onMapClick={onMapClick}
          className={className}
          onMapStyleChange={onMapStyleChange}
          mapStyle={mapStyle}
          selectedLayers={selectedLayers}
          onLayerChange={onLayerChange}
        />
      ) : (
        <SimpleMapView
          center={center}
          zoom={zoom}
          markers={markers}
          onMarkerClick={onMarkerClick}
          onMapClick={onMapClick}
          className={className}
        />
      )}
    </div>
  )
}

export default SmartMapView
