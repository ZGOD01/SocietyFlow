# SocietyFlow — Digital Society Document & Approval Management Platform

> **Your Society. Every Document. One Place.**  
> Multi-tenant SaaS foundation for cooperative housing societies, residential condominiums, and apartment owner associations.

---

## 🏛️ Project Overview

SocietyFlow replaces unindexed physical filing cabinets, missing share certificates, and untracked WhatsApp threads with a deterministic, auditable web platform. 

### Core Capabilities
1. **Personal Document Vault**: Secure, unit-isolated vault for registered sale agreements, original share certificates, property tax receipts, and police verifications.
2. **Society Document Library**: Centralized statutory repository for cooperative model bylaws, AGM/EGM signed minutes, statutory audit reports, and deemed conveyance titles.
3. **Requests & NOC Approval Pipeline**: Structured application workflows for flat transfers, bank mortgages, renovation permits, and tenant verification with digital multi-signatory quorum (Chairman, Secretary, Treasurer).
4. **Flat & Ownership Registry**: Wing-wise rosters (Wings A to E), carpet area tracking, share certificate serial registry, and occupancy tracking (self-occupied vs rented).
5. **Auditor & Partner Oversight**: Specialized role desk for Chartered Accountants and legal advocates conducting statutory audits and title due diligence.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS + Custom CSS Variables Design Tokens
- **Typography**: `Outfit` (Headings) and `Inter` (Body & Controls)
- **Iconography**: Exclusively Ionicons 5 (`react-icons/io5`)
- **Animation**: Motion for React (`motion/react`) with spring physics and press feedback
- **Form & Validation**: React Hook Form + Zod
- **Testing**: Vitest (Unit) + Playwright (E2E)
- **Planned Backend**: Node.js Next.js Server Routes, MongoDB Atlas with Mongoose (Milestone 2), Auth.js (Milestone 2), Cloudflare R2 (Milestone 3)

> **Architectural Constraint Enforcement**: Supabase, PostgreSQL, AWS S3, Sentry, and Firebase are strictly forbidden.

---

## 🎨 Design Tokens & Style Authority

Adapted from `SPPU_Notes_Style_Guide.md`:

| Token | Value | Purpose |
| :--- | :--- | :--- |
| **Background** | `#FFFFFF` | Core application and page background |
| **Surface** | `#F8F9FA` | Muted containers, card backgrounds, sidebar |
| **Primary Text/Action** | `#1A1A1A` | High-emphasis headings, main action buttons |
| **Secondary Text** | `#6B7280` | Descriptive body copy, subtitle text |
| **Tertiary Text** | `#9CA3AF` | Form placeholders, timestamps, subtle meta |
| **Hero / Accent** | `#4F46E5` | Indigo brand highlight, active states, focus rings |
| **Hero Soft** | `#EEF2FF` | Pill badges, icon container fills, light highlights |
| **Border** | `#E5E7EB` | Crisp 1px structural dividing lines |
| **Success** | `#10B981` | Approved, verified, compliant (`#ECFDF5` soft) |
| **Warning** | `#F59E0B` | Pending review, committee action (`#FFFBEB` soft) |
| **Error** | `#F43F5E` | Rejected, overdue, critical (`#FFF1F2` soft) |
| **Information** | `#0EA5E9` | Audit notices, active workflows (`#F0F9FF` soft) |
| **Geometry** | `14px` & `9999px` | Card radius 12-16px, pill buttons & badges |
| **Shadows** | Subtle Neutral | Ultra-clean neutral shadows, no gradients |

---

## 📂 Architecture & Directory Layout

```
SocietyFlow/
├── public/                 # Static assets
├── src/
│   ├── app/                # Next.js App Router routes
│   │   ├── (auth)/
│   │   │   ├── login/      # Sign-in foundation
│   │   │   └── register/   # Registration foundation
│   │   ├── admin/          # Managing committee administration console
│   │   ├── approvals/      # Multi-signatory approval pipeline
│   │   ├── dashboard/      # Society & personal metrics overview
│   │   ├── documents/      # Unit-level personal document vault
│   │   ├── partner/        # Auditor & legal partner portal
│   │   ├── properties/     # Flats & ownership registry
│   │   ├── requests/       # Service & NOC applications
│   │   ├── settings/       # Society configuration & preferences
│   │   ├── society-documents/# Public society library (bylaws, minutes)
│   │   ├── globals.css     # Global styles & Tailwind theme mappings
│   │   ├── layout.tsx      # Root layout with Outfit & Inter fonts
│   │   └── page.tsx        # High-conversion sponsor-ready landing page
│   ├── components/
│   │   ├── common/         # Foundation notices & shared scaffolds
│   │   ├── landing/        # Landing page sections (Hero, Features, etc.)
│   │   ├── layout/         # AppShell, desktop collapsible sidebar, header
│   │   └── ui/             # 13 Reusable UI components (AppButton, AppCard, etc.)
│   ├── config/             # Role definitions & navigation configuration
│   ├── lib/                # Utilities, animations, and formatting helpers
│   ├── modules/            # Feature-oriented domain contracts & Zod schemas
│   │   ├── auth/           # Login/Register validation schemas
│   │   ├── documents/      # Upload & categorization contracts
│   │   └── domain-schemas.ts # Society, Flat, Approval, & Transfer schemas
│   ├── styles/             # Centralized design tokens (tokens.css)
│   └── types/              # Domain TypeScript interfaces & role models
├── tests/                  # Vitest unit test suite
├── .env.example            # Environment variable specifications
├── SPPU_Notes_Style_Guide.md # Design authority tokens document
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js `18.17+` or `20.x`
- npm `9.x+`

### 2. Installation
```bash
git clone <repository-url>
cd SocietyFlow
npm install --legacy-peer-deps
```

### 3. Environment Setup
```bash
cp .env.example .env.local
```
*(Leave credentials as placeholders until backend milestone integration).*

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Running Tests & Quality Checks
```bash
# TypeScript compiler type check
npx tsc --noEmit

