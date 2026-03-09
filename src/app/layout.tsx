import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"

// Import Mapbox GL CSS globally to fix missing CSS declarations
import "mapbox-gl/dist/mapbox-gl.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "AreaScore Kenya - Find Your Perfect Land",
  description: "Discover the best areas to buy land in Kenya. Explore amenities, road access, and nearby facilities.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={cn(dmSans.variable, "font-sans min-h-screen")}>
        {children}
      </body>
    </html>
  )
}

