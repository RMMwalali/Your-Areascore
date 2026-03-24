import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

export const dynamic = "force-dynamic"

function getAuthUser(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key")
  const validKey = process.env.ADMIN_API_KEY || "areascore-admin-key"
  
  if (apiKey === validKey) {
    return { id: "admin", email: "admin@areascore.ke" }
  }
  return null
}

export async function GET(request: NextRequest) {
  const user = getAuthUser(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const type = searchParams.get("type")
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")

  const where: any = {}
  if (status) where.status = status
  if (type) where.type = type

  try {
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: { images: { orderBy: { order: "asc" } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.listing.count({ where })
    ])

    return NextResponse.json({
      listings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error("Admin listings fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
      status = "DRAFT",
      images = []
    } = body

    if (!title || !type || !price || !sizeValue || !sizeUnit) {
      return NextResponse.json(
        { error: "Missing required fields: title, type, price, sizeValue, sizeUnit" },
        { status: 400 }
      )
    }

    const finalSlug = slug || title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") + "-" + uuidv4().slice(0, 8)

    const listing = await prisma.listing.create({
      data: {
        title,
        slug: finalSlug,
        type,
        price: parseFloat(price),
        sizeValue: parseFloat(sizeValue),
        sizeUnit,
        description,
        contactWhatsapp,
        contactPhone,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        county,
        town,
        status,
        images: {
          create: images.map((url: string, idx: number) => ({
            url,
            order: idx
          }))
        }
      },
      include: { images: { orderBy: { order: "asc" } } }
    })

    return NextResponse.json(listing, { status: 201 })
  } catch (error: any) {
    console.error("Create listing error:", error)
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A listing with this slug already exists" },
        { status: 409 }
      )
    }
    
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 })
  }
}

