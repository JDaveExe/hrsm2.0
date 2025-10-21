# Emergency Appointment Feature - Implementation Plan

## 📋 Overview
Add emergency appointment booking that bypasses the 2-day advance booking rule with proper safeguards and usage limits.

---

## 🎯 Requirements Summary

### UI/UX Flow:
1. **Emergency Button** in Book Appointment modal header (right side, visible but not easily clicked by accident)
2. **Warning Modal** appears when Emergency button clicked:
   - Title: "Emergency Appointment - Important Notice"
   - 3-second countdown timer with progress bar
   - Warning message about proper use
   - Usage limit information (2 per month, 14-day cooldown)
   - "I Understand" button (disabled until 3 seconds pass)
3. **Emergency Booking Modal** appears after "I Understand":
   - Same layout as regular booking modal
   - Service Type field LOCKED to "Emergency Consultation"
   - Date can be today or tomorrow (bypasses 2-day rule)
   - Time selector enabled
   - **Reason required** (dropdown + text explanation)
   - Symptoms field (required)
   - Additional notes (optional)
   - No X button (must use Cancel/Book buttons)

### Backend Logic:
- **Auto-approved** (no admin approval needed)
- Status: "Emergency" (distinct from "Pending")
- Usage tracking:
  - Max 2 emergency appointments per 30 days
  - 14-day cooldown between emergency requests
  - Cancelled emergency appointments count toward limit
- Admin notification when emergency appointment booked

### Admin Features:
- **Top bar alert** showing count of emergency appointments today
- **Emergency badge** on appointments with status "EMERGENCY" (red/orange color)
- Can view emergency appointment history per patient

---

## 🎨 CSS Naming Convention (Avoid Conflicts)

All new CSS classes will use prefix: `emergency-apt-*`

```css
/* Emergency Button */
.emergency-apt-trigger-btn

/* Warning Modal */
.emergency-apt-warning-modal-overlay
.emergency-apt-warning-modal
.emergency-apt-warning-header
.emergency-apt-warning-body
.emergency-apt-countdown-container
.emergency-apt-countdown-bar
.emergency-apt-countdown-text
.emergency-apt-understand-btn

/* Emergency Booking Modal */
.emergency-apt-booking-modal-overlay
.emergency-apt-booking-modal
.emergency-apt-booking-header
.emergency-apt-booking-form
.emergency-apt-locked-field
.emergency-apt-reason-dropdown
.emergency-apt-reason-text

/* Admin Components */
.emergency-apt-alert-banner
.emergency-apt-badge
.emergency-apt-count-indicator
```

---

## 📂 Files to Modify

### Frontend:
1. **`src/components/patient/components/PatientAppointments.js`**
   - Add emergency button to modal header
   - Add warning modal component
   - Add emergency booking modal
   - Add usage tracking state
   - Add emergency booking handler

2. **`src/components/patient/styles/PatientAppointments.css`**
   - Add emergency-specific styles (append to end of file)

3. **`src/components/admin/components/AdminDashboard.js`** (or AdminHeader)
   - Add emergency alert banner

4. **`src/components/admin/components/AllAppointments.js`**
   - Add emergency badge to status column

### Backend:
1. **`backend/models/Appointment.js`**
   - Add `isEmergency` BOOLEAN field
   - Add `emergencyReason` TEXT field
   - Add `emergencyReasonCategory` ENUM field

2. **`backend/routes/appointments.js`**
   - Add emergency usage check endpoint: `GET /api/appointments/emergency-usage/:patientId`
   - Modify create endpoint to handle emergency bookings
   - Add emergency notification logic

3. **`backend/controllers/notificationController.js`** (if exists)
   - Add emergency notification to admins

---

## 🔧 Implementation Steps

### Phase 1: Database Schema (15 mins)
1. ✅ Add columns to Appointments table
2. ✅ Create migration script
3. ✅ Test migration

### Phase 2: Backend API (30 mins)
1. ✅ Add emergency usage tracking endpoint
2. ✅ Modify appointment creation to handle emergency flag
3. ✅ Add emergency notification system
4. ✅ Test API endpoints

