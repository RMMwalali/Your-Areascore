'use client'

import * as React from 'react'
import { AreaSummary } from '@/types'
import { Star, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface AreaRatingProps {
  summary?: AreaSummary
  className?: string
}

interface RatingCategory {
  name: string
  score: number
  weight: number
  description: string
  icon: React.ElementType
  color: string
}

export function AreaRating({ summary, className }: AreaRatingProps) {
  if (!summary) return null

  // Calculate ratings based on area data
  const calculateRatings = (): RatingCategory[] => {
    const counts = summary.counts || []
    const roads = summary.roads
    const radius = summary.radius || 5000

    // Education rating (schools)
    const schoolCount = counts.find(c => c.category === 'school')?.count || 0
    const educationScore = Math.min(100, (schoolCount / 5) * 100) // 5 schools = 100%

    // Health rating (hospitals, clinics, pharmacies)
    const healthCount = counts
      .filter(c => ['hospital', 'clinic', 'pharmacy'].includes(c.category))
      .reduce((sum, c) => sum + c.count, 0)
    const healthScore = Math.min(100, (healthCount / 3) * 100) // 3 facilities = 100%

    // Shopping rating (supermarkets, markets)
    const shoppingCount = counts
      .filter(c => ['supermarket', 'market'].includes(c.category))
      .reduce((sum, c) => sum + c.count, 0)
    const shoppingScore = Math.min(100, (shoppingCount / 3) * 100) // 3 facilities = 100%

    // Transport rating (bus stops, stations)
    const transportCount = counts
      .filter(c => ['bus_stop', 'bus_station'].includes(c.category))
      .reduce((sum, c) => sum + c.count, 0)
    const transportScore = Math.min(100, (transportCount / 10) * 100) // 10 stops = 100%

    // Road access rating
    const roadAccessScore = roads?.accessQuality === 'excellent' ? 100 :
                           roads?.accessQuality === 'good' ? 75 :
                           roads?.accessQuality === 'fair' ? 50 : 25

    return [
      {
        name: 'Education',
        score: educationScore,
        weight: 0.25,
        description: `${schoolCount} schools within ${radius/1000}km`,
        icon: TrendingUp,
        color: 'bg-primary-500'
      },
      {
        name: 'Healthcare',
        score: healthScore,
        weight: 0.25,
        description: `${healthCount} facilities within ${radius/1000}km`,
        icon: CheckCircle2,
        color: 'bg-primary-500'
      },
      {
        name: 'Shopping',
        score: shoppingScore,
        weight: 0.2,
        description: `${shoppingCount} markets within ${radius/1000}km`,
        icon: Star,
        color: 'bg-primary-500'
      },
      {
        name: 'Transport',
        score: transportScore,
        weight: 0.2,
        description: `${transportCount} transport points within ${radius/1000}km`,
        icon: AlertTriangle,
        color: 'bg-primary-500'
      },
      {
        name: 'Road Access',
        score: roadAccessScore,
        weight: 0.1,
        description: roads?.accessQuality || 'Unknown access',
        icon: TrendingUp,
        color: 'bg-gray-500'
      }
    ]
  }

  const ratings = calculateRatings()
  
  // Calculate overall score
  const overallScore = Math.round(
    ratings.reduce((sum, rating) => sum + (rating.score * rating.weight), 0)
  )

  const getGrade = (score: number) => {
    if (score >= 85) return { grade: 'A', color: 'text-green-600 bg-green-50', description: 'Excellent' }
    if (score >= 70) return { grade: 'B', color: 'text-primary-600 bg-primary-50', description: 'Good' }
    if (score >= 55) return { grade: 'C', color: 'text-yellow-600 bg-yellow-50', description: 'Average' }
    if (score >= 40) return { grade: 'D', color: 'text-orange-600 bg-orange-50', description: 'Below Average' }
    return { grade: 'F', color: 'text-red-600 bg-red-50', description: 'Poor' }
  }

  const grade = getGrade(overallScore)

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary-600" />
            Area Livability Rating
          </span>
          <Badge className={grade.color}>
            Grade {grade.grade} - {grade.description}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900 mb-2">{overallScore}/100</div>
          <Progress value={overallScore} className="h-3 mb-2" />
          <p className="text-sm text-gray-600">Overall livability score</p>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-4">
          {ratings.map((rating) => {
            const Icon = rating.icon
            return (
              <div key={rating.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 ${rating.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{rating.name}</p>
                      <p className="text-xs text-gray-500">{rating.description}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold">{Math.round(rating.score)}</span>
                </div>
                <Progress value={rating.score} className="h-2" />
              </div>
            )
          })}
        </div>

        {/* Insights */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2">Key Insights</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            {overallScore >= 70 && (
              <li>• This area has good overall infrastructure and amenities</li>
            )}
            {ratings.find(r => r.name === 'Education')?.score >= 70 && (
              <li>• Strong educational facilities in the vicinity</li>
            )}
            {ratings.find(r => r.name === 'Healthcare')?.score >= 70 && (
              <li>• Good healthcare access for residents</li>
            )}
            {ratings.find(r => r.name === 'Transport')?.score < 50 && (
              <li>• Limited public transport options available</li>
            )}
            {ratings.find(r => r.name === 'Shopping')?.score < 50 && (
              <li>• Few shopping and market facilities nearby</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
