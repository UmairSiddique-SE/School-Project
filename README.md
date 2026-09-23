# EduSphere — Multi-School SaaS School Management System

EduSphere is a multi-school school management platform under active development. It brings school administration, academics, attendance, finance, communication, and subscription management into one platform.

**Status:** In Progress

## What EduSphere provides

- Multi-school / tenant-aware architecture
- Role-based authentication and access control
- Super-admin school onboarding and approval workflows
- Student, parent, teacher, and staff management
- Classes, sections, and subjects
- Attendance management
- Fees and finance workflows
- Homework, examinations, results, and academic records
- Timetable and notice board
- Library and transport management
- Reports and settings
- Subscription and plan management
- REST API with documented backend architecture

## Technology

### Frontend
- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Framer Motion
- React Hook Form + Zod
- Axios
- Recharts
- Radix UI
- Lucide React

### Backend
- Node.js
- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT / Passport
- bcryptjs
- class-validator
- Nodemailer
- Swagger / OpenAPI
- Helmet
- Throttler
- Jest

### Infrastructure
- PostgreSQL / Neon
- Prisma
- Cloudinary
- REST APIs

## Architecture

```text
EduSphere
├── frontend/   # React + Vite client application
└── backend/    # NestJS REST API
```

The frontend communicates with the NestJS backend through REST APIs. PostgreSQL provides persistent application data, while Prisma provides type-safe database access.

## Development

Clone the repository:

```bash
git clone https://github.com/UmairSiddique-SE/School-Project.git
cd School-Project
```

Install dependencies in both `frontend` and `backend`, configure the required environment variables, then start each application using its local development scripts.

> **Note:** This project is actively being developed. Some modules and production workflows may continue to change as the platform evolves.

## Project focus

EduSphere is being built as a practical SaaS-oriented school management system with a focus on:

- Tenant isolation and authorization
- Maintainable backend architecture
- Real application workflows instead of static demo data
- Scalable school administration
- Subscription and onboarding management
- Secure authentication and API design

## Maintainer

**Umair Siddique**

- GitHub: https://github.com/UmairSiddique-SE
- LinkedIn: https://www.linkedin.com/in/umair-siddique-6029bb375/
- Portfolio: https://umair-siddique.vercel.app/

---

Built as a Software Engineering project by Umair Siddique.
