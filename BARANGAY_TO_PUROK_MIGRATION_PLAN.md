# Barangay to Purok Migration Plan
**Date:** October 11, 2025
**Recommendation:** Change all 'Barangay' references to 'Purok'

## ⚠️ CRITICAL: This is a database-breaking change that requires careful execution!

---

## 📋 Summary of Affected Areas

### 1. **Database Tables**
Based on code analysis, the following table has a `barangay` column:
- **Patients** table - `barangay` VARCHAR column

### 2. **Backend Files** (Found ~100+ occurrences)
- `backend/models/Patient.js` - Model definition
- `backend/routes/auth.js` - Registration/login endpoints
- `backend/routes/patients.js` - Patient CRUD operations
- `backend/routes/checkups.js` - Barangay visits analytics endpoint
- `backend/services/emailService.js` - Email templates
- `backend/test-cleaning-logic.js` - Test scripts

### 3. **Frontend Files**
- `src/components/LoginSignup.js` - Registration form (JUST UPDATED with new validation)
- Form state: `formData.barangay`
- Validation: `fieldErrors.barangay`
- Labels: "Barangay" text
- Mapping object: `streetToBarangay` → needs to become `streetToPurok`

### 4. **Service Files**
- `src/services/authService.js` - API calls for registration

---

## 🔧 Step-by-Step Migration Process

### **STEP 1: Create Database Migration Script**

```sql
-- migration-barangay-to-purok.sql

-- ============================================
-- BACKUP FIRST! Run this before migration:
-- mysqldump -u root -p hrsm2 > hrsm2_backup_before_purok_migration.sql
-- ============================================

USE hrsm2;

-- Start transaction for safety
START TRANSACTION;

-- Rename column in Patients table
ALTER TABLE Patients 
CHANGE COLUMN barangay purok VARCHAR(255);

-- Verify the change
SELECT COUNT(*) as total_patients, 
       COUNT(purok) as patients_with_purok 
FROM Patients;

-- If everything looks good, COMMIT
-- If there's an issue, ROLLBACK
COMMIT;

-- ============================================
-- ROLLBACK SCRIPT (if needed):
-- ALTER TABLE Patients CHANGE COLUMN purok barangay VARCHAR(255);
-- ============================================
```

### **STEP 2: Update Backend Model**

File: `backend/models/Patient.js` (Line ~115)

```javascript
// CHANGE FROM:
barangay: {
  type: DataTypes.STRING,
  allowNull: true,
},

// CHANGE TO:
purok: {
  type: DataTypes.STRING,
  allowNull: true,
},
```

### **STEP 3: Update Backend Routes**

#### File: `backend/routes/auth.js` (Lines ~82, ~182)
```javascript
// Update destructuring and field references
const { 
  firstName, lastName, middleName, suffix,
  email, password, phoneNumber,
  houseNo, street, purok,  // CHANGED from barangay
  city, region,
  philHealthNumber, membershipStatus,
  dateOfBirth, gender, civilStatus
} = req.body;
```

#### File: `backend/routes/patients.js`
- Line ~76: Update `fieldsToClean` array
- Line ~246: Update address formatting
- Line ~381: Update patient data response
- Line ~476: Update destructuring
- Line ~512: Update field assignment
- Line ~617: Update response formatting
- Line ~684: Update patient mapping

#### File: `backend/routes/checkups.js` (Lines ~1676-1752)
```javascript
// Update analytics endpoint
router.get('/analytics/purok-visits', async (req, res) => {  // CHANGED endpoint
  try {
    console.log('Fetching purok visits analytics data...');  // CHANGED
    
    // ... update all variable names:
    // barangay → purok
    // barangayMap → purokMap
    // barangayData → purokData
    // commonBarangays → commonPuroks
    
    const purokMap = {};
    // ... rest of implementation
  }
});
```

### **STEP 4: Update Frontend Components**

#### File: `src/components/LoginSignup.js`

**A. Update State (Line ~42-60):**
```javascript
const [formData, setFormData] = useState({
  // ... other fields
  purok: '',  // CHANGED from barangay
  // ... other fields
});

const [fieldErrors, setFieldErrors] = useState({
  // ... other fields
  purok: '',  // CHANGED from barangay
  // ... other fields
});
```

