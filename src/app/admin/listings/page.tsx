"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Listing } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Loader2,
  ArrowLeft,
  Save
} from "lucide-react"

interface ListingsResponse {
  listings: Listing[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function AdminListingsPage() {
  const router = useRouter()
  const [listings, setListings] = React.useState<Listing[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showForm, setShowForm] = React.useState(false)
  const [editingListing, setEditingListing] = React.useState<Listing | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState<string | null>(null)

  const [formData, setFormData] = React.useState({
    title: "",
    type: "RESIDENTIAL" as 'RESIDENTIAL' | 'INVESTMENT' | 'ACREAGE' | 'COMMERCIAL',
    price: "",
    sizeValue: "",
    sizeUnit: "" as string,
    description: "",
    contactWhatsapp: "",
    contactPhone: "",
    lat: "",
    lng: "",
    county: "",
    town: "",
    status: "DRAFT" as 'DRAFT' | 'PUBLISHED',
    images: ""
  })

  const ADMIN_API_KEY = "areascore-admin-key"

  const fetchListings = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/listings", {
        headers: { "x-api-key": ADMIN_API_KEY }
      })
      if (res.ok) {
        const data: ListingsResponse = await res.json()
        setListings(data.listings)
      }
    } catch (error) {
      console.error("Failed to fetch listings:", error)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchListings()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        sizeValue: parseFloat(formData.sizeValue),
        lat: formData.lat ? parseFloat(formData.lat) : null,
        lng: formData.lng ? parseFloat(formData.lng) : null,
        images: formData.images.split("\n").filter(Boolean)
      }

      const url = editingListing 
        ? `/api/admin/listings/by-id/${editingListing.id}`
        : "/api/admin/listings"
      
      const method = editingListing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ADMIN_API_KEY
        },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setShowForm(false)
        setEditingListing(null)
        resetForm()
        fetchListings()
      } else {
        const error = await res.json()
        alert(error.error || "Failed to save listing")
      }
    } catch (error) {
      console.error("Save error:", error)
      alert("Failed to save listing")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (listing: Listing) => {
    setEditingListing(listing)
    setFormData({
      title: listing.title,
      type: listing.type,
      price: listing.price.toString(),
      sizeValue: listing.sizeValue.toString(),
      sizeUnit: listing.sizeUnit,
      description: listing.description || "",
      contactWhatsapp: listing.contactWhatsapp || "",
      contactPhone: listing.contactPhone || "",
      lat: listing.lat?.toString() || "",
      lng: listing.lng?.toString() || "",
      county: listing.county || "",
      town: listing.town || "",
      status: listing.status,
      images: listing.images.map(i => i.url).join("\n")
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return
    
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/listings/by-id/${id}`, {
        method: "DELETE",
        headers: { "x-api-key": ADMIN_API_KEY }
      })
      
      if (res.ok) {
        fetchListings()
      }
    } catch (error) {
      console.error("Delete error:", error)
    } finally {
      setDeleting(null)
    }
  }

  const handleToggleStatus = async (listing: Listing) => {
    const newStatus = listing.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"
    
    try {
      const res = await fetch(`/api/admin/listings/by-id/${listing.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ADMIN_API_KEY
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (res.ok) {
        fetchListings()
      }
    } catch (error) {
      console.error("Status toggle error:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      type: "RESIDENTIAL",
      price: "",
      sizeValue: "",
      sizeUnit: "SQFT",
      description: "",
      contactWhatsapp: "",
      contactPhone: "",
      lat: "",
      lng: "",
      county: "",
      town: "",
      status: "DRAFT",
      images: ""
    })
  }

  const listingTypeLabels: Record<string, string> = {
    RESIDENTIAL: "Residential",
    INVESTMENT: "Investment",
    ACREAGE: "Acreage",
    COMMERCIAL: "Commercial"
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-white sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => { setShowForm(false); setEditingListing(null); resetForm() }}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-bold">
                {editingListing ? "Edit Listing" : "New Listing"}
              </h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Title *</label>
                <Input
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Prime Plot in Ruiru"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type *</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                >
                  <option value="RESIDENTIAL">Residential</option>
                  <option value="INVESTMENT">Investment</option>
                  <option value="ACREAGE">Acreage</option>
                  <option value="COMMERCIAL">Commercial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Price (KES) *</label>
                <Input
                  required
                  type="number"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  placeholder="5000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Size</label>
                <div className="flex gap-2">
                  <Input
                    required
                    type="number"
                    value={formData.sizeValue}
                    onChange={e => setFormData({ ...formData, sizeValue: e.target.value })}
                    placeholder="50x100"
                    className="flex-1"
                  />
                  <select
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.sizeUnit}
                    onChange={e => setFormData({ ...formData, sizeUnit: e.target.value as any })}
                  >
                    <option value="SQFT">sq ft</option>
                    <option value="SQM">sq m</option>
                    <option value="ACRES">acres</option>
                    <option value="HECTARES">ha</option>
                    <option value="PLOT_50X100">50x100</option>
                    <option value="PLOT_40_80">40x80</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">County</label>
                <Input
                  value={formData.county}
                  onChange={e => setFormData({ ...formData, county: e.target.value })}
                  placeholder="e.g., Kiambu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Town</label>
                <Input
                  value={formData.town}
                  onChange={e => setFormData({ ...formData, town: e.target.value })}
                  placeholder="e.g., Ruiru"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Latitude</label>
                <Input
                  type="number"
                  step="any"
                  value={formData.lat}
                  onChange={e => setFormData({ ...formData, lat: e.target.value })}
                  placeholder="-1.1486"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Longitude</label>
                <Input
                  type="number"
                  step="any"
                  value={formData.lng}
                  onChange={e => setFormData({ ...formData, lng: e.target.value })}
                  placeholder="36.9711"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">WhatsApp</label>
                <Input
                  value={formData.contactWhatsapp}
                  onChange={e => setFormData({ ...formData, contactWhatsapp: e.target.value })}
                  placeholder="254700000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <Input
                  value={formData.contactPhone}
                  onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="254700000000"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the property..."
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Image URLs (one per line)</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                  value={formData.images}
                  onChange={e => setFormData({ ...formData, images: e.target.value })}
                  placeholder="https://example.com/image1.jpg"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {editingListing ? "Update" : "Create"} Listing
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingListing(null); resetForm() }}>
                Cancel
              </Button>
            </div>
          </form>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push("/")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-bold">Manage Listings</h1>
            </div>
            <Button onClick={() => { resetForm(); setShowForm(true) }}>
              <Plus className="h-4 w-4 mr-2" />
              New Listing
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No listings yet.</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Listing
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-medium">Title</th>
                  <th className="text-left p-4 font-medium">Type</th>
                  <th className="text-left p-4 font-medium">Price</th>
                  <th className="text-left p-4 font-medium">Location</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map(listing => (
                  <tr key={listing.id} className="border-t">
                    <td className="p-4">
                      <div className="font-medium">{listing.title}</div>
                      <div className="text-sm text-muted-foreground">{listing.sizeValue} {listing.sizeUnit}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-muted">
                        {listingTypeLabels[listing.type]}
                      </span>
                    </td>
                    <td className="p-4 font-medium">
                      KES {listing.price.toLocaleString()}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {[listing.town, listing.county].filter(Boolean).join(", ") || "-"}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        listing.status === "PUBLISHED" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {listing.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(listing)}
                          title={listing.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                        >
                          {listing.status === "PUBLISHED" 
                            ? <EyeOff className="h-4 w-4" />
                            : <Eye className="h-4 w-4" />
                          }
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(listing)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(listing.id)}
                          disabled={deleting === listing.id}
                        >
                          {deleting === listing.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
