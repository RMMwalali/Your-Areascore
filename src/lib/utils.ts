import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Simple geohash implementation for caching
const GEOHASH_ALPHABET = "0123456789bcdefghjkmnpqrstuvwxyz"

export function encodeGeohash(lat: number, lng: number, precision: number = 6): string {
  let minLat = -90, maxLat = 90
  let minLng = -180, maxLng = 180
  let bit = 0
  let ch = 0
  let isLong = true
  let geohash = ""

  while (geohash.length < precision) {
    if (isLong) {
      const mid = (minLng + maxLng) / 2
      if (lng >= mid) {
        ch |= 1 << (4 - bit)
        minLng = mid
      } else {
        maxLng = mid
      }
    } else {
      const mid = (minLat + maxLat) / 2
      if (lat >= mid) {
        ch |= 1 << (4 - bit)
        minLat = mid
      } else {
        maxLat = mid
      }
    }
    isLong = !isLong
    if (bit < 4) {
      bit++
    } else {
      geohash += GEOHASH_ALPHABET[ch]
      bit = 0
      ch = 0
    }
  }

  return geohash
}

export function decodeGeohash(hash: string): { lat: number; lng: number } | null {
  let minLat = -90, maxLat = 90
  let minLng = -180, maxLng = 180
  let isLong = true

  for (const char of hash.toLowerCase()) {
    const idx = GEOHASH_ALPHABET.indexOf(char)
    if (idx === -1) return null

    for (let bit = 4; bit >= 0; bit--) {
      const mask = 1 << bit
      if (isLong) {
        const mid = (minLng + maxLng) / 2
        if (idx & mask) {
          minLng = mid
        } else {
          maxLng = mid
        }
      } else {
        const mid = (minLat + maxLat) / 2
        if (idx & mask) {
          minLat = mid
        } else {
          maxLat = mid
        }
      }
      isLong = !isLong
    }
  }

  return {
    lat: (minLat + maxLat) / 2,
    lng: (minLng + maxLng) / 2
  }
}

export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

export function radiusToBBox(centerLat: number, centerLng: number, radiusM: number) {
  const latDelta = radiusM / 111320
  const lngDelta = radiusM / (111320 * Math.cos(toRad(centerLat)))

  return {
    minLat: centerLat - latDelta,
    maxLat: centerLat + latDelta,
    minLng: centerLng - lngDelta,
    maxLng: centerLng + lngDelta
  }
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

export function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `KES ${(price / 1000000).toFixed(1)}M`
  }
  if (price >= 1000) {
    return `KES ${(price / 1000).toFixed(0)}K`
  }
  return `KES ${price}`
}

export function formatSize(value: number, unit: string): string {
  const unitLabels: Record<string, string> = {
    SQM: "sq m",
    SQFT: "sq ft",
    ACRES: "acres",
    HECTARES: "ha",
    PLOT_50X100: "50x100",
    PLOT_40_80: "40x80"
  }
  return `${value.toLocaleString()} ${unitLabels[unit] || unit}`
}
