# 🏥 Healthcare Resource Sharing Management (HRSM) 2.0

A comprehensive, modern healthcare management system built with React and Node.js, designed for healthcare facilities to efficiently manage patients, appointments, inventory, and staff with advanced features and security.

## ✨ Key Features

### 👥 **Patient Management**
- Advanced patient records with family organization
- Real-time patient data synchronization
- Comprehensive medical history tracking
- Family member relationships and management
- Patient search and filtering capabilities

### 📅 **Appointment System**
- Real-time appointment scheduling and management
- Calendar view with availability checking
- Appointment conflict detection
- Multi-user appointment coordination
- Today's checkups workflow

### 🏥 **Healthcare Operations**
- Vital signs monitoring and history
- Prescription tracking and management
- Immunization records and scheduling
- Medical inventory management with alerts
- Treatment records and follow-ups

### 📊 **Analytics & Reporting**
- Real-time dashboard with statistics
- Interactive charts and data visualization
- Healthcare trend analysis and forecasting
- Comprehensive report generation
- Performance monitoring

### 🛡️ **Security & Access Control**
- Role-based user management (Admin, Doctor, Patient)
- Secure JWT authentication with auto-logout
- CSRF protection and input validation
- Encrypted data transmission
- Session management and security monitoring

### 🔧 **Advanced Features**
- Multi-instance testing support
- Simulation mode for testing and training
- Real-time data synchronization
- Backup and restore functionality
- Performance optimization and caching

## 🚀 Technologies Used

### Frontend
- **React.js 18** with modern hooks and context
- **TanStack Query** for optimized data fetching
- **Bootstrap 5** with responsive design
- **Chart.js** for interactive analytics
- **CSS3** with modern design system

### Backend
- **Node.js** with Express.js framework
- **MySQL** with Sequelize ORM
- **JWT** authentication with secure storage
- **Axios** for API communication
- **Real-time** data synchronization

### Development Tools
- **Performance monitoring** and error boundaries
- **Comprehensive testing** scripts and tools
- **Database migration** and seeding tools
- **Multi-instance** development support

## 📋 Installation & Setup

### Prerequisites
- **Node.js** (v16 or higher)
- **MySQL** (v8.0 or higher)
- **npm** package manager
- **Git** for version control

### Quick Start

> 📋 **New to the project?** Check out our [**Quick Clone & Setup Guide**](CLONE_AND_SETUP.md) for the fastest way to get started!

1. **Clone the repository**
   ```bash
   git clone https://github.com/JDaveExe/hrsm2.0.git
   cd hrsm2.0
   ```

2. **Automated setup** (Recommended)
   ```bash
   # Windows users
   setup.bat
   
   # Linux/Mac users
   chmod +x setup.sh && ./setup.sh
   ```

3. **Manual installation** (Alternative)
   ```bash
   # Install all dependencies
   npm install
   cd backend && npm install && cd ..
   ```

3. **Database Setup**
   ```bash
   # Create MySQL database
   mysql -u root -p -e "CREATE DATABASE hrsm_db;"
   
   # Copy and configure environment
   cp backend/.env.example backend/.env
   ```
   
   Edit `backend/.env`:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=hrsm_db
   
   # Security
   JWT_SECRET=your-super-secure-secret-key-64-characters-long
   
   # Default User Passwords (Change for production!)
   DEFAULT_ADMIN_PASSWORD=secure_admin_password
   DEFAULT_DOCTOR_PASSWORD=secure_doctor_password
   DEFAULT_PATIENT_PASSWORD=secure_patient_password
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ```

4. **Start the application**
   ```bash
   # Quick start script
   ./start-backend.bat    # Start backend server
   npm start             # Start frontend (new terminal)
   ```

5. **Access the system**
   - **Main Application**: `http://localhost:3000`
   - **Backend API**: `http://localhost:5000`

## 👤 Login Credentials

### Default Test Accounts
- **Admin**: 
  - Username: `admin`
  - Password: Set in `.env` as `DEFAULT_ADMIN_PASSWORD`
  - Access: Full system administration