### Phase 3: Patient UI - Warning Modal (45 mins)
1. ✅ Add Emergency button to booking modal header
2. ✅ Create warning modal component with 3-sec timer
3. ✅ Add CSS for warning modal
4. ✅ Test countdown and button enable

### Phase 4: Patient UI - Emergency Booking (60 mins)
1. ✅ Create emergency booking modal
2. ✅ Lock service type to "Emergency Consultation"
3. ✅ Add reason dropdown (dropdown + textarea)
4. ✅ Modify date validation to allow same-day/next-day
5. ✅ Add usage limit display and checking
6. ✅ Remove X button, keep only Cancel/Book
7. ✅ Add CSS for emergency booking
8. ✅ Test full emergency booking flow

### Phase 5: Admin UI (30 mins)
1. ✅ Add emergency alert banner to admin dashboard
2. ✅ Add EMERGENCY badge to appointments list
3. ✅ Add CSS for admin components
4. ✅ Test admin notifications

### Phase 6: Testing (30 mins)
1. ✅ Test emergency booking flow end-to-end
2. ✅ Test usage limits (2 per month)
3. ✅ Test cooldown period (14 days)
4. ✅ Test cancellation counting toward limit
5. ✅ Test admin notifications
6. ✅ Test edge cases

---

## ⚠️ Safety Checks

### Before Implementation:
- ✅ Review existing modal structure
- ✅ Identify existing CSS classes to avoid conflicts
- ✅ Check database schema for conflicts
- ✅ Review appointment model structure

### During Implementation:
- ✅ Use scoped CSS class names with `emergency-apt-` prefix
- ✅ Don't modify existing CSS classes
- ✅ Test each phase before moving to next
- ✅ Verify no visual conflicts with existing modals

### After Implementation:
- ✅ Cross-browser testing
- ✅ Mobile responsive testing
- ✅ Test with existing appointments (no breaks)
- ✅ Test admin view doesn't conflict

---

## 🎨 Color Scheme

```css
/* Emergency-specific colors */
--emergency-red: #dc3545;
--emergency-orange: #fd7e14;
--emergency-yellow: #ffc107;
--emergency-red-light: #f8d7da;
--emergency-orange-light: #ffe5d0;
```

---

## 📊 Database Schema Changes

```sql
ALTER TABLE Appointments 
ADD COLUMN isEmergency BOOLEAN DEFAULT FALSE,
ADD COLUMN emergencyReason TEXT,
ADD COLUMN emergencyReasonCategory ENUM(
  'Severe Pain',
  'High Fever (>39°C)',
  'Injury/Accident',
  'Breathing Difficulty',
  'Severe Allergic Reaction',
  'Other Critical'
) AFTER status;

-- Index for efficient emergency appointment queries
CREATE INDEX idx_appointments_emergency ON Appointments(isEmergency, createdAt);
```

---

## 🔔 Admin Notification Message

```
🚨 Emergency Appointment Booked!

Patient: [Name]
Date: [Date]
Time: [Time]
Reason: [Category] - [Details]
Booked at: [Timestamp]
```

---

## ✅ Success Criteria

- ✅ Emergency button visible but not easily clicked by accident
- ✅ Warning modal shows 3-second countdown
- ✅ Emergency booking bypasses 2-day rule
- ✅ Usage limit enforced (2 per 30 days)
- ✅ Cooldown enforced (14 days between)
- ✅ Cancelled appointments count toward limit
- ✅ Admin sees emergency alerts
- ✅ Emergency badge shows in appointments list
- ✅ No CSS conflicts with existing UI
- ✅ Mobile responsive
- ✅ Auto-approved (no manual approval needed)

---

**Status: READY FOR IMPLEMENTATION** ✅

**Estimated Total Time: 3-4 hours**

**Risk Level: MEDIUM** (Database changes + complex UI flow)

**Testing Priority: HIGH** (Critical healthcare feature)

