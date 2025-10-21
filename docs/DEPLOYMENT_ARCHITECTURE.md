# Railway Deployment Architecture

## Overview

Your HRSM 2.0 system deploys as **3 separate Railway services** in one project:

```
┌─────────────────────────────────────────────────────────────┐
│                    Railway Project: HRSM 2.0                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐│
│  │  Frontend        │  │  Backend         │  │  MySQL     ││
│  │  Service         │  │  Service         │  │  Database  ││
│  │                  │  │                  │  │            ││
│  │  React App       │─→│  Express API     │─→│  Tables    ││
│  │  (Static Build)  │  │  (Node.js)       │  │  & Data    ││
│  │                  │  │                  │  │            ││
│  │  Port: Auto      │  │  Port: 5000      │  │  Port: 3306││
│  └──────────────────┘  └──────────────────┘  └────────────┘│
│         ↓                      ↓                     ↓       │
│  your-frontend-url    your-backend-url      (internal)      │
│  .up.railway.app      .up.railway.app                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Service Details

### 1. Frontend Service

**What it is**: Your React application built and served as static files

**Configuration**:
- Root Directory: `/` (repository root)
- Build Command: `npm install && npm run build`
- Start Command: `npx serve -s build -p $PORT`
- Framework: React 19 + React Router

**What it does**:
- Serves the login page
- Serves admin dashboard
- Serves doctor interface
- Serves patient management UI
- Makes API calls to Backend Service

**Environment Variables**:
```
REACT_APP_API_URL=https://your-backend.up.railway.app
NODE_ENV=production
GENERATE_SOURCEMAP=false
```

**Public URL**: `https://hrsm-frontend-production.up.railway.app`

---

### 2. Backend Service

**What it is**: Your Node.js/Express REST API server

**Configuration**:
- Root Directory: `backend/`
- Build Command: `npm install`
- Start Command: `node server.js`
- Framework: Express 5 + Sequelize

**What it does**:
- Handles authentication (login/logout)
- Manages patient records
- Handles appointments
- Manages inventory
- Tracks vaccinations
- Audit logging
- All CRUD operations

**API Endpoints** (examples):
- `POST /api/auth/login`
- `GET /api/patients`
- `POST /api/appointments`
- `GET /api/inventory`
- `POST /api/vaccinations`
- ...and 20+ more routes

**Environment Variables**:
```
MYSQLHOST=${{MySQL.MYSQLHOST}}
MYSQLPORT=${{MySQL.MYSQLPORT}}
MYSQLDATABASE=${{MySQL.MYSQLDATABASE}}
MYSQLUSER=${{MySQL.MYSQLUSER}}
MYSQLPASSWORD=${{MySQL.MYSQLPASSWORD}}
NODE_ENV=production
JWT_SECRET=your-secret
CORS_ORIGIN=https://your-frontend-url
```

**Public URL**: `https://hrsm-backend-production.up.railway.app`

---

### 3. MySQL Database Service

**What it is**: Managed MySQL 8.0 database

**Configuration**:
- Provisioned automatically by Railway
- Not directly accessible from internet
- Accessible only by backend service (same Railway project)

**What it stores**:
- User accounts (admin, doctors, nurses)
- Patient records
- Appointments
- Vital signs
- Medications & vaccines
- Inventory
- Audit logs
- All application data

**Tables** (20+ tables):
```
users
patients
families
appointments
vital_signs
checkups
diagnoses
prescriptions
medications
medication_batches
vaccinations
vaccine_batches
immunization_history
inventory
audit_logs
notifications
doctor_sessions
lab_referrals
...and more
```

**Connection**: Internal Railway network (private)

---

## Request Flow

### User Login Example

```
1. User visits: https://your-frontend.up.railway.app
   └→ Frontend loads React app

2. User enters credentials and clicks "Login"
   └→ Frontend sends: POST https://your-backend.up.railway.app/api/auth/login

3. Backend receives request
   ├→ Validates credentials
   ├→ Queries MySQL database
   ├→ Generates JWT token
   └→ Returns token to frontend

4. Frontend stores token
   └→ Redirects to dashboard

5. Frontend requests patient data
   └→ GET https://your-backend.up.railway.app/api/patients
      (with Authorization header)

6. Backend verifies token
   ├→ Queries MySQL for patients
   └→ Returns patient data

7. Frontend displays patient list
```

---

## Data Flow Diagram

```
┌─────────────┐
│   Browser   │
│  (User PC)  │
└──────┬──────┘
       │ HTTPS
       ↓
┌─────────────────────────────────────────┐
│  Frontend Service (Railway)             │
│                                         │
│  - Serves static HTML/CSS/JS            │
│  - React application                    │
│  - Client-side routing                  │
│                                         │
└──────────────┬──────────────────────────┘
               │ HTTPS API Calls
               │ (with JWT token)
               ↓
┌─────────────────────────────────────────┐
│  Backend Service (Railway)              │
│                                         │
│  - Express REST API                     │
│  - JWT authentication                   │
│  - Business logic                       │
│  - Data validation                      │
│                                         │
└──────────────┬──────────────────────────┘
               │ MySQL Protocol
               │ (internal network)
               ↓
┌─────────────────────────────────────────┐
│  MySQL Database (Railway)               │
│                                         │
│  - Stores all application data          │
│  - Persistent storage                   │
│  - Automated backups                    │
│                                         │
└─────────────────────────────────────────┘
```

