# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend framework**: React + Vite + Tailwind CSS
- **UI components**: shadcn/ui (Radix primitives)
- **Routing**: wouter
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## CRM Application

A clean, minimal CRM web application located at `artifacts/crm/`.

### Features (Phase 1)
- **Dashboard**: Summary stats (companies, contacts, activities), Tasks placeholder, Recent Activity placeholder
- **Companies**: List view with table, Add Company dialog (name + type), Company detail page with associated contacts
- **Contacts**: List view with table, Add Contact dialog (name, email, company), Contact detail page with linked company
- **Layout**: Left sidebar navigation (Dashboard, Companies, Contacts)
- **Data**: In-memory mock data using React Context (no database yet)

### File Structure
- `artifacts/crm/src/App.tsx` — Main app with routing
- `artifacts/crm/src/components/layout.tsx` — Sidebar layout wrapper
- `artifacts/crm/src/lib/data-context.tsx` — In-memory data store with React Context
- `artifacts/crm/src/pages/` — Page components (dashboard, companies, contacts, detail pages)
- `artifacts/crm/src/components/ui/` — shadcn UI components

### Data Types
- **Company**: id, name, type (Client/Partner/Vendor/Prospect)
- **Contact**: id, name, email, companyId (linked to company)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
