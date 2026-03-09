// Geocoding types
export interface GeocodeResult {
  label: string
  lat: number
  lng: number
  bbox?: [number, number, number, number]
  type?: string
  county?: string
  town?: string
}

// Place/POI types
export interface Place {
  id: string
  source: string
  sourceId: string
  name: string
  category: string
  subcategory?: string
  address?: string
  phone?: string
  lat: number
  lng: number
  distance?: number
}

export interface CategoryCount {
  category: string
  count: number
}

export interface NearestItem {
  place: Place
  distance: number
}

export interface RoadStats {
  nearestRoads: {
    name: string
    type: string
    distance: number
  }[]
  accessQuality: 'excellent' | 'good' | 'fair' | 'poor'
}

export interface AreaSummary {
  center: { lat: number; lng: number }
  radius: number
  counts: CategoryCount[]
  nearestItems: Record<string, NearestItem[]>
  roads?: RoadStats
  sources: {
    overpass: boolean
    google: boolean
    foursquare: boolean
  }
  attribution: string[]
  cached: boolean
  expiresAt?: string
}

export interface Listing {
  id: string
  title: string
  slug: string
  type: 'RESIDENTIAL' | 'INVESTMENT' | 'ACREAGE' | 'COMMERCIAL'
  price: number
  currency: string
  sizeValue: number
  sizeUnit: string
  description?: string
  contactWhatsapp?: string
  contactPhone?: string
  lat?: number
  lng?: number
  county?: string
  town?: string
  status: 'DRAFT' | 'PUBLISHED'
  images: ListingImage[]
  nearbyAmenities?: AreaSummary
  createdAt: string
  updatedAt: string
}

export interface ListingImage {
  id: string
  url: string
  order: number
}

export interface ListingFilters {
  type?: string
  county?: string
  town?: string
  minPrice?: number
  maxPrice?: number
  minSize?: number
  maxSize?: number
  bbox?: string
  radius?: number
  lat?: number
  lng?: number
  status?: string
  page?: number
  limit?: number
}

export interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

export interface OverpassResponse {
  version: number
  generator: string
  osm3s: {
    timestamp_osm_base: string
    copyright: string
  }
  elements: OverpassElement[]
}

export interface AreaCacheData {
  id: string
  geohash: string
  radiusM: number
  computed: {
    counts: CategoryCount[]
    nearestItems: Record<string, NearestItem[]>
    roads?: RoadStats
  }
  sourcesUsed: Record<string, boolean>
  expiresAt: Date
}