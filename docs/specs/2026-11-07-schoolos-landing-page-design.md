# SchoolOS Landing Page Redesign

## Goal
Replace the current multi-tier, EduSphere-branded public landing page with a polished SchoolOS pre-launch landing page that converts Pakistani school owners into registration applications while accurately representing the product's current state.

## Current implementation context
- Frontend is React 19 + Vite + TypeScript, using React Router, Tailwind CSS, Framer Motion, and lucide-react.
- Public landing page: `frontend/src/pages/LandingPage.tsx`.
- Routes already exist for `/register-school/plans`, `/register-school/form`, `/school-login`, and `/admin-login`.
- Landing page currently fetches public schools and plans from backend endpoints and contains multiple plan cards, EduSphere branding, a school directory/search modal, and FAQ content.
- Preserve existing functional routes, API integration, responsive behavior, and school search only where it remains appropriate.

## Approved product and pricing direction
- Public brand: SchoolOS.
- One public subscription: PKR 3,000 per month.
- Do not show Free, Pro, Premium, or multiple competing plans on the landing page.
- Confirm the exact included student limit/features against the backend plan configuration before making claims. Do not invent plan limits.
- No schools are registered yet: show a tasteful empty state or omit the directory section; never show fake schools, customer logos, testimonials, review scores, or adoption statistics.

## Landing page structure
1. Sticky responsive navbar with SchoolOS identity, Platform, Features, Pricing, FAQs, School Login, and primary Apply/Register CTA.
2. Hero with outcome-led headline, concise copy for school owners, primary school-application CTA, secondary product-exploration CTA, and a polished illustrative dashboard preview clearly labelled as a demo preview.
3. Product capability section covering only features supported by the existing application.
4. Feature/benefit sections for student records, attendance, fee management, academics/exams, timetable, and reporting where verified in code.
5. Simple onboarding explanation: application submitted → Super Admin review → approval → school access.
6. Single pricing card: PKR 3,000/month, with verified inclusions only.
7. Concise FAQ that accurately describes approval, payment, login, data handling, and support.
8. Final application CTA and clean footer with existing school/admin login links.

## Visual direction
- Premium light-first SaaS aesthetic, deep navy typography, royal-blue accent, restrained gradients, soft borders/shadows, clear whitespace, modern typography.
- Mobile-first responsive layout and accessible contrast/focus states.
- Use subtle Framer Motion only where it improves clarity; avoid heavy animation and visual clutter.
- Dashboard preview should be a self-contained illustrative mock UI, not fake live statistics or customer data.

## Functional and technical requirements
- Preserve current React/Vite architecture; do not migrate frameworks.
- Keep existing registration/login destinations working.
- Do not break dynamic school listing/search behavior; when the API returns zero schools, show an honest empty state or hide the section.
- Inspect backend public plan response and registration flow before choosing how the single PKR 3,000 plan is represented. Do not silently alter billing or database plan catalogue as part of a landing-page-only change.
- Remove inaccurate marketing statements, especially inconsistent trial durations, biometric claims, multi-campus claims, or other capabilities unless confirmed in the current implementation.
- Keep API errors graceful and avoid console errors.
- Verify frontend lint and production build; test the page's key links and responsive layout where tooling permits.

## Scope boundary
This task is the public landing page and its displayed pricing/marketing copy. It does not redesign authenticated dashboards, change subscription billing logic, change database plan records, or modify school approval policy.
