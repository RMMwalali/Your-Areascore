import { useCallback, useRef } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>()
  
  set<T>(key: string, data: T, ttl: number = 300000) { // 5 minutes default TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }
  
  clear() {
    this.cache.clear()
  }
  
  // Generate cache key from coordinates and radius
  static geoKey(lat: number, lng: number, radius: number = 1000): string {
    const precision = 4 // ~10m precision
    return `${lat.toFixed(precision)}_${lng.toFixed(precision)}_${radius}`
  }
}

export const dataCache = new DataCache()

// Hook for concurrent data loading with performance optimization
export function useFastDataLoading() {
  const loadingPromises = useRef<Map<string, Promise<any>>>(new Map())
  
  const loadConcurrently = useCallback(async <T>(
    key: string,
    loader: () => Promise<T>,
    ttl: number = 300000
  ): Promise<T> => {
    // Check cache first
    const cached = dataCache.get<T>(key)
    if (cached) {
      console.log(`Cache hit for ${key}`)
      return cached
    }
    
    // Check if already loading
    const existingPromise = loadingPromises.current.get(key)
    if (existingPromise) {
      console.log(`Deduplicated request for ${key}`)
      return existingPromise
    }
    
    // Create new request
    console.log(`Loading data for ${key}`)
    const promise = loader()
    loadingPromises.current.set(key, promise)
    
    try {
      const data = await promise
      dataCache.set(key, data, ttl)
      return data
    } finally {
      loadingPromises.current.delete(key)
    }
  }, [])
  
  const preloadArea = useCallback(async (lat: number, lng: number, radius: number = 1000) => {
    const geoKey = DataCache.geoKey(lat, lng, radius)
    
    // Preload all data types concurrently
    const promises = [
      loadConcurrently(
        `amenities_${geoKey}`,
        () => loadAmenitiesData(lat, lng, radius),
        300000 // 5 minutes
      ),
      loadConcurrently(
        `foursquare_${geoKey}`,
        () => loadFoursquareData(lat, lng, radius),
        600000 // 10 minutes
      ),
      loadConcurrently(
        `flood_${geoKey}`,
        () => loadFloodRiskData(lat, lng),
        600000 // 10 minutes
      ),
      loadConcurrently(
        `realestate_${geoKey}`,
        () => loadRealEstateData(lat, lng),
        300000 // 5 minutes
      ),
      loadConcurrently(
        `weather_${DataCache.geoKey(lat, lng, 1)}`,
        () => loadWeatherData(lat, lng),
        180000 // 3 minutes
      )
    ]
    
    try {
      const results = await Promise.allSettled(promises)
      return {
        amenities: results[0].status === 'fulfilled' ? results[0].value : [],
        foursquarePlaces: results[1].status === 'fulfilled' ? results[1].value : [],
        floodRisk: results[2].status === 'fulfilled' ? results[2].value : [],
        realEstate: results[3].status === 'fulfilled' ? results[3].value : [],
        weather: results[4].status === 'fulfilled' ? results[4].value : null
      }
    } catch (error) {
      console.error('Error preloading area data:', error)
      return {
        amenities: [],
        foursquarePlaces: [],
        floodRisk: [],
        realEstate: [],
        weather: null
      }
    }
  }, [loadConcurrently])
  
  return { loadConcurrently, preloadArea }
}

// Optimized data loading functions
async function loadAmenitiesData(lat: number, lng: number, radius: number) {
  const bbox = {
    minLat: lat - 0.01,
    minLng: lng - 0.01,
    maxLat: lat + 0.01,
    maxLng: lng + 0.01
  }
  
  const response = await fetch('/api/area/amenities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bbox })
  })
  
  if (!response.ok) throw new Error('Amenities request failed')
  const data = await response.json()
  return data.amenities || []
}

async function loadFoursquareData(lat: number, lng: number, radius: number) {
  const response = await fetch('/api/area/foursquare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng, radius })
  })
  
  if (!response.ok) throw new Error('Foursquare request failed')
  const data = await response.json()
  return data.places || []
}

async function loadFloodRiskData(lat: number, lng: number) {
  const bbox = {
    minLat: lat - 0.02,
    minLng: lng - 0.02,
    maxLat: lat + 0.02,
    maxLng: lng + 0.02
  }
  
  const response = await fetch('/api/area/flood-risk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bbox })
  })
  
  if (!response.ok) throw new Error('Flood risk request failed')
  const data = await response.json()
  return data.floodRisk || []
}

async function loadRealEstateData(lat: number, lng: number) {
  const response = await fetch('/api/area/real-estate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ center: { lat, lng } })
  })
  
  if (!response.ok) throw new Error('Real estate request failed')
  const data = await response.json()
  return data.properties || []
}

async function loadWeatherData(lat: number, lng: number) {
  const response = await fetch('/api/area/weather', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng })
  })
  
  if (!response.ok) throw new Error('Weather request failed')
  const data = await response.json()
  return data.weather?.[0] || null
}
