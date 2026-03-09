'use client'

import * as React from 'react'
import { AreaSummary } from '@/types'
import { formatDistance } from '@/lib/utils'
import { 
  GraduationCap, 
  Building, 
  ShoppingCart, 
  Bus, 
  MapPin,
  Route,
  Loader2
} from 'lucide-react'

interface AreaSummaryPanelProps {
  summary?: AreaSummary
  isLoading?: boolean
  error?: string
}

const categoryIcons: Record<string, React.ElementType> = {
  school: GraduationCap,
  hospital: Building,
  clinic: Building,
  pharmacy: Building,
  supermarket: ShoppingCart,
  market: ShoppingCart,
  bus_stop: Bus,
  bus_station: Bus,
}

const categoryLabels: Record<string, string> = {
  school: 'Schools',
  hospital: 'Hospitals',
  clinic: 'Clinics',
  pharmacy: 'Pharmacies',
  supermarket: 'Supermarkets',
  market: 'Markets',
  bus_stop: 'Bus Stops',
  bus_station: 'Bus Stations',
}

const accessQualityColors: Record<string, string> = {
  excellent: 'text-green-600 bg-green-50',
  good: 'text-lime-600 bg-lime-50',
  fair: 'text-yellow-600 bg-yellow-50',
  poor: 'text-red-600 bg-red-50',
}

export function AreaSummaryPanel({ summary, isLoading, error }: AreaSummaryPanelProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading area data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-lg">
        <p className="font-medium">Error loading area data</p>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">Explore an area</p>
        <p className="text-sm">Search for a location or drop a pin on the map to see amenities and details.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Amenities Overview</h3>
        <div className="grid grid-cols-2 gap-3">
          {summary.counts.map(item => {
            const Icon = categoryIcons[item.category] || MapPin
            return (
              <div 
                key={item.category}
                className="flex items-center gap-3 p-3 bg-muted rounded-lg"
              >
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{item.count}</p>
                  <p className="text-xs text-muted-foreground">
                    {categoryLabels[item.category] || item.category}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {summary.roads && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Road Access</h3>
          <div className="space-y-3">
            <div className={`p-3 rounded-lg ${accessQualityColors[summary.roads.accessQuality]}`}>
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4" />
                <span className="font-medium capitalize">
                  {summary.roads.accessQuality} Access
                </span>
              </div>
            </div>
            
            {summary.roads.nearestRoads.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Nearest Roads</p>
                {summary.roads.nearestRoads.slice(0, 3).map((road, idx) => (
                  <div 
                    key={idx}
                    className="flex justify-between items-center text-sm p-2 bg-muted rounded"
                  >
                    <span className="truncate">{road.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatDistance(road.distance)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {Object.entries(summary.nearestItems).map(([category, items]) => {
        if (items.length === 0) return null
        const Icon = categoryIcons[category] || MapPin
        return (
          <div key={category}>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {categoryLabels[category] || category}
            </h3>
            <div className="space-y-2">
              {items.slice(0, 3).map((item, idx) => (
                <div 
                  key={idx}
                  className="flex justify-between items-center text-sm p-2 bg-muted rounded"
                >
                  <span className="truncate">{item.place.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatDistance(item.distance)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <div className="pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          Data sources: {summary.attribution.join(', ')}
          {summary.cached && ' - Cached'}
        </p>
      </div>
    </div>
  )
}