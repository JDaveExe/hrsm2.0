# Management Audit Trail - Quick Reference Guide

## 🎯 What Gets Logged Now?

### 📊 Reports (7 Actions)
1. **Custom Report Created** - From InventoryAnalysis charts
2. **Report Type Selected** - From "Select Report Type" modal  
3. **Quick Report Generated** - From ReportsGenerate
4. **Forecast Report Generated** - Comprehensive health forecast
5. **Chart Exported** - PNG download
6. **Report Printed** - PDF/Print action
7. **Report Removed** - Deleted from slots

### 📦 Inventory (2 Actions)
1. **Stock Update** - Added/Deducted/Adjusted (consolidated)
2. **Item Disposed** - Expired vaccines removed

---

## 🔍 Using the Dropdowns

### Action Dropdown
**Shows**: All unique actions from database  
**Format**: "Generated Report", "Stock Update", "Disposed Item"  
**Updates**: Automatically on page load  
**Filter**: Select action to see only those logs

### Type Dropdown
**Shows**: All unique target types from database  
**Format**: "Report", "Medication", "Vaccine", "Patient"  
**Updates**: Automatically on page load  
**Filter**: Select type to see only those logs

---

## 🔑 API Endpoints

### Get Actions
```
GET /api/audit/actions
Auth: Bearer token (Admin/Management)
Returns: ["generated_report", "stock_update", ...]
```

### Get Target Types
```
GET /api/audit/target-types
Auth: Bearer token (Admin/Management)
Returns: ["report", "medication", "vaccine", ...]
```

### Log Report
```
POST /api/audit/log-report
Auth: Bearer token
Body: { 
  reportType: string, 
  reportDetails: { 
    reportName, format, reportId, ...
  } 
}
```

---

## 📝 Example Audit Log Entries

### Report Created
```
Action: generated_report
Description: Generated Patient Demographics report in bar format (Date range: 2025-10-01 to 2025-10-06)
Target: report
User: admin@management.com
```

### Chart Exported
```
Action: generated_report
Description: Generated Patient Demographics - Export report in PNG format
Target: report
User: admin@management.com
```

### Stock Added
```
Action: stock_update
Description: Added 50 units to Paracetamol (Expiry: 12/31/2026)
Target: medication
User: admin@management.com
```

### Vaccine Disposed
```
Action: disposed_item
Description: Disposed vaccine BCG (Qty: 10, Expiry: 09/15/2025, Reason: expired)
Target: vaccine
User: admin@management.com
```

---

## 🛠️ Quick Troubleshooting

### Dropdowns Not Showing Data?
1. Check browser console for errors
2. Verify user role is admin/management
3. Check network tab for 403 errors
4. Ensure audit_logs table has data

### Audit Logs Not Appearing?
1. Check browser console for "Failed to log..." warnings
2. Verify backend server is running
3. Check authentication token is valid
4. Look for database connection errors

### Actions Not Being Logged?
1. Perform the action (create report, export, etc.)
2. Check browser network tab for POST to `/api/audit/log-report`
3. Check backend terminal for audit logging messages
4. Query database: `SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10`

---

## 🎨 Testing Quick Actions

```javascript
// Test in browser console:

// 1. Create custom report
// - Go to Inventory Analysis
// - Click "Create Custom Report" on any chart
// - Check audit trail for "generated_report"

// 2. Export chart
// - Open any report in ReportsManager
// - Click "Export Chart"
// - Check audit trail for export action

// 3. Test dropdowns
fetch('/api/audit/actions', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(r => r.json()).then(console.log);

fetch('/api/audit/target-types', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(r => r.json()).then(console.log);
```

---

## 📊 Database Queries

### View Recent Logs
```sql
SELECT 
  action, 
  actionDescription, 
  targetType, 
  userName, 
  timestamp 
FROM audit_logs 
ORDER BY timestamp DESC 
LIMIT 20;
```

### Count by Action
```sql
SELECT 
  action, 
  COUNT(*) as count 
FROM audit_logs 
WHERE userRole = 'management' 
GROUP BY action 
ORDER BY count DESC;
```

### Today's Management Activities
```sql
SELECT * 
FROM audit_logs 
WHERE userRole = 'management' 
AND DATE(timestamp) = CURDATE()
ORDER BY timestamp DESC;
```

---

## 🔐 Security Notes

- All endpoints require authentication
- Only Admin and Management can view audit logs
- Audit logging failures don't block user actions
- Tokens are validated on every request
- IP addresses and user agents are logged

---

## 📱 User Flow Examples

### Creating a Report
1. Click "Create Report" button
2. Select "Patient Analytics"
3. Choose chart type (bar/line/pie)
4. Confirm creation
5. ✅ **Logged**: "generated_report" with all details

### Exporting Data
1. Open any report
2. Click "Export Chart"
3. PNG downloads
4. ✅ **Logged**: Export action with report name

### Disposing Expired Items
1. Navigate to Vaccine Inventory
2. Find expired batch
3. Click "Dispose"
4. Confirm disposal
5. ✅ **Logged**: "disposed_item" with batch details

---

## 🎯 Key Files Reference

### Backend
- `backend/utils/auditLogger.js` - All audit methods
- `backend/routes/audit.js` - Audit API endpoints
- `backend/routes/forecast.js` - Forecast report logging
- `backend/routes/vaccine-batches.js` - Disposal logging
- `backend/routes/medication-batches.js` - Stock logging

### Frontend
- `src/components/management/components/ManagementAuditTrail.js` - Main audit UI
- `src/components/management/components/ReportsManager.js` - Report actions
- `src/components/management/components/InventoryAnalysis.js` - Custom reports
- `src/components/management/components/ReportsGenerate.js` - Quick reports

---

## ✅ Verification Checklist

- [ ] Dropdowns show real database data
- [ ] All report creations are logged
- [ ] Export/Print/Remove actions logged
- [ ] Stock updates use "stock_update" action
- [ ] Expired item disposal logged
- [ ] No console errors
- [ ] Filters work correctly
- [ ] Search functionality works
- [ ] Pagination displays properly

---

**Last Updated**: October 6, 2025  
**Version**: 2.0  
**Status**: Production Ready ✅
