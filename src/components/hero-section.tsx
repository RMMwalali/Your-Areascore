'use client'

import * as React from 'react'
import { Search, MapPin, TrendingUp, Shield, Star } from 'lucide-react'
import { SearchInput } from '@/components/search-input'
import { Button } from '@/components/ui/button'

export function HeroSection() {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isSearching, setIsSearching] = React.useState(false)

  const handleSearch = async (query: string) => {
    setIsSearching(true)
    // This will be handled by the parent component
    setTimeout(() => setIsSearching(false), 1000)
  }

  const features = [
    {
      icon: MapPin,
      title: "Comprehensive Data",
      description: "Detailed information about amenities, roads, and infrastructure"
    },
    {
      icon: TrendingUp,
      title: "Area Ratings",
      description: "Objective scores for livability and accessibility"
    },
    {
      icon: Shield,
      title: "Verified Sources",
      description: "Reliable data from official and community sources"
    },
    {
      icon: Star,
      title: "Free Research Tool",
      description: "Open access to location intelligence for everyone"
    }
  ]

  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-gray-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 to-gray-100/20" />
      </div>
      
      <div className="relative container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <MapPin className="h-4 w-4" />
            Kenya's Location Intelligence Platform
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Research Any
            <span className="block text-blue-600">Location in Kenya</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Explore detailed insights about amenities, infrastructure, and resources 
            for any area in Kenya. Make informed decisions with comprehensive location data.
          </p>

          {/* Search Section */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="bg-white rounded-2xl shadow-xl p-2 border border-gray-100">
              <SearchInput 
                onSearch={handleSearch}
                isLoading={isSearching}
                placeholder="Search locations, counties, or landmarks..."
                className="border-0 bg-transparent"
              />
            </div>
            
            {/* Quick Search Tags */}
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'].map((city) => (
                <Button
                  key={city}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSearch(city)}
                  className="rounded-full text-sm hover:bg-emerald-50 hover:border-emerald-300"
                >
                  {city}
                </Button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {[
              { number: '47', label: 'Counties Mapped' },
              { number: '500K+', label: 'Data Points' },
              { number: '15', label: 'Amenity Types' },
              { number: '100%', label: 'Free Access' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
