'use client'

import * as React from 'react'
import { Listing } from '@/types'
import { ListingCard } from '@/components/listing-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Info } from 'lucide-react'

interface SponsoredListingsProps {
  listings?: Listing[]
  areaName?: string
  className?: string
}

export function SponsoredListings({ 
  listings = [], 
  areaName,
  className 
}: SponsoredListingsProps) {
  const [showAll, setShowAll] = React.useState(false)
  
  // Sample sponsored listings if none provided
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
    }
  ]

  const displayListings = showAll ? sampleListings : sampleListings.slice(0, 2)

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>Available Land Opportunities</span>
            <Badge variant="secondary" className="text-xs">
              Sponsored
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Info className="h-3 w-3" />
            <span>Promoted</span>
          </div>
        </div>
        {areaName && (
          <p className="text-sm text-gray-600">
            Land opportunities in and around {areaName}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Disclaimer */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-primary-800">
              <p className="font-medium mb-1">About Sponsored Listings</p>
              <p>
                These are paid promotions from verified land sellers. 
                Always conduct due diligence and visit properties in person 
                before making any purchase decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>

        {/* Show More Button */}
        {sampleListings.length > 2 && (
          <div className="text-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="gap-2"
            >
              {showAll ? 'Show Less' : `Show All (${sampleListings.length})`}
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* External Link */}
        <div className="text-center pt-2">
          <p className="text-xs text-gray-500 mb-2">
            Looking for more options?
          </p>
          <Button variant="ghost" size="sm" className="text-xs hover:bg-primary-50 hover:text-primary-700">
            View All Land Listings
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
