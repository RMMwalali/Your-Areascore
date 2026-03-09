import Link from "next/link"
import { Listing } from "@/types"
import { formatPrice, formatSize } from "@/lib/utils"
import { MapPin, Maximize2, ArrowRight } from "lucide-react"

interface ListingCardProps {
  listing: Listing
}

const listingTypeLabels: Record<string, string> = {
  RESIDENTIAL: "Residential Plot",
  INVESTMENT: "Investment Plot",
  ACREAGE: "Acreage / Farm",
  COMMERCIAL: "Commercial",
}

const listingTypeColors: Record<string, string> = {
  RESIDENTIAL: "bg-blue-100 text-blue-800",
  INVESTMENT: "bg-purple-100 text-purple-800",
  ACREAGE: "bg-green-100 text-green-800",
  COMMERCIAL: "bg-orange-100 text-orange-800",
}

export function ListingCard({ listing }: ListingCardProps) {
  const mainImage = listing.images[0]?.url || "/placeholder-land.jpg"

  return (
    <Link 
      href={`/listings/${listing.slug}`}
      className="group block bg-card rounded-lg border overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="aspect-[16/10] relative overflow-hidden bg-muted">
        <img
          src={mainImage}
          alt={listing.title}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${listingTypeColors[listing.type]}`}>
            {listingTypeLabels[listing.type]}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
          {listing.title}
        </h3>
        
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <MapPin className="h-3 w-3" />
          <span className="line-clamp-1">
            {[listing.town, listing.county].filter(Boolean).join(", ") || "Kenya"}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm mb-3">
          <div className="flex items-center gap-1">
            <Maximize2 className="h-3 w-3 text-muted-foreground" />
            <span>{formatSize(listing.sizeValue, listing.sizeUnit)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <span className="text-xl font-bold text-primary">
            {formatPrice(listing.price)}
          </span>
          <span className="flex items-center gap-1 text-sm text-primary font-medium group-hover:gap-2 transition-all">
            View Details
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  )
}

