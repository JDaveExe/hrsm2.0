# Medical Supplies Inventory Proposal for Healthcare Center
## Pasig City Health Center - Barangay Health Stations

---

## 📋 Research: Medical Supplies in Philippine Healthcare Centers

### Primary Medical Supplies Used in Barangay Health Stations

Based on the **Department of Health (DOH) guidelines** and **Philippine Health Insurance Corporation (PhilHealth)** standards for Primary Care facilities, here are the essential medical supplies:

---

## 🏥 CATEGORY 1: BASIC MEDICAL SUPPLIES

### 1. **Wound Care & Dressing Supplies**
- **Gauze Pads** (2"x2", 4"x4") - For wound dressing
- **Cotton Balls** - General wound cleaning
- **Bandages** (Elastic/Adhesive) - Wound coverage
- **Micropore Tape** - Securing dressings
- **Betadine Solution** - Antiseptic
- **Alcohol (70% Isopropyl)** - Disinfection
- **Hydrogen Peroxide** - Wound cleaning
- **Sterile Gloves** (Small, Medium, Large)

### 2. **Diagnostic & Examination Supplies**
- **Thermometer Covers** (Digital thermometer supplies)
- **Tongue Depressors** - Throat examination
- **Cotton Swabs** - Specimen collection
- **Examination Gloves** (Non-sterile)
- **Face Masks** (Surgical, N95)
- **Face Shields**
- **Surgical Gowns/Coveralls**
- **Urine Test Strips**
- **Blood Glucose Test Strips**
- **Rapid Diagnostic Test Kits** (RDT) - For dengue, COVID-19, etc.

### 3. **Injection & IV Supplies**
- **Syringes** (1ml, 3ml, 5ml, 10ml)
- **Needles** (Various gauges: 21G, 23G, 25G)
- **IV Cannulas/Catheters**
- **IV Tubings**
- **IV Solutions** (PNSS, D5LRS, D5W)
- **Blood Collection Tubes**
- **Tourniquet**
- **Alcohol Swabs**

### 4. **Documentation & Office Supplies**
- **Medical Forms** (Patient records, prescriptions)
- **Labels & Stickers**
- **Pens & Markers**
- **Folders & Envelopes**

### 5. **Hygiene & Sanitation**
- **Hand Sanitizer** (Alcohol-based gel)
- **Soap** (Handwashing)
- **Tissue Paper**
- **Trash Bags** (Medical waste, general waste)
- **Disinfectant Solution** (Lysol, bleach)

### 6. **Emergency & First Aid Supplies**
- **Nebulizer Masks** (Adult, Pediatric)
- **Oxygen Masks/Nasal Cannula**
- **Ambu Bag** (Manual resuscitator)
- **Splints** (For fractures)
- **Cold/Hot Compress**

---

## 🏙️ PASIG CITY SPECIFIC CONSIDERATIONS

### Additional Supplies Based on Pasig Health Programs:

1. **COVID-19 Response**
   - **Rapid Antigen Test Kits**
   - **RT-PCR Test Kits**
   - **Thermal Scanners**
   - **Quarantine Supplies**

2. **Maternal & Child Health Program**
   - **Prenatal Vitamins** (Iron, Folic Acid)
   - **Newborn Screening Test Kits**
   - **Family Planning Supplies** (Condoms, Pills)
   - **Infant Weighing Scales**

3. **Dengue Control Program**
   - **Dengue RDT Kits**
   - **Mosquito Repellent**
   - **Larvicide**

4. **Tuberculosis (TB) Program**
   - **Sputum Containers**
   - **TB Test Kits** (GeneXpert supplies)
   - **N95 Masks** (Healthcare workers)

---

## 💡 THE BIG QUESTION: HOW TO TRACK SUPPLY USAGE?

### **Current Challenge:**
Unlike medications and vaccines which are:
- **Prescribed** → Direct patient link
- **Administered** → Documented in patient records
- **Traceable** → Appointment/checkup/vaccination records

Medical supplies are:
- **Used indirectly** → No direct patient prescription
- **Consumed in bulk** → Multiple patients per item
- **Non-specific** → Hard to track who used what

---

## 🎯 PROPOSED TRACKING SOLUTIONS

### **Option 1: Manual Adjustment System** ⭐ SIMPLEST
**How it works:**
- Initial stock is logged
- Staff manually adjusts stock when supplies run low
- No automatic deduction

**Pros:**
- Easy to implement
- No complex tracking needed
- Staff control

**Cons:**
- Manual prone to errors
- No real-time accuracy
- Hard to analyze usage patterns

**Example:**
```
Gauze Pads: 500 units in stock
Staff uses 50 units throughout the day
Staff manually updates: 450 units remaining
```

---

