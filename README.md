# AreaScore Kenya

A premium, map-based "Where to buy land in Kenya" web app. Users explore an area and instantly see amenities, road access, and area insights.

## Features

- **Area Explorer**: Search places or drop a pin to see nearby amenities (schools, hospitals, shops, transport)
- **Road Access**: View distance to nearest major roads
- **Area Summary**: Structured counts and nearest items by distance bands (1km, 3km, 5km)
- **Classified Listings**: Land listings with auto-generated nearby amenities
- **Caching**: Area data cached in PostgreSQL for fast subsequent loads

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript
- **UI**: Tailwind CSS + Shadcn UI components
- **Maps**: MapLibre GL JS with OSM/Carto tiles
- **Backend**: Next.js Route Handlers
- **Database**: PostgreSQL with Prisma ORM
- **APIs**: Overpass API (OSM), Nominatim (Geocoding)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ with PostGIS extension
- npm or yarn

### Installation

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Configure `.env`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/areascore
   OVERPASS_USER_AGENT="AreaScore/1.0 (your-email@example.com)"
   ```

5. Enable PostGIS in your database:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

6. Generate Prisma client and push schema:
   ```bash
   npm run db:generate
   npm run db:push
   ```

7. Start development server:
   ```bash
   npm run dev
   ```

8. Open http://localhost:3000

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/geocode?q=...` | Search places (Nominatim) |
| `GET /api/area/summary?lat=&lng=` | Get area amenities summary |
| `GET /api/listings` | List published listings |

## Data Sources

- **OpenStreetMap**: POIs and roads via Overpass API
- **Attribution**: © OpenStreetMap contributors

## License

MIT
