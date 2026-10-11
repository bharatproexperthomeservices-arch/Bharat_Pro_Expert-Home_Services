# Bharat Pro Expert Home Services

Administration platform foundation for Bharat Pro Expert Home Services.

- **Owner:** Anil Chauhan
- **Support:** 8920252626
- **Primary email:** Bharatproexperthomeservices@gmail.com
- **Support email:** Bharatproexpert@gmail.com
- **Brand color:** `#6C3CE9`

## Architecture

- `apps/web`: Next.js App Router admin frontend
- `apps/api`: Express + TypeScript API
- `packages/ui`: shared UI and brand primitives
- `packages/db`: database package; Prisma schema is introduced in Section 2
- `packages/types`: shared TypeScript contracts
- PostgreSQL 16 and Redis 7 through Docker Compose

## Requirements

Docker Desktop with Docker Compose v2. Node.js 22+ is required for local development outside Docker.

## Start the foundation

1. Copy `.env.example` to `.env` and replace development secrets before exposing any service publicly.
2. Start core services:

   ```bash
   docker compose up --build -d
   ```

3. Check the API: `curl http://localhost:4000/health`
4. Open http://localhost:3000.

Optional services:

- pgAdmin: `docker compose --profile tools up --build -d` at http://localhost:5050
- Nginx: `docker compose --profile edge up --build -d` at http://localhost:8080
- Ollama: `docker compose --profile ai up -d ollama`; after checking disk and RAM, pull a model with `docker compose --profile ai exec ollama ollama pull llama3:8b`.

## Security

Never commit real API keys, database credentials, JWT secrets, SMTP passwords or payment secrets. Rotate credentials that have ever been committed. Sample credentials are development-only. Do not expose pgAdmin or development containers to the public internet.

## Current scope

This is the Section 1 infrastructure foundation, not a completed production admin system. Database models, migrations, authentication, role permissions and business CRUD modules are introduced and verified in subsequent sections.
