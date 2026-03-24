'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  MapPin, 
  Shield, 
  Droplets, 
  ShoppingBag, 
  TrendingUp, 
  Star,
  ThumbsUp,
  ThumbsDown,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface AISummary {
  overview: {
    name: string
    score: number
    verdict: string
    strength: string
    risk: string
  }
  categories: {
    safety: { score: number; explanation: string }
    floodResilience: { score: number; explanation: string }
    amenities: { score: number; explanation: string }
    economic: { score: number; explanation: string }
    other: { score: number; explanation: string }
  }
  insights: string[]
  recentNews: string[]
  pros: string[]
  cons: string[]
  recommendation: string
  dataFreshness: string
}

interface LocationSummaryProps {
  summary: AISummary | null
  loading?: boolean
  error?: string
  onRetry?: () => void
}

export function LocationSummary({ summary, loading = false, error, onRetry }: LocationSummaryProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('insights')

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto border-red-200">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Info className="h-12 w-12 text-red-500 mx-auto" />
            <div>
              <h3 className="font-semibold text-red-700">Analysis Unavailable</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
            {onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm">
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Select a location to see AI analysis</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!summary.overview || !summary.categories) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Info className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Analysis data is incomplete. Please retry.</p>
            {onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm" className="mt-3">
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  const getVerdictColor = (verdict: string) => {
    if (verdict.includes('Excellent')) return 'bg-green-100 text-green-800'
    if (verdict.includes('Good')) return 'bg-blue-100 text-blue-800'
    if (verdict.includes('Average')) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{summary.overview?.name ?? "Selected Area"}</CardTitle>
            <Badge className={getVerdictColor(summary.overview?.verdict ?? "")}> 
              {summary.overview?.verdict ?? ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-center mb-4">
            <div className={`text-4xl font-bold ${getScoreColor(summary.overview?.score ?? 0)}`}>
              {summary.overview?.score ?? 0}/100
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <ThumbsUp className="h-4 w-4 text-green-500" />
              <span className="text-green-700">{summary.overview?.strength ?? ""}</span>
            </div>
            <div className="flex items-center space-x-2">
              <ThumbsDown className="h-4 w-4 text-red-500" />
              <span className="text-red-700">{summary.overview?.risk ?? ""}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'safety', label: 'Safety', icon: Shield, weight: '25%' },
            { key: 'floodResilience', label: 'Flood Resilience', icon: Droplets, weight: '20%' },
            { key: 'amenities', label: 'Amenities', icon: ShoppingBag, weight: '25%' },
            { key: 'economic', label: 'Economic', icon: TrendingUp, weight: '20%' },
            { key: 'other', label: 'Other Factors', icon: Star, weight: '10%' }
          ].map(({ key, label, icon: Icon, weight }) => {
            const category = summary.categories[key as keyof typeof summary.categories]
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-sm">{label}</span>
                    <Badge variant="outline" className="text-xs">{weight}</Badge>
                  </div>
                  <span className={`font-bold ${getScoreColor(category?.score ?? 0)}`}>
                    {category?.score ?? 0}/100
                  </span>
                </div>
                <Progress value={category?.score ?? 0} className="h-2" />
                <p className="text-xs text-gray-600">{category?.explanation ?? ""}</p>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Collapsible Sections */}
      {[
        { key: 'insights', title: 'Key Insights', items: summary.insights },
        { key: 'recentNews', title: 'Recent News & Incidents', items: summary.recentNews },
        { key: 'pros', title: 'Pros', items: summary.pros },
        { key: 'cons', title: 'Cons', items: summary.cons }
      ].map(({ key, title, items }) => (
        <Card key={key}>
          <CardHeader 
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection(key)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{title}</CardTitle>
              {expandedSection === key ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </CardHeader>
          {expandedSection === key && (
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {items.map((item, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm">
                    <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                      key === 'recentNews' ? 'bg-orange-500' : 'bg-blue-500'
                    }`} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          )}
        </Card>
      ))}

      {/* Recommendation */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-base text-blue-700">Recommendation</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-gray-700">{summary.recommendation}</p>
        </CardContent>
      </Card>

      {/* Data Freshness */}
      <div className="text-center">
        <p className="text-xs text-gray-500">{summary.dataFreshness}</p>
      </div>
    </div>
  )
}
