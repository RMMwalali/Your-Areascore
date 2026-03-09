"use client"

import * as React from "react"
import Map, { Marker, NavigationControl, MapRef } from "react-map-gl"
import "maplibre-gl/dist/maplibre-gl.css"

interface MapViewProps {
  center?: { lat: number; lng: number }
  zoom?: number
  markers?: Array<{
    id: string
    lat: number
    lng: number
    label?: string
    type?: "default" | "listing"
  }>
  onMarkerClick?: (id: string) => void
  onMapClick?: (lat: number, lng: number) => void
  className?: string
}

const KENYA_CENTER = { lat: -0.0236, lng: 37.9062 }
const DEFAULT_ZOOM = 6

export function MapView({ 
  center = KENYA_CENTER, 
  zoom = DEFAULT_ZOOM,
  markers = [],
  onMarkerClick,
  onMapClick,
  className 
}: MapViewProps) {
  const mapRef = React.useRef<MapRef>(null)
  const [viewState, setViewState] = React.useState({
    latitude: center.lat,
    longitude: center.lng,
    zoom
  })

  const handleMapClick = (e: any) => {
    if (onMapClick && e.lngLat) {
      onMapClick(e.lngLat.lat, e.lngLat.lng)
    }
  }

  return (
    <div className={className}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
        mapLibreImports={{ maplibre: import("maplibre-gl") }}
        attributionControl={true}
      >
        <NavigationControl position="top-right" />
        
        {markers.map(marker => (
          <Marker
            key={marker.id}
            latitude={marker.lat}
            longitude={marker.lng}
            anchor="bottom"
            onClick={e => {
              e.originalEvent.stopPropagation()
              onMarkerClick?.(marker.id)
            }}
          >
            <div 
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer
                ${marker.type === "listing" ? "bg-green-600" : "bg-blue-600"}
                hover:scale-110 transition-transform
              `}
            >
              {marker.label || "+"}
            </div>
          </Marker>
        ))}
      </Map>
      <p className="text-xs text-muted-foreground mt-1">
        Map data: OpenStreetMap contributors
      </p>
    </div>
  )
}

export default MapView

