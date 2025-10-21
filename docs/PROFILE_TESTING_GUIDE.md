# USER PROFILE IMPLEMENTATION - TESTING GUIDE

## 🎯 Implementation Complete!

All three profile views (Admin, Doctor, Management) have been successfully implemented with:
- **User Profile Section** (side-by-side with Recent Activities)
- **Recent Activities Section** (fetches from audit trail, filtered by user)
- **Password Change Functionality**
- **Profile Editing** (own profile + admin can edit any user)
- **Dashboard-specific color theming**

---

## 🚀 QUICK START

### 1. Start Backend Server
```bash
cd backend
node server.js
```
Backend should be running on `http://localhost:5000`

### 2. Start Frontend (from root directory)
For testing multiple dashboards simultaneously:

**Admin Dashboard:**
```bash
npm start
```
Runs on `http://localhost:3000`

**Doctor Dashboard:**
```bash
PORT=3001 npm start
```
Runs on `http://localhost:3001`

**Management Dashboard:**
```bash
PORT=3002 npm start
```
Runs on `http://localhost:3002`

---

## 📋 TESTING CHECKLIST

### ✅ Admin Dashboard Profile
**Access:** Admin Dashboard > Settings > My Profile

1. **Profile Display**
   - [ ] Profile page loads successfully
   - [ ] All fields display correctly (firstName, lastName, email, contactNumber, position)
   - [ ] Role badge shows "ADMIN"
   - [ ] Status badge shows "Active" in green
   - [ ] Created and Updated dates display correctly

2. **Profile Editing**
   - [ ] Click "Edit" button
   - [ ] Edit firstName - verify changes
   - [ ] Edit lastName - verify changes
   - [ ] Edit email - verify changes
   - [ ] Edit contactNumber - verify changes
   - [ ] Edit position - verify changes
   - [ ] Click "Save" - verify success message appears
   - [ ] Click "Cancel" - verify changes revert

3. **Password Change**
   - [ ] Click "Change Password" button
   - [ ] Enter current password
   - [ ] Enter new password (must meet requirements: 8+ chars, uppercase, lowercase, number)
   - [ ] Confirm new password
   - [ ] Click "Update Password"
   - [ ] Verify success message
   - [ ] Verify new activity appears in Recent Activities

4. **Recent Activities**
   - [ ] Activities load automatically
   - [ ] Each activity shows: action, description, timestamp, IP address
   - [ ] Action badges have correct colors
   - [ ] Click "Refresh" to reload activities
   - [ ] If more than 10 activities, pagination works

