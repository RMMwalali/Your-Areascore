'use client'

import * as React from 'react'
import { SearchInput } from '@/components/search-input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Search, 
  TrendingUp, 
  BookOpen, 
  Database, 
  Users,
  ArrowRight,
  Info,
  Star,
  Shield
} from 'lucide-react'

interface DashboardHomeProps {
  onSearch: (query: string) => void
  isSearching?: boolean
}

export function DashboardHome({ onSearch, isSearching }: DashboardHomeProps) {
  const handleSearch = (query: string) => {
    onSearch(query)
  }

  const features = [
    {
      icon: Database,
      title: "Comprehensive Data",
      description: "Access detailed information about amenities, infrastructure, and resources for any location in Kenya",
      color: "bg-primary-100 text-primary-600"
    },
    {
      icon: TrendingUp,
      title: "Area Ratings",
      description: "Get objective livability scores based on education, healthcare, transport, and shopping access",
      color: "bg-primary-100 text-primary-600"
    },
    {
      icon: MapPin,
      title: "Interactive Maps",
      description: "Visual exploration with detailed markers for schools, hospitals, markets, and transport hubs",
      color: "bg-primary-100 text-primary-600"
    },
    {
      icon: BookOpen,
      title: "Research Tool",
      description: "Perfect for students, researchers, and curious individuals exploring Kenyan geography",
      color: "bg-primary-100 text-primary-600"
    }
  ]

  const howItWorks = [
    {
      step: 1,
      title: "Search Location",
      description: "Enter any location, county, or landmark in Kenya",
      icon: Search
    },
    {
      step: 2,
      title: "View Analysis",
      description: "See comprehensive data about amenities and infrastructure",
      icon: TrendingUp
    },
    {
      step: 3,
      title: "Get Rating",
      description: "Receive objective livability score with detailed breakdown",
      icon: Star
    },
    {
      step: 4,
      title: "Explore Options",
      description: "Optional: View sponsored land opportunities in the area",
      icon: MapPin
    }
  ]

  const dataSources = [
    { name: "OpenStreetMap", type: "Primary", description: "Community-mapped locations and amenities" },
    { name: "Health Facilities", type: "Official", description: "Kenya Master Health Facility List" },
    { name: "Educational Data", type: "Community", description: "Schools and educational institutions" },
    { name: "Transport Networks", type: "Open Data", description: "Road and public transport information" }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">AreaScore</h1>
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Kenya's Location Intelligence Platform
            </h2>
            
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Research any location in Kenya with comprehensive data about amenities, 
              infrastructure, and livability. Make informed decisions with objective area analysis.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex justify-center">
                <SearchInput 
                  onSearch={handleSearch}
                  isLoading={isSearching}
                  placeholder="Search any location in Kenya..."
                  className="shadow-lg w-full max-w-lg"
                />
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'].map((city) => (
                  <Button
                    key={city}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSearch(city)}
                    className="rounded-full border-primary-200 text-primary-700 hover:bg-primary-50 hover:border-primary-300"
                  >
                    {city}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { number: '47', label: 'Counties', icon: MapPin },
              { number: '500K+', label: 'Data Points', icon: Database },
              { number: '15', label: 'Amenity Types', icon: TrendingUp },
              { number: '100%', label: 'Free Access', icon: Users }
            ].map((stat, index) => (
              <Card key={index} className="text-center border-primary-100 hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <stat.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mx-auto mb-2" />
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">{stat.number}</div>
                  <div className="text-xs sm:text-sm text-gray-600">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Features Grid */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Platform Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${feature.color}`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">How to Use AreaScore</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {howItWorks.map((step, index) => (
                  <Card key={index} className="relative border-primary-100">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {step.step}
                        </div>
                        <CardTitle className="text-base sm:text-lg leading-tight">{step.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </CardContent>
                    {index < howItWorks.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                        <ArrowRight className="h-6 w-6 text-primary-300" />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
          </div>

          {/* Data Sources */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Data Sources</h3>
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {dataSources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-primary-100">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm sm:text-base truncate">{source.name}</h4>
                          <Badge variant={source.type === 'Official' ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                            {source.type}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600">{source.description}</p>
                      </div>
                      <Shield className="h-5 w-5 text-primary-400 flex-shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* About Section */}
          <div className="text-center">
            <Card className="max-w-2xl mx-auto border-primary-100">
              <CardContent className="p-6 sm:p-8">
                <Info className="h-10 w-10 sm:h-12 sm:w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-4">About This Project</h3>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">
                  AreaScore is a free location intelligence tool designed to help people research 
                  any area in Kenya. We provide objective, data-driven insights about amenities, 
                  infrastructure, and livability to support informed decision-making.
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Land listings shown are sponsored content to support the platform's operation. 
                  Always conduct thorough research and due diligence before making any property decisions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
