# 🏥 Healthcare Resource Sharing Management (HRSM) 2.0

A comprehensive, modern healthcare management system built with React and Node.js, designed for healthcare facilities to efficiently manage patients, appointments, inventory, and staff with advanced features and security.

## ✨ Key Features

### 👥 **Patient Management**
- Advanced patient records with family organization
- Real-time patient data synchronization
- Comprehensive medical history tracking
- Family member relationships and management
- Patient search and filtering capabilities
- **🆕 QR Code Check-in System** - Contact-free patient identification
- **🆕 Street-Barangay Address Logic** - Smart address filtering
- **🆕 Patient Welcome Modal** - Improved user onboarding

### 📅 **Appointment System**
- Real-time appointment scheduling and management
- Calendar view with availability checking
- Appointment conflict detection
- Multi-user appointment coordination
- Today's checkups workflow
- **🆕 Enhanced Appointment Notifications** - Real-time status updates
- **🆕 Doctor Availability Tracking** - Live status monitoring
- **🆕 Appointment UI Improvements** - Better user experience

### 🏥 **Healthcare Operations**
- Vital signs monitoring and history
- Prescription tracking and management
- Immunization records and scheduling
- Medical inventory management with alerts
- Treatment records and follow-ups
- **🆕 Batch-Based Inventory System** - FIFO medication/vaccine tracking
- **🆕 Custom Diagnosis System** - Enhanced diagnostic capabilities
- **🆕 Doctor Status Tracking** - Real-time availability updates
- **🆕 Vaccination Workflow** - Streamlined immunization process

### 📊 **Analytics & Reporting**
- Real-time dashboard with statistics
- Interactive charts and data visualization
- Healthcare trend analysis and forecasting
- Comprehensive report generation
- Performance monitoring
- **🆕 Weather-Based Prescription Forecasting** - Climate-aware medication planning
- **🆕 Enhanced Healthcare Insights** - Advanced analytics dashboard
- **🆕 Patient Volume Forecasting** - Predictive analytics
- **🆕 Real-time Stock Alerts** - Intelligent inventory monitoring

### 🛡️ **Security & Access Control**
- Role-based user management (Admin, Doctor, Patient)
- Secure JWT authentication with auto-logout
- CSRF protection and input validation
- Encrypted data transmission
- Session management and security monitoring
- **🆕 Enhanced Notification System** - Secure real-time messaging
- **🆕 Improved Session Management** - Better security controls
- **🆕 Admin Controls** - Advanced system management

### 🔧 **Advanced Features**
- Multi-instance testing support
- Simulation mode for testing and training
- Real-time data synchronization
- Backup and restore functionality
- Performance optimization and caching
- **🆕 Weather Integration** - Climate-aware healthcare planning
- **🆕 Comprehensive Testing Suite** - 436+ test files for quality assurance
- **🆕 Database Migration Tools** - Seamless system updates
- **🆕 Enhanced Inventory Management** - Smart stock tracking
- **🆕 Patient Health Stock Widget** - Personal health monitoring

## 🚀 Technologies Used

### Frontend
- **React.js 18** with modern hooks and context
- **TanStack Query** for optimized data fetching
- **Bootstrap 5** with responsive design
- **Chart.js** for interactive analytics
- **CSS3** with modern design system
- **QR Code Integration** for contact-free operations
- **Weather API Integration** for climate-aware features

### Backend
- **Node.js** with Express.js framework
- **MySQL** with Sequelize ORM
- **JWT** authentication with secure storage
- **Axios** for API communication
- **Real-time** data synchronization
- **Advanced Batch System** for inventory FIFO tracking
- **Weather Forecasting Service** for predictive healthcare
- **Enhanced Notification System** with real-time alerts

### Development Tools
- **Performance monitoring** and error boundaries
- **Comprehensive testing** scripts and tools (436+ files)
- **Database migration** and seeding tools
- **Multi-instance** development support
- **Automated setup scripts** for Windows/Linux/Mac
- **Real-time debugging tools** for development

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
   
   # Alternative: Full system startup
   ./start-multi-instance.bat  # Multiple dashboards for testing
   ```

5. **Access the system**
   - **Main Application**: `http://localhost:3000`
   - **Backend API**: `http://localhost:5000`
   - **QR Code Check-in**: Available after patient registration
   - **Weather Forecasting**: Integrated in Enhanced Forecasting Dashboard

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
./start-three-instances.bat    # Full testing setup
```

### Testing Suite
The system includes 436+ comprehensive test files covering:
```bash
# Core functionality tests
node test-complete-workflow.js
node test-patient-creation.js
node test-appointment-scheduling.js

