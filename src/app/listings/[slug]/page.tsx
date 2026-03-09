import { notFound } from "next/navigation"
import Link from "next/link"
import prisma from "@/lib/db"
import { formatPrice, formatSize } from "@/lib/utils"
import { AreaSummaryPanel } from "@/components/area-summary"
import { MapView } from "@/components/map"
import { MapPin, Phone, MessageCircle, ArrowLeft } from "lucide-react"

interface PageProps {
  params: { slug: string }
}

async function getListing(slug: string) {
  const listing = await prisma.listing.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: { images: { orderBy: { order: "asc" } } }
  })
  return listing
}

async function getAreaSummary(lat: number, lng: number) {
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/area/summary?lat=${lat}&lng=${lng}`,
      { next: { revalidate: 3600 } }
    )
    if (res.ok) {
      return await res.json()
    }
  } catch (error) {
    console.error("Failed to fetch area summary:", error)
  }
  return null
}

export default async function ListingDetailPage({ params }: PageProps) {
  const listing = await getListing(params.slug)
  
  if (!listing) {
    notFound()
  }

  const mainImage = listing.images[0]?.url || "/placeholder-land.jpg"
  const areaSummary = listing.lat && listing.lng 
    ? await getAreaSummary(listing.lat, listing.lng)
    : null

  const listingTypeLabels: Record<string, string> = {
    RESIDENTIAL: "Residential Plot",
    INVESTMENT: "Investment Plot",
    ACREAGE: "Acreage / Farm",
    COMMERCIAL: "Commercial Site",
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Map
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video relative rounded-lg overflow-hidden bg-muted">
              <img
                src={mainImage}
                alt={listing.title}
                className="object-cover w-full h-full"
              />
              {listing.images.length > 1 && (
                <div className="absolute bottom-4 left-4 flex gap-2">
                  {listing.images.slice(0, 5).map((img, idx) => (
                    <div 
                      key={img.id}
                      className={`w-16 h-16 rounded-md overflow-hidden border-2 ${
                        idx === 0 ? "border-white" : "border-transparent"
                      }`}
                    >
                      <img src={img.url} alt="" className="object-cover w-full h-full" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary rounded-full">
                  {listingTypeLabels[listing.type]}
                </span>
                <span className="text-sm text-muted-foreground">
                  {listing.sizeValue} {listing.sizeUnit}
                </span>
              </div>
              <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
              <p className="text-2xl font-bold text-primary">
                {formatPrice(listing.price)}
              </p>
            </div>

            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="h-5 w-5 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">
                  {[listing.town, listing.county].filter(Boolean).join(", ")}
                </p>
                {listing.lat && listing.lng && (
                  <p className="text-sm">
                    {listing.lat.toFixed(4)}, {listing.lng.toFixed(4)}
                  </p>
                )}
              </div>
            </div>

            {listing.lat && listing.lng && (
              <div className="h-64 rounded-lg overflow-hidden">
                <MapView
                  center={{ lat: listing.lat, lng: listing.lng }}
                  zoom={14}
                  markers={[{
                    id: "listing",
                    lat: listing.lat,
                    lng: listing.lng,
                    label: "1",
                    type: "listing"
                  }]}
                  className="h-full w-full"
                />
              </div>
            )}

            {listing.description && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Description</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {listing.description}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-lg border p-6 space-y-4">
              <h2 className="text-lg font-semibold">Contact Seller</h2>
              
              {listing.contactWhatsapp && (
                <a
                  href={`https://wa.me/${listing.contactWhatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp
                </a>
              )}
              
              {listing.contactPhone && (
                <a
                  href={`tel:${listing.contactPhone}`}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Phone className="h-5 w-5" />
                  {listing.contactPhone}
                </a>
              )}
              
              {!listing.contactWhatsapp && !listing.contactPhone && (
                <p className="text-center text-muted-foreground">
                  No contact information available
                </p>
              )}
            </div>

            {areaSummary && (
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-4">Nearby Amenities</h2>
                <AreaSummaryPanel summary={areaSummary} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
