"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Settings, Layers, MapPin, X, ChevronDown, Globe } from "lucide-react"

interface EnhancedSearchBarProps {
  onSearch: (query: string) => void
  isLoading?: boolean
  className?: string
  onMapStyleChange?: (style: string) => void
  currentMapStyle?: string
  onLayersToggle?: () => void
  showLayers?: boolean
  selectedLayers?: string[]
  onLayerChange?: (layer: string, enabled: boolean) => void
}

const MAP_STYLES = [
  { id: "mapbox://styles/mapbox/streets-v12", name: "Streets", icon: "🗺️" },
  { id: "mapbox://styles/mapbox/satellite-streets-v12", name: "Satellite", icon: "🛰️" },
  { id: "mapbox://styles/mapbox/light-v11", name: "Light", icon: "☀️" },
  { id: "mapbox://styles/mapbox/dark-v11", name: "Dark", icon: "🌙" },
  { id: "mapbox://styles/mapbox/outdoors-v12", name: "Outdoors", icon: "🏞️" }
]

const LAYER_OPTIONS = [
  { id: "amenities", name: "🏢 Basic Amenities", icon: "🏢" },
  { id: "foursquare", name: "⭐ Foursquare Places", icon: "⭐" },
  { id: "floodRisk", name: "🌊 Flood Risk", icon: "🌊" },
  { id: "realEstate", name: "🏠 Real Estate", icon: "🏠" },
  { id: "heatmap", name: "🔥 Best Places Heatmap", icon: "🔥" }
]

export function EnhancedSearchBar({ 
  onSearch, 
  isLoading = false, 
  className = "",
  onMapStyleChange,
  currentMapStyle = "mapbox://styles/mapbox/streets-v12",
  onLayersToggle,
  showLayers = false,
  selectedLayers = [],
  onLayerChange
}: EnhancedSearchBarProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [showStyleDropdown, setShowStyleDropdown] = React.useState(false)
  const [showLayerDropdown, setShowLayerDropdown] = React.useState(false)
  const [showMobileMenu, setShowMobileMenu] = React.useState(false)
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim())
    }
  }

  const handleStyleSelect = (styleId: string) => {
    onMapStyleChange?.(styleId)
    setShowStyleDropdown(false)
  }

  const handleLayerToggle = (layerId: string) => {
    const isEnabled = selectedLayers.includes(layerId)
    onLayerChange?.(layerId, !isEnabled)
  }

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowStyleDropdown(false)
        setShowLayerDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentStyle = MAP_STYLES.find(style => style.id === currentMapStyle) || MAP_STYLES[0]

  return (
    <Card className={`shadow-lg border-primary-100 ${className}`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="flex-1 relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search locations in Kenya..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                disabled={isLoading}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>
          </div>

          {/* Desktop: Map Style Selector */}
          <div className="hidden md:block relative" ref={dropdownRef}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowStyleDropdown(!showStyleDropdown)
                setShowLayerDropdown(false)
              }}
              className="flex items-center gap-2 h-10 px-3 bg-white border-gray-200 hover:bg-gray-50"
            >
              <Globe className="h-4 w-4" />
              <span className="text-xs font-medium">{currentStyle.icon} {currentStyle.name}</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${showStyleDropdown ? 'rotate-180' : ''}`} />
            </Button>

            {/* Style Dropdown */}
            {showStyleDropdown && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[150px]">
                {MAP_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => handleStyleSelect(style.id)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors ${
                      style.id === currentMapStyle ? 'bg-primary/10 text-primary' : 'text-gray-700'
                    }`}
                  >
                    <span>{style.icon}</span>
                    <span>{style.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop: Layer Selector */}
          <div className="hidden md:block relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowLayerDropdown(!showLayerDropdown)
                setShowStyleDropdown(false)
              }}
              className="flex items-center gap-2 h-10 px-3 bg-white border-gray-200 hover:bg-gray-50"
            >
              <Layers className="h-4 w-4" />
              <span className="text-xs font-medium">Layers</span>
              {selectedLayers.length > 0 && (
                <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {selectedLayers.length}
                </span>
              )}
              <ChevronDown className={`h-3 w-3 transition-transform ${showLayerDropdown ? 'rotate-180' : ''}`} />
            </Button>

            {/* Layer Dropdown */}
            {showLayerDropdown && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]">
                {LAYER_OPTIONS.map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => handleLayerToggle(layer.id)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors ${
                      selectedLayers.includes(layer.id) ? 'bg-primary/10 text-primary' : 'text-gray-700'
                    }`}
                  >
                    <span>{layer.icon}</span>
                    <span>{layer.name}</span>
                    {selectedLayers.includes(layer.id) && (
                      <span className="ml-auto text-primary">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile: Menu Toggle */}
          <div className="md:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="h-10 px-3 bg-white border-gray-200 hover:bg-gray-50"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Selected Layers Tags */}
        {selectedLayers.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {selectedLayers.map((layerId) => {
              const layer = LAYER_OPTIONS.find(l => l.id === layerId)
              if (!layer) return null
              return (
                <div
                  key={layerId}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                >
                  <span>{layer.icon}</span>
                  <span>{layer.name.split(' ')[1]}</span>
                  <button
                    onClick={() => handleLayerToggle(layerId)}
                    className="ml-1 hover:text-primary/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden mt-3 pt-3 border-t border-gray-200">
            <div className="space-y-3">
              {/* Mobile: Map Style Selector */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">Map Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {MAP_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => handleStyleSelect(style.id)}
                      className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                        style.id === currentMapStyle 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span>{style.icon}</span>
                      <span className="ml-1">{style.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile: Layer Selector */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">Layers</label>
                <div className="space-y-2">
                  {LAYER_OPTIONS.map((layer) => (
                    <button
                      key={layer.id}
                      onClick={() => handleLayerToggle(layer.id)}
                      className={`w-full px-3 py-2 text-xs rounded-lg border transition-colors text-left ${
                        selectedLayers.includes(layer.id) 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{layer.icon}</span>
                        <span>{layer.name}</span>
                        {selectedLayers.includes(layer.id) && (
                          <span className="ml-auto">✓</span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
