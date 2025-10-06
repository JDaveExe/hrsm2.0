# 🔍 Debug Update - Check What's Changing

## What We Just Added

Debug logging to the User model's `beforeUpdate` hook to see:
1. What fields are being changed
2. Whether password is detected as changed
3. Why it might be rehashing

## Run Test Again

```bash
# Terminal 1: Restart backend
cd backend
node server.js

# Terminal 2: Run test
node test-complete-credential-flow.js
```

## Expected Backend Logs

During the profile update, you should see:
```
beforeUpdate hook called
Changed fields: ['username', 'email', 'contactNumber']
Password changed? false
Password not changed, skipping rehash
```

## If Password Shows as Changed

If you see:
```
Password changed? true
Rehashing password...
```

Then Sequelize is incorrectly detecting the password as changed, which would cause it to rehash with a random salt, making the old password invalid!

---

Run the test and share the backend console output around the "Profile update" section!