5. **Styling**
   - [ ] Card headers are blue gradient (#007bff)
   - [ ] Admin theme colors throughout
   - [ ] Buttons styled correctly
   - [ ] Responsive layout works on mobile

---

### ✅ Doctor Dashboard Profile
**Access:** Doctor Dashboard > Settings

1. **Profile Display**
   - [ ] Profile page loads (should replace old DoctorSettings)
   - [ ] All fields display correctly
   - [ ] Role badge shows "DOCTOR"
   - [ ] Status badge shows "Active" in green
   - [ ] Created and Updated dates display correctly

2. **Profile Editing**
   - [ ] Click "Edit" button (light color on green header)
   - [ ] Edit profile fields
   - [ ] Click "Save" - verify success
   - [ ] Verify edit action appears in Recent Activities

3. **Password Change**
   - [ ] Test password change flow
   - [ ] Verify password requirements enforced
   - [ ] Verify success message on completion

4. **Recent Activities**
   - [ ] Activities show doctor-specific actions (checkups, prescriptions, etc.)
   - [ ] Pagination works
   - [ ] Refresh button works

5. **Styling**
   - [ ] Card headers are green gradient (#28a745)
   - [ ] Doctor theme colors throughout
   - [ ] Green accent colors match dashboard
   - [ ] Responsive layout works

---

### ✅ Management Dashboard Profile
**Access:** Management Dashboard > My Profile (in sidebar below Audit Trail)

1. **Sidebar Integration**
   - [ ] "My Profile" link appears below "Audit Trail"
   - [ ] Icon is person-circle
   - [ ] Link navigates correctly

2. **Profile Display**
   - [ ] Profile page loads successfully
   - [ ] All fields display correctly
   - [ ] Role badge shows "MANAGEMENT"
   - [ ] Status badge shows "Active" in green
   - [ ] Created and Updated dates display correctly

3. **Profile Editing**
   - [ ] Click "Edit" button (dark outline on dark header)
   - [ ] Edit profile fields
   - [ ] Click "Save" - verify success
   - [ ] Verify edit action appears in Recent Activities

4. **Password Change**
   - [ ] Test password change flow
   - [ ] Verify password requirements enforced
   - [ ] Verify success message

5. **Recent Activities**
   - [ ] Activities show management-specific actions (inventory updates, reports, etc.)
   - [ ] Pagination works
   - [ ] Refresh button works

6. **Styling**
   - [ ] Card headers are dark gradient (#212529)
   - [ ] Neutral/dark theme throughout
   - [ ] Buttons use dark variants
   - [ ] Responsive layout works

---

### ✅ Admin User Management
**Access:** Admin Dashboard > Settings > User Management

1. **Info Banner**
   - [ ] Blue info banner appears at top of page
   - [ ] Message reads: "Profiles created can be updated its info on their settings."
   - [ ] Banner is styled consistently
   - [ ] Icon displays correctly

2. **Edit User Functionality**
   - [ ] Click "Manage" > "Edit Users"
   - [ ] Click "Edit" on any user
   - [ ] Modal shows profile fields (firstName, lastName, email, contactNumber, position)
   - [ ] Password field is optional
   - [ ] Edit user's profile fields
   - [ ] Click "Save"
   - [ ] Verify user updated successfully
   - [ ] Verify audit trail logs admin's action

3. **Create New User**
   - [ ] Click "Manage" > "Add User"
   - [ ] Select user type (Admin/Doctor/Management)
   - [ ] Fill in profile information
   - [ ] Create user
   - [ ] Verify success message
   - [ ] Verify banner reminds that profile can be updated

---

## 🔐 API ENDPOINT TESTING

Use Postman or curl to test endpoints:

### Get Own Profile
```bash
GET http://localhost:5000/api/profile/me
Authorization: Bearer <token>
```

### Update Own Profile
```bash
PUT http://localhost:5000/api/profile/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "contactNumber": "+63 912 345 6789",
  "position": "City Health Officer"
}
```

### Change Password
```bash
PUT http://localhost:5000/api/profile/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

### Get Own Recent Activities
```bash
GET http://localhost:5000/api/profile/activities/me?page=1&limit=10
Authorization: Bearer <token>
```

### Get User Profile (Admin Only)
```bash
GET http://localhost:5000/api/profile/:userId
Authorization: Bearer <admin_token>
```

### Update User Profile (Admin Only)
```bash
PUT http://localhost:5000/api/profile/:userId
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "position": "Medical Officer III"
}
```

---

## 🎨 COLOR SCHEME VERIFICATION

### Admin Theme (#007bff - Blue)
- Header border: 3px solid #007bff
- Card headers: linear-gradient(135deg, #007bff 0%, #0056b3 100%)
- Buttons: Blue variants
- Focus: Blue glow

### Doctor Theme (#28a745 - Green)
- Header border: 3px solid #28a745
- Card headers: linear-gradient(135deg, #28a745 0%, #20893d 100%)
- Buttons: Green/success variants
- Focus: Green glow

### Management Theme (#212529 - Dark)
- Header border: 3px solid #212529
- Card headers: linear-gradient(135deg, #212529 0%, #343a40 100%)
- Buttons: Dark variants
- Focus: Dark glow

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue: Profile page doesn't load
**Solution:** 
- Check browser console for errors
- Verify backend is running on port 5000
- Clear browser cache
- Check that profile routes are registered in server.js

### Issue: Activities not showing
**Solution:**
- Verify user has activities in audit trail
- Check audit_logs table in database
- Verify userId matches in activities query
- Check browser network tab for API errors

### Issue: Password change fails
**Solution:**
- Verify password meets requirements (8+ chars, uppercase, lowercase, number)
- Check current password is correct
- Verify backend password validation logic
- Check network tab for specific error message

### Issue: Edit User modal missing profile fields
**Solution:**
- Verify UserManagement.js was updated correctly
- Check handleEditUser function includes profile fields
- Refresh browser cache

### Issue: Colors don't match dashboard
**Solution:**
- Verify correct CSS file is imported
- Check CSS class names match
- Verify gradients in card headers
- Clear browser cache

---

## ✨ FEATURES TO HIGHLIGHT

1. **Side-by-Side Layout**: Profile info and activities are displayed side-by-side for better UX
2. **Real-time Activities**: Activities auto-refresh after profile changes
3. **Password Strength**: Strong password validation with clear requirements
4. **Responsive Design**: Works on desktop, tablet, and mobile
5. **Role-based Access**: Admins can edit any user, users can only edit themselves
6. **Audit Trail Integration**: All changes logged automatically
7. **Dashboard-specific Theming**: Each dashboard has its unique color scheme
8. **Pagination**: Activities paginated for performance
9. **Error Handling**: Clear error messages for all failure scenarios
10. **Info Banner**: User Management shows helpful reminder about profile updates

---

## 📝 USER CREDENTIALS FOR TESTING

If you need to test with different user roles:

**Admin Account:**
- Email: admin@maybunga.health
- Password: [as configured]

**Doctor Account:**
- Create via Admin > User Management > Add User > Medical Staff

**Management Account:**
- Create via Admin > User Management > Add User > Management

---

## ✅ FINAL VERIFICATION

Before marking complete, verify:
- [ ] All 3 dashboards have working profiles
- [ ] Profile editing works for own account
- [ ] Admin can edit other users' profiles
- [ ] Password changes work
- [ ] Recent activities display correctly
- [ ] Pagination works on activities
- [ ] Info banner shows in User Management
- [ ] Colors match respective dashboards
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Audit trail logs all changes

---

## 🎉 SUCCESS!

If all checks pass, the profile system is fully functional! Users can now:
- View their profile information
- Edit their personal details
- Change their passwords securely
- See their recent activity history
- Administrators can manage user profiles centrally

---

## 📞 SUPPORT

For issues or questions:
1. Check browser console for errors
2. Verify backend server is running
3. Check network tab for API failures
4. Review audit logs for clues
5. Consult PROFILE_IMPLEMENTATION_SUMMARY.md for details
