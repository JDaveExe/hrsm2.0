# Testing Guide for Admin-Doctor Simulation Integration

## Quick Browser Console Tests

### 1. Check Current Shared State
```javascript
// Run in browser console on either dashboard
console.log("Doctor Queue:", JSON.parse(localStorage.getItem('doctorQueueData') || '[]'));
console.log("Shared Checkups:", JSON.parse(localStorage.getItem('sharedCheckupsData') || '[]'));
console.log("Simulation Mode:", JSON.parse(localStorage.getItem('simulationModeStatus') || '{}'));
```

### 2. Manually Add Test Patient to Doctor Queue
```javascript
// Run in admin dashboard console
const testPatient = {
  id: 'SIM-' + Date.now(),
  name: 'Simulation Test Patient',
  type: 'Check-up', 
  status: 'Waiting',
  source: 'admin_simulation',
  queuedAt: new Date().toISOString(),
  patientId: 'PT-SIM'
};

let queue = JSON.parse(localStorage.getItem('doctorQueueData') || '[]');
queue.push(testPatient);
localStorage.setItem('doctorQueueData', JSON.stringify(queue));
console.log('Added test patient, refresh doctor dashboard');
```

### 3. Test Simulation Mode Notification
```javascript
// Run in admin dashboard console to activate simulation mode
const simulationStatus = {
  enabled: true,
  currentSimulatedDate: new Date().toISOString(),
  activatedBy: 'Test Admin',
  activatedAt: new Date().toISOString(),
  smsSimulation: true,
  emailSimulation: true,
  dataSimulation: false
};

localStorage.setItem('simulationModeStatus', JSON.stringify(simulationStatus));
console.log('Simulation mode activated, refresh doctor dashboard to see notification');
```

### 4. Test Status Update
```javascript
// Run in doctor dashboard console
let queue = JSON.parse(localStorage.getItem('doctorQueueData') || '[]');
if (queue.length > 0) {
  queue[0].status = 'In Progress';
  queue[0].startedAt = new Date().toISOString();
  localStorage.setItem('doctorQueueData', JSON.stringify(queue));
  console.log('Updated status, refresh to see changes');
}
```

## Visual Test Checklist

### Admin Dashboard (localhost:3000)
- [ ] Can add patients to simulation
- [ ] "Add to Doctor Queue" button works  
- [ ] Simulation controls are visible
- [ ] Status updates reflect doctor changes
- [ ] Simulation mode toggles sync to shared state

### Doctor Dashboard (localhost:3001)  
- [ ] **NEW: Simulation notification bar appears when admin activates simulation mode**
- [ ] Notification shows admin username, activation time, and simulated date
- [ ] Simulation patients appear with blue styling
- [ ] CPU icon visible in row number
- [ ] "From Admin" status badge shows count
- [ ] Can start/continue sessions on simulation patients
- [ ] Status changes sync back to admin

### Cross-Dashboard Communication
- [ ] Admin simulation mode activation shows notification in doctor dashboard
- [ ] Admin additions appear in doctor queue
- [ ] Doctor status changes visible in admin
- [ ] LocalStorage persistence working
- [ ] Real-time updates on page refresh

## Expected Visual Indicators

### Simulation Notification Bar (NEW)
- Blue gradient background (light mode) / Cyan gradient (dark mode)
- CPU icon with pulsing animation
- Shows: "Simulation Mode Active"
- Displays activating admin username
- Shows simulated date or "Real-time mode"
- "SIMULATION" badge with warning icon
- Sticky positioning below topbar

### Simulation Row Styling
- Blue gradient background
- Blue left border (4px)
- CPU icon in row number column
- "From Admin" status badge
- Distinct hover effects

### Status Badges
- Waiting: Yellow/orange
- In Progress: Green
- From Admin: Blue with CPU icon

## Step-by-Step Testing Procedure

### Phase 1: Setup Multi-Instance Testing
1. Open http://localhost:3000 (Admin Dashboard)
2. Open http://localhost:3001 (Doctor Dashboard)
3. Login to admin with: `admin` / `admin123`
4. Login to doctor with: `doctor` / `doctor123`

### Phase 2: Test Simulation Mode Activation
5. In Admin Dashboard:
   - Go to "Today Checkup" section
   - Toggle the simulation mode ON
   - Set a simulated date (optional)
6. In Doctor Dashboard:
   - **Refresh the page**
   - **Verify simulation notification bar appears**
   - Check notification shows correct admin username
   - Verify simulated date is displayed

### Phase 3: Test Admin-to-Doctor Queue Transfer
7. In Admin Dashboard:
   - Add patients using simulation controls
   - Use "Add to Doctor Queue" button
8. In Doctor Dashboard:
   - **Refresh to see new patients**
   - Verify patients appear with blue styling
   - Check CPU icons in row numbers
   - Verify "From Admin" status badge count

### Phase 4: Test Doctor Workflow
9. In Doctor Dashboard:
   - Click "Start Session" on simulation patient
   - Verify status changes to "In Progress"
10. In Admin Dashboard:
    - **Refresh to see status update**
    - Verify shared state reflects doctor's changes

### Phase 5: Test Simulation Mode Deactivation
11. In Admin Dashboard:
    - Toggle simulation mode OFF
12. In Doctor Dashboard:
    - **Refresh the page**
    - **Verify notification bar disappears**
    - Existing simulation patients should remain but no new ones added

## Troubleshooting

### If simulation notification doesn't appear:
1. Check browser console for errors
2. Verify simulationModeStatus in localStorage: `JSON.parse(localStorage.getItem('simulationModeStatus'))`
3. Ensure admin has activated simulation mode
4. Try hard refresh (Ctrl+F5) on doctor dashboard
5. Check DataContext import in DocDashboard.js

### If simulation patients don't appear:
1. Check browser console for errors
2. Verify localStorage has data: `JSON.parse(localStorage.getItem('doctorQueueData'))`
3. Refresh both dashboards
4. Check DataContext is properly imported

### If styling doesn't work:
1. Check DocDashboard.css is loaded
2. Verify simulation classes are applied
3. Check for CSS conflicts
4. Test in different browsers

### If cross-dashboard sync fails:
1. Verify both dashboards use same localStorage
2. Check network tab for API errors
3. Ensure both instances point to same backend
4. Try clearing localStorage and testing again

## Advanced Testing Commands

### Clear All Simulation Data
```javascript
localStorage.removeItem('doctorQueueData');
localStorage.removeItem('sharedCheckupsData');
localStorage.removeItem('simulationModeStatus');
location.reload();
```

### Mock Complex Simulation Scenario
```javascript
// Create multiple simulation patients with different statuses
const patients = [
  { id: 'SIM-001', name: 'Patient One', status: 'Waiting', type: 'Check-up' },
  { id: 'SIM-002', name: 'Patient Two', status: 'In Progress', type: 'Follow-up' },
  { id: 'SIM-003', name: 'Patient Three', status: 'Waiting', type: 'Consultation' }
].map(p => ({
  ...p,
  source: 'admin_simulation',
  queuedAt: new Date().toISOString(),
  patientId: 'PT-' + p.id
}));

localStorage.setItem('doctorQueueData', JSON.stringify(patients));
console.log('Added multiple test patients');
```
