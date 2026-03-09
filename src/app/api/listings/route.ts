import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { calculateDistance } from "@/lib/utils"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  const type = searchParams.get("type")
  const county = searchParams.get("county")
  const town = searchParams.get("town")
  const minPrice = searchParams.get("minPrice")
  const maxPrice = searchParams.get("maxPrice")
  const minSize = searchParams.get("minSize")
  const maxSize = searchParams.get("maxSize")
  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")
  const radius = searchParams.get("radius")
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")

  const where: any = { status: "PUBLISHED" }

  if (type) where.type = type
  if (county) where.county = county
  if (town) where.town = town
  if (minPrice) where.price = { ...where.price, gte: parseFloat(minPrice) }
  if (maxPrice) where.price = { ...where.price, lte: parseFloat(maxPrice) }
  if (minSize) where.sizeValue = { ...where.sizeValue, gte: parseFloat(minSize) }
  if (maxSize) where.sizeValue = { ...where.sizeValue, lte: parseFloat(maxSize) }

  try {
    const listings = await prisma.listing.findMany({
      where,
      include: { images: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await prisma.listing.count({ where })

    let results = listings.map(l => ({
      ...l,
      distance: lat && lng && l.lat && l.lng 
        ? calculateDistance(parseFloat(lat), parseFloat(lng), l.lat, l.lng)
        : null
    }))

    if (lat && lng && radius) {
      const radiusM = parseFloat(radius)
      results = results.filter(l => l.distance !== null && l.distance <= radiusM)
    }

    return NextResponse.json({
      listings: results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Listings fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 }
    )
  }
}

