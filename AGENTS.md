# AGENTS.md — CARDS NFC/QR SaaS

## Project overview

NFC/QR card management system. Physical cards contain a permanent URL (`/c/{public_id}`); the digital destination is mutable from an admin panel without touching the physical QR/NFC.

## Stack

- **Frontend**: React 18 + Vite 6 + TypeScript (port 5173 → host 3000)
- **Backend**: Node.js 22 + Express + TypeScript (port 8000, internal)
- **Database**: PostgreSQL 16
- **Tests**: Vitest

## Running the app

```bash
docker compose -f docker-compose.base44.yml up -d
```

Frontend is the web entry point on host port 3000. Vite proxies `/c/*` and `/api/*` to the backend.

## Key conventions

- `public_id` is a 16-char base62 string (crypto.randomBytes + rejection sampling). Never sequential.
- Redirect endpoint returns `302 Found` + `Cache-Control: no-store`. Never `301`.
- Only HTTPS destination URLs are accepted.
- QR encodes the permanent URL, never the destination.
- NFC URL is identical to QR URL.
- Auth: JWT, single admin user. PoC creds: `admin@cards.local` / `admin123`.

## File layout

```
backend/    Express API + redirect resolver
frontend/   React admin panel (Vite)
docs/       architecture, decision log, technical backlog, testing
```

## Environment

- `JWT_SECRET`: required at boot. Delivered via `/run/base44/app.env`; fallback in `.env.base44-defaults`.
- `PUBLIC_BASE_URL` / `VITE_PUBLIC_BASE_URL`: base URL for permanent card URLs. Uses `BASE44_PUBLIC_HOST_SUFFIX` (set by platform).
- `DATABASE_URL`: PostgreSQL connection string (compose service `db`).

## Verifying it works

1. `docker compose -f docker-compose.base44.yml ps` — all services up.
2. `curl -sI http://localhost:3000/c/<public_id>` — expect `302` + `Location` + `Cache-Control: no-store`.
3. Login at `http://localhost:3000` with PoC credentials.
4. Two seed cards (CARD A → WhatsApp, CARD B → menu) are auto-created on first boot.
