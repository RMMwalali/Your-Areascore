import { OverpassResponse, OverpassElement } from "@/types"

const DEFAULT_TIMEOUT = parseInt(process.env.OVERPASS_TIMEOUT_SECONDS || "25", 10)

export const OVERPASS_CATEGORIES: Record<string, string[]> = {
  school: ["amenity=school"],
  hospital: ["amenity=hospital"],
  clinic: ["amenity=clinic"],
  pharmacy: ["amenity=pharmacy"],
  supermarket: ["shop=supermarket"],
  market: ["amenity=market"],
  bus_stop: ["highway=bus_stop"],
  bus_station: ["amenity=bus_station"],
  mall: ["shop=mall"],
  convenience: ["shop=convenience"],
  hardware: ["shop=hardware"],
  restaurant: ["amenity=restaurant"],
  bank: ["amenity=bank"],
  atm: ["amenity=atm"],
  fuel: ["amenity=fuel"]
}

export function buildOverpassBBOXQuery(
  minLat: number,
  minLng: number,
  maxLat: number,
  maxLng: number,
  categories?: string[]
): string {
  const cats = categories || Object.keys(OVERPASS_CATEGORIES)
  const filters = cats.flatMap(cat => OVERPASS_CATEGORIES[cat] || [])

  const parts: string[] = []
  for (const filter of filters) {
    parts.push(`node[${filter}](${minLat},${minLng},${maxLat},${maxLng});`)
    parts.push(`way[${filter}](${minLat},${minLng},${maxLat},${maxLng});`)
  }

  if (parts.length === 0) {
    return `[out:json][timeout:${DEFAULT_TIMEOUT}];out center;`
  }

  return `[out:json][timeout:${DEFAULT_TIMEOUT}];(${parts.join("")});out center;`
}

export function buildOverpassAroundQuery(
  lat: number,
  lng: number,
  radiusMeters: number,
  categories?: string[]
): string {
  const cats = categories || Object.keys(OVERPASS_CATEGORIES)
  const filters = cats.flatMap(cat => OVERPASS_CATEGORIES[cat] || [])

  const parts: string[] = []
  for (const filter of filters) {
    parts.push(`node[${filter}](around:${radiusMeters},${lat},${lng});`)
    parts.push(`way[${filter}](around:${radiusMeters},${lat},${lng});`)
  }

  if (parts.length === 0) {
    return `[out:json][timeout:${DEFAULT_TIMEOUT}];out center;`
  }

  return `[out:json][timeout:${DEFAULT_TIMEOUT}];(${parts.join("")});out center;`
}

export function buildOverpassRoadsQuery(
  minLat: number,
  minLng: number,
  maxLat: number,
  maxLng: number
): string {
  const query = "[out:json][timeout:" + DEFAULT_TIMEOUT + "];(" +
    "way[highway=primary](" + minLat + "," + minLng + "," + maxLat + "," + maxLng + ");" +
    "way[highway=secondary](" + minLat + "," + minLng + "," + maxLat + "," + maxLng + ");" +
    "way[highway=tertiary](" + minLat + "," + minLng + "," + maxLat + "," + maxLng + ");" +
    ");out center;"
  
  return query
}

export async function queryOverpass(
  query: string,
  retries = 3,
  backoffMs = 1000
): Promise<OverpassResponse> {
  const baseUrl = process.env.OVERPASS_BASE_URL || "https://overpass-api.de/api/interpreter"
  const userAgent = process.env.OVERPASS_USER_AGENT || "AreaScore/1.0"

  let lastError: Error | null = null

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": userAgent
        },
        body: "data=" + encodeURIComponent(query)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error("Overpass API error: " + response.status + " - " + errorText)
      }

      const data = await response.json()
      return data as OverpassResponse
    } catch (error) {
      lastError = error as Error
      console.error("Overpass query attempt " + (attempt + 1) + " failed:", error)
      
      if (attempt < retries - 1) {
        const delay = backoffMs * Math.pow(2, attempt) + Math.random() * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // Return empty response instead of throwing to prevent total UI failure
  console.warn("Overpass query failed after retries, returning empty data")
  return { 
    elements: [],
    version: 0.6,
    generator: "AreaScore Fallback",
    osm3s: { 
      timestamp_osm_base: new Date().toISOString(),
      copyright: "AreaScore Fallback - No data due to API timeout"
    }
  }
}

export function normalizeOverpassElement(
  element: OverpassElement,
  category: string
): {
  sourceId: string
  name: string
  category: string
  subcategory: string | null
  address: string | null
  phone: string | null
  lat: number
  lng: number
} {
  const lat = element.center?.lat ?? element.lat ?? 0
  const lon = element.center?.lon ?? element.lon ?? 0
  const tags = element.tags || {}

  const name = tags.name || 
    tags["name:en"] || 
    tags["official_name"] ||
    category + " " + element.id

  const address = tags["addr:street"] 
    ? (tags["addr:housenumber"] || "") + " " + tags["addr:street"]
    : null

  const phone = tags.phone || tags["contact:phone"] || null

  let subcategory: string | null = null
  if (tags.amenity) subcategory = tags.amenity
  else if (tags.shop) subcategory = tags.shop
  else if (tags.highway) subcategory = tags.highway

  return {
    sourceId: element.type + "_" + element.id,
    name,
    category,
    subcategory,
    address,
    phone,
    lat,
    lng: lon
  }
}

function getCategoryFromTags(tags: Record<string, string>): string | null {
  if (tags.amenity === "school") return "school"
  if (tags.amenity === "hospital") return "hospital"
  if (tags.amenity === "clinic") return "clinic"
  if (tags.amenity === "pharmacy") return "pharmacy"
  if (tags.amenity === "market") return "market"
  if (tags.amenity === "bus_station") return "bus_station"
  if (tags.amenity === "restaurant") return "restaurant"
  if (tags.amenity === "bank") return "bank"
  if (tags.amenity === "atm") return "atm"
  if (tags.amenity === "fuel") return "fuel"
  if (tags.shop === "supermarket") return "supermarket"
  if (tags.shop === "mall") return "mall"
  if (tags.shop === "convenience") return "convenience"
  if (tags.shop === "hardware") return "hardware"
  if (tags.highway === "bus_stop") return "bus_stop"
  return null
}

export function processOverpassResponse(response: OverpassResponse) {
  const places: ReturnType<typeof normalizeOverpassElement>[] = []

  for (const element of response.elements) {
    const category = getCategoryFromTags(element.tags || {})
    if (!category) continue

    places.push(normalizeOverpassElement(element, category))
  }

  return places
}