# Production build validation
npm run build

# Unit tests
npm run test
```

---

## 🗺️ Roadmap & Milestones

- [x] **Prompt 1: Production Foundation**
  - Initialized Next.js 16 with TypeScript Strict Mode
  - Configured design tokens, Outfit & Inter fonts, and Ionicons 5
  - Built 13 atomic reusable UI components
  - Developed sponsor-ready responsive landing page
  - Implemented responsive multi-tenant AppShell with role sandbox
  - Created 11 routes with clearly labeled architectural foundations
- [x] **Prompt 2: Identity, MongoDB Models & Session Layer**
  - Configured MongoDB Atlas M0 Free Tier with cached connection pooling (`src/lib/db.ts`)
  - Created 9 tenant-isolated Mongoose models: `User`, `Society`, `Building`, `Wing`, `Flat`, `SocietyMembership`, `FlatOccupancy`, `SocietyInvitation`, `AuditEvent`
  - Implemented password hashing (bcrypt 12 rounds) and signed Edge-compatible JWT sessions (jose)
  - Connected registration (`/register`), login (`/login`), and logout (`/api/auth/logout`)
  - Built Edge route-protection proxy middleware (`src/middleware.ts`)
  - Implemented server-side RBAC authorization helpers (`requireAuth`, `requireRole`, `requireSocietyMembership`, `requireFlatAccess`)
  - Implemented sliding-window brute-force rate limiter (`src/lib/rate-limit.ts`)
  - Created development seed script (`npm run seed`) with 2 societies and 11 role-based test accounts
  - 25/25 automated unit tests passing (`npm run test`)
- [ ] **Prompt 3: Document Vault & Cloudflare R2**
  - Cloudflare R2 presigned upload/download streams
  - Digital watermarking & file integrity hashing
- [ ] **Prompt 4: Committee Approval & Ownership Transfer Engine**
  - Cryptographic multi-signatory quorum
  - Form 14/15 nomination & transfer fee validation
- [ ] **Prompt 5: Auditor Desk & Reporting**
  - Grade 'A' compliance balance sheet exports
  - Statutory report generation for cooperative registrars

---

## 👥 Seed Credentials & Test Accounts

Run `npm run seed` to populate your MongoDB Atlas cluster. All test accounts share the universal development password:

> **Default Password:** `SocietyFlow@2026`

| Role / Persona | Email | Assigned Society | Destination |
| :--- | :--- | :--- | :--- |
| **Flat Owner** | `owner@greenwood.in` | Greenwood Estates CHS | `/dashboard` |
| **Tenant** | `tenant@greenwood.in` | Greenwood Estates CHS | `/dashboard?view=tenant` |
| **Hon. Secretary** | `secretary@greenwood.in` | Greenwood Estates CHS | `/management/dashboard` |
| **Chairman** | `chairman@greenwood.in` | Greenwood Estates CHS | `/management/dashboard` |
| **Treasurer** | `treasurer@greenwood.in` | Greenwood Estates CHS | `/management/dashboard` |
| **Society Manager** | `manager@greenwood.in` | Greenwood Estates CHS | `/management/dashboard` |
| **Statutory Auditor / Partner** | `auditor@legaldesk.in` | Empanelled Partner | `/partner/dashboard` |
| **Platform Super Admin** | `admin@societyflow.com` | Global Platform | `/admin/dashboard` |
| **Multi-Society Resident** | `multi.user@societyflow.com` | Greenwood + Palmgrove | `/select-workspace` |
| **Pending Verification Applicant** | `pending.owner@greenwood.in` | Greenwood Estates CHS | `/pending-approval` |

