import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

function getAuthUser(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key")
  const validKey = process.env.ADMIN_API_KEY || "areascore-admin-key"
  
  if (apiKey === validKey) {
    return { id: "admin", email: "admin@areascore.ke" }
  }
  return null
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getAuthUser(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      include: { images: { orderBy: { order: "asc" } } }
    })

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    return NextResponse.json(listing)
  } catch (error) {
    console.error("Get listing error:", error)
    return NextResponse.json({ error: "Failed to fetch listing" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getAuthUser(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      title,
      slug,
      type,
      price,
      sizeValue,
      sizeUnit,
      description,
      contactWhatsapp,
      contactPhone,
      lat,
      lng,
      county,
      town,
      status,
      images
    } = body

    const existing = await prisma.listing.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    const listing = await prisma.listing.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(slug && { slug }),
        ...(type && { type }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(sizeValue !== undefined && { sizeValue: parseFloat(sizeValue) }),
        ...(sizeUnit && { sizeUnit }),
        ...(description !== undefined && { description }),
        ...(contactWhatsapp !== undefined && { contactWhatsapp }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(lat !== undefined && { lat: lat ? parseFloat(lat) : null }),
        ...(lng !== undefined && { lng: lng ? parseFloat(lng) : null }),
        ...(county !== undefined && { county }),
        ...(town !== undefined && { town }),
        ...(status && { status })
      },
      include: { images: { orderBy: { order: "asc" } } }
    })

    if (images && Array.isArray(images)) {
      await prisma.listingImage.deleteMany({
        where: { listingId: params.id }
      })

      if (images.length > 0) {
        await prisma.listingImage.createMany({
          data: images.map((url: string, idx: number) => ({
            listingId: params.id,
            url,
            order: idx
          }))
        })
      }

      const updated = await prisma.listing.findUnique({
        where: { id: params.id },
        include: { images: { orderBy: { order: "asc" } } }
      })

      return NextResponse.json(updated)
    }

    return NextResponse.json(listing)
  } catch (error: any) {
    console.error("Update listing error:", error)
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A listing with this slug already exists" },
        { status: 409 }
      )
    }
    
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getAuthUser(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const listing = await prisma.listing.findUnique({
      where: { id: params.id }
    })

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    await prisma.listing.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete listing error:", error)
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 })
  }
}