**B. Update Data Mapping (Line ~88-102):**
```javascript
// CHANGE FROM:
const streetToBarangay = {
  'Amang Rodriguez Avenue': ['Manggahan', 'Rosario', 'Dela Paz'],
  // ... rest
};

// CHANGE TO:
const streetToPurok = {
  'Amang Rodriguez Avenue': ['Manggahan', 'Rosario', 'Dela Paz'],
  // ... rest
};
```

**C. Update Helper Functions:**
```javascript
// CHANGE FROM:
const getAvailableBarangays = () => {
  if (!formData.street || !streetToBarangay[formData.street]) {
    return [];
  }
  return streetToBarangay[formData.street];
};

// CHANGE TO:
const getAvailablePuroks = () => {
  if (!formData.street || !streetToPurok[formData.street]) {
    return [];
  }
  return streetToPurok[formData.street];
};
```

**D. Update Validation (Lines in validateField function):**
```javascript
case 'purok':  // CHANGED from 'barangay'
  if (!value || value.trim() === '') {
    error = 'Purok is required';  // CHANGED
  }
  break;
```

**E. Update JSX Form Fields:**
```jsx
<Form.Group>
  <Form.Label>Purok <span className="text-danger">*</span></Form.Label>
  <Form.Select 
    name="purok"  // CHANGED
    value={formData.purok}  // CHANGED
    onChange={handleChange}
    onBlur={() => handleFieldBlur('purok')}  // CHANGED
    onFocus={() => clearFieldError('purok')}  // CHANGED
    disabled={!formData.street}
    isInvalid={!!fieldErrors.purok}  // CHANGED
  >
    <option value="">Select Purok</option>
    {getAvailablePuroks().map(p => <option key={p} value={p}>{p}</option>)}
  </Form.Select>
  <Form.Control.Feedback type="invalid">
    {fieldErrors.purok}  // CHANGED
  </Form.Control.Feedback>
</Form.Group>
```

**F. Update handleSubmit:**
```javascript
// Clear the form - update field name
setFormData({
  // ... other fields
  purok: '',  // CHANGED from barangay
  // ... other fields
});
```

### **STEP 5: Update Service Files**

#### File: `src/services/authService.js`
- Update any field mappings or transformations

### **STEP 6: Update Test Files**
- `backend/scripts/test-patient-creation.js`
- `backend/scripts/test-na-email.ps1`
- `final-registration-test.js`
- And other test scripts

### **STEP 7: Search and Replace Remaining References**
Use VS Code Find & Replace (Ctrl+Shift+H):
1. Search: `barangay` (case-sensitive)
2. Replace: `purok`
3. Search: `Barangay` (case-sensitive)
4. Replace: `Purok`

**IMPORTANT:** Exclude these from replacement:
- Email templates mentioning "Barangay Maybunga" (these are address references, not field names)
- Comments/documentation that explain the old system
- SQL backup files

---

## ✅ Testing Checklist

- [ ] **Backup Database** - Create full backup before any changes
- [ ] **Run Migration Script** - Execute SQL migration in test environment
- [ ] **Test Backend Startup** - Ensure server starts without errors
- [ ] **Test Registration** - Register new user with purok field
- [ ] **Test Patient CRUD** - View/edit patient profiles
- [ ] **Test Analytics** - Check purok visits analytics endpoint
- [ ] **Test Existing Data** - Verify old data displays correctly with new field name
- [ ] **Test Validation** - Ensure field validation works for purok
- [ ] **Test API Responses** - Check all API responses use 'purok' not 'barangay'
- [ ] **Cross-Browser Testing** - Test frontend in different browsers
- [ ] **Mobile Testing** - Test responsive forms on mobile devices

---

## 🔄 Rollback Plan

If something goes wrong:

1. **Stop the application**
2. **Rollback database:**
   ```sql
   ALTER TABLE Patients CHANGE COLUMN purok barangay VARCHAR(255);
   ```
3. **Git revert frontend/backend changes**
4. **Restart application**

---

## 📝 Notes

- This change affects the entire application stack
- Estimated time: 2-3 hours for complete migration and testing
- Recommended to do this during low-traffic period
- Consider feature flag if you want gradual rollout
- Update API documentation after completion
- Notify team members about field name change

---

## 🚀 Execution Order

1. Create database backup
2. Update database schema (run SQL migration)
3. Update backend models
4. Update backend routes
5. Update frontend components
6. Update services
7. Test thoroughly
8. Deploy to production (if tests pass)

---

**Status:** Ready for execution
**Risk Level:** High (database schema change)
**Reversibility:** Yes (with rollback script)