### **Option 2: Daily/Weekly Consumption Log** ⭐⭐ RECOMMENDED
**How it works:**
- Staff logs daily consumption at end of shift
- System tracks usage over time
- Automatic stock adjustment based on log

**Pros:**
- Better tracking than manual
- Usage pattern analysis possible
- Accountability for staff

**Cons:**
- Requires daily discipline
- Still manual entry

**Example:**
```
End of Day Report:
- Gauze Pads used: 30 units (20 patients)
- Alcohol used: 50ml
- Syringes used: 15 pieces
System auto-deducts from stock
```

**Implementation:**
- Add "Daily Consumption Log" feature
- Staff inputs usage before logging out
- System calculates average daily usage
- Alerts when supplies low

---

### **Option 3: Service-Based Deduction** ⭐⭐⭐ MOST ACCURATE
**How it works:**
- Link supplies to services (checkup, injection, dressing)
- When service is performed, auto-deduct supplies
- Predefined "supply bundles" per service

**Pros:**
- Automatic tracking
- Accurate per-patient usage
- Best for analytics

**Cons:**
- Complex implementation
- Requires service standardization
- May not fit all scenarios

**Example:**
```
Service: "Wound Dressing"
Auto-deducts:
- Gauze Pads: 2 units
- Betadine: 10ml
- Micropore Tape: 1 piece
- Sterile Gloves: 1 pair

When doctor performs wound dressing on Patient A:
System automatically deducts supplies
```

**Implementation:**
- Create "Service Templates"
- Define supply requirements per service
- Link to doctor's activities (checkup, procedures)

---

### **Option 4: Hybrid Approach** ⭐⭐⭐⭐ BEST FOR YOUR SYSTEM
**Combines Options 2 & 3:**

**For Trackable Services (Option 3):**
- Injection → Auto-deduct syringe, needle, alcohol swab
- Blood Pressure Check → Auto-deduct alcohol swab (if applicable)
- Wound Dressing → Auto-deduct gauze, betadine, tape, gloves

**For General Supplies (Option 2):**
- Daily consumables (tissue, soap, etc.)
- Staff manually logs daily consumption
- Not tied to specific patient

**Pros:**
- Best of both worlds
- Flexible system
- Accurate for critical items
- Practical for general supplies

**Cons:**
- Most complex to implement
- Requires careful planning

---

## 📊 DATABASE STRUCTURE PROPOSAL

### **New Table: `medical_supplies`**
```sql
CREATE TABLE medical_supplies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  supply_name VARCHAR(255) NOT NULL,
  category ENUM('Wound Care', 'Diagnostic', 'Injection', 'Hygiene', 'Emergency', 'Office', 'PPE') NOT NULL,
  unit_of_measure VARCHAR(50) NOT NULL, -- pieces, ml, boxes, packs
  current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  minimum_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit_cost DECIMAL(10,2),
  supplier VARCHAR(255),
  expiry_date DATE,
  location VARCHAR(100), -- Storage location in health center
  is_trackable BOOLEAN DEFAULT FALSE, -- TRUE if auto-deduct, FALSE if manual
  tracking_method ENUM('manual', 'daily_log', 'service_based', 'hybrid') DEFAULT 'manual',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### **New Table: `supply_usage_log`** (For Daily Consumption)
```sql
CREATE TABLE supply_usage_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  supply_id INT NOT NULL,
  quantity_used DECIMAL(10,2) NOT NULL,
  usage_date DATE NOT NULL,
  logged_by_user_id INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supply_id) REFERENCES medical_supplies(id),
  FOREIGN KEY (logged_by_user_id) REFERENCES users(id)
);
```

### **New Table: `service_supply_templates`** (For Service-Based Tracking)
```sql
CREATE TABLE service_supply_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  service_name VARCHAR(255) NOT NULL, -- e.g., "Wound Dressing", "Injection"
  supply_id INT NOT NULL,
  quantity_per_service DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supply_id) REFERENCES medical_supplies(id)
);
```

### **New Table: `supply_transactions`** (Stock In/Out History)
```sql
CREATE TABLE supply_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  supply_id INT NOT NULL,
  transaction_type ENUM('stock_in', 'stock_out', 'adjustment', 'expired') NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  remaining_stock DECIMAL(10,2) NOT NULL,
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  performed_by_user_id INT NOT NULL,
  reference_type VARCHAR(50), -- 'daily_log', 'service', 'manual_adjustment'
  reference_id INT, -- ID of the related record
  notes TEXT,
  FOREIGN KEY (supply_id) REFERENCES medical_supplies(id),
  FOREIGN KEY (performed_by_user_id) REFERENCES users(id)
);
```

---

## 🎨 UI/UX PROPOSAL FOR MANAGEMENT DASHBOARD

### **New Tab: Medical Supplies**

```
Management Dashboard > Inventory
├── Prescription Inventories (Existing)
├── Vaccine Inventories (Existing)
└── Medical Supplies (NEW)
    ├── All Supplies (List view)
    ├── By Category (Filter)
    ├── Low Stock Alerts
    ├── Expiring Soon
    └── Daily Consumption Log
