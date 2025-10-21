# Testing Guide: Barangay → Purok Migration

## ✅ What's Already Verified

1. **Registration Form** - ✅ WORKING
   - You confirmed: "alright it is working on registration now!"
   - Purok field is functioning correctly
   - Data saves to database properly

2. **Code Quality** - ✅ VERIFIED
   - All files have zero syntax errors
   - Database migration completed successfully
   - 36 patients preserved with data integrity

---

## 🧪 What Needs Testing

### Test 1: Admin Add Patient Form

**Location:** Admin Dashboard → Patient Management → Add Patient Button

**Steps:**
1. Login as admin user
2. Navigate to "Patient Management"
3. Click the "Add Patient" button (green button at top)
4. Fill in the required fields:
   - First Name: Test
   - Last Name: Purok
   - Date of Birth: (any valid date)
   - Gender: (select one)
   - Civil Status: (select one)
   - Contact Number: 09123456789
   - **Street:** Select any street (e.g., "Shaw Boulevard")
   - **Purok:** Should populate with options (e.g., "Kapitolyo", "Oranbo", "Bagong Ilog")
5. Click Submit

**Expected Results:**
- ✅ Purok dropdown should populate when street is selected
- ✅ Purok dropdown should show "Select Purok" as placeholder
- ✅ Form should validate that Purok is required
- ✅ Patient should be created successfully
- ✅ Success message should appear

**What to Check:**
- Does the purok dropdown work properly?
- Does validation show "Purok is required" if left empty?
- Does the patient save with the correct purok value?

---

### Test 2: Healthcare Insights Analytics

**Location:** Management Dashboard → Healthcare Insights

**Steps:**
1. Login as admin or management user
2. Navigate to "Healthcare Insights"
3. Scroll down to the "Patient Visits by Purok" chart (bottom right)
4. Observe the chart

**Expected Results:**
- ✅ Chart title should say "Patient Visits by Purok"
- ✅ Chart should display bar graph with purok names on X-axis
- ✅ Chart should show visit counts on Y-axis
- ✅ Sorting dropdown should have options:
  - "Most Visits"
  - "Purok Name (A-Z)"

**Additional Tests:**
1. Click the "Zoom" button
   - ✅ Modal should open with larger chart
   - ✅ Data table should show "Purok" column (not "Barangay")
   - ✅ Statistics should show "Puroks Served" (not "Barangays Served")
   - ✅ Should show "Avg per Purok" (not "Avg per Barangay")

2. Test Sorting
   - ✅ Click "Most Visits" - bars should sort by height (descending)
   - ✅ Click "Purok Name (A-Z)" - bars should sort alphabetically

---

## 🔍 Quick Verification Checklist

### Frontend Components
- [ ] LoginSignup - Registration form uses "Purok" label ✅ (already working)
- [ ] PatientManagement - Add Patient form uses "Purok" label
- [ ] HealthcareInsights - Chart shows "Purok" instead of "Barangay"

### Backend API
- [ ] Registration endpoint accepts `purok` field ✅ (already working)
- [ ] Add patient endpoint accepts `purok` field
- [ ] Analytics endpoint returns `/api/checkups/analytics/purok-visits`

### Database
- [ ] Patients table has `purok` column ✅ (migration complete)
- [ ] New patients save with `purok` value ✅ (registration working)
- [ ] Existing patients show their `purok` values

---

## 🐛 Common Issues & Solutions

### Issue 1: Purok dropdown not populating
**Solution:** Make sure street is selected first. The dropdown is dependent on street selection.

### Issue 2: Chart shows no data
**Solution:** 
1. Check if there are completed checkups in the database
2. Verify the backend server is running
3. Check browser console for API errors

### Issue 3: "Barangay" still appears somewhere
**Solution:** Let me know the specific location and I'll update it. We intentionally kept:
- App titles (e.g., "Barangay Maybunga Healthcare")
- Location names (e.g., "Barangay Maybunga, Pasig City")

---

## 📊 What Changed

### Before Migration:
- Registration form had "Barangay" field
- Admin form had "Barangay" field
- Analytics showed "Patient Visits by Barangay"
- Database column was `Patients.barangay`

### After Migration:
- Registration form has "Purok" field ✅
- Admin form has "Purok" field ✅
- Analytics shows "Patient Visits by Purok" ✅
- Database column is `Patients.purok` ✅

---

## 🎯 Success Criteria

The migration is 100% successful when:

1. ✅ Registration works with purok (CONFIRMED WORKING)
2. [ ] Admin can add patients with purok field
3. [ ] Analytics dashboard shows purok data
4. [ ] No errors in browser console
5. [ ] No errors in backend logs
6. [ ] All data saves and displays correctly

---

## 📞 If You Find Issues

Report any issues you find with:
1. **Location:** Where did you see it? (which page/component)
2. **What you expected:** What should it say/do?
3. **What you saw:** What actually happened?
4. **Screenshot:** (if possible)

Example:
- Location: Admin → Add Patient Modal
- Expected: Dropdown should say "Select Purok"
- Saw: Dropdown still says "Select Barangay"
- Screenshot: [attach]

---

## 🚀 Next Steps After Testing

Once both tests pass:
1. Mark todos as complete
2. Consider the migration 100% successful
3. Continue with other capstone recommendations
4. Optional: Update any documentation or user guides

---

**Testing Priority:**
1. 🔴 HIGH: Admin Add Patient form (core functionality)
2. 🟡 MEDIUM: Healthcare Insights analytics (reporting feature)

---

**Estimated Testing Time:** 5-10 minutes

Good luck with testing! 🎉
