'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { DashboardHome } from '@/components/dashboard-home'
import { LocationSummary } from '@/components/location-summary'
import { AreaRating } from '@/components/area-rating'
import { FloatingAdCard } from '@/components/floating-ad-card'
import { ListingCard } from '@/components/listing-card'
import { GeocodeResult, Listing } from '@/types'
import { MapPin, List, Loader2, X, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { SearchInput } from '@/components/search-input'
import { EnhancedSearchBar } from '@/components/enhanced-search-bar'
import { LayersPanel, LayersState } from '@/components/layers-panel'

const SmartMapView = dynamic(() => import('@/components/map-smart').then(mod => mod.SmartMapView), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-muted flex items-center justify-center rounded-lg">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
})

type ViewMode = 'explore' | 'listings' | 'dashboard'

export default function ModernHomePage() {
  const [viewMode, setViewMode] = React.useState<ViewMode>('dashboard')
  const [searchResults, setSearchResults] = React.useState<GeocodeResult[]>([])
  const [selectedLocation, setSelectedLocation] = React.useState<GeocodeResult | null>(null)
  const [aiSummary, setAiSummary] = React.useState<any>(null)
  const [isSearching, setIsSearching] = React.useState(false)
  const [isLoadingSummary, setIsLoadingSummary] = React.useState(false)
  const [summaryError, setSummaryError] = React.useState<string | null>(null)
  const [layers, setLayers] = React.useState<LayersState>({
    schools: true,
    health: true,
    shopping: true,
    transport: true,
    roads: true
  })
  const [showMobileLayers, setShowMobileLayers] = React.useState(false)
  const [listings, setListings] = React.useState<Listing[]>([])
  const [showMobilePanel, setShowMobilePanel] = React.useState(false)
  const [showFloatingAd, setShowFloatingAd] = React.useState(false)
  const [adCycleCount, setAdCycleCount] = React.useState(0)
  const [currentAdIndex, setCurrentAdIndex] = React.useState(0)
  const [nextAdTimer, setNextAdTimer] = React.useState<NodeJS.Timeout | null>(null)
  const [mapStyle, setMapStyle] = React.useState("mapbox://styles/mapbox/streets-v12")
  const [showMapLayers, setShowMapLayers] = React.useState(true)
  const [selectedLayers, setSelectedLayers] = React.useState<string[]>(["amenities", "foursquare", "heatmap"])

  // Handle automatic ad cycling
  React.useEffect(() => {
    // When an ad closes and we want to schedule the next one
    if (!showFloatingAd && adCycleCount > 0 && viewMode === 'explore' && selectedLocation !== null) {
      // Schedule next ad to appear in 3 minutes
      const timer = setTimeout(() => {
        setShowFloatingAd(true)
      }, 180000) // 3 minutes = 180,000ms
      
      setNextAdTimer(timer)
    }
    // Cleanup timer when conditions change
    return () => {
      if (nextAdTimer) {
        clearTimeout(nextAdTimer)
        setNextAdTimer(null)
      }
    }
  }, [showFloatingAd, adCycleCount, viewMode, selectedLocation])

  // Cleanup timers on unmount
  React.useEffect(() => {
    return () => {
      if (nextAdTimer) {
        clearTimeout(nextAdTimer)
      }
    }
  }, [nextAdTimer])

  const handleSearch = async (query: string) => {
    setIsSearching(true)
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setSearchResults(data.results || [])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const amenityMarkers: Array<{ id: string; lat: number; lng: number; label?: string; type: 'amenity'; category?: string; name?: string }> = React.useMemo(() => {
    if (!aiSummary || !selectedLocation) return []

    // Create a simple marker for the selected location since AI summary doesn't have detailed amenity data
    return [{
      id: 'selected-location',
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      label: selectedLocation.label,
      type: 'amenity' as const,
      category: 'location',
      name: selectedLocation.label
    }]
  }, [aiSummary, selectedLocation])

  const handleSelectResult = async (result: GeocodeResult) => {
    setSelectedLocation(result)
    setSearchResults([])
    setViewMode('explore')
    await loadAIAnalysis(result.lat, result.lng, result.label)
    setShowMobilePanel(true)
    // Show first floating ad after 3 seconds to allow user to see results first
    setTimeout(() => setShowFloatingAd(true), 3000)
  }

  const handleLayerChange = (layerId: string, enabled: boolean) => {
    setSelectedLayers(prev => {
      if (enabled) {
        return [...prev, layerId]
      } else {
        return prev.filter(id => id !== layerId)
      }
    })
  }

  const loadAIAnalysis = async (lat: number, lng: number, locationName: string) => {
    setIsLoadingSummary(true)
    setSummaryError(null)
    try {
      // Get area data first with better error handling
      const [amenitiesRes, foursquareRes, floodRes, realEstateRes, weatherRes, newsRes] = await Promise.allSettled([
        fetch('/api/area/amenities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            bbox: {
              minLat: lat - 0.01,
              minLng: lng - 0.01,
              maxLat: lat + 0.01,
              maxLng: lng + 0.01
            }
          })
        }).catch(err => {
          console.error('Amenities API failed:', err)
          return { status: 'rejected', reason: err };
        }),
        fetch('/api/area/foursquare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng, radius: 1000 })
        }).catch(err => {
          console.error('Foursquare API failed:', err);
          return { status: 'rejected', reason: err };
        }),
        fetch('/api/area/flood-risk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            bbox: {
              minLat: lat - 0.02,
              minLng: lng - 0.02,
              maxLat: lat + 0.02,
              maxLng: lng + 0.02
            }
          })
        }).catch(err => {
          console.error('Flood risk API failed:', err);
          return { status: 'rejected', reason: err };
        }),
        fetch('/api/area/real-estate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ center: { lat, lng } })
        }).catch(err => {
          console.error('Real estate API failed:', err);
          return { status: 'rejected', reason: err };
        }),
        fetch('/api/area/weather', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng })
        }).catch(err => {
          console.error('Weather API failed:', err);
          return { status: 'rejected', reason: err };
        }),
        fetch('/api/area/news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            locationName, 
            lat, 
            lng, 
            radius: 50 
          })
        }).catch(err => {
          console.error('News API failed:', err);
          return { status: 'rejected', reason: err };
        })
      ])

      // Safely extract data with fallbacks
      let amenities = [];
      let foursquarePlaces = [];
      let floodRisk = [];
      let realEstate = [];
      let weather = null;
      let newsData = null;

      try {
        if (amenitiesRes.status === 'fulfilled') {
          const data = await amenitiesRes.value.json();
          amenities = data.amenities || [];
        }
      } catch (err) {
        console.error('Failed to parse amenities data:', err);
      }

      try {
        if (foursquareRes.status === 'fulfilled') {
          const data = await foursquareRes.value.json();
          foursquarePlaces = data.places || [];
        }
      } catch (err) {
        console.error('Failed to parse Foursquare data:', err);
      }

      try {
        if (floodRes.status === 'fulfilled') {
          const data = await floodRes.value.json();
          floodRisk = data.floodRisk || [];
        }
      } catch (err) {
        console.error('Failed to parse flood risk data:', err);
      }

      try {
        if (realEstateRes.status === 'fulfilled') {
          const data = await realEstateRes.value.json();
          realEstate = data.properties || [];
        }
      } catch (err) {
        console.error('Failed to parse real estate data:', err);
      }

      try {
        if (weatherRes.status === 'fulfilled') {
          const data = await weatherRes.value.json();
          weather = data.weather?.[0] || null;
        }
      } catch (err) {
        console.error('Failed to parse weather data:', err);
      }

      try {
        if (newsRes.status === 'fulfilled') {
          const data = await newsRes.value.json();
          newsData = data;
        }
      } catch (err) {
        console.error('Failed to parse news data:', err);
      }

      // Now get AI analysis
      const aiRes = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, locationName })
      });

      console.log('AI analysis response status:', aiRes.status);

      if (!aiRes.ok) {
        const errorText = await aiRes.text();
        console.error('AI analysis failed:', errorText);
        throw new Error(`AI analysis failed: ${aiRes.status}`);
      }

      const aiData = await aiRes.json();
      console.log('AI analysis data received:', aiData);
      setAiSummary(aiData.summary);
    } catch (error) {
      console.error('AI analysis error:', error);
      setAiSummary(null);
      setSummaryError('Unable to generate location analysis. Please try again.');
    } finally {
      setIsLoadingSummary(false);
    }
  }

  const handleMarkerClick = async (marker: any) => {
    const lat = marker.lat || marker.location?.lat
    const lng = marker.lng || marker.location?.lng
    
    if (lat && lng) {
      setSelectedLocation({ 
        label: marker.name || marker.label || 'Selected Location', 
        lat, 
        lng 
      })
      await loadAIAnalysis(lat, lng, marker.name || marker.label || 'Selected Location')
      setShowMobilePanel(true)
    }
  }

  React.useEffect(() => {
    if (viewMode === 'listings') {
      fetch('/api/listings?limit=12')
        .then(res => res.json())
        .then(data => setListings(data.listings || []))
        .catch(console.error)
    }
  }, [viewMode])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl">AreaScore</span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Button
                variant={viewMode === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => setViewMode('dashboard')}
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                Dashboard
              </Button>
              <Button
                variant={viewMode === 'explore' ? 'default' : 'ghost'}
                onClick={() => setViewMode('explore')}
                className="gap-2"
              >
                <MapPin className="h-4 w-4" />
                Research
              </Button>
              <Button
                variant={viewMode === 'listings' ? 'default' : 'ghost'}
                onClick={() => setViewMode('listings')}
                className="gap-2"
              >
                <List className="h-4 w-4" />
                Listings
              </Button>
            </nav>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobilePanel(!showMobilePanel)}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Mode */}
      {viewMode === 'dashboard' && (
        <DashboardHome 
          onSearch={handleSearch}
          isSearching={isSearching}
        />
      )}

      {/* Search Results Dropdown */}
      {searchResults.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Search Results</h3>
              <Button variant="ghost" size="sm" onClick={() => setSearchResults([])}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="divide-y">
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                  onClick={() => handleSelectResult(result)}
                >
                  <p className="font-medium">{result.label}</p>
                  <p className="text-sm text-gray-500">
                    {[result.town, result.county].filter(Boolean).join(', ')}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Research Page Search Results */}
      {viewMode === 'explore' && searchResults.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-32">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Search Results</h3>
              <Button variant="ghost" size="sm" onClick={() => setSearchResults([])}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="divide-y">
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                  onClick={() => handleSelectResult(result)}
                >
                  <p className="font-medium">{result.label}</p>
                  <p className="text-sm text-gray-500">
                    {[result.town, result.county].filter(Boolean).join(', ')}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={viewMode === 'explore' ? 'relative overflow-hidden' : 'relative'}>
        {/* Explore Mode */}
        {viewMode === 'explore' && (
          <div className="h-[calc(100vh-64px)] h-[calc(100dvh-64px)] overflow-hidden">
            <div className="flex h-full min-h-0">
              {/* Desktop Layers Sidebar */}
              <div className="hidden lg:block w-80 bg-white border-r overflow-y-auto h-full min-h-0">
                <div className="p-4">
                  <LayersPanel value={layers} onChange={setLayers} />
                </div>
              </div>

              {/* Map */}
              <div className="flex-1 relative">
                {/* Research Search */}
                <div className="absolute top-4 left-4 right-4 z-10 md:right-auto md:w-[420px]">
                  <EnhancedSearchBar 
                    onSearch={handleSearch} 
                    isLoading={isSearching} 
                    className="max-w-none"
                    onMapStyleChange={setMapStyle}
                    currentMapStyle={mapStyle}
                    onLayersToggle={() => setShowMapLayers(!showMapLayers)}
                    showLayers={showMapLayers}
                    selectedLayers={selectedLayers}
                    onLayerChange={handleLayerChange}
                  />
                </div>

                {/* Mobile Layers Button */}
                <div className="lg:hidden absolute top-4 right-4 z-10">
                  <Button
                    variant="outline"
                    onClick={() => setShowMobileLayers(true)}
                    className="bg-white/95 backdrop-blur-sm shadow-lg border-primary-200"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Layers
                  </Button>
                </div>

                <SmartMapView
                  center={selectedLocation ? { lat: selectedLocation.lat, lng: selectedLocation.lng } : undefined}
                  zoom={selectedLocation ? 14 : 6}
                  markers={[
                    ...(selectedLocation ? [{
                      id: 'selected',
                      lat: selectedLocation.lat,
                      lng: selectedLocation.lng,
                      label: '📍',
                      type: 'default' as const
                    }] : []),
                    ...amenityMarkers
                  ]}
                  onMarkerClick={handleMarkerClick}
                  onMapClick={(lat, lng) => loadAIAnalysis(lat, lng, 'Selected Location')}
                  className="h-full"
                  onMapStyleChange={setMapStyle}
                  mapStyle={mapStyle}
                  onLayersToggle={() => setShowMapLayers(!showMapLayers)}
                  showLayers={showMapLayers}
                  selectedLayers={selectedLayers}
                  onLayerChange={handleLayerChange}
                />

                {/* Mobile Layers Sheet */}
                <LayersPanel
                  isMobile
                  isOpen={showMobileLayers}
                  onClose={() => setShowMobileLayers(false)}
                  value={layers}
                  onChange={setLayers}
                />

                {/* Mobile Floating Action Button */}
                <div className="md:hidden absolute bottom-4 right-4">
                  <Button
                    onClick={() => setShowMobilePanel(!showMobilePanel)}
                    className="rounded-full shadow-lg"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Desktop Sidebar */}
              <div className="hidden md:block w-96 bg-white border-l overflow-y-auto h-full min-h-0">
                <div className="p-6 min-h-0">
                  {selectedLocation && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">
                          {[selectedLocation.town, selectedLocation.county].filter(Boolean).join(', ')}
                        </h2>
                        <Badge variant="outline">
                          {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {summaryError && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {summaryError}
                    </div>
                  )}
                  
                  <LocationSummary 
                    summary={aiSummary}
                    loading={isLoadingSummary}
                    error={summaryError}
                    onRetry={() => selectedLocation && loadAIAnalysis(selectedLocation.lat, selectedLocation.lng, selectedLocation.label)}
                  />
                  
                  {/* Area Rating - Keep for compatibility but may not work with AI summary */}
                  {aiSummary && (
                    <div className="mt-6">
                      <div className="text-center text-sm text-gray-500">
                        AI-powered analysis replaces traditional rating system
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Listings Mode */}
        {viewMode === 'listings' && (
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Location Research Tool</h1>
              <p className="text-gray-600">Comprehensive data about amenities and infrastructure across Kenya</p>
            </div>
            
            {listings.length === 0 ? (
              <Card>
                <CardContent className="text-center py-16">
                  <List className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Start Your Research</h3>
                  <p className="text-gray-500">Search for any location in Kenya to begin exploring area data</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {listings.map(listing => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Panel */}
      {showMobilePanel && viewMode === 'explore' && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setShowMobilePanel(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Area Analysis</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowMobilePanel(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <LocationSummary 
                summary={aiSummary}
                loading={isLoadingSummary}
                error={summaryError}
                onRetry={() => selectedLocation && loadAIAnalysis(selectedLocation.lat, selectedLocation.lng, selectedLocation.label)}
              />
              
              {/* Area Rating - Keep for compatibility but may not work with AI summary */}
              {aiSummary && (
                <div className="mt-6">
                  <div className="text-center text-sm text-gray-500">
                    AI-powered analysis replaces traditional rating system
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Ad Card */}
      <FloatingAdCard
        isVisible={showFloatingAd && viewMode === 'explore' && selectedLocation !== null}
        areaName={selectedLocation?.town || selectedLocation?.county}
        currentAdIndex={currentAdIndex}
        onClose={() => {
          setShowFloatingAd(false)
          setAdCycleCount(prev => prev + 1)
          setCurrentAdIndex(prev => (prev + 1) % 5) // Assuming 5 sample ads
          // The useEffect above will handle scheduling the next ad
        }}
        displayDuration={9}
        nextAdDelay={180} // 3 minutes
      />
    </div>
  )
}