```

### **Features:**

1. **Supply List View**
   - Search & filter by category
   - Stock status badges (In Stock, Low Stock, Out of Stock)
   - Quick add/edit/delete
   - Expiry date monitoring

2. **Add New Supply Modal**
   - Supply name, category, unit of measure
   - Initial stock, minimum stock threshold
   - Supplier, cost, expiry date
   - Tracking method selection (Manual/Daily Log/Service-Based)

3. **Daily Consumption Log Modal** (For staff)
   - Select date
   - Input supplies used for the day
   - Auto-calculate remaining stock
   - Save log

4. **Service Templates Manager** (For admin setup)
   - Create service (e.g., "Wound Dressing")
   - Add supplies required per service
   - Set quantities

5. **Analytics Dashboard**
   - Most consumed supplies
   - Monthly usage trends
   - Cost analysis
   - Stock turnover rate
   - Expiry waste tracking

---

## 🚀 IMPLEMENTATION PHASES

### **Phase 1: Basic Manual System** (Quickest)
1. Create `medical_supplies` table
2. Add Medical Supplies tab in Management Dashboard
3. CRUD operations (Add, View, Edit, Delete)
4. Manual stock adjustment
5. Low stock alerts

**Effort:** 2-3 days
**Tracking:** Manual only

---

### **Phase 2: Daily Consumption Log** (Recommended First Step)
1. Create `supply_usage_log` table
2. Add "Log Daily Usage" feature
3. Auto-deduct from stock based on daily log
4. Usage analytics & reports

**Effort:** 3-4 days
**Tracking:** Daily manual logging with auto-calculation

---

### **Phase 3: Service-Based Auto-Tracking** (Advanced)
1. Create `service_supply_templates` table
2. Link supplies to doctor activities
3. Auto-deduct when service performed
4. Hybrid tracking (some manual, some auto)

**Effort:** 5-7 days
**Tracking:** Semi-automatic based on services

---

### **Phase 4: Full Analytics & Reporting** (Optional Enhancement)
1. Create `supply_transactions` table for complete audit trail
2. Advanced analytics dashboard
3. Predictive stock forecasting
4. Supplier management integration

**Effort:** 5-7 days
**Tracking:** Complete audit trail with full analytics

---

## ❓ QUESTIONS FOR DISCUSSION

### 1. **Which tracking method do you prefer?**
   - Option 1: Manual adjustment only (simplest)
   - Option 2: Daily consumption log (recommended)
   - Option 3: Service-based auto-deduction (complex)
   - Option 4: Hybrid approach (best but most work)

### 2. **Which categories should we prioritize first?**
   - Should we start with all categories or phase them in?
   - Are some supplies more critical to track than others?

### 3. **Who will be responsible for logging supply usage?**
   - Management only?
   - Doctors/nurses?
   - Dedicated inventory staff?

### 4. **Should we track supply costs?**
   - Do you need cost analysis and budgeting features?
   - Supplier management?

### 5. **Expiry date management:**
   - How critical is expiry tracking?
   - Should we have automatic alerts X days before expiry?

### 6. **Integration with existing features:**
   - Should doctors see supply levels during checkups?
   - Should admin/management be the only ones who manage supplies?

---

## 💭 MY RECOMMENDATION

Based on your existing system structure and typical barangay health center operations:

### **Start with Phase 1 + Phase 2 (Basic + Daily Log)**

**Why:**
1. **Practical** - Matches real-world health center operations
2. **Simple** - Staff can easily log daily consumption
3. **Trackable** - Better than pure manual, not overly complex
4. **Scalable** - Can upgrade to service-based tracking later
5. **Fits Your System** - Similar to your vaccine/medication tracking

**Implementation:**
- Create medical supplies inventory (like vaccines/medications)
- Add "Daily Usage Log" feature at end of day
- Auto-calculate stock based on logs
- Alert when stock is low
- Generate usage reports for procurement planning

**Later Enhancement:**
- Add service-based auto-tracking for specific procedures
- Link to doctor activities for automatic deduction
- Advanced analytics and forecasting

---

## 📌 NEXT STEPS

1. **Confirm your preferred tracking approach**
2. **Review the proposed supply categories**
3. **Decide on implementation phase**
4. **I'll create the database structure and backend APIs**
5. **Build the frontend UI for Medical Supplies tab**

Let's discuss! What are your thoughts on the tracking methods and which approach would work best for your health center? 🏥

---

**References:**
- DOH Primary Care Facility Guidelines
- Philippine Health Technology Assessment Council (PHTAC) Standards
- Barangay Health Station Supply Standards
- PhilHealth Primary Care Benefit Package
