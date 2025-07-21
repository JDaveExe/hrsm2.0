# Maybunga Healthcare Backend API

Backend API server for the Maybunga Healthcare Management System built with Node.js, Express.js, and MongoDB.

## 🚀 Phase 1 - Foundation Complete ✅

### ✅ Day 1 - Completed Tasks
- [x] Backend project structure created
- [x] Package.json with all dependencies configured
- [x] Express.js server setup with security middleware
- [x] Environment configuration (.env)
- [x] Basic route structure established
- [x] Error handling middleware
- [x] Request logging middleware
- [x] MongoDB connection setup (ready for database)
- [x] CORS configuration for frontend integration
- [x] Rate limiting and security headers
- [x] Health check endpoints

### ✅ Day 2 - Completed Tasks
- [x] Database schemas designed and implemented
  - [x] User model with role-based structure
  - [x] Patient model with medical information
  - [x] Appointment model with scheduling logic
  - [x] MedicalRecord model with multiple types
  - [x] Prescription model with medication tracking
  - [x] Family model for patient grouping
  - [x] Notification model for system alerts
- [x] JWT authentication configuration
- [x] Authentication middleware with role-based access
- [x] Password hashing utilities with security validation
- [x] Model relationships and data integrity
- [x] Database model testing framework

## 🛠️ Installation & Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   copy .env.example .env
   ```
   Edit `.env` file with your configuration.

4. **Start the server:**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 🔧 API Endpoints

### Health Check
- `GET /api/health` - Main API health check

### Route Health Checks
- `GET /api/auth/health` - Authentication routes
- `GET /api/users/health` - User management routes
- `GET /api/patients/health` - Patient management routes
- `GET /api/doctors/health` - Doctor management routes
- `GET /api/appointments/health` - Appointment management routes
- `GET /api/medical-records/health` - Medical records routes
- `GET /api/prescriptions/health` - Prescription management routes

## 🔒 Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API request throttling
- **Request Logging** - Activity monitoring
- **Input Validation** - Data sanitization (ready)
- **JWT Authentication** - Secure user sessions (ready)

## 📊 Server Status

**Current Status:** ✅ Running successfully on port 5001

**Server Features:**
- Express.js web framework
- MongoDB connection ready
- Environment variable configuration
- Structured error handling
- Request/response logging
- Security middleware stack
- Route organization
- Background process support

## 🔄 Next Steps (Phase 2 - Day 3)

Following the implementation plan:

1. **Authentication System Implementation**
   - User registration and login endpoints
   - JWT token generation and verification
   - Password reset functionality
   - Role-based access control middleware

2. **API Route Development**
   - Implement CRUD operations for all entities
   - Input validation and error handling
   - Response formatting and pagination

3. **Advanced Features**
   - File upload functionality
   - QR code generation for patients
   - Email notification system

## 🏥 Project Structure

```
backend/
├── config/           # Database configuration
├── middleware/       # Custom middleware
├── models/          # Database schemas (Phase 2)
├── routes/          # API route handlers
├── uploads/         # File upload directories
├── utils/           # Utility functions (Phase 2)
├── server.js        # Main application entry
├── package.json     # Dependencies & scripts
└── .env            # Environment variables
```

## 📝 Environment Variables

```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/maybunga_healthcare
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:3000
```

---

**Built with ❤️ for Maybunga Healthcare Management System**