# New feature tests
node test-qr-workflow.js        # QR code check-in system
node test-vaccine-batch-system.js  # Batch tracking
node test-weather-prescription-feature.js  # Weather forecasting
node test-doctor-status-tracking.js  # Real-time doctor status
```

## 🆕 Major New Features

### 📱 QR Code Check-in System
- **Contact-free patient identification** for health safety
- **Instant check-in process** with QR code scanning
- **Automatic queue management** and status updates
- **Integration with appointment system** for seamless workflow

### 🧬 Advanced Batch System
- **FIFO inventory tracking** for medications and vaccines
- **Expiration date management** with automated alerts
- **Batch-specific reporting** for regulatory compliance
- **Real-time stock calculations** based on active batches

### 🌦️ Weather-Based Prescription Forecasting
- **Climate-aware medication planning** for Pasig City
- **Predictive analytics** based on weather patterns
- **Seasonal disease prevention** with medication recommendations
- **Real-time weather integration** for dynamic planning

### 🔔 Enhanced Notification System
- **Real-time appointment notifications** for all users
- **Doctor availability alerts** for admin coordination
- **Prescription and vaccination reminders** for patients
- **System-wide status updates** for operational awareness

### 👨‍⚕️ Doctor Status Tracking
- **Real-time availability monitoring** (Online/Offline/Busy)
- **Automatic status updates** based on login/logout
- **Session management** with checkup tracking
- **Admin visibility** into doctor availability

### 📊 Enhanced Analytics Dashboard
- **Healthcare insights** with predictive analytics
- **Patient volume forecasting** for resource planning
- **Inventory optimization** with demand prediction
- **Performance metrics** and operational analytics

### 🏥 Patient Health Stock Widget
- **Personal medication tracking** for patients
- **Prescription history** and refill reminders
- **Health trend monitoring** with visual charts
- **Integration with provider inventory** for availability
### 🆕 Feature-Specific Testing
```bash
# QR Code System Testing
node test-qr-workflow.js
node test-patient-checkin.js

# Batch System Testing
node test-vaccine-batch-system.js
node test-medication-batch-creation.js
node test-enhanced-batch-system.js

# Weather Forecasting Testing
node test-weather-prescription-feature.js
node test-weather-dynamics.js
node test-temperature-dynamics.js

# Notification System Testing
node test-notification-system-complete.js
node test-admin-appointment-notification.js
node test-patient-notifications.js

# Doctor Status & Management Testing
node verify-doctor-status-tracking.js
node test-doctor-filtering.js
node test-diagnosis-workflow.js

# Inventory & Stock Management Testing
node test-stock-display-fixes.js
node test-inventory-fixes.js
node test-urgent-alerts-complete.js
```

### Database Management
```bash
# Reset database
node backend/scripts/setupDatabase.js

# Add sample data
node backend/add_sample_data.js

# Clear specific data
node backend/scripts/clearPatientData.js

# 🆕 NEW: Batch system migration
node final-vaccine-batch-migration.js
node create-missing-medication-batches.js

# 🆕 NEW: Fix inventory expiration dates
node fix-expired-inventory.js
node extend-expiry-to-2027.js
```

### Testing Scripts
```bash
# API connectivity test
node test-api-connection.js

# Complete workflow test
node test-complete-workflow.js

# Security testing
node test-security.js

# 🆕 NEW: Comprehensive system validation
node validate-appointment-fixes.js
node verify-expiration-fixes.js
node comprehensive-fix-summary.js
```

## 📁 Project Structure

```
hrsm2.0/
├── 📁 src/
│   ├── 📁 components/
│   │   ├── 📁 admin/          # Admin dashboard components
│   │   │   ├── EnhancedForecastingDashboard.js  # 🆕 Weather forecasting
│   │   │   ├── ResetCheckupDataModal.js         # 🆕 Admin controls
│   │   │   └── WeatherPrescriptionWidget.js     # 🆕 Climate integration
│   │   ├── 📁 doctor/         # Doctor interface components
│   │   ├── 📁 patient/        # Patient portal components
│   │   │   ├── PatientQRModal.js               # 🆕 QR code system
│   │   │   ├── PatientHealthStock.js           # 🆕 Health tracking
│   │   │   └── PatientWelcomeModal.js          # 🆕 User onboarding
│   │   ├── 📁 management/     # 🆕 Management dashboard
│   │   │   ├── HealthcareInsights.js           # 🆕 Analytics
│   │   │   ├── PrescriptionInventory.js        # 🆕 Batch tracking
│   │   │   └── VaccineInventory.js             # 🆕 Vaccine management
│   │   └── 📁 shared/         # Shared UI components
│   ├── 📁 hooks/              # Custom React hooks
│   ├── 📁 services/           # API services and utilities
│   │   ├── weatherForecastingService.js    # 🆕 Weather integration
│   │   ├── weatherPrescriptionService.js   # 🆕 Climate-aware planning
│   │   └── enhancedForecastingService.js   # 🆕 Predictive analytics
│   ├── 📁 context/            # React context providers
│   └── 📁 utils/              # Utility functions
├── 📁 backend/
│   ├── 📁 routes/             # API endpoints
│   │   ├── medication-batches.js           # 🆕 Batch tracking API
│   │   ├── vaccine-batches.js              # 🆕 Vaccine batch API
│   │   └── weatherPrescriptionRoutes.js    # 🆕 Weather API
│   ├── 📁 models/             # Database models
│   │   ├── MedicationBatch.js              # 🆕 Batch tracking
│   │   └── VaccineBatch.js                 # 🆕 Vaccine batches
│   ├── 📁 middleware/         # Express middleware
│   ├── 📁 services/           # Business logic
│   │   ├── enhancedHealthForecasting.js    # 🆕 Health analytics
│   │   └── healthcareDataCollector.js      # 🆕 Data aggregation
│   └── 📁 scripts/            # Database and utility scripts
├── 📁 public/                 # Static assets
├── 📁 documentation/          # Project documentation
│   ├── QR_SYSTEM_IMPLEMENTATION_COMPLETE.md     # 🆕 QR guide
│   ├── VACCINE_BATCH_IMPLEMENTATION_COMPLETE.md # 🆕 Batch guide
│   ├── WEATHER_PRESCRIPTION_FORECASTING_GUIDE.md # 🆕 Weather guide
│   └── APPOINTMENT_TESTING_GUIDE.md              # 🆕 Testing guide
└── 📁 testing/                # 🆕 Comprehensive test suite (436+ files)
    ├── test-qr-workflow.js
    ├── test-vaccine-batch-system.js
    ├── test-weather-prescription-feature.js
    └── ... (433+ more test files)
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

