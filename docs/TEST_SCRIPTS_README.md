# Medical Supplies Inventory - Test Scripts

## 📋 Overview

Comprehensive test suite for Medical Supplies Inventory functionality.

## 🧪 Test Scripts

### Individual Tests:

1. **`test-add-supply.js`** - Tests adding new medical supplies
   - Creates a test supply
   - Verifies it's added to database
   - Checks persistence after refresh

2. **`test-log-usage.js`** - Tests daily usage logging
   - Logs usage for a supply
   - Verifies stock is automatically deducted
   - Checks usage log is saved
   - Verifies persistence

3. **`test-edit-supply.js`** - Tests editing supply information
   - Updates stock and supplier info
   - Verifies changes are saved
   - Checks persistence

4. **`test-add-stock.js`** - Tests adding stock to supplies
   - Adds stock to existing supply
   - Verifies stock increases correctly
   - Checks persistence

5. **`test-remove-supplies.js`** - Tests bulk deletion
   - Deletes multiple supplies
   - Verifies they're removed from database
   - Checks persistence

### Master Test Runner:

6. **`test-all-medical-supplies.js`** - Runs all tests in sequence
   - Executes all 5 tests
   - Provides comprehensive summary
   - Shows pass/fail results

## 🚀 How to Run

### Prerequisites:
1. Backend server must be running on port 5000
2. Node.js and axios package installed

### Run Individual Tests:

```bash
# Test Add Supply
node test-add-supply.js

# Test Log Usage
node test-log-usage.js

# Test Edit Supply
node test-edit-supply.js

# Test Add Stock
node test-add-stock.js

# Test Remove Supplies
node test-remove-supplies.js
```

### Run All Tests:

```bash
# Run complete test suite
node test-all-medical-supplies.js
```

## 📊 What Each Test Checks

### Test 1: Add Supply ✅
- ✅ Supply is created with correct data
- ✅ Unique ID is generated
- ✅ Supply appears in list
- ✅ Data persists after "refresh"

### Test 2: Log Usage ✅
- ✅ Usage is logged
- ✅ Stock is automatically deducted
- ✅ Usage log is saved
- ✅ Stock reduction persists

### Test 3: Edit Supply ✅
- ✅ Supply information is updated
- ✅ Changes are saved correctly
- ✅ Data persists after "refresh"

### Test 4: Add Stock ✅
- ✅ Stock is added to supply
- ✅ Stock increases correctly
- ✅ Changes persist

### Test 5: Remove Supplies ✅
- ✅ Supplies are deleted
- ✅ Deleted supplies return 404
- ✅ Count decreases correctly
- ✅ Deletion persists

## 📝 Expected Output

Each test will show:
- 📊 Initial state
- ➕ Action being performed
- 🔍 Verification steps
- 🔄 Persistence check
- ✅ Summary

Example success output:
```
🧪 TEST 1: Add Medical Supply

============================================================
📊 Step 1: Getting current supplies...
✅ Current supplies count: 30

➕ Step 2: Adding new supply...
✅ Supply added successfully!

🔍 Step 3: Verifying supply was added...
✅ Count increased by 1 - Supply added correctly!

🔄 Step 5: Simulating page refresh...
✅ Supply persists after refresh!

============================================================
📋 TEST 1 SUMMARY: Add Medical Supply
============================================================
✅ Supply creation: SUCCESS
✅ Data persistence: SUCCESS
```

## 🐛 Troubleshooting

### Error: "connect ECONNREFUSED"
**Solution:** Start the backend server
```bash
cd backend
node server.js
```

### Error: "No supplies found"
**Solution:** Run test-add-supply.js first to create test data

### Error: "Usage log error"
**Solution:** Check that supply_usage_log.json exists in backend/data/

## 💡 Tips

1. **Run tests in order** the first time to build up test data
2. **Run all tests** using `test-all-medical-supplies.js` for comprehensive check
3. **Check browser** after each test to verify UI updates
4. **Check JSON files** in `backend/data/` to see persisted data

## 📂 Data Files

Tests interact with these files:
- `backend/data/medical_supplies.json` - All supplies
- `backend/data/supply_usage_log.json` - Usage logs

## ✅ Success Criteria

All tests should show:
- ✅ All operations complete successfully
- ✅ Data persists across "refreshes"
- ✅ Stock calculations are correct
- ✅ No errors in console

## 🎯 What This Proves

When all tests pass, it confirms:
1. ✅ Add Supply works and persists
2. ✅ Log Usage works and auto-deducts stock
3. ✅ Edit Supply works and persists
4. ✅ Add Stock works and persists
5. ✅ Remove works and persists

**All functionality is production-ready!** 🚀
