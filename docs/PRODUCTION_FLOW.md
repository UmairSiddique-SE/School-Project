# EduSphere Production Flow

## 1. Public onboarding

Landing Page -> Plan Selection -> School Registration -> Email Verification -> Payment/Trial -> Super Admin Review -> Activation -> School Admin Login

A school must remain inactive until the platform approval/payment rules for the selected plan are satisfied.

## 2. School Admin flow

Login -> School Dashboard -> Students / Parents / Staff / Classes / Sections / Subjects / Attendance / Fees / Homework / Exams / Results / Timetable / Notice Board / Library / Transport / Reports / Subscription / Settings / Profile

Every module must provide:
- loading state
- empty state
- validation
- success/error feedback
- search/filter where applicable
- confirmation for destructive actions
- backend authorization

## 3. Super Admin flow

Login -> Overview -> School Requests -> Schools -> Subscriptions -> Plans & Pricing -> Payments -> Users -> Support -> Announcements -> Notifications -> Email Templates -> Reports -> Activity Logs -> System Settings -> Profile

Critical actions:
- approve/reject school request
- approve/reject onboarding payment
- activate/suspend school
- change plan
- extend subscription
- review payment history
- review audit history

## 4. Final plans

| Plan | Students | Staff | Price |
|---|---:|---:|---:|
| Free Trial | 20 | Unlimited | PKR 0 |
| Professional | 500 | Unlimited | PKR 3,000/month |
| Premium | Unlimited | Unlimited | PKR 5,000/month |

Student limits must be enforced on the backend as well as the frontend.

## 5. Data rules

- Production dashboards must use real records only.
- No fake/demo statistics or placeholder records in production.
- Empty database states must show zero/empty-state UI.
- School users can access only their own school's tenant data.
- Super Admin can access platform-wide data.
- Payment amount must come from the selected platform plan, not from a trusted client value.
- Payment proof is required for paid onboarding plans.

## 6. Subscription lifecycle

PENDING -> ACTIVE -> EXPIRING SOON -> EXPIRED -> SUSPENDED

Supported administrative actions:
- renew
- extend
- change plan
- suspend
- reactivate

## 7. Release acceptance checklist

### Authentication
- [ ] registration validation
- [ ] email verification
- [ ] login/password validation
- [ ] refresh-token rotation
- [ ] logout/revocation
- [ ] forgot/reset password
- [ ] password change revokes sessions

### Onboarding
- [ ] registration creates one consistent onboarding record
- [ ] no duplicate school is created during approval
- [ ] payment proof validation
- [ ] approval activates the intended school
- [ ] rejection keeps the account inactive
- [ ] onboarding notification works

### Authorization
- [ ] SUPER_ADMIN platform access
- [ ] SCHOOL_ADMIN tenant isolation
- [ ] staff/teacher permissions
- [ ] destructive actions protected

### UI/UX
- [ ] no hard-coded dashboard numbers
- [ ] no silent API failures
- [ ] loading/empty/error states
- [ ] responsive layouts
- [ ] confirmation dialogs

### Production
- [ ] SQLite replaced by PostgreSQL/Neon
- [ ] production seed contains no demo ERP records
- [ ] Cloudinary configured for images/payment proofs
- [ ] backend/frontend environment variables configured
- [ ] end-to-end smoke test completed