# 🆕 Weather API Integration (Optional)
REACT_APP_OPENWEATHER_API_KEY=your-weather-api-key

# 🆕 Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE=daily
BACKUP_RETENTION_DAYS=30
```

## 📖 Feature Documentation

### 🆕 Quick Start for New Features

#### QR Code Check-in System
```bash
# Test QR code workflow
node test-qr-workflow.js

# Features: Contact-free check-in, automatic queue management
# Location: Patient dashboard → QR Code modal
```

#### Weather-Based Prescription Forecasting
```bash
# Test weather integration
node test-weather-prescription-feature.js

# Features: Climate-aware medication planning for Pasig City
# Location: Admin dashboard → Enhanced Forecasting → Weather tab
```

#### Advanced Batch Inventory System
```bash
# Test batch tracking
node test-vaccine-batch-system.js
node test-medication-batch-creation.js

# Features: FIFO tracking, expiration management, batch reports
# Location: Management dashboard → Inventory → Batch Details
```

#### Enhanced Notification System
```bash
# Test notifications
node test-notification-system-complete.js

# Features: Real-time alerts, appointment notifications
# Location: All dashboards → Notification bell
```

## 🔄 Update History

### Version 2.5.0 (Latest) - October 2025
#### 🆕 Major New Features Added:
- **QR Code Check-in System** - Contact-free patient identification
- **Weather-Based Prescription Forecasting** - Climate-aware healthcare planning
- **Advanced Batch Inventory System** - FIFO medication/vaccine tracking
- **Enhanced Notification System** - Real-time alerts across all users
- **Doctor Status Tracking** - Live availability monitoring
- **Patient Health Stock Widget** - Personal health monitoring
- **Enhanced Analytics Dashboard** - Predictive healthcare insights
- **Comprehensive Testing Suite** - 436+ test files for quality assurance

#### 🔧 System Improvements:
- Updated inventory management with batch tracking
- Enhanced user interface with modern design patterns
- Improved security with enhanced session management
- Better error handling and system stability
- Optimized database queries and performance
- Advanced appointment conflict detection
- Street-Barangay address logic implementation

#### 🐛 Bug Fixes:
- Fixed inventory expiration date issues
- Resolved patient ID mapping inconsistencies
- Improved appointment notification delivery
- Enhanced doctor session management
- Fixed stock display calculations
- Resolved QR code generation issues

### Version 2.0.0 - Initial Release
- Complete healthcare management system
- Multi-role user management
- Appointment scheduling
- Medical record management
- Basic inventory tracking
- Dashboard analytics

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Test** your changes: `npm test`
4. **Commit** your changes: `git commit -m 'Add amazing feature'`
5. **Push** to branch: `git push origin feature/amazing-feature`
6. **Submit** a pull request

### Testing Guidelines
- Run comprehensive tests before submitting PRs
- Include tests for new features
- Update documentation for any changes
- Follow existing code style and patterns

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/JDaveExe/hrsm2.0/issues)
- **Documentation**: Check the `/documentation` folder
- **Testing**: Use the comprehensive test suite (436+ files)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Healthcare professionals who provided domain expertise
- Open source community for excellent libraries and tools
- Beta testers who helped refine the system
- Contributors who made this comprehensive update possible

---

**🏥 HRSM 2.0** - *Comprehensive Healthcare Management for the Digital Age*

Built with ❤️ for healthcare facilities worldwide
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
