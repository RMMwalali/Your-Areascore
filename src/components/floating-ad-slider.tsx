'use client'

import * as React from 'react'
import { Listing } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, ExternalLink, MapPin, Clock } from 'lucide-react'
import './floating-ad-slider.css'

interface FloatingAdSliderProps {
  listings?: Listing[]
  areaName?: string
  isVisible?: boolean
  onClose?: () => void
  autoCloseDelay?: number // in seconds
}

export function FloatingAdSlider({ 
  listings = [], 
  areaName,
  isVisible = false,
  onClose,
  autoCloseDelay = 9
}: FloatingAdSliderProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [isAnimating, setIsAnimating] = React.useState(false)
  const [timeRemaining, setTimeRemaining] = React.useState(autoCloseDelay)
  const [isPaused, setIsPaused] = React.useState(false)

  // Sample listings if none provided
  const sampleListings: Listing[] = listings.length > 0 ? listings : [
    {
      id: '1',
      title: 'Prime Residential Plot - Nairobi',
      slug: 'prime-residential-plot-nairobi',
      type: 'RESIDENTIAL',
      price: 2500000,
      currency: 'KES',
      sizeValue: 50,
      sizeUnit: 'PLOT_50X100',
      description: 'Well-located residential plot in developing area',
      contactWhatsapp: '+254712345678',
      contactPhone: '+254712345678',
      lat: -1.2921,
      lng: 36.8219,
      county: 'Nairobi',
      town: 'Nairobi',
      status: 'PUBLISHED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      images: []
    },
    {
      id: '2',
      title: 'Investment Land - Kiambu',
      slug: 'investment-land-kiambu',
      type: 'INVESTMENT',
      price: 1800000,
      currency: 'KES',
      sizeValue: 40,
      sizeUnit: 'PLOT_40_80',
      description: 'Great investment opportunity in fast-growing area',
      contactWhatsapp: '+254712345679',
      contactPhone: '+254712345679',
      lat: -1.1716,
      lng: 36.8353,
      county: 'Kiambu',
      town: 'Kiambu',
      status: 'PUBLISHED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      images: []
    },
    {
      id: '3',
      title: 'Commercial Plot - Mombasa',
      slug: 'commercial-plot-mombasa',
      type: 'COMMERCIAL',
      price: 3500000,
      currency: 'KES',
      sizeValue: 60,
      sizeUnit: 'PLOT_50X100',
      description: 'High-traffic commercial location near main road',
      contactWhatsapp: '+254712345680',
      contactPhone: '+254712345680',
      lat: -4.0435,
      lng: 39.6682,
      county: 'Mombasa',
      town: 'Mombasa',
      status: 'PUBLISHED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      images: []
    }
  ]

  const displayListings = sampleListings

  // Auto-advance timer
  React.useEffect(() => {
    if (!isVisible || isPaused) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Move to next listing
          setCurrentIndex((prevIndex) => (prevIndex + 1) % displayListings.length)
          return autoCloseDelay
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isVisible, isPaused, autoCloseDelay, displayListings.length])

  // Auto-close after all listings have been shown
  React.useEffect(() => {
    if (!isVisible) return

    const totalDuration = autoCloseDelay * displayListings.length
    const closeTimer = setTimeout(() => {
      onClose?.()
    }, totalDuration * 1000)

    return () => clearTimeout(closeTimer)
  }, [isVisible, autoCloseDelay, displayListings.length, onClose])

  const handleNext = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % displayListings.length)
      setTimeRemaining(autoCloseDelay)
      setIsAnimating(false)
    }, 300)
  }

  const handlePrevious = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + displayListings.length) % displayListings.length)
      setTimeRemaining(autoCloseDelay)
      setIsAnimating(false)
    }, 300)
  }

  const handleClose = () => {
    onClose?.()
  }

  const currentListing = displayListings[currentIndex]

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE').format(price)
  }

  const formatSize = (value: number, unit: string) => {
    switch (unit) {
      case 'PLOT_50X100': return `${value}x100ft`
      case 'PLOT_40_80': return `${value}x80ft`
      case 'SQM': return `${value}m²`
      case 'SQFT': return `${value}ft²`
      case 'ACRES': return `${value} acres`
      case 'HECTARES': return `${value} hectares`
      default: return `${value} ${unit}`
    }
  }

  if (!isVisible || !currentListing) return null

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 pointer-events-none ${isVisible ? 'floating-ad-enter' : 'floating-ad-exit'}`}>
      <div className="pointer-events-auto">
        {/* Timer Bar */}
        <div className="relative h-1 bg-gray-200 floating-ad-timer">
          <div 
            className="absolute h-full bg-primary-600 transition-all duration-1000 ease-linear"
            style={{ width: `${(timeRemaining / autoCloseDelay) * 100}%` }}
          />
        </div>

        {/* Floating Ad Card */}
        <div className="bg-white border-t border-primary-200 shadow-2xl transform transition-all duration-500 ease-out floating-ad-card">
          <Card className="border-0 rounded-none shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs bg-primary-100 text-primary-700 floating-ad-pulse">
                    Sponsored
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{timeRemaining}s</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {currentIndex + 1} / {displayListings.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="h-6 w-6 p-0 hover:bg-gray-100"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className={`floating-ad-transition ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
                <div className="flex gap-4">
                  {/* Property Image Placeholder */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-8 w-8 text-gray-400" />
                  </div>

                  {/* Property Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-gray-900 mb-1 truncate">
                      {currentListing.title}
                    </h4>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {currentListing.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-bold text-primary-600">
                        KES {formatPrice(currentListing.price)}
                      </span>
                      <span className="text-gray-500">
                        {formatSize(currentListing.sizeValue, currentListing.sizeUnit)}
                      </span>
                      <span className="text-gray-500">
                        {currentListing.county}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      className="bg-primary-600 hover:bg-primary-700 text-white text-xs px-3"
                    >
                      View Details
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs px-3 border-primary-200 text-primary-700 hover:bg-primary-50"
                    >
                      Contact
                    </Button>
                  </div>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  className="text-xs text-gray-500 hover:text-gray-700"
                  disabled={displayListings.length <= 1}
                >
                  ← Previous
                </Button>
                
                {/* Dot Indicators */}
                <div className="flex gap-1">
                  {displayListings.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors floating-ad-transition ${
                        index === currentIndex ? 'bg-primary-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  className="text-xs text-gray-500 hover:text-gray-700"
                  disabled={displayListings.length <= 1}
                >
                  Next →
                </Button>
              </div>

              {/* Disclaimer */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  This is a sponsored listing. Always conduct due diligence before making any purchase decisions.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