---

## Security Architecture

### Network Security

```
Internet → Railway Edge → SSL Termination → Services
   ↓
Frontend: Public HTTPS (anyone can visit)
   ↓
Backend: Public HTTPS (requires JWT token)
   ↓
MySQL: Private network (backend only)
```

### Authentication Flow

```
┌──────────┐
│  Login   │
└────┬─────┘
     ↓
┌────────────────────────┐
│ Backend validates      │
│ username + password    │
└────┬───────────────────┘
     ↓
┌────────────────────────┐
│ Query MySQL users      │
│ table with bcrypt      │
└────┬───────────────────┘
     ↓
┌────────────────────────┐
│ Generate JWT token     │
│ (includes user role)   │
└────┬───────────────────┘
     ↓
┌────────────────────────┐
│ Return token to        │
│ frontend               │
└────┬───────────────────┘
     ↓
┌────────────────────────┐
│ Frontend stores token  │
│ in sessionStorage      │
└────────────────────────┘
     ↓
┌────────────────────────┐
│ All API requests       │
│ include token in       │
│ Authorization header   │
└────────────────────────┘
```

---

## Deployment Process

### Initial Setup

```
1. Create Railway Project
   └→ Connects to GitHub repo

2. Deploy Backend First
   ├→ Set root directory: backend/
   ├→ Add MySQL database
   ├→ Configure environment variables
   ├→ Deploy and verify
   └→ Run: railway run npm run init-db

3. Deploy Frontend Second
   ├→ Set root directory: /
   ├→ Set REACT_APP_API_URL
   ├→ Build React app
   └→ Serve static files

4. Connect Services
   └→ Update backend CORS_ORIGIN
```

### Update Process

```
Developer pushes to GitHub
   ↓
Railway detects commit
   ↓
Triggers automatic build
   ↓
Backend: npm install → node server.js
Frontend: npm install → npm run build → serve
   ↓
Deploy new version
   ↓
Health checks pass
   ↓
Route traffic to new version
```

---

## Environment Variables Flow

### Backend Variables

```
Railway MySQL Service
   ↓ (Auto-generates)
MYSQLHOST, MYSQLPORT, etc.
   ↓ (Reference with ${{MySQL.MYSQLHOST}})
Backend Service Environment
   ↓ (Reads at runtime)
backend/config/database.js
   ↓ (Creates connection)
Sequelize instance
   ↓ (Used by)
All backend models and routes
```

### Frontend Variables

```
Railway Frontend Variables
   ↓
REACT_APP_API_URL=https://backend.up.railway.app
   ↓ (Embedded at build time)
React build process (webpack)
   ↓ (Available as)
process.env.REACT_APP_API_URL
   ↓ (Used in)
src/services/axiosConfig.js
   ↓ (Configures)
Axios baseURL for all API calls
```

---

## File Structure in Railway

### Frontend Service (sees root `/`):

```
/
├── src/                  ← React source code
├── public/               ← Static assets
├── build/                ← Generated after build
├── package.json          ← Frontend dependencies
├── railway.json          ← Frontend config
└── node_modules/
```

### Backend Service (sees `backend/`):

```
backend/
├── config/               ← Database config
├── models/               ← Sequelize models
├── routes/               ← Express routes
├── middleware/           ← Auth, validation
├── scripts/              ← init-production-db.js
├── server.js             ← Entry point
├── package.json          ← Backend dependencies
├── railway.json          ← Backend config
└── node_modules/
```

---

## Why This Architecture Works

✅ **Separation of Concerns**
- Frontend handles UI/UX
- Backend handles business logic
- Database handles data persistence

✅ **Scalability**
- Each service can scale independently
- Frontend is just static files (fast)
- Backend can handle multiple instances

✅ **Security**
- MySQL not exposed to internet
- JWT tokens for authentication
- CORS properly configured

✅ **Maintainability**
- Clear boundaries between services
- Easy to debug (separate logs)
- Can update frontend without backend restart

✅ **Performance**
- Frontend served from CDN
- Backend optimized for API requests
- Database connection pooling

---

## Cost Optimization

```
Railway charges per service usage:

Frontend: ~$3-5/month
  └→ Low CPU, serves static files

Backend: ~$5-7/month
  └→ Moderate CPU, handles API logic

MySQL: ~$5-10/month
  └→ Storage + queries

Total: $13-22/month
```

---

## Monitoring Architecture

```
Railway Dashboard
   ↓
Service Metrics
├── Frontend
│   ├── Deploy status
│   ├── Build logs
│   ├── Runtime logs
│   └── Traffic metrics
│
├── Backend
│   ├── Deploy status
│   ├── Server logs
│   ├── API response times
│   └── Error rates
│
└── MySQL
    ├── Connection count
    ├── Query performance
    ├── Storage usage
    └── Backup status
```

---

This architecture provides a robust, scalable, and maintainable deployment for your healthcare system! 🚀