- **Doctor**: 
  - Username: `doctor`
  - Password: Set in `.env` as `DEFAULT_DOCTOR_PASSWORD`
  - Access: Patient care and medical records

- **Patient**: 
  - Username: `patient`
  - Password: Set in `.env` as `DEFAULT_PATIENT_PASSWORD`
  - Access: Personal health records

> ⚠️ **Security Notice**: Change default passwords in production!

## 🧪 Development & Testing

### Multi-Instance Testing
```bash
# Test with multiple frontend instances
./start-multi-instance.bat     # Admin + Patient dashboards
./start-three-instances.bat     # Full multi-user testing
```

### Database Management
```bash
# Reset database
node backend/scripts/setupDatabase.js

# Add sample data
node backend/add_sample_data.js

# Clear specific data
node backend/scripts/clearPatientData.js
```

### Testing Scripts
```bash
# API connectivity test
node test-api-connection.js

# Complete workflow test
node test-complete-workflow.js

# Security testing
node test-security.js
```

## 📁 Project Structure

```
hrsm2.0/
├── 📁 src/
│   ├── 📁 components/
│   │   ├── 📁 admin/          # Admin dashboard components
│   │   ├── 📁 doctor/         # Doctor interface components
│   │   ├── 📁 patient/        # Patient portal components
│   │   └── 📁 shared/         # Shared UI components
│   ├── 📁 hooks/              # Custom React hooks
│   ├── 📁 services/           # API services and utilities
│   ├── 📁 context/            # React context providers
│   └── 📁 utils/              # Utility functions
├── 📁 backend/
│   ├── 📁 routes/             # API endpoints
│   ├── 📁 models/             # Database models
│   ├── 📁 middleware/         # Express middleware
│   ├── 📁 services/           # Business logic
│   └── 📁 scripts/            # Database and utility scripts
├── 📁 public/                 # Static assets
└── 📁 documentation/          # Project documentation
```

## 🚀 Deployment

### Production Setup
1. Set `NODE_ENV=production` in backend `.env`
2. Configure production database
3. Set strong JWT secrets and passwords
4. Enable HTTPS and security headers
5. Set up proper backup procedures

### Environment Variables
```env
# Production Security
NODE_ENV=production
JWT_SECRET=your-super-secure-production-secret
DB_SSL=true

# Email Configuration (Optional)
SMTP_HOST=your-smtp-server
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE=daily
```

## 🔄 Recent Updates (v2.0)

### Major Improvements
- ✅ Complete UI/UX overhaul with modern design
- ✅ Advanced patient management with family organization
- ✅ Real-time appointment scheduling system
- ✅ Comprehensive inventory management
- ✅ Enhanced security with JWT and auto-logout
- ✅ Performance optimizations and caching
- ✅ Multi-user testing environment
- ✅ Backup and restore functionality

### Technical Enhancements
- ✅ Modern React patterns with hooks
- ✅ TanStack Query for optimized data fetching
- ✅ Responsive CSS design system
- ✅ Database optimizations and indexing
- ✅ API modernization and standardization
- ✅ Error boundary implementations
- ✅ Comprehensive testing framework

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow existing code patterns and naming conventions
- Add tests for new features
- Update documentation as needed
- Ensure responsive design compatibility
- Test across different user roles

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Documentation

- **Issues**: [GitHub Issues](https://github.com/JDaveExe/hrsm2.0/issues)
- **Documentation**: Check the documentation files in the repository
- **Security**: See `SECURITY_GUIDE.md` for security best practices

## 🎯 Roadmap

- [ ] Mobile application development
- [ ] Advanced analytics and AI insights
- [ ] Integration with external health systems
- [ ] Telemedicine capabilities
- [ ] Multi-language support
- [ ] Cloud deployment options

---

**Made with ❤️ for healthcare professionals**

*This system is designed to improve healthcare delivery and patient care through modern technology and user-friendly interfaces.*
