# 🏫 EduSphere — SaaS School Management System

A full-featured, multi-tenant **SaaS School Management System** built with **NestJS** (backend) and **React + Vite** (frontend). Designed for Pakistani schools with support for super-admin platform management, school onboarding, student/teacher/staff management, fees, exams, attendance, transport, hostel, library, and more.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start (Development)](#-quick-start-development)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Production Deployment](#-production-deployment)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Super Admin Setup](#-super-admin-setup)
- [API Documentation](#-api-documentation)
- [License](#-license)

---

## ✨ Features

### Platform (Super Admin)
- Multi-school management & onboarding
- Subscription & billing management
- Platform-wide announcements & alerts
- Support ticket system
- School activation/deactivation

### School Administration
- **People Management** — Teachers, Students, Staff, Parents (CRUD, bulk operations, promotions, transfers)
- **Academics** — Classes, Sections, Subjects, Timetable, Academic Years
- **Examinations** — Exam creation, result recording, grading, report cards
- **Attendance** — Student & teacher daily attendance tracking
- **Finance** — Fee structures, payments, receipts, payroll, accounting
- **Communication** — Announcements, notifications, notice board, homework
- **Transport** — Routes, vehicles, GPS tracking, student assignments
- **Hostel** — Hostel rooms, student allocation, fee management
- **Library** — Book catalog, issue/return tracking
- **Buildings** — Building & room management
- **Reports** — Comprehensive analytics & exportable reports

### Portals
- **Student Portal** — View grades, attendance, homework, fee status
- **Parent Portal** — Monitor child's academic progress
- **School Admin Portal** — Full school management dashboard

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | NestJS 11, Prisma 5, PostgreSQL, Passport JWT |
| **Frontend** | React 19, Vite 8, TypeScript, Tailwind CSS 4, Radix UI |
| **Auth** | JWT (access + refresh tokens), bcryptjs |
| **Email** | Nodemailer (Brevo SMTP) |
| **Storage** | Cloudinary (image uploads) |
| **Deployment** | Vercel (frontend), any Node.js host (backend) |
| **CI/CD** | GitHub Actions |

---

## 📂 Project Structure

```
schol system/
├── backend/                 # NestJS API server
│   ├── prisma/
│   │   └── schema.prisma    # Database schema (PostgreSQL)
│   ├── src/
│   │   ├── modules/         # Feature modules (auth, people, exam, etc.)
│   │   ├── common/          # Guards, decorators, filters
│   │   └── main.ts          # Application entry point
│   ├── scripts/             # DB validation, admin bootstrap
│   ├── .env.example         # Environment template
│   └── package.json
├── frontend/                # React + Vite SPA
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React contexts (auth, theme)
│   │   └── lib/             # Utilities, API client
│   ├── .env.example         # Environment template
│   └── package.json
├── .github/workflows/       # CI pipeline
├── vercel.json              # Vercel deployment config
└── README.md
```

---

## 🚀 Quick Start (Development)

### Prerequisites
- **Node.js** ≥ 20
- **npm** ≥ 10
- **PostgreSQL** ≥ 14 (or use [Neon](https://neon.tech) / [Supabase](https://supabase.com) for managed DB)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/schol-system.git
cd "schol system"

# Install backend dependencies
cd backend && npm ci

# Install frontend dependencies
cd ../frontend && npm ci
```

### 2. Configure Environment

```bash
# Backend — copy and fill in your values
cp backend/.env.example backend/.env

# Frontend — copy and fill in your values
cp frontend/.env.example frontend/.env
```

### 3. Setup Database

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Create super admin user
npm run admin:ensure
```

### 4. Start Development Servers

```bash
# Terminal 1 — Backend (port 3000)
cd backend && npm run start:dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET` | Secret key for JWT signing (min 32 chars) | ✅ |
| `JWT_EXPIRATION` | Access token expiry (e.g., `15m`) | ✅ |
| `JWT_REFRESH_EXPIRATION` | Refresh token expiry (e.g., `7d`) | ✅ |
| `PORT` | Server port (default: `3000`) | ❌ |
| `NODE_ENV` | `development` or `production` | ❌ |
| `CORS_ORIGINS` | Allowed frontend origins | ❌ |
| `SMTP_HOST` | SMTP server hostname | ✅ |
| `SMTP_PORT` | SMTP port (default: `587`) | ✅ |
| `SMTP_USER` | SMTP username | ✅ |
| `SMTP_PASS` | SMTP password / app key | ✅ |
| `SMTP_FROM` | Sender email address | ✅ |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | ✅ |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ✅ |

### Frontend (`frontend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API base URL | ✅ |

---

## 🗄 Database Setup

### Using Neon (Recommended for production)

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string to `DATABASE_URL` in `backend/.env`
3. Run migrations:

```bash
cd backend
npx prisma migrate deploy
```

### PostgreSQL Migration Guide

```bash
cd backend

# Validate DB config matches production requirements
npm run validate:production-db

# If migrating from a fresh setup, create baseline
npm run db:baseline:postgres

# Apply all pending migrations
npm run db:deploy

# Generate updated Prisma client
npx prisma generate
```

---

## 🌐 Production Deployment

### Frontend (Vercel)

1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Vercel will auto-detect settings from `vercel.json`:
   - **Build Command**: `cd frontend && npm ci && npm run build`
   - **Output Directory**: `frontend/dist`
3. Set `VITE_API_URL` in Vercel Environment Variables
4. Deploy!

### Backend (Railway / Render / VPS)

1. Set all required environment variables (see table above)
2. Ensure `NODE_ENV=production`
3. Build and start:

```bash
cd backend
npm ci
npm run build
npm run start:prod
```

4. The server starts at the configured `PORT` (default 3000)

### Post-Deployment Checklist

- [ ] `DATABASE_URL` points to managed PostgreSQL
- [ ] `npm run validate:production-db` passes
- [ ] `npx prisma migrate deploy` applied successfully
- [ ] Super admin created via `npm run admin:ensure`
- [ ] `JWT_SECRET` is a strong, unique random string (≥ 32 characters)
- [ ] SMTP credentials configured and tested
- [ ] Cloudinary credentials configured
- [ ] `CORS_ORIGINS` set to your frontend domain
- [ ] HTTPS enabled on both frontend and backend

---

## ⚙ CI/CD Pipeline

The project includes a GitHub Actions CI workflow (`.github/workflows/ci.yml`) that runs on every push and PR to `main` and `feat/super-admin-market-ready`:

### Backend Pipeline
1. ✅ `npm ci` — Install dependencies
2. ✅ `npx prisma generate` — Generate Prisma client
3. ✅ `npm run validate:production-db` — Validate DB config
4. ✅ `npm run lint:check` — ESLint (zero errors required)
5. ✅ `npm run build` — NestJS compilation
6. ✅ `npm run test` — Jest unit tests

### Frontend Pipeline
1. ✅ `npm ci` — Install dependencies
2. ✅ `npm run lint` — ESLint
3. ✅ `npm run build` — TypeScript + Vite production build

---

## 👤 Super Admin Setup

After initial deployment, create the platform super admin:

```bash
cd backend

# Set bootstrap credentials in .env:
# BOOTSTRAP_ADMIN_NAME="Platform Administrator"
# BOOTSTRAP_ADMIN_EMAIL="admin@yourdomain.com"
# BOOTSTRAP_ADMIN_PASSWORD="use-a-unique-password-of-at-least-12-characters"

npm run admin:ensure
```

This creates a `SUPER_ADMIN` user who can:
- Create and manage schools
- Manage subscriptions
- Send platform announcements
- Handle support tickets

---

## 📖 API Documentation

When the backend is running, Swagger API docs are available at:

```
http://localhost:3000/api/docs
```

---

## 📄 License

This project is **UNLICENSED** — proprietary software. All rights reserved.

