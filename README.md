# RecklessBricks

An independent case archive documenting the Bricks and Minifigs / Reckless Ben controversy — built with Next.js, Prisma, and PostgreSQL.

## Stack

| Layer     | Tech                                   |
| --------- | -------------------------------------- |
| Framework | Next.js 16 (App Router, React 19)      |
| Language  | TypeScript (strict)                    |
| Styling   | Tailwind v4 + custom CSS design system |
| ORM       | Prisma 7                               |
| Database  | PostgreSQL 16 (Docker)                 |
| Linter    | Biome                                  |

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Copy the example env file and adjust if needed:

```bash
cp .env.example .env
```

The only value you may need to change is `POSTGRES_PORT` if `5433` conflicts with something already running on your machine. Change **both** `POSTGRES_PORT` and the port in `DATABASE_URL` to the same value.

### 3. Start the database, run migrations, and seed

```bash
pnpm setup
```

This runs three steps in order:
1. `pnpm db:up` — starts the PostgreSQL container
2. `pnpm db:wait` — waits until the container's healthcheck reports healthy
3. `pnpm db:push` — applies the Prisma schema as a migration
4. `pnpm db:seed` — seeds all fictional data (events, people, videos, documents, social posts)

### 4. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) (or the next available port).

## Database scripts

| Command          | Description                                                          |
| ---------------- | -------------------------------------------------------------------- |
| `pnpm db:up`     | Start the Postgres Docker container                                  |
| `pnpm db:down`   | Stop and remove the container                                        |
| `pnpm db:wait`   | Block until the container is healthy                                 |
| `pnpm db:push`   | Run pending Prisma migrations (`prisma migrate dev`)                 |
| `pnpm db:seed`   | Seed the database with fictional sample data                         |
| `pnpm db:studio` | Open Prisma Studio at [http://localhost:5555](http://localhost:5555) |
| `pnpm setup`     | Full first-run setup (up + wait + push + seed)                       |

## Project structure

```
src/
  app/
    page.tsx              # Home
    timeline/page.tsx     # Filterable case timeline
    videos/page.tsx       # Video archive grouped by source
    bodycam/page.tsx      # Police bodycam evidence table
    documents/page.tsx    # Document archive with viewer
    social/page.tsx       # Social media archive
    people/page.tsx       # People directory
    people/[id]/page.tsx  # Individual person profile
  components/
    nav.tsx               # Sticky nav with mobile drawer
    footer.tsx
    icons.tsx             # Inline SVG icon set
    timeline-view.tsx     # Interactive timeline (client)
    media-modal.tsx       # Video/bodycam modal player
    doc-viewer.tsx        # Document viewer modal
    search-overlay.tsx    # Keyboard-driven search overlay
    avatar.tsx / cat-tag.tsx / page-head.tsx
  lib/
    db.ts                 # Prisma singleton (PrismaPg adapter)
    types.ts              # Shared types + constants + fmtDate
prisma/
  schema.prisma           # Models: Person, Event, Video, Bodycam, Document, SocialPost
  seed.ts                 # Fictional sample data
design/                   # Original design reference files (not compiled)
```

## Docker details

The compose file uses environment variables for all credentials and the host port, so nothing needs editing beyond `.env`:

```yaml
ports:
  - "${POSTGRES_PORT:-5433}:5432"
```

A healthcheck is configured so `pnpm db:wait` polls `docker inspect` until Postgres is actually accepting connections rather than relying on a fixed sleep.

## Notes

- Event dates in the seed are **approximate** — verify against original source URLs before treating as authoritative.
- The `design/` folder contains the original single-file JSX prototype used as the design reference. It is excluded from linting and is not part of the compiled app.
- The Prisma generated client lives at `src/generated/prisma/` and is excluded from linting (all files carry `@ts-nocheck`).
- Source URLs and links to real parties (YouTube, GoFundMe, Wikipedia, Dropbox) are stored in the database and surface as external links throughout the archive.
