'use client'

import * as React from 'react'
import { AreaSummary } from '@/types'
import { formatDistance } from '@/lib/utils'
import { 
  GraduationCap, 
  Stethoscope, 
  ShoppingCart, 
  Bus, 
  MapPin,
  Road,
  Loader2,
  TrendingUp,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface ModernAreaSummaryProps {
  summary?: AreaSummary
  isLoading?: boolean
  error?: string
  className?: string
}

const categoryIcons: Record<string, React.ElementType> = {
  school: GraduationCap,
  hospital: Stethoscope,
  clinic: Stethoscope,
  pharmacy: Stethoscope,
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

const accessQualityConfig = {
  excellent: { 
    color: 'bg-green-500', 
    label: 'Excellent Access', 
    icon: CheckCircle2,
    description: 'Very close to major roads'
  },
  good: { 
    color: 'bg-primary-500', 
    label: 'Good Access', 
    icon: CheckCircle2,
    description: 'Reasonable road access'
  },
  fair: { 
    color: 'bg-yellow-500', 
    label: 'Fair Access', 
    icon: AlertCircle,
    description: 'Moderate distance to roads'
  },
  poor: { 
    color: 'bg-red-500', 
    label: 'Limited Access', 
    icon: AlertCircle,
    description: 'Far from major roads'
  },
}

export function ModernAreaSummary({ 
  summary, 
  isLoading, 
  error, 
  className 
}: ModernAreaSummaryProps) {
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">Unable to load area data</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Select a location to see area analysis</p>
        </CardContent>
      </Card>
    )
  }

  const maxCount = Math.max(...summary.counts.map(c => c.count), 1)
  const roadQuality = accessQualityConfig[summary.roads?.accessQuality || 'fair'] as any

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Location Research</h3>
          <p className="text-sm text-gray-500">
            Comprehensive analysis within {summary.radius / 1000}km radius
          </p>
        </div>
        {summary.cached && (
          <Badge variant="secondary" className="text-xs">
            Cached data
          </Badge>
        )}
      </div>

      {/* Road Access Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <roadQuality.icon className="h-5 w-5" />
            Road Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{roadQuality.label}</p>
              <p className="text-sm text-gray-500">{roadQuality.description}</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${roadQuality.color}`} />
          </div>
          
          {summary.roads?.nearestRoads?.slice(0, 3).map((road, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{road.name}</span>
              <span className="font-medium">{formatDistance(road.distance)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Amenities Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            Local Amenities
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {summary.counts.map((category) => {
            const Icon = categoryIcons[category.category]
            const percentage = (category.count / maxCount) * 100
            
            return (
              <div key={category.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary-600" />
                    </div>
                    <span className="font-medium text-sm">
                      {categoryLabels[category.category]}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {category.count}
                  </span>
                </div>
                <Progress 
                  value={percentage} 
                  className="h-2" 
                />
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Nearest Places */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Nearest Facilities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(summary.nearestItems || {}).map(([category, items]) => {
            const Icon = categoryIcons[category]
            const nearestItem = items[0]
            
            if (!nearestItem) return null
            
            return (
              <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border">
                    <Icon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{nearestItem.place.name}</p>
                    <p className="text-xs text-gray-500">{categoryLabels[category]}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatDistance(nearestItem.distance)}</p>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Data Sources */}
      <div className="text-xs text-gray-400 pt-4 border-t">
        <p>Data sources: {summary.attribution?.join(', ') || 'OpenStreetMap'}</p>
        {summary.expiresAt && (
          <p>Updates: {new Date(summary.expiresAt).toLocaleDateString()}</p>
        )}
      </div>
    </div>
  )
}
