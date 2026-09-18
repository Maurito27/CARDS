# CARDS — NFC/QR SaaS

## Architecture

```
QR / NFC permanente → URL permanente /c/{public_id} → backend resolver → 302 → destination_url
```

### Components

- **Frontend** (`frontend/`): React + Vite + TypeScript. Admin panel for card management. Runs on port 5173 (mapped to host 3000). Proxies `/c/*` and `/api/*` to the backend.
- **Backend** (`backend/`): Node.js + Express + TypeScript. Serves the public redirect resolver (`GET /c/:publicId`) and the protected admin API (`/api/cards/*`). Runs on port 8000.
- **Database** (`db`): PostgreSQL 16. Stores cards, destination history, and access logs.

### Key design decisions

- `public_id` is a 16-char base62 string (~95 bits entropy), generated with `crypto.randomBytes` + rejection sampling. Separate from the internal UUID.
- Redirect uses `302 Found` (never `301`) with `Cache-Control: no-store`.
- Only HTTPS destination URLs are accepted (syntactic + policy validation).
- QR encodes the permanent URL (`PUBLIC_BASE_URL + /c/ + public_id`), never the destination.
- NFC URL is identical to the QR URL.
- Auth: JWT-based, single admin user. PoC credentials: `admin@cards.local` / `admin123`.

### Dev environment

```bash
docker compose -f docker-compose.base44.yml up -d
```

Frontend: http://localhost:3000
API: http://localhost:8000 (proxied through frontend)

### Running tests

```bash
cd backend && npm test
```

### Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | compose environment | PostgreSQL connection string |
| `JWT_SECRET` | `/run/base44/app.env` (or `.env.base44-defaults` fallback) | Signs auth tokens |
| `PUBLIC_BASE_URL` | compose environment | Base URL for permanent card URLs (QR/NFC) |
| `ADMIN_EMAIL` | compose environment | Admin login email |
| `ADMIN_PASSWORD` | compose environment | Admin login password |
| `VITE_PUBLIC_BASE_URL` | compose environment | Base URL exposed to frontend |
