# Affecio Admin Portal

Desktop-only admin UI for Affecio. Connects to **affecio-admin-api** on port **4001** and shares the same PostgreSQL database as the main mobile API (port 4000).

## Setup

```bash
# Frontend (this repo)
cd affecio-app-admin
npm install --prefer-offline --no-audit --no-fund
cp .env.example .env.local

# Backend (sibling folder)
cd ../affecio-admin-api
npm install --prefer-offline --no-audit --no-fund
cp .env.example .env
# Set DATABASE_URL to your shared Postgres — do NOT run migrate reset
npx prisma generate
npm run dev   # http://localhost:4001
```

```bash
# Back in frontend
npm run dev   # http://localhost:3000
```

## Design system

Affecio mobile tokens mapped to Tailwind:

| Token | Value | Usage |
|-------|-------|-------|
| bg | `#000000` | Page background |
| surface | `#111111` | Cards, sidebar |
| input | `#1A1A1A` | Inputs, row hover |
| border | `#2A2A2A` | Borders |
| text | `#FFFFFF` | Headings |
| muted | `#AAAAAA` | Metadata |
| accent | `#FF4B63` | Active nav, CTAs |
| danger | `#FF3B30` | Destructive |
| link | `#4FC3F7` | Links |

Fonts: **Poppins** (body), **PP Mondwest** (titles — add `.woff2` to `public/fonts/`), **PP Neue Bit** (stats).

## Desktop only

Viewports below **1024px** show a full-screen "desktop only" message. Dashboard layout requires **1280px** min width with a **240px** fixed sidebar.

## Database

The admin API uses `prisma db pull` + `prisma db push` on the shared DB. **Never run `prisma migrate reset`.**
