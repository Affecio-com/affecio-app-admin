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

## Deploy on Vercel (multi-service)

**Vercel project → Settings → General → Root Directory:** `affecio-app-admin` (this folder in the GitHub repo, not the repo root).

If builds fail with `entrypoint "dist/index.js" does not exist`, the deployment is on an **old commit** or the dashboard overrides Entrypoint — redeploy latest `main` and clear any manual Entrypoint on the `affecio-admin-api` service.

Root `vercel.json` deploys two services in one project:

| Service | Role | Public path |
|---------|------|-------------|
| **app** | Next.js admin UI | `/` |
| **affecio-admin-api** | Express + Prisma | `/api/*` |

**Binding:** `app` → `affecio-admin-api` injects `ADMIN_API_URL` (server-side). The browser calls **same-origin** `/api/...`; do not set `NEXT_PUBLIC_ADMIN_API_URL` on Vercel production.

**Environment variables (Vercel dashboard → affecio-admin-api service):** `DATABASE_URL`, `ADMIN_JWT_SECRET`, `ADMIN_REFRESH_SECRET`, R2 keys, optional `REDIS_URL`, `FCM_SERVER_KEY`, `SENTRY_DSN`. Use strong secrets in production.

**Local options**

| Mode | Frontend | API URL |
|------|----------|---------|
| Split (default) | `npm run dev` in repo root | `.env.local` → `http://localhost:4001/api` |
| Unified local | `vercel dev` at repo root | unset `NEXT_PUBLIC_ADMIN_API_URL` (uses `/api`) |

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
