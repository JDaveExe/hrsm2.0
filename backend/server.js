require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { sequelize, connectDB } = require('./config/database');
const dbProtection = require('./utils/databaseProtection');

// Import models with associations already defined
const { User, Patient, Family, VitalSigns, Appointment } = require('./models');

const app = express();

// Trust proxy for proper IP address extraction
app.set('trust proxy', true);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:5000'],
  credentials: true
}));
app.use(helmet({
  crossOriginResourcePolicy: false, // To allow resources to be loaded from different origins
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database with protection
const initializeServer = async () => {
  try {
    await connectDB();
    
    // Initialize database protection
    await dbProtection.initializeDatabase();
    
    // Sync database with alter to add new columns
    await sequelize.sync({ alter: true });
    console.log('Database connected - tables synchronized');
    
    // Create default users (including management)
    const User = require('./models/User');
    await User.createDefaultUsers();
    
    // Note: Using hardcoded fallback accounts in auth.js instead of database records
    console.log('Hardcoded test accounts available: admin/admin123, doctor/doctor123, patient/patient123, management/management123');
  } catch (error) {
    console.error('Server initialization failed:', error);
    process.exit(1);
  }
};

// Initialize server
initializeServer();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/families', require('./routes/families'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/vital-signs', require('./routes/vitalSigns'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/inventory-analytics', require('./routes/inventoryAnalytics'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/checkups', require('./routes/checkups'));
app.use('/api/medications', require('./routes/medications'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/audit-notifications', require('./routes/auditNotifications'));
app.use('/api/medication-batches', require('./routes/medication-batches')); // Medication batch management
app.use('/api/vaccine-batches', require('./routes/vaccine-batches')); // Vaccine batch management
app.use('/api/vaccinations', require('./routes/vaccinations'));
app.use('/api/doctor/queue', require('./routes/doctorQueue'));
app.use('/api/doctor/sessions', require('./routes/doctorSessions'));
app.use('/api/doctor/reports', require('./routes/doctorReports'));
app.use('/api/lab-referrals', require('./routes/labReferrals'));
app.use('/api', require('./routes/patientPrescriptions'));
app.use('/api/vaccine-analytics', require('./routes/vaccine-analytics'));
app.use('/api/immunization-history', require('./routes/immunization-history'));

// Doctor checkups endpoint - specific route for doctor checkups
app.use('/api/doctor/checkups', (req, res, next) => {
  // If it's a GET request to the root, route to the doctor endpoint
  if (req.method === 'GET' && req.path === '/') {
    req.url = '/doctor';
  }
  require('./routes/checkups')(req, res, next);
});
app.use('/api/forecast', require('./routes/forecast'));
app.use('/api/forecast-enhanced', require('./routes/enhancedForecast'));
app.use('/api/backup', require('./routes/backup'));

// Serve static data files
app.use('/backend/data', express.static(require('path').join(__dirname, 'data')));

// Database status endpoint
app.get('/api/db-status', async (req, res) => {
  try {
    const status = await dbProtection.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a direct route for debugging
app.get('/api/debug/check', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'API is responding correctly',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint for frontend connectivity
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Backend is connected and running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/', (req, res) => {
  res.send('Healthcare API is running...');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  res.status(500).json({ 
    message: 'Server Error', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
