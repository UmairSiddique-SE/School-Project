# Professional Student Management & Profile Upgrade

Upgrade the Student Management page to follow the professional, integrated "In-Page" standard, including a completely redesigned Profile View.

## User Review Required

> [!IMPORTANT]
> I will convert the **Student Profile** from a floating modal into an **In-Page View**. This means clicking a student will smoothly transition the entire page into their detailed profile while keeping the Sidebar and Header visible.
>
> [!TIP]
> This provide much more room for "Academic Timeline", "Fee History", and "Exam Results" without the cramped feeling of a modal.

## Proposed Changes

### 1. Integrated Profile View (`Students.tsx`)
- **State Management:** Transition from a 3-way view state: `list` | `add` | `profile`.
- **Professional Layout:**
    - **Left Sidebar:** Quick identity info, current status, and primary actions (Print ID, Promote, Edit).
    - **Right Content:** Expansive tabbed area with high-fidelity cards for Attendance, Fees, and Results.
- **Enhanced Metrics:** Redesign stats cards to match the professional Admin dashboard style (glassmorphism, vibrant gradients).

### 2. List View Refinements
- **Glassmorphic Table:** Apply the `glass` and `glass-elevated` styling to the student list table for better visual depth.
- **Improved Header:** Match the search/filter area styling with the new registration headers.

### 3. Integrated Actions
- Ensure that "Promote" and "Transfer" dialogs within the profile also feel part of the integrated space.

## Verification Plan

### Manual Verification
1. **Navigation:** Verify clicking a student opens the in-page profile. Confirm the "Back" button returns to the list perfectly.
2. **Tab Switching:** Ensure all profile tabs (Attendance, Fees, etc.) render correctly in the expansive view.
3. **Responsive Check:** Confirm the 2-column profile layout collapses elegantly on smaller screens.
