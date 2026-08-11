# Visitor Management System (VMS)

A full-stack visitor management system built with **Next.js 16 (App Router)**, **TypeScript**, **MongoDB (Mongoose 9)**, **Tailwind CSS v4**, and **shadcn-style UI components**.

Tracks visitors through the full lifecycle — register → check-in → check-out — with host management, reports, CSV export, print passes, role-based access control, audit logs, and a seeded demo dataset.

## Features

- **Auth & Roles** — JWT (HS256) session cookie, roles `ADMIN`, `RECEPTIONIST`, `SECURITY`, permission-based access control.
- **Visitor lifecycle** — register (expected or check-in now), view, edit, check in/out, cancel, delete (admin), unique `VIS-YYYYMMDD-XXXXX` IDs.
- **Photo upload** — client-side compression to ≤800px JPEG, stored in `public/uploads`, URL persisted in Mongo.
- **Hosts / Employees** — CRUD, active/inactive status, departments.
- **Dashboard** — today's stats, visit trends (recharts), purpose distribution, recent visitors.
- **Reports** — filtered table with summary cards and CSV export.
- **Print visitor pass** — `/visitors/[id]/pass`.
- **Settings** — user management (create, role, activate/deactivate, reset password, delete) and audit logs.
- **Audit logging** — every important action logged with actor + metadata.
- **Seed script** — demo hosts, 3 staff accounts, ~90 visitors over 30 days.
- **Tests** — Vitest suite for validations and service helpers.

## Tech Stack

- Next.js 16 (Turbopack), React 19, App Router
- TypeScript (strict)
- MongoDB + Mongoose 9 (aggregations, transactions for visitor creation)
- Zod validation
- React Hook Form + `@hookform/resolvers`
- Tailwind CSS v4, shadcn-style Radix UI components
- recharts, lucide-react, sonner, jose (JWT), cva/tailwind-merge

## Getting Started

### Prerequisites

- Node.js 20+ (developed on 24)
- MongoDB — MongoDB Atlas (recommended) or a local `mongod`

### 1. Install

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in values:

```
# MongoDB
MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>.mongodb.net"
MONGODB_DB=visitor_management

# Authentication — generate with: openssl rand -hex 32
AUTH_SECRET=replace_with_a_long_random_string

# Branding (optional)
COMPANY_NAME=Acme Office
```

> The app builds the DB URI as `MONGODB_URI/MONGODB_DB`, so the URI should NOT include a trailing slash or a database name. Leave the cluster name and DB name separate even if they look similar.

### 3. Run the seed script

Populates hosts, staff accounts, and ~90 visitors across 30 days (idempotent — re-running only fills gaps and resets the visitor ID counters):

```bash
npm run seed
```

Seed accounts:

| Role          | Email                | Password      |
| ------------- | -------------------- | ------------- |
| ADMIN         | admin@company.com    | admin123      |
| RECEPTIONIST  | reception@company.com | reception123  |
| SECURITY      | security@company.com | security123   |

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

## Scripts

| Command          | Description                            |
| ---------------- | -------------------------------------- |
| `npm run dev`    | Start the dev server                   |
| `npm run build`  | Production build                       |
| `npm run start`  | Start the production server            |
| `npm run lint`   | ESLint                                 |
| `npm test`       | Run the Vitest suite once              |
| `npm run test:watch` | Run Vitest in watch mode          |
| `npm run seed`   | Seed demo data                         |

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Protected pages (dashboard, visitors, hosts, reports, settings)
│   ├── api/                  # Route handlers
│   ├── login/                # Login page
│   ├── visitors/[id]/pass/   # Printable visitor pass
│   └── layout.tsx            # Root layout (Toaster, TooltipProvider)
├── components/
│   ├── auth/                 # Login form
│   ├── dashboard/            # Stat cards, charts, recent visits
│   ├── hosts/                # Hosts table + dialogs
│   ├── layout/               # Dashboard shell, sidebar, nav
│   ├── reports/              # Reports client
│   ├── settings/             # Users manager, audit logs
│   ├── ui/                   # shadcn-style primitives
│   └── visitors/             # Forms, table, profile, actions, photo upload
├── lib/
│   ├── services/             # DB logic (visitors, hosts, reports, dashboard)
│   ├── validations/          # Zod schemas
│   ├── auth.ts               # Session create/verify (jose)
│   ├── api.ts / api-auth.ts  # API helpers + route auth
│   ├── permissions.ts        # Role → permission map
│   ├── audit-log.ts          # Audit log writer
│   ├── mongodb.ts            # Cached mongoose connection
│   └── password.ts           # scrypt hashing
├── models/                   # Mongoose models (Visitor, Host, User, AuditLog, Counter)
└── app/                      # (root) — mounted under src/app; public/ at repo root
public/uploads/               # Uploaded photos (gitignored)
scripts/seed.ts               # Seed script
tests/                        # Vitest tests
```

## API Overview

All handlers follow `{ success, data }` / `{ success: false, error: { message, code } }` and require a session cookie for protected routes.

| Method | Endpoint                     | Description                          | Permission |
| ------ | ---------------------------- | ------------------------------------ | ---------- |
| POST   | `/api/auth`                  | Login                                | —          |
| POST   | `/api/auth/logout`           | Logout                               | auth       |
| GET    | `/api/dashboard`             | Dashboard stats + trends             | read       |
| GET/POST | `/api/visitors`            | List / register visitor              | read/write |
| GET/PATCH/DELETE | `/api/visitors/[id]` | Read / update / delete (admin)       | varies     |
| POST   | `/api/visitors/[id]/check-in`  | Check in                          | check-in   |
| POST   | `/api/visitors/[id]/check-out` | Check out                        | check-out  |
| POST   | `/api/visitors/[id]/cancel`    | Cancel visit                      | edit       |
| GET/POST | `/api/hosts`              | List / create hosts                  | read/manage|
| GET/PATCH/DELETE | `/api/hosts/[id]`   | Host read / update / delete          | manage     |
| GET    | `/api/reports`               | Filtered report + summary            | report     |
| GET    | `/api/reports/export`        | CSV download                         | report     |
| POST   | `/api/upload`                | Upload a visitor photo               | write      |
| GET/POST | `/api/users`              | Manage users (admin)                 | admin      |
| GET    | `/api/audit-logs`            | Audit log entries (admin)            | admin      |

## Notes & Pitfalls

- **Mongoose 9** ships with breaking type changes vs. older docs: use `QueryFilter` semantics via typed `Record<string, unknown>` in aggregation `$match`, and avoid assigning the result of `Model.create(..., { session })` through a captured outer variable (TypeScript narrows it to `never`) — return it from the transaction callback instead.
- **Zod v4** disallows `.partial()` on an object schema that already has refinements — the update schema builds its own field defs and applies refinements after `.partial()`.
- **React Compiler lint** (`react-hooks/set-state-in-effect`) rejects `void fetchData(...)` inside an effect when the called function sets state synchronously — keep `setLoading()` in event handlers and wrap the effect's fetch in an async IIFE.
- The `next` package's AGENTS.md block is managed by `next dev`; don't fight it.

## Deployment

- Set the same env vars (`MONGODB_URI`, `MONGODB_DB`, `AUTH_SECRET`) on your host.
- Vercel: `next build` handles everything; add a startup hook to run `npm run seed` once if you want demo data.
- `public/uploads` is written at runtime — use a persistent/network filesystem for uploaded photos, or hook uploads to object storage in production.