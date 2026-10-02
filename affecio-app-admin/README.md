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

## Deployment

Frontend on **Vercel**, API on **Render** (`https://affecio-app-admin.onrender.com`).

**Vercel (Next.js UI)**

- Root Directory: `affecio-app-admin`
- Env: `NEXT_PUBLIC_ADMIN_API_URL=https://affecio-app-admin.onrender.com/api`
- No backend env vars needed here.

**Render (Express API)**

- Root Directory: `affecio-app-admin/affecio-admin-api`
- Build: `npm install && npm run build` · Start: `npm start` · Health check: `/api/health`
- Env: `NODE_ENV=production`, `DATABASE_URL`, `ADMIN_JWT_SECRET`, `ADMIN_REFRESH_SECRET`, `CORS_ORIGIN=https://<your-vercel-domain>`, R2 keys, optional `REDIS_URL`, `FCM_SERVER_KEY`, `SENTRY_DSN`.

Local dev stays split: `npm run dev` here (`.env.local` → `http://localhost:4001/api`) and `npm run dev` in `affecio-admin-api`.

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
