# 🏫 SchoolOS — Commercial Multi-School SaaS ERP

> A production-ready, multi-tenant School Management ERP for Pakistan's private school sector.  
> Built on NestJS (backend) + React/Vite (frontend) + PostgreSQL (Prisma ORM).

---

## Overview

SchoolOS is a full-stack, cloud-hosted school management platform designed for real-world commercial deployment. It is **not** a university project or demo app.

**Business model:** One paid plan — **Professional at PKR 3,000/month**.

### Who uses it
- Private schools, academies, secondary colleges in Pakistan
- Multi-campus groups (future roadmap)

### Core modules
| Module | Description |
|--------|-------------|
| **Dashboard** | Live school statistics, attendance rate, revenue, admissions |
| **Students** | Admission, profiles, documents, B-Form tracking, lifecycle status |
| **Teachers & Staff** | HR records, attendance, leave management |
| **Classes & Sections** | Academic year, class, section, subject management |
| **Attendance** | Class-wise live marking, absent alerts, SMS integration |
| **Exams & Results** | Exam scheduling, marks entry, grading, result cards |
| **Fees & Finance** | Fee structures, collections, receipts, concessions, account ledger |
| **Timetable** | Period scheduling per class/section |
| **Homework** | Teacher-assigned homework per subject/section |
| **Notice Board** | School-wide announcements |
| **Transport** | Routes and vehicle management |
| **Library** | Book inventory and issue tracking |
| **Parent Portal** | Read-only portal for parents to track their children |
| **Student Portal** | LMS-style portal for students |
| **Teacher Portal** | Attendance marking, homework submission, timetable view |
| **Reports** | Exportable date-wise, class-wise reports |
| **Super Admin** | Multi-school management, approval workflow, billing, audit logs |

---

## Architecture

```
SchoolOS/
├── backend/          # NestJS API (TypeScript)
│   ├── src/
│   │   ├── modules/  # Feature modules (auth, people, finance, school, admin, ...)
│   │   ├── common/   # Guards, decorators, middleware
│   │   └── main.ts
│   └── prisma/       # PostgreSQL schema + migrations
│
└── frontend/         # React 18 + Vite + TailwindCSS (TypeScript)
    └── src/
        ├── pages/    # Route-level page components
        ├── components/
        ├── context/  # Auth, Sync, Theme contexts
        ├── layouts/
        └── api/      # Axios API client
```

### Key architectural decisions
- **Multi-tenant**: Every school's data is isolated by `schoolId`. Enforced server-side, not just frontend.
- **RBAC**: Roles: `SUPER_ADMIN`, `SCHOOL_ADMIN`, `TEACHER`, `STUDENT`, `PARENT`. All enforced by guards.
- **OTP Email Verification**: Cryptographically secure 6-digit OTP using Node.js `crypto.randomInt`. Expires in 30 minutes. Max 5 attempts before invalidation.
- **JWT Auth**: Short-lived access tokens (15m) + rotating refresh tokens (7 days). Logout revokes immediately.
- **Offline Sync**: IndexedDB-based offline queue with automatic background sync when internet is restored.

---

## Registration Flow (Public)

```
Landing Page → Professional Plan (PKR 3,000/month)
  → School Registration Form
  → Email OTP Verification
  → Onboarding / Payment Submission
  → Super Admin Review
  → Approval → School ERP activated
  → Rejection → School portal disabled
```

---

## Authentication & Security

- Passwords hashed with bcryptjs (12 rounds)
- JWT access tokens (15 min expiry)
- Refresh tokens stored in DB, revoked on logout/password change
- OTP: 6-digit, cryptographic, 30-min TTL, max 5 attempts, 30-sec resend cooldown
- School approval status checked at login and token refresh
- Rejected/inactive schools cannot log in
- Super Admin endpoints protected by role guard

---

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/schoolos?schema=public"
JWT_SECRET="your-jwt-secret"
JWT_EXPIRATION="15m"
JWT_REFRESH_SECRET="your-refresh-secret"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="SchoolOS <your-email@gmail.com>"
CLOUDINARY_CLOUD_NAME="your-cloud"
CLOUDINARY_API_KEY="your-key"
CLOUDINARY_API_SECRET="your-secret"
FRONTEND_URL="https://your-frontend-domain.com"
ROOT_DOMAIN="schoolos.app"
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL="https://your-backend-domain.com"
```

> ⚠️ Never commit `.env` files. Use `.env.example` as reference only.

---

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- pnpm or npm

### Backend
```bash
cd backend
npm install
# Copy .env.example to .env and fill in values
npx prisma migrate deploy
npx prisma generate
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
# Copy .env.example to .env
npm run dev
```

---

## Production Deployment

### Backend
Deployed on Railway / Render / VPS with:
```bash
npm run build
npx prisma migrate deploy
npm run start:prod
```

### Frontend
Deployed on Vercel with:
```bash
npm run build
# dist/ folder is served
```

---

## Commercial Plan

| Plan | Price | Features |
|------|-------|----------|
| **Professional** | PKR 3,000/month | Up to 500 students, unlimited staff, full reports, fee management, email+chat support |

Super Admin manually reviews and approves each school registration after payment verification.

---

## License

Proprietary — All rights reserved. Not for redistribution.
